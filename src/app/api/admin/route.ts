
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

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
            case 'searchRegistry': {
                const { term, type } = payload;
                const collectionName = (type === 'lead') ? 'leads' : 'partners';
                
                let query: any = db.collection(collectionName);
                if (type && type !== 'all' && type !== 'lead') {
                    query = query.where('type', '==', type);
                }

                // Note: Firestore doesn't support full-text search.
                // We perform a wide read (capped) and filter for a "Forensic Scan" experience.
                const snap = await query.orderBy('updatedAt', 'desc').limit(1000).get();
                
                let data = snap.docs.map((d: QueryDocumentSnapshot) => ({ 
                    id: d.id, 
                    ...serializeTimestamps(d.data()) 
                }));

                if (term && term.length > 0) {
                    const lowTerm = term.toLowerCase();
                    data = data.filter((item: any) => {
                        const name = (item.companyName || item.company_name || '').toLowerCase();
                        const email = (item.email || '').toLowerCase();
                        const contact = (item.contactPerson || '').toLowerCase();
                        const tags = (item.industrialTags || []).join(' ').toLowerCase();
                        const notes = (item.minedServiceWording || item.notes || '').toLowerCase();
                        const id = item.id.toLowerCase();

                        return name.includes(lowTerm) || 
                               email.includes(lowTerm) || 
                               contact.includes(lowTerm) || 
                               tags.includes(lowTerm) ||
                               notes.includes(lowTerm) ||
                               id.includes(lowTerm);
                    });
                }

                return NextResponse.json({ success: true, data: data.slice(0, 100) });
            }

            case 'getShops': {
                const snap = await db.collectionGroup('shops').get();
                const data = snap.docs
                    .filter((doc: QueryDocumentSnapshot) => {
                        const segments = doc.ref.path.split('/');
                        return segments.length === 4 && segments[0] === 'companies';
                    })
                    .map((doc: QueryDocumentSnapshot) => {
                        const segments = doc.ref.path.split('/');
                        return { 
                            id: doc.id, 
                            companyId: segments[1],
                            ...serializeTimestamps(doc.data()) 
                        };
                    });
                
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
                if (!shopSnap.exists) throw new Error(`Source profile not found.`);
                
                const shopData = shopSnap.data()!;
                const batch = db.batch();

                batch.update(internalShopRef, { 
                    status: 'approved', 
                    updatedAt: FieldValue.serverTimestamp() 
                });
                
                batch.set(publicShopRef, {
                    ...shopData,
                    id: shopId,
                    companyId,
                    status: 'approved',
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });

                const productsSnap = await internalShopRef.collection('products').get();
                const publicProductsCol = publicShopRef.collection('products');
                
                const existingPublic = await publicProductsCol.get();
                existingPublic.forEach(d => batch.delete(d.ref));

                productsSnap.forEach(d => {
                    batch.set(publicProductsCol.doc(d.id), { 
                        ...d.data(), 
                        id: d.id,
                        updatedAt: FieldValue.serverTimestamp()
                    });
                });

                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').limit(1000).get();
                const data = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getPartnersByType': {
                const type = payload.type || 'all';
                let q: any = db.collection('partners');
                if (type !== 'all') {
                    q = q.where('type', '==', type);
                }
                const snap = await q.orderBy('updatedAt', 'desc').limit(1000).get();
                const data = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                const data = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                const data = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...serializeTimestamps(d.data()) }));
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
