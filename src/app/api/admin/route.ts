
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import { enrichPartner } from '@/ai/flows/enrich-partner-flow';

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

        if (!isAdmin) {
            throw new Error("Access Denied: Administrative authority required.");
        }

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};

        switch (action) {
            case 'searchListings': {
                const { term } = payload;
                const snap = await db.collectionGroup('vehicleListings').where('status', '==', 'active').get();
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
                const results = await Promise.all(snap.docs.map(async (d) => {
                    const data = d.data();
                    const [vehicleSnap, sellerSnap, buyerSnap] = await Promise.all([
                        db.collectionGroup('vehicleListings').where('id', '==', data.vehicleId).get(),
                        db.collection('companies').doc(data.sellerId).get(),
                        db.collection('companies').doc(data.buyerId).get()
                    ]);
                    
                    return {
                        id: d.id,
                        ...data,
                        vehicleName: vehicleSnap.empty ? 'Unknown Vehicle' : `${vehicleSnap.docs[0].data().year} ${vehicleSnap.docs[0].data().make}`,
                        sellerName: sellerSnap.data()?.companyName || 'Unknown Seller',
                        buyerName: buyerSnap.data()?.companyName || 'Unknown Buyer'
                    };
                }));
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'finalizeSale': {
                const { saleId } = payload;
                const saleRef = db.collection('sales').doc(saleId);
                const saleSnap = await saleRef.get();
                if (!saleSnap.exists) throw new Error("Sale not found.");
                
                const saleData = saleSnap.data()!;
                const commission = saleData.agreedPrice * (saleData.commissionRate / 100);
                const sellerNet = saleData.agreedPrice - commission;

                await db.runTransaction(async (transaction) => {
                    // Update status
                    transaction.update(saleRef, { status: 'concluded', updatedAt: FieldValue.serverTimestamp() });

                    // Disburse to Seller
                    const sellerRef = db.collection('companies').doc(saleData.sellerId);
                    transaction.update(sellerRef, {
                        walletBalance: FieldValue.increment(sellerNet),
                        availableBalance: FieldValue.increment(sellerNet)
                    });

                    // Record Platform Revenue
                    const platformTxRef = db.collection('platformTransactions').doc();
                    transaction.set(platformTxRef, {
                        type: 'credit',
                        amount: commission,
                        description: `Commission on vehicle sale: ${saleId}`,
                        chartOfAccountsCode: '4240',
                        timestamp: FieldValue.serverTimestamp()
                    });
                });
                return NextResponse.json({ success: true });
            }

            case 'logCommunication': {
                const { partnerId, type, subject, notes, collection = 'partners' } = payload;
                if (!partnerId || !subject) throw new Error("Missing logging details.");
                
                const logRef = db.collection(collection).doc(partnerId).collection('communications').doc();
                await logRef.set({
                    id: logRef.id,
                    type,
                    subject,
                    notes,
                    adminId: decodedToken.uid,
                    timestamp: FieldValue.serverTimestamp()
                });
                
                await db.collection(collection).doc(partnerId).update({
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                });
                
                return NextResponse.json({ success: true });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(500).get();
                const members = await Promise.all(snap.docs.map(async (doc) => {
                    const data = doc.data();
                    const ownerSnap = await db.collection('users').doc(data.ownerId).get();
                    return { id: doc.id, ...data, firstName: ownerSnap.data()?.firstName || 'User', lastName: ownerSnap.data()?.lastName || '', email: ownerSnap.data()?.email || 'N/A' };
                }));
                return NextResponse.json({ success: true, data: members.map(serializeTimestamps) });
            }

            default: return NextResponse.json({ success: false, error: "Action not supported." }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
