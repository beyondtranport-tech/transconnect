
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
                const snap = await db.collectionGroup('shops').get();
                
                // IMPORTANT: Filter out the public clones. Only manage source records.
                const data = snap.docs
                    .filter(d => d.ref.path.includes('/companies/'))
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
                
                // Memory sort to bypass index delay
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
                if (!shopSnap.exists) throw new Error(`Source profile not found at ${internalShopRef.path}`);
                
                const shopData = shopSnap.data()!;
                const batch = db.batch();

                // 1. Mark as approved internally
                batch.update(internalShopRef, { 
                    status: 'approved', 
                    lastSyncAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp() 
                });
                
                // 2. Clear and Clone to Public Root (Resolves 404)
                batch.set(publicShopRef, {
                    ...shopData,
                    id: shopId,
                    companyId,
                    status: 'approved',
                    synchronizedAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });

                // 3. Resync Product Sub-collections
                const productsSnap = await internalShopRef.collection('products').get();
                const publicProductsCol = publicShopRef.collection('products');
                
                const existingPublic = await publicProductsCol.get();
                existingPublic.forEach(d => batch.delete(d.ref));

                productsSnap.forEach(d => {
                    batch.set(publicProductsCol.doc(d.id), { 
                        ...d.data(), 
                        id: d.id,
                        synchronizedAt: FieldValue.serverTimestamp()
                    });
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

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(100).get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getPartnersByType': {
                const type = payload.type || 'all';
                let query: any = db.collection('partners');
                if (type !== 'all') {
                    query = query.where('type', '==', type);
                }
                const snap = await query.orderBy('updatedAt', 'desc').limit(100).get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
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
                    const cid = pathSegments[cIdx + 1];
                    const sid = pathSegments[sIdx + 1];

                    const shopSnap = await db.doc(`companies/${cid}/shops/${sid}`).get();
                    const shopName = shopSnap.exists ? shopSnap.data()?.shopName : 'Unknown Shop';

                    return {
                        id: d.id,
                        companyId: cid,
                        shopId: sid,
                        shopName,
                        ...serializeTimestamps(data)
                    };
                }));

                return NextResponse.json({ success: true, data: agreements });
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

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
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
