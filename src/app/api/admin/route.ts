
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

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
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) throw new Error(`Admin SDK failed: ${initError}`);

        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized.');
        const token = authHeader.split('Bearer ')[1];
        
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        const db = getFirestore(app);

        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || 
                        decodedToken.email === 'mkoton100@gmail.com' || 
                        decodedToken.email === 'michael@logisticsflow.co.za' ||
                        decodedToken.admin === true;

        if (!isAdmin) throw new Error("Access Denied.");

        const body = await req.json();
        const { action, payload } = body;

        switch (action) {
            // MEMBERS & AUDIT
            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(500).get();
                const members = await Promise.all(snap.docs.map(async (doc) => {
                    const data = doc.data();
                    const ownerSnap = await db.collection('users').doc(data.ownerId).get();
                    return { id: doc.id, ...data, firstName: ownerSnap.data()?.firstName || 'Member', lastName: ownerSnap.data()?.lastName || '', email: ownerSnap.data()?.email || 'N/A' };
                }));
                return NextResponse.json({ success: true, data: members.map(serializeTimestamps) });
            }
            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                const logs = await Promise.all(snap.docs.map(async (doc) => {
                    const data = doc.data();
                    const userSnap = await db.collection('users').doc(data.userId).get();
                    return { id: doc.id, ...data, userName: userSnap.data()?.firstName || 'System' };
                }));
                return NextResponse.json({ success: true, data: logs.map(serializeTimestamps) });
            }

            // LOADS MALL OVERSIGHT
            case 'getBrokerAgreements': {
                const snap = await db.collectionGroup('brokerAgreements').orderBy('status', 'asc').orderBy('createdAt', 'desc').get();
                const agreements = snap.docs.map(d => ({ id: d.id, path: d.ref.path, ...d.data() }));
                return NextResponse.json({ success: true, data: agreements.map(serializeTimestamps) });
            }
            case 'getGlobalLoads': {
                const snap = await db.collectionGroup('loads').orderBy('status', 'asc').orderBy('createdAt', 'desc').limit(200).get();
                const loads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                return NextResponse.json({ success: true, data: loads.map(serializeTimestamps) });
            }
            case 'updateBrokerAgreementStatus': {
                const { path, status } = payload;
                await db.doc(path).update({ status, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }

            // BUY & SELL MALL
            case 'searchListings': {
                const { term } = payload;
                const snap = await db.collectionGroup('vehicleListings')
                    .where('status', '==', 'active')
                    .orderBy('createdAt', 'desc')
                    .get();
                    
                let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                if (term) {
                    const low = term.toLowerCase();
                    results = results.filter((r: any) => 
                        r.make?.toLowerCase().includes(low) || 
                        r.model?.toLowerCase().includes(low) || 
                        r.classification?.toLowerCase().includes(low)
                    );
                }
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }
            case 'getGlobalSales': {
                const snap = await db.collection('sales').orderBy('updatedAt', 'desc').limit(100).get();
                const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }
            case 'finalizeSale': {
                const { saleId, commissionRate: overrideRate } = payload;
                const saleRef = db.collection('sales').doc(saleId);
                const saleSnap = await saleRef.get();
                if (!saleSnap.exists) throw new Error("Sale not found.");
                const saleData = saleSnap.data()!;
                
                const rate = overrideRate || saleData.commissionRate || 2.5;
                const commission = saleData.agreedPrice * (rate / 100);
                const sellerNet = saleData.agreedPrice - commission;

                await db.runTransaction(async (transaction) => {
                    transaction.update(saleRef, { status: 'concluded', updatedAt: FieldValue.serverTimestamp(), commissionRate: rate });
                    const sellerRef = db.collection('companies').doc(saleData.sellerId);
                    transaction.update(sellerRef, {
                        walletBalance: FieldValue.increment(sellerNet),
                        availableBalance: FieldValue.increment(sellerNet)
                    });
                    const platformTxRef = db.collection('platformTransactions').doc();
                    transaction.set(platformTxRef, {
                        type: 'credit', amount: commission, description: `Vehicle Sale Commission: ${saleId}`, timestamp: FieldValue.serverTimestamp(), companyId: saleData.sellerId
                    });
                });
                return NextResponse.json({ success: true });
            }

            // REGISTRY & ENRICHMENT
            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(500).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })).map(serializeTimestamps) });
            }
            case 'logCommunication': {
                const { partnerId, type, subject, notes, collection = 'partners' } = payload;
                const logRef = db.collection(collection).doc(partnerId).collection('communications').doc();
                await logRef.set({ id: logRef.id, type, subject, notes, adminId: decodedToken.uid, timestamp: FieldValue.serverTimestamp() });
                await db.collection(collection).doc(partnerId).update({ lastOutreachAt: FieldValue.serverTimestamp(), lastOutreachSubject: subject, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }

            // STAFF
            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
            }

            default: return NextResponse.json({ success: false, error: "Action not supported." }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

