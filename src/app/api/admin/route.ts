

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
                    const docData = doc.data();
                    const pathSegments = doc.ref.path.split('/');
                    const companyIdIndex = pathSegments.indexOf('companies');
                    const companyId = companyIdIndex !== -1 && companyIdIndex < pathSegments.length - 1 ? pathSegments[companyIdIndex + 1] : null;
                    
                    return {
                        ...serializeTimestamps(docData),
                        id: doc.id, // This is the staff document ID
                        companyId: companyId,
                    };
                });
                return NextResponse.json({ success: true, data: data });
            }
            case 'addStaffMember': {
                const { companyId, data } = payload;
                if (!companyId || !data) {
                    throw new Error("Missing companyId or data for addStaffMember.");
                }
                const staffCollectionRef = db.collection(`companies/${companyId}/staff`);
                const newStaffDocRef = staffCollectionRef.doc();
                const finalData = { ...data, id: newStaffDocRef.id, companyId: companyId };
                await newStaffDocRef.set(finalData);
                return NextResponse.json({ success: true, id: newStaffDocRef.id });
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
                const snapshot = await db.collectionGroup('shops').where('status', 'in', ['pending_review', 'approved', 'rejected']).orderBy('createdAt', 'desc').get();
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
                const { memberId, transactionId } = payload;
                if (!memberId || !transactionId) throw new Error("memberId and transactionId are required.");
                await db.doc(`companies/${memberId}/transactions/${transactionId}`).delete();
                return NextResponse.json({ success: true });
            }
             case 'updateMemberStatus': {
                const { companyId, status } = payload;
                if (!companyId || !status) {
                    throw new Error("Missing companyId or status.");
                }

                await db.runTransaction(async (transaction) => {
                    const companyRef = db.doc(`companies/${companyId}`);
                    const memberSnap = await transaction.get(companyRef);
                    if (!memberSnap.exists) {
                        throw new Error("Member not found.");
                    }
                    const beforeData = memberSnap.data();

                    const updatedData = { status, updatedAt: FieldValue.serverTimestamp() };
                    transaction.update(companyRef, updatedData);

                    const auditLogRef = db.collection('auditLogs').doc();
                    transaction.set(auditLogRef, {
                        collectionPath: 'companies',
                        documentId: companyId,
                        userId: adminUid,
                        action: 'update',
                        timestamp: FieldValue.serverTimestamp(),
                        before: serializeTimestamps(beforeData),
                        after: serializeTimestamps({ ...beforeData, ...updatedData }),
                    });
                });
                return NextResponse.json({ success: true, message: "Member status updated and audited." });
            }
            case 'deleteMember': {
                const { companyId } = payload;
                if (!companyId) throw new Error("Missing companyId.");

                await db.runTransaction(async (transaction) => {
                    const companyRef = db.doc(`companies/${companyId}`);
                    const memberSnap = await transaction.get(companyRef);
                    if (!memberSnap.exists) {
                        throw new Error("Member not found.");
                    }
                    const beforeData = memberSnap.data();
                    
                    transaction.delete(companyRef);
                    
                    const auditLogRef = db.collection('auditLogs').doc();
                    transaction.set(auditLogRef, {
                        collectionPath: 'companies',
                        documentId: companyId,
                        userId: adminUid,
                        action: 'delete',
                        timestamp: FieldValue.serverTimestamp(),
                        before: serializeTimestamps(beforeData),
                        after: null,
                    });
                });
                return NextResponse.json({ success: true, message: "Member deleted and action audited." });
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
            case 'updateStaffMember': {
                const { companyId, staffId, data } = payload;
                if (!companyId || !staffId || !data) {
                    throw new Error("Missing companyId, staffId, or data for update.");
                }
                const staffRef = db.doc(`companies/${companyId}/staff/${staffId}`);
                await staffRef.update({ ...data, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true, message: "Staff member updated." });
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
            case 'approveShop': {
                 const { shopId, companyId } = payload;
                if (!shopId || !companyId) {
                    throw new Error("Missing shopId or companyId for approveShop action.");
                }
                
                const memberShopRef = db.doc(`companies/${companyId}/shops/${shopId}`);
                const publicShopRef = db.doc(`shops/${shopId}`);
                
                const shopDoc = await memberShopRef.get();
                if (!shopDoc.exists) {
                    throw new Error(`Shop with ID ${shopId} not found for company ${companyId}.`);
                }
                
                const shopData = shopDoc.data();
                if (!shopData) {
                    throw new Error(`Shop data is empty for shop ${shopId}.`);
                }
                
                const batch = db.batch();

                const publicShopData = { ...shopData, status: 'approved', updatedAt: FieldValue.serverTimestamp() };
                
                batch.set(publicShopRef, publicShopData);
                batch.update(memberShopRef, { status: 'approved', updatedAt: FieldValue.serverTimestamp() });
                
                 // Award points for shop approval if applicable
                const loyaltyConfigDoc = await db.collection('configuration').doc('loyaltySettings').get();
                const shopCreationPoints = loyaltyConfigDoc.data()?.shopCreationPoints || 100;
                const companyRef = db.doc(`companies/${companyId}`);
                batch.update(companyRef, { rewardPoints: FieldValue.increment(shopCreationPoints) });
                
                await batch.commit();

                return NextResponse.json({ success: true, message: 'Shop approved and published.' });
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
