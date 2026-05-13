'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue, FieldPath } from 'firebase-admin/firestore';
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

export async function POST(req: NextRequest) {
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) {
            throw new Error(`Admin SDK not initialized: ${initError}`);
        }

        const authorization = req.headers.get('authorization');
        if (!authorization?.startsWith('Bearer ')) {
            throw new Error('Unauthorized: Missing or invalid token.');
        }
        const token = authorization.split('Bearer ')[1];
        
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        const requestorUid = decodedToken.uid;
        
        const { action, payload } = await req.json();
        const db = getFirestore(app);
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';

        // --- AUTHORIZATION ---
        const userDocForAuth = await db.collection('users').doc(requestorUid).get();
        const userCompanyIdForAuth = userDocForAuth.data()?.companyId;

        if (!isAdmin) {
             const allowedUserActions = ['saveCompanyLead', 'acceptCommercialAgreement', 'getAuditLogs', 'unpublishShop', 'logCommunication', 'getCommunicationLogs'];
             if (!allowedUserActions.includes(action)) {
                 throw new Error("Forbidden: Admin access required.");
             }
        }

        switch (action) {
            case 'invitePartner': {
                const { partnerId, followUpTask } = payload;
                const batch = db.batch();
                const partnerRef = db.collection('partners').doc(partnerId);
                
                batch.update(partnerRef, {
                    invitationStatus: 'invited',
                    updatedAt: FieldValue.serverTimestamp()
                });

                if (followUpTask && followUpTask.dueDate) {
                    const taskRef = partnerRef.collection('tasks').doc();
                    batch.set(taskRef, {
                        id: taskRef.id,
                        title: followUpTask.title,
                        description: followUpTask.description || '',
                        dueDate: Timestamp.fromDate(new Date(followUpTask.dueDate)),
                        status: 'pending',
                        assigneeId: followUpTask.assigneeId || requestorUid,
                        createdAt: FieldValue.serverTimestamp(),
                        updatedAt: FieldValue.serverTimestamp(),
                    });
                }
                
                const logRef = partnerRef.collection('communications').doc();
                batch.set(logRef, {
                    id: logRef.id,
                    type: 'Email',
                    subject: 'System Invitation Sent',
                    timestamp: FieldValue.serverTimestamp(),
                    loggedBy: requestorUid,
                });

                await batch.commit();
                return NextResponse.json({ success: true });
            }
            case 'listAllUsers': {
                const listUsersResult = await adminAuth.listUsers();
                const users = listUsersResult.users.map(u => ({
                    uid: u.uid,
                    email: u.email,
                    displayName: u.displayName,
                }));
                return NextResponse.json({ success: true, data: users });
            }
            case 'bulkSavePartners': {
                const { partners, type } = payload;
                if (!partners || !Array.isArray(partners)) throw new Error("Partners array is required.");
                const chunks = [];
                for (let i = 0; i < partners.length; i += 500) {
                    chunks.push(partners.slice(i, i + 500));
                }
                for (const chunk of chunks) {
                    const batch = db.batch();
                    const partnersCollection = db.collection('partners');
                    chunk.forEach((p: any) => {
                        const docRef = partnersCollection.doc();
                        batch.set(docRef, {
                            ...p,
                            id: docRef.id,
                            type: type || p.type,
                            status: p.status || 'active',
                            invitationStatus: p.invitationStatus || 'pending',
                            createdAt: FieldValue.serverTimestamp(),
                            updatedAt: FieldValue.serverTimestamp()
                        });
                    });
                    await batch.commit();
                }
                return NextResponse.json({ success: true, message: `${partners.length} records imported.` });
            }
            case 'getCommunicationLogs': {
                const { partnerId } = payload;
                const logsSnap = await db.collection(`partners/${partnerId}/communications`).orderBy('timestamp', 'desc').get();
                const data = logsSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }
            case 'logCommunication': {
                const { partnerId, type, subject, notes, followUpTask } = payload;
                const batch = db.batch();
                const logRef = db.collection(`partners/${partnerId}/communications`).doc();
                batch.set(logRef, {
                    id: logRef.id, type, subject, notes: notes || '',
                    timestamp: FieldValue.serverTimestamp(), loggedBy: requestorUid,
                });
                if (followUpTask && followUpTask.dueDate) {
                    const taskRef = db.collection(`partners/${partnerId}/tasks`).doc();
                    batch.set(taskRef, {
                        id: taskRef.id, title: followUpTask.title, description: followUpTask.description || '',
                        dueDate: Timestamp.fromDate(new Date(followUpTask.dueDate)), status: 'pending',
                        assigneeId: followUpTask.assigneeId || requestorUid,
                        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
                    });
                }
                await batch.commit();
                return NextResponse.json({ success: true });
            }
            case 'getMembers': {
                const companiesSnap = await db.collection('companies').get();
                const userDocs = await db.collection('users').get();
                const userMap = new Map(userDocs.docs.map(d => [d.id, d.data()]));
                const data = companiesSnap.docs.map(doc => {
                    const c = doc.data();
                    const u = userMap.get(c.ownerId) || {};
                    return { id: doc.id, ...serializeTimestamps(c), firstName: u.firstName, lastName: u.lastName, email: u.email };
                });
                return NextResponse.json({ success: true, data });
            }
            case 'getShops': {
                const shopsSnap = await db.collectionGroup('shops').get();
                const data = shopsSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }
            case 'approveShop': {
                const { shopId, companyId } = payload;
                const shopRef = db.doc(`companies/${companyId}/shops/${shopId}`);
                const publicShopRef = db.doc(`shops/${shopId}`);
                const productsSnap = await shopRef.collection('products').get();
                
                await db.runTransaction(async (transaction) => {
                    const shopDoc = await transaction.get(shopRef);
                    const shopData = shopDoc.data()!;
                    transaction.update(shopRef, { status: 'approved', updatedAt: FieldValue.serverTimestamp() });
                    transaction.set(publicShopRef, { ...shopData, status: 'approved', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                    productsSnap.docs.forEach(p => {
                        transaction.set(publicShopRef.collection('products').doc(p.id), p.data());
                    });
                });
                return NextResponse.json({ success: true });
            }
            case 'rejectShop': {
                const { shopId, companyId } = payload;
                await db.doc(`companies/${companyId}/shops/${shopId}`).update({ status: 'rejected', updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }
            case 'getPendingAgreements': {
                const snap = await db.collectionGroup('agreements').where('status', '==', 'proposed').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()), shopName: doc.ref.parent.parent?.id }));
                return NextResponse.json({ success: true, data });
            }
            case 'acceptCommercialAgreement': {
                const { companyId, shopId, agreementId } = payload;
                const agreementRef = db.doc(`companies/${companyId}/shops/${shopId}/agreements/${agreementId}`);
                await agreementRef.update({ status: 'active', effectiveDate: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }
            case 'getAuditLogs': {
                const logsSnap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                const data = logsSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }
            case 'getWalletTransactions': {
                const snap = await db.collectionGroup('transactions').orderBy('date', 'desc').limit(200).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }
            case 'getWalletPayments': {
                const snap = await db.collectionGroup('walletPayments').orderBy('createdAt', 'desc').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }
            case 'approveWalletPayment': {
                const { companyId, paymentId, amount, reconciliationId } = payload;
                const companyRef = db.doc(`companies/${companyId}`);
                const paymentRef = db.doc(`companies/${companyId}/walletPayments/${paymentId}`);
                const txRef = db.collection(`companies/${companyId}/transactions`).doc();
                
                await db.runTransaction(async (transaction) => {
                    transaction.update(companyRef, { walletBalance: FieldValue.increment(amount), availableBalance: FieldValue.increment(amount) });
                    transaction.update(paymentRef, { status: 'approved', updatedAt: FieldValue.serverTimestamp() });
                    transaction.set(txRef, { 
                        transactionId: txRef.id, type: 'credit', amount, date: FieldValue.serverTimestamp(),
                        description: 'Top-up approved', status: 'allocated', reconciliationId
                    });
                });
                return NextResponse.json({ success: true });
            }
            case 'getPendingPayouts': {
                const snap = await db.collectionGroup('payoutRequests').where('status', '==', 'pending').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }
            case 'approvePayout': {
                const { companyId, payoutId, amount } = payload;
                const companyRef = db.doc(`companies/${companyId}`);
                const payoutRef = db.doc(`companies/${companyId}/payoutRequests/${payoutId}`);
                const txRef = db.collection(`companies/${companyId}/transactions`).doc();
                await db.runTransaction(async (transaction) => {
                    transaction.update(companyRef, { walletBalance: FieldValue.increment(-amount), availableBalance: FieldValue.increment(-amount) });
                    transaction.update(payoutRef, { status: 'completed', processedAt: FieldValue.serverTimestamp() });
                    transaction.set(txRef, { transactionId: txRef.id, type: 'debit', amount, date: FieldValue.serverTimestamp(), description: 'Payout complete', status: 'allocated' });
                });
                return NextResponse.json({ success: true });
            }
            case 'getDashboardQueues': {
                const shopsSnap = await db.collectionGroup('shops').where('status', '==', 'pending_review').get();
                const agreementsSnap = await db.collectionGroup('agreements').where('status', '==', 'proposed').get();
                return NextResponse.json({ success: true, data: { pendingShops: shopsSnap.docs.map(d => d.id), proposedAgreements: agreementsSnap.docs.map(d => d.id) } });
            }
            case 'savePartner': {
                const { partner } = payload;
                const partnersCollection = db.collection('partners');
                const docRef = partner.id ? partnersCollection.doc(partner.id) : partnersCollection.doc();
                await docRef.set({ ...partner, id: docRef.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, id: docRef.id });
            }
            case 'deletePartner': {
                await db.collection('partners').doc(payload.partnerId).delete();
                return NextResponse.json({ success: true });
            }
            case 'getPartnersByType': {
                const snap = await db.collection('partners').where('type', '==', payload.type).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }
            default:
                return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}