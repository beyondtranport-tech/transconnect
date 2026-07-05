import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * UTILITY: TIMESTAMP SERIALIZATION
 * Ensures all Firestore Timestamps are converted to ISO strings for the client.
 */
function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    if (docData instanceof Timestamp) return docData.toDate().toISOString();
    if (Array.isArray(docData)) return docData.map(serializeTimestamps);
    if (typeof docData === 'object' && docData !== null) {
        const serialized: { [key: string]: any } = {};
        for (const key in docData) serialized[key] = serializeTimestamps(docData[key]);
        return serialized;
    }
    return docData;
}

export async function POST(req: NextRequest) {
    let currentAction = 'initialization';
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) throw new Error(`Admin SDK failed: ${initError}`);

        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized: Missing token.');
        const token = authHeader.split('Bearer ')[1];
        
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        const db = getFirestore(app);

        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || 
                        decodedToken.email === 'mkoton100@gmail.com' || 
                        decodedToken.email === 'michael@logisticsflow.co.za' ||
                        decodedToken.admin === true;

        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        const body = await req.json();
        const { action, payload } = body;
        currentAction = action;

        switch (action) {
            // --- MEMBER & USER OVERSIGHT ---
            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(1000).get();
                const members = await Promise.all(snap.docs.map(async (doc) => {
                    const data = doc.data();
                    const ownerSnap = await db.collection('users').doc(data.ownerId).get();
                    return { 
                        id: doc.id, 
                        ...data, 
                        firstName: ownerSnap.data()?.firstName || 'Member', 
                        lastName: ownerSnap.data()?.lastName || '', 
                        email: ownerSnap.data()?.email || 'N/A' 
                    };
                }));
                return NextResponse.json({ success: true, data: members.map(serializeTimestamps) });
            }
            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(200).get();
                const logs = await Promise.all(snap.docs.map(async (doc) => {
                    const data = doc.data();
                    const userSnap = await db.collection('users').doc(data.userId).get();
                    return { id: doc.id, ...data, userName: userSnap.data()?.firstName || 'System' };
                }));
                return NextResponse.json({ success: true, data: logs.map(serializeTimestamps) });
            }

            // --- REGISTRY MANAGEMENT (CRM) ---
            case 'getPartnersByType': {
                const { type } = payload;
                const snap = await db.collection('partners').where('type', '==', type).orderBy('updatedAt', 'desc').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })).map(serializeTimestamps) });
            }
            case 'savePartner': {
                const { partner, collection = 'partners' } = payload;
                const ref = db.collection(collection).doc(partner.id || db.collection(collection).doc().id);
                await ref.set({ 
                    ...partner, 
                    id: ref.id, 
                    updatedAt: FieldValue.serverTimestamp(),
                    createdAt: partner.createdAt || FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }
            case 'deletePartner': {
                const { partnerId, source = 'Partner' } = payload;
                const coll = source === 'Lead' ? 'leads' : 'partners';
                await db.collection(coll).doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }
            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })).map(serializeTimestamps) });
            }

            // --- SUPPLIER MALL (SHOPS) ---
            case 'getShops': {
                const snap = await db.collectionGroup('shops').get();
                const shops = snap.docs.map(d => ({ id: d.id, path: d.ref.path, ...d.data() }));
                return NextResponse.json({ success: true, data: shops.map(serializeTimestamps) });
            }
            case 'approveShop': {
                const { shopId, companyId } = payload;
                const shopRef = db.doc(`companies/${companyId}/shops/${shopId}`);
                const publicRef = db.collection('shops').doc(shopId);
                
                await db.runTransaction(async (transaction) => {
                    const shopSnap = await transaction.get(shopRef);
                    if (!shopSnap.exists) throw new Error("Shop record not found.");
                    const data = shopSnap.data()!;
                    
                    transaction.update(shopRef, { status: 'approved', updatedAt: FieldValue.serverTimestamp() });
                    transaction.set(publicRef, { 
                        ...data, 
                        status: 'approved', 
                        updatedAt: FieldValue.serverTimestamp(),
                        companyId 
                    }, { merge: true });
                });
                return NextResponse.json({ success: true });
            }

            // --- BUY & SELL MALL ---
            case 'getGlobalSales': {
                const snap = await db.collection('sales').orderBy('updatedAt', 'desc').limit(200).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })).map(serializeTimestamps) });
            }
            case 'searchListings': {
                const { term } = payload;
                const snap = await db.collectionGroup('vehicleListings').where('status', '==', 'active').get();
                let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                if (term) {
                    const lowTerm = term.toLowerCase();
                    results = results.filter((r: any) => 
                        r.make?.toLowerCase().includes(lowTerm) || 
                        r.model?.toLowerCase().includes(lowTerm) || 
                        r.description?.toLowerCase().includes(lowTerm)
                    );
                }
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }
            case 'finalizeSale': {
                const { saleId, commissionRate } = payload;
                const saleRef = db.collection('sales').doc(saleId);
                
                await db.runTransaction(async (transaction) => {
                    const saleSnap = await transaction.get(saleRef);
                    if (!saleSnap.exists) throw new Error("Sale record not found.");
                    const saleData = saleSnap.data()!;
                    
                    const price = saleData.agreedPrice;
                    const commission = price * (commissionRate / 100);
                    const sellerNet = price - commission;

                    const sellerRef = db.collection('companies').doc(saleData.sellerId);
                    
                    // Disburse to seller
                    transaction.update(sellerRef, {
                        walletBalance: FieldValue.increment(sellerNet),
                        availableBalance: FieldValue.increment(sellerNet),
                        updatedAt: FieldValue.serverTimestamp()
                    });

                    // Log seller transaction
                    const sellerTxRef = sellerRef.collection('transactions').doc();
                    transaction.set(sellerTxRef, {
                        transactionId: sellerTxRef.id,
                        type: 'credit',
                        amount: sellerNet,
                        description: `Sale proceeds: ${saleData.vehicleName}`,
                        status: 'allocated',
                        date: FieldValue.serverTimestamp()
                    });

                    // Isolate commission
                    const platTxRef = db.collection('platformTransactions').doc();
                    transaction.set(platTxRef, {
                        transactionId: platTxRef.id,
                        type: 'credit',
                        amount: commission,
                        description: `Commission from ${saleData.sellerName} on vehicle sale`,
                        companyId: saleData.sellerId,
                        date: FieldValue.serverTimestamp()
                    });

                    transaction.update(saleRef, { status: 'concluded', updatedAt: FieldValue.serverTimestamp() });
                });
                return NextResponse.json({ success: true });
            }

            // --- STAFF MANAGEMENT ---
            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
            }
            case 'savePlatformStaff': {
                const { staff } = payload;
                const ref = db.collection('platformStaff').doc(staff.id || db.collection('platformStaff').doc().id);
                await ref.set({ ...staff, id: ref.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true });
            }

            default: return NextResponse.json({ success: false, error: `Action "${action}" not supported.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Failure [${currentAction}]:`, error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Internal Server Error' 
        }, { status: 500 });
    }
}
