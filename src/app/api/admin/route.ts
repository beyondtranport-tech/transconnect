
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

// Helper to convert Firestore Timestamps to JSON-serializable strings
function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    const newDocData: { [key: string]: any } = {};
    for (const key in docData) {
        const value = docData[key];
        if (value instanceof Timestamp) {
            newDocData[key] = value.toDate().toISOString();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            newDocData[key] = serializeTimestamps(value);
        } else {
            newDocData[key] = value;
        }
    }
    return newDocData;
}

export async function verifyAdmin(request: NextRequest): Promise<{ db: FirebaseFirestore.Firestore, adminUid: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        throw new Error(`Admin SDK not initialized: ${initError}`);
    }

    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
        throw new Error('Unauthorized: Missing or invalid token.');
    }
    const token = authorization.split('Bearer ')[1];
    
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    if (decodedToken.email !== 'beyondtransport@gmail.com') {
        throw new Error('Forbidden: Admin access required.');
    }

    return { db: getFirestore(app), adminUid: decodedToken.uid };
}


export async function POST(req: NextRequest) {
    try {
        const { db, adminUid } = await verifyAdmin(req);
        const { action, payload } = await req.json();

        switch (action) {
            case 'getMembers': {
                const companiesSnap = await db.collection('companies').get();
                const ownerIds = companiesSnap.docs.map(doc => doc.data().ownerId).filter(Boolean);
                
                let usersData: { [key: string]: any } = {};
                if (ownerIds.length > 0) {
                    const usersSnap = await db.collection('users').where('__name__', 'in', ownerIds).get();
                    usersSnap.forEach(doc => {
                        usersData[doc.id] = serializeTimestamps(doc.data());
                    });
                }
                
                const members = companiesSnap.docs.map(companyDoc => {
                    const company = serializeTimestamps(companyDoc.data());
                    const owner = usersData[company.ownerId];
                    return {
                        id: company.ownerId, // User UID is the primary ID for this list
                        companyId: company.id,
                        firstName: owner?.firstName,
                        lastName: owner?.lastName,
                        email: owner?.email,
                        createdAt: owner?.createdAt,
                        companyName: company.companyName,
                        membershipId: company.membershipId,
                        walletBalance: company.walletBalance,
                    };
                });
                
                return NextResponse.json({ success: true, data: members });
            }
             case 'getMemberships': {
                const snapshot = await db.collection('memberships').get();
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }
            case 'getContributions': {
                const snapshot = await db.collection('contributions').get();
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }
            case 'getShops': {
                const snapshot = await db.collectionGroup('shops').where('status', '!=', 'draft').get();
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }
            case 'getFinanceApplications': {
                 const [quotesSnap, enquiriesSnap] = await Promise.all([
                    db.collectionGroup('quotes').get(),
                    db.collectionGroup('enquiries').get()
                ]);
                const quotes = quotesSnap.docs.map(doc => ({ ...serializeTimestamps(doc.data()), id: doc.id, recordType: 'Quote' }));
                const enquiries = enquiriesSnap.docs.map(doc => ({ ...serializeTimestamps(doc.data()), id: doc.id, recordType: 'Enquiry' }));

                const combined = [...quotes, ...enquiries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                return NextResponse.json({ success: true, data: combined });
            }
            case 'approveWalletPayment': {
                 const { companyId, paymentId, amount, description, userId, reconciliationId } = payload;
                 if (!companyId || !paymentId || !amount || !description || !userId) {
                    throw new Error("Missing required payload for approveWalletPayment.");
                 }

                 const batch = db.batch();
                 
                 const companyRef = db.doc(`companies/${companyId}`);
                 batch.update(companyRef, { walletBalance: FieldValue.increment(amount) });
                 
                 const transactionRef = db.collection(`companies/${companyId}/transactions`).doc();
                 batch.set(transactionRef, {
                    transactionId: transactionRef.id,
                    reconciliationId: reconciliationId || null,
                    type: 'credit',
                    amount: amount,
                    date: Timestamp.now(),
                    description: `EFT Payment: ${description}`,
                    status: 'allocated',
                    isAdjustment: false,
                    chartOfAccountsCode: '4410',
                    postedBy: adminUid,
                    userId,
                 });

                 const paymentRef = db.doc(`companies/${companyId}/walletPayments/${paymentId}`);
                 batch.delete(paymentRef);

                 await batch.commit();
                 return NextResponse.json({ success: true, message: "Payment approved and wallet updated." });
            }
            case 'deleteTransaction': {
                const { companyId, transactionId } = payload;
                if (!companyId || !transactionId) throw new Error("companyId and transactionId are required.");
                await db.doc(`companies/${companyId}/transactions/${transactionId}`).delete();
                return NextResponse.json({ success: true });
            }
            default:
                return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`API Error in /api/admin for action:`, error);
        const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
        return NextResponse.json({ success: false, error: error.message }, { status });
    }
}
