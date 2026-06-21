
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    const newDocData: { [key: string]: any } = {};
    for (const key in docData) {
        const value = docData[key];
        if (value instanceof Timestamp) {
            newDocData[key] = value.toDate().toISOString();
        } else if (value && typeof value === 'object' && value._methodName === 'serverTimestamp') {
            newDocData[key] = new Date().toISOString();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            newDocData[key] = serializeTimestamps(value);
        } else {
            newDocData[key] = value;
        }
    }
    return newDocData;
}

export async function POST(req: NextRequest) {
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) throw new Error(`Admin SDK failed: ${initError}`);

        const authorization = req.headers.get('authorization');
        if (!authorization?.startsWith('Bearer ')) throw new Error('Unauthorized.');
        const token = authorization.split('Bearer ')[1];
        
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        
        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};
        const db = getFirestore(app);
        
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';
        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        switch (action) {
            case 'getShops': {
                // Fetch all shops across the platform
                const snap = await db.collectionGroup('shops').get();
                
                // Filter and Map: We only want shops nested under companies (Primary Source)
                // Reference path looks like: companies/COMPANY_ID/shops/SHOP_ID
                const data = snap.docs
                    .filter(d => d.ref.path.includes('companies/'))
                    .map(d => {
                        const pathSegments = d.ref.path.split('/');
                        const companiesIdx = pathSegments.indexOf('companies');
                        const companyId = companiesIdx !== -1 ? pathSegments[companiesIdx + 1] : 'unknown';
                        
                        return { 
                            id: d.id, 
                            companyId,
                            ...serializeTimestamps(d.data()) 
                        };
                    });
                
                // Sort in memory to bypass the COLLECTION_GROUP index requirement
                const sortedData = data.sort((a, b) => {
                    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
                    return timeB - timeA;
                });
                    
                return NextResponse.json({ success: true, data: sortedData.slice(0, 100) });
            }

            case 'approveShop': {
                const { shopId, companyId } = payload;
                if (!shopId || !companyId) throw new Error("Approval Error: Missing identifiers.");

                const internalShopRef = db.doc(`companies/${companyId}/shops/${shopId}`);
                const publicShopRef = db.doc(`shops/${shopId}`);
                
                const shopSnap = await internalShopRef.get();
                if (!shopSnap.exists) throw new Error(`Source profile not found at ${internalShopRef.path}`);
                
                const shopData = shopSnap.data()!;
                const batch = db.batch();

                // 1. Update internal status
                batch.update(internalShopRef, { 
                    status: 'approved', 
                    updatedAt: FieldValue.serverTimestamp() 
                });
                
                // 2. Clone to public root registry
                batch.set(publicShopRef, {
                    ...shopData,
                    id: shopId,
                    companyId,
                    status: 'approved',
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });

                // 3. Sync Products sub-collection to public
                const productsSnap = await internalShopRef.collection('products').get();
                const publicProductsCol = publicShopRef.collection('products');
                
                // Clear existing public entries first
                const existingPublic = await publicProductsCol.get();
                existingPublic.forEach(d => batch.delete(d.ref));

                // Copy over current active products
                productsSnap.forEach(d => {
                    batch.set(publicProductsCol.doc(d.id), { ...d.data(), id: d.id });
                });

                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').limit(500).get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                // Sort in memory
                data.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                return NextResponse.json({ success: true, data: data.slice(0, 100) });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').limit(100).get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                data.sort((a,b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
                return NextResponse.json({ success: true, data });
            }

            case 'getContributions': {
                const snap = await db.collection('contributions').limit(100).get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            default:
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
