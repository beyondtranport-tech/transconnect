
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Utility to recursively serialize Firestore Timestamps to ISO strings.
 */
function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    if (docData instanceof Timestamp) {
        return docData.toDate().toISOString();
    }
    if (Array.isArray(docData)) {
        return docData.map(serializeTimestamps);
    }
    if (typeof docData === 'object' && docData !== null) {
        const serialized: { [key: string]: any } = {};
        for (const key in docData) {
            serialized[key] = serializeTimestamps(docData[key]);
        }
        return serialized;
    }
    return docData;
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
        
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';
        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};
        const db = getFirestore(app);

        switch (action) {
            case 'getShops': {
                // Fetch all shops across the platform
                const snap = await db.collectionGroup('shops').get();
                
                // Filter to only show primary records (nested under companies)
                // Public clones live at 'shops/{id}', primary live at 'companies/{cid}/shops/{id}'
                const data = snap.docs
                    .filter(d => d.ref.path.split('/').includes('companies'))
                    .map(d => {
                        const pathSegments = d.ref.path.split('/');
                        const cIdx = pathSegments.indexOf('companies');
                        const companyId = pathSegments[cIdx + 1];
                        
                        return { 
                            id: d.id, 
                            companyId,
                            ...serializeTimestamps(d.data()) 
                        };
                    });
                
                // Sort in memory to bypass index requirement
                data.sort((a, b) => {
                    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
                    return timeB - timeA;
                });
                    
                return NextResponse.json({ success: true, data: data.slice(0, 100) });
            }

            case 'approveShop': {
                const { shopId, companyId } = payload;
                if (!shopId || !companyId) throw new Error("Missing shopId or companyId.");

                const internalShopRef = db.doc(`companies/${companyId}/shops/${shopId}`);
                const publicShopRef = db.doc(`shops/${shopId}`);
                
                const shopSnap = await internalShopRef.get();
                if (!shopSnap.exists) throw new Error(`Source shop record not found.`);
                
                const shopData = shopSnap.data()!;
                const batch = db.batch();

                // 1. Update internal status
                batch.update(internalShopRef, { 
                    status: 'approved', 
                    updatedAt: FieldValue.serverTimestamp() 
                });
                
                // 2. Clone to public root (The fix for 404)
                batch.set(publicShopRef, {
                    ...shopData,
                    id: shopId,
                    companyId,
                    status: 'approved',
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });

                // 3. Sync Products
                const productsSnap = await internalShopRef.collection('products').get();
                const publicProductsCol = publicShopRef.collection('products');
                
                // Clear old public products
                const existingPublic = await publicProductsCol.get();
                existingPublic.forEach(d => batch.delete(d.ref));

                // Copy current products
                productsSnap.forEach(d => {
                    batch.set(publicProductsCol.doc(d.id), { ...d.data(), id: d.id });
                });

                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'rejectShop': {
                const { shopId, companyId } = payload;
                if (!shopId || !companyId) throw new Error("Missing identifiers.");

                const internalShopRef = db.doc(`companies/${companyId}/shops/${shopId}`);
                const publicShopRef = db.doc(`shops/${shopId}`);

                const batch = db.batch();
                batch.update(internalShopRef, { status: 'rejected', updatedAt: FieldValue.serverTimestamp() });
                batch.delete(publicShopRef);

                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'getPendingAgreements': {
                const snap = await db.collectionGroup('agreements')
                    .where('status', '==', 'proposed')
                    .get();
                
                const agreements = await Promise.all(snap.docs.map(async d => {
                    const data = d.data();
                    const pathSegments = d.ref.path.split('/');
                    const cIdx = pathSegments.indexOf('companies');
                    const sIdx = pathSegments.indexOf('shops');
                    const companyId = pathSegments[cIdx + 1];
                    const shopId = pathSegments[sIdx + 1];

                    // Fetch shop name for UI
                    const shopSnap = await db.doc(`companies/${companyId}/shops/${shopId}`).get();
                    const shopName = shopSnap.exists ? shopSnap.data()?.shopName : 'Unknown Shop';

                    return {
                        id: d.id,
                        companyId,
                        shopId,
                        shopName,
                        ...serializeTimestamps(data)
                    };
                }));

                return NextResponse.json({ success: true, data: agreements });
            }

            case 'acceptCommercialAgreement': {
                const { companyId, shopId, agreementId } = payload;
                const agreementRef = db.doc(`companies/${companyId}/shops/${shopId}/agreements/${agreementId}`);
                const shopRef = db.doc(`companies/${companyId}/shops/${shopId}`);
                
                const agreementSnap = await agreementRef.get();
                if (!agreementSnap.exists) throw new Error("Agreement not found.");

                const batch = db.batch();
                batch.update(agreementRef, { 
                    status: 'active', 
                    effectiveDate: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp() 
                });
                batch.update(shopRef, { 
                    platformCommission: agreementSnap.data().percentage,
                    updatedAt: FieldValue.serverTimestamp()
                });

                // Archive other proposals
                const otherProposals = await db.collection(`companies/${companyId}/shops/${shopId}/agreements`)
                    .where('status', '==', 'proposed')
                    .get();
                
                otherProposals.forEach(doc => {
                    if (doc.id !== agreementId) {
                        batch.update(doc.ref, { status: 'archived', updatedAt: FieldValue.serverTimestamp() });
                    }
                });

                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(100).get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getContributions': {
                const snap = await db.collection('contributions').orderBy('createdAt', 'desc').limit(100).get();
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
