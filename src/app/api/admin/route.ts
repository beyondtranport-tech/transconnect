

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
                const usersSnap = await db.collection('users').get();
                
                const usersMap = new Map();
                usersSnap.forEach(doc => usersMap.set(doc.id, doc.data()));

                const members = companiesSnap.docs.map(doc => {
                    const companyData = doc.data();
                    const ownerInfo = usersMap.get(companyData.ownerId) || {};
                    return {
                        ...serializeTimestamps(companyData),
                        id: doc.id, // Company ID is the primary ID for this record
                        userId: companyData.ownerId,
                        firstName: ownerInfo.firstName,
                        lastName: ownerInfo.lastName,
                        email: ownerInfo.email,
                    };
                });
                return NextResponse.json({ success: true, data: members });
            }
             case 'getStaff': {
                const staffSnap = await db.collectionGroup('staff').get();
                const data = staffSnap.docs.map(doc => {
                    return {
                        ...serializeTimestamps(doc.data()),
                        id: doc.id,
                    };
                });
                return NextResponse.json({ success: true, data: data });
            }
            case 'getWalletPayments': {
                const snapshot = await db.collectionGroup('walletPayments').get();
                const data = snapshot.docs.map(doc => {
                    const docPath = doc.ref.path;
                    const pathSegments = docPath.split('/');
                    const companiesIndex = pathSegments.indexOf('companies');
                    const companyId = companiesIndex > -1 && pathSegments.length > companiesIndex + 1 ? pathSegments[companiesIndex + 1] : null;

                    return { 
                        id: doc.id,
                        companyId: companyId, 
                        ...serializeTimestamps(doc.data()) 
                    };
                });
                return NextResponse.json({ success: true, data });
            }
            case 'getWalletTransactions': {
                const snapshot = await db.collectionGroup('transactions').get();
                const data = snapshot.docs.map(doc => {
                     const docPath = doc.ref.path;
                    const pathSegments = docPath.split('/');
                    const companiesIndex = pathSegments.indexOf('companies');
                    const companyId = companiesIndex > -1 && pathSegments.length > companiesIndex + 1 ? pathSegments[companiesIndex + 1] : null;

                    return { 
                        id: doc.id,
                        companyId: companyId,
                        ...serializeTimestamps(doc.data()) 
                    };
                });
                return NextResponse.json({ success: true, data });
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
                const quotes = quotesSnap.docs.map(doc => {
                    const data = serializeTimestamps(doc.data());
                    return { ...data, id: doc.id, recordType: 'Quote', applicantId: data.userId };
                });
                const enquiries = enquiriesSnap.docs.map(doc => {
                    const data = serializeTimestamps(doc.data());
                    return { ...data, id: doc.id, recordType: 'Enquiry', applicantId: data.userId };
                });

                const combined = [...quotes, ...enquiries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                return NextResponse.json({ success: true, data: combined });
            }
            case 'approveWalletPayment': {
                 const { companyId, paymentId, amount, description, reconciliationId } = payload;
                 if (!companyId || !paymentId || !amount || !description) {
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
                    companyId: companyId,
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
            case 'updateStaffStatus': {
                const { companyId, staffId, status } = payload;
                if (!companyId || !staffId || !status) {
                    throw new Error("Missing companyId, staffId, or status.");
                }
                const staffRef = db.doc(`companies/${companyId}/staff/${staffId}`);
                await staffRef.update({ status, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true, message: "Staff status updated." });
            }
            case 'deleteStaffMember': {
                const { companyId, staffId } = payload;
                if (!companyId || !staffId) {
                    throw new Error("Missing companyId or staffId.");
                }
                const staffRef = db.doc(`companies/${companyId}/staff/${staffId}`);
                await staffRef.delete();
                return NextResponse.json({ success: true, message: "Staff member deleted." });
            }
            case 'updateStaffMember': {
                const { companyId, staffId, data } = payload;
                if (!companyId || !staffId || !data) {
                    throw new Error("Missing companyId, staffId, or data for update.");
                }
                const staffRef = db.doc(`companies/${companyId}/staff/${staffId}`);
                await staffRef.update({ ...data, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true, message: "Staff member updated." });
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
