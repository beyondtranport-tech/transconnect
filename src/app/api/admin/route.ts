
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Data Sanitization Layer
 * Scrubs 'undefined' values and normalizes snake_case keys from AI results.
 */
function normalizeAndSanitize(obj: any): any {
    if (Array.isArray(obj)) return obj.map(normalizeAndSanitize);
    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc: any, key) => {
            let val = obj[key];
            if (val === undefined) val = null;
            if (typeof val === 'object') val = normalizeAndSanitize(val);
            
            // Normalize common AI variations
            const normalizedKey = key === 'company_name' ? 'companyName' : 
                                key === 'contact_person' ? 'contactPerson' : 
                                key === 'industrial_category' ? 'category' : key;
            
            acc[normalizedKey] = val;
            return acc;
        }, {});
    }
    return obj;
}

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
        
        // Harmonized Admin Authorization
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';
        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        switch (action) {
            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(100).get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(100).get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                let q = db.collection('partners').orderBy('updatedAt', 'desc').limit(100);
                if (type && type !== 'all') {
                    q = db.collection('partners').where('type', '==', type).orderBy('updatedAt', 'desc').limit(100);
                }
                const snap = await q.get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getShops': {
                // Fetch all shops using collection group
                const snap = await db.collectionGroup('shops').orderBy('updatedAt', 'desc').get();
                
                // CRITICAL: Filter for 'Primary Source' records only (nested under companies)
                // This eliminates the public clones from appearing as duplicates in management.
                const data = snap.docs
                    .filter(d => d.ref.path.includes('/companies/'))
                    .map(d => {
                        const pathSegments = d.ref.path.split('/');
                        const companyIdIndex = pathSegments.indexOf('companies');
                        const companyId = pathSegments[companyIdIndex + 1];
                        return { 
                            id: d.id, 
                            companyId,
                            ...serializeTimestamps(d.data()) 
                        };
                    });
                return NextResponse.json({ success: true, data });
            }

            case 'approveShop': {
                const { shopId, companyId } = payload;
                if (!shopId || !companyId) throw new Error("Sync Error: Missing IDs.");

                const internalShopRef = db.doc(`companies/${companyId}/shops/${shopId}`);
                const publicShopRef = db.doc(`shops/${shopId}`);
                
                const shopSnap = await internalShopRef.get();
                if (!shopSnap.exists) throw new Error(`Source not found at ${internalShopRef.path}`);
                
                const shopData = shopSnap.data()!;
                const { id: _, ...sanitizedData } = shopData;

                const batch = db.batch();
                batch.update(internalShopRef, { status: 'approved', updatedAt: FieldValue.serverTimestamp() });
                batch.set(publicShopRef, {
                    ...sanitizedData,
                    id: shopId,
                    companyId,
                    status: 'approved',
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });

                const productsSnap = await internalShopRef.collection('products').get();
                const publicProductsCol = publicShopRef.collection('products');
                
                // Clear and re-sync products
                const existingPublic = await publicProductsCol.get();
                existingPublic.forEach(d => batch.delete(d.ref));

                productsSnap.forEach(d => {
                    batch.set(publicProductsCol.doc(d.id), { ...d.data(), id: d.id });
                });

                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                if (!Array.isArray(partners)) throw new Error("Invalid payload.");
                const batch = db.batch();
                const collectionName = type === 'lead' ? 'leads' : 'partners';
                
                partners.forEach((p: any) => {
                    const sanitized = normalizeAndSanitize(p);
                    const docId = sanitized.record_id || sanitized.id || db.collection(collectionName).doc().id;
                    const docRef = db.collection(collectionName).doc(docId);
                    batch.set(docRef, {
                        ...sanitized,
                        type: type === 'lead' ? 'lead' : type,
                        status: sanitized.status || (type === 'lead' ? 'new' : 'active'),
                        updatedAt: FieldValue.serverTimestamp(),
                        createdAt: FieldValue.serverTimestamp()
                    }, { merge: true });
                });
                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
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

            case 'listAllUsers': {
                const listUsers = await adminAuth.listUsers(100);
                const data = listUsers.users.map(u => ({
                    uid: u.uid,
                    email: u.email,
                    displayName: u.displayName,
                    disabled: u.disabled,
                    creationTime: u.metadata.creationTime,
                    lastSignInTime: u.metadata.lastSignInTime
                }));
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
