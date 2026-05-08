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

        if (action === 'saveCompanyLead') {
            if (payload.companyId !== userCompanyIdForAuth && !isAdmin) {
                 throw new Error("Forbidden: You can only manage leads for your own company.");
            }
        } else if (action === 'acceptCommercialAgreement' || action === 'proposeCounterOffer') {
            if (payload.companyId !== userCompanyIdForAuth && !isAdmin) {
                throw new Error("Forbidden: You can only manage agreements for your own company.");
            }
        } else if (action === 'unpublishShop') {
            if (payload.companyId !== userCompanyIdForAuth && !isAdmin) {
                throw new Error("Forbidden: You can only unpublish your own shop.");
            }
        }
         else if (!isAdmin) {
             const allowedUserActions = ['saveCompanyLead', 'acceptCommercialAgreement', 'getAuditLogs', 'unpublishShop', 'logCommunication', 'getCommunicationLogs'];
             if (!allowedUserActions.includes(action)) {
                 throw new Error("Forbidden: Admin access required.");
             }
        }

        switch (action) {
            case 'bulkSavePartners': {
                const { partners, type } = payload;
                if (!partners || !Array.isArray(partners)) throw new Error("Partners array is required.");
                
                // Batch limit is 500
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
                return NextResponse.json({ success: true, message: `${partners.length} partners imported successfully.` });
            }
             case 'getCommunicationLogs': {
                const { partnerId } = payload;
                if (!partnerId) throw new Error("partnerId is required.");
                const logsSnap = await db.collection(`partners/${partnerId}/communications`).orderBy('timestamp', 'desc').get();
                const data = logsSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }
             case 'logCommunication': {
                const { partnerId, type, subject, notes, followUpTask } = payload;
                if (!partnerId || !type || !subject) {
                    throw new Error("Missing partnerId, type, or subject for logging communication.");
                }
                const batch = db.batch();
                const logRef = db.collection(`partners/${partnerId}/communications`).doc();
                batch.set(logRef, {
                    id: logRef.id,
                    type,
                    subject,
                    notes: notes || '',
                    timestamp: FieldValue.serverTimestamp(),
                    loggedBy: requestorUid,
                });
                
                if (followUpTask && followUpTask.dueDate) {
                    const taskRef = db.collection(`partners/${partnerId}/tasks`).doc();
                    batch.set(taskRef, {
                        id: taskRef.id,
                        title: followUpTask.title || `Follow up: ${subject}`,
                        description: followUpTask.description || '',
                        dueDate: Timestamp.fromDate(new Date(followUpTask.dueDate)),
                        status: 'pending',
                        assigneeId: followUpTask.assigneeId || requestorUid,
                        relatedToName: followUpTask.relatedToName || '',
                        createdAt: FieldValue.serverTimestamp(),
                        updatedAt: FieldValue.serverTimestamp(),
                    });
                }
                
                await batch.commit();
                return NextResponse.json({ success: true, message: 'Communication logged.' });
            }
            case 'updateFacilityStatus': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { clientId, facilityId, status } = payload;
                if (!clientId || !facilityId || !status) throw new Error("clientId, facilityId, and status are required.");
                const facilityRef = db.doc(`lendingClients/${clientId}/facilities/${facilityId}`);
                await facilityRef.update({ status, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true, message: `Facility status updated to ${status}.` });
            }
            case 'saveLendingSecurity': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { security } = payload;
                if (!security || !security.clientId || !security.agreementId) throw new Error("clientId, agreementId, and security data are required.");
                const { id: securityId, ...dataToSave } = security;
                const collectionRef = db.collection(`lendingClients/${dataToSave.clientId}/agreements/${dataToSave.agreementId}/securities`);
                if (securityId) {
                    const docRef = collectionRef.doc(securityId);
                    await docRef.set({ ...dataToSave, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                    return NextResponse.json({ success: true, id: securityId });
                } else {
                    const newDocRef = collectionRef.doc();
                    await newDocRef.set({ ...dataToSave, id: newDocRef.id, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
                    return NextResponse.json({ success: true, id: newDocRef.id });
                }
            }
            case 'deleteLendingSecurity': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { clientId, agreementId, securityId } = payload;
                if (!clientId || !agreementId || !securityId) throw new Error("clientId, agreementId, and securityId are required.");
                await db.doc(`lendingClients/${clientId}/agreements/${agreementId}/securities/${securityId}`).delete();
                return NextResponse.json({ success: true, message: "Security document deleted." });
            }
            case 'saveLendingFacility': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { facility } = payload;
                const { id, status, ...data } = facility;
                const collectionRef = db.collection(`lendingClients/${facility.clientId}/facilities`);
                if (id) {
                    await collectionRef.doc(id).set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                    return NextResponse.json({ success: true, id });
                } else {
                    const newDoc = collectionRef.doc();
                    await newDoc.set({ ...data, id: newDoc.id, status: 'pending', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
                    return NextResponse.json({ success: true, id: newDoc.id });
                }
            }
            case 'deleteLendingFacility': {
                 if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { clientId, facilityId } = payload;
                await db.doc(`lendingClients/${clientId}/facilities/${facilityId}`).delete();
                return NextResponse.json({ success: true });
            }
            case 'getLendingData': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { collectionName } = payload;
                let snapshot;
                if (['agreements', 'facilities', 'transactions', 'securities', 'payments'].includes(collectionName)) {
                    snapshot = await db.collectionGroup(collectionName).get();
                } else {
                    snapshot = await db.collection(collectionName).get();
                }
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }
            case 'saveLendingAgreement': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { agreement } = payload;
                const { id: agreementId, ...dataToSave } = agreement;
                const collectionRef = db.collection(`lendingClients/${dataToSave.clientId}/agreements`);
                if (agreementId) {
                    await collectionRef.doc(agreementId).set({ ...dataToSave, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                    return NextResponse.json({ success: true, id: agreementId });
                } else {
                    const newDocRef = collectionRef.doc();
                    await newDocRef.set({ ...dataToSave, id: newDocRef.id, status: 'pending', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
                    return NextResponse.json({ success: true, id: newDocRef.id });
                }
            }
            case 'saveLendingAsset': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { asset } = payload;
                const collectionRef = db.collection('lendingAssets');
                const { id, ...assetData } = asset;
                if (id) {
                    await collectionRef.doc(id).set({ ...assetData, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                    return NextResponse.json({ success: true, id: id });
                } else {
                    const newDocRef = collectionRef.doc();
                    await newDocRef.set({ ...assetData, id: newDocRef.id, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), status: 'available' });
                    return NextResponse.json({ success: true, id: newDocRef.id });
                }
            }
            case 'deleteLendingAsset': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { assetId } = payload;
                await db.collection('lendingAssets').doc(assetId).delete();
                return NextResponse.json({ success: true });
            }
            case 'saveLendingPartner': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { partner } = payload;
                const partnersCollection = db.collection('lendingPartners');
                if (partner.id) {
                    const { id, ...data } = partner;
                    await partnersCollection.doc(id).set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                    return NextResponse.json({ success: true, id });
                } else {
                    const newDocRef = partnersCollection.doc();
                    await newDocRef.set({ ...partner, id: newDocRef.id, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
                    return NextResponse.json({ success: true, id: newDocRef.id });
                }
            }
            case 'saveLendingClient': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { client } = payload;
                const clientsCollection = db.collection('lendingClients');
                if (client.id) {
                    const { id, ...data } = client;
                    await clientsCollection.doc(id).set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                    return NextResponse.json({ success: true, id });
                } else {
                    const newDocRef = clientsCollection.doc();
                    await newDocRef.set({ ...client, id: newDocRef.id, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
                    return NextResponse.json({ success: true, id: newDocRef.id });
                }
            }
            case 'listAllUsers': {
                const listUsersResult = await getAuth(app).listUsers();
                const users = listUsersResult.users.map(u => ({
                    uid: u.uid,
                    email: u.email,
                    displayName: u.displayName,
                    disabled: u.disabled,
                    creationTime: u.metadata.creationTime,
                    lastSignInTime: u.metadata.lastSignInTime,
                }));
                return NextResponse.json({ success: true, data: users });
            }
            case 'getPartnersByType': {
                const { type } = payload;
                const partnersSnap = await db.collection('partners').where('type', '==', type).get();
                const data = partnersSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }
            case 'invitePartner': {
                const { partnerId, followUpTask } = payload;
                const partnerDocRef = db.collection('partners').doc(partnerId);
                const partnerSnap = await partnerDocRef.get();
                if (!partnerSnap.exists) throw new Error("Partner not found.");
                const partnerData = partnerSnap.data()!;
                const batch = db.batch();
                batch.update(partnerDocRef, { invitationStatus: 'invited', updatedAt: FieldValue.serverTimestamp() });
                const logRef = db.collection(`partners/${partnerId}/communications`).doc();
                batch.set(logRef, {
                    id: logRef.id,
                    type: 'Invite',
                    subject: 'Invitation Link Generated',
                    notes: `Generated unique sign-up link for ${partnerData.email}.`,
                    timestamp: FieldValue.serverTimestamp(),
                    loggedBy: requestorUid,
                });
                if (followUpTask && followUpTask.dueDate) {
                    const taskRef = db.collection(`partners/${partnerId}/tasks`).doc();
                    batch.set(taskRef, {
                        id: taskRef.id,
                        title: followUpTask.title || 'Follow up on invitation',
                        description: followUpTask.description || '',
                        dueDate: Timestamp.fromDate(new Date(followUpTask.dueDate)),
                        status: 'pending',
                        assigneeId: followUpTask.assigneeId || requestorUid,
                        relatedToName: partnerData.companyName || `${partnerData.firstName} ${partnerData.lastName}`,
                        createdAt: FieldValue.serverTimestamp(),
                        updatedAt: FieldValue.serverTimestamp(),
                    });
                }
                await batch.commit();
                return NextResponse.json({ success: true, message: "Invitation processed." });
            }
            case 'getAuditLogs': {
                let logsQuery = isAdmin ? db.collection('auditLogs').orderBy('timestamp', 'desc').limit(200) : db.collection('auditLogs').where('companyId', '==', userCompanyIdForAuth).orderBy('timestamp', 'desc').limit(50);
                const logsSnap = await logsQuery.get();
                const userIds = new Set<string>();
                logsSnap.docs.forEach(doc => { if (doc.data().userId) userIds.add(doc.data().userId); });
                let userMap = new Map();
                if (userIds.size > 0) {
                    const userDocs = await db.collection('users').where(FieldPath.documentId(), 'in', Array.from(userIds)).get();
                    userMap = new Map(userDocs.docs.map(doc => [doc.id, doc.data()]));
                }
                const enrichedLogs = logsSnap.docs.map(doc => {
                    const logData = doc.data();
                    const user = userMap.get(logData.userId);
                    return {
                        id: doc.id,
                        ...serializeTimestamps(logData),
                        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
                    };
                });
                return NextResponse.json({ success: true, data: enrichedLogs });
            }
            case 'getMembers': {
                const companiesSnap = await db.collection('companies').get();
                const usersSnap = await db.collection('users').get();
                const usersMap = new Map(usersSnap.docs.map(d => [d.id, d.data()]));
                const members = companiesSnap.docs.map(doc => {
                    const companyData = doc.data();
                    const owner = usersMap.get(companyData.ownerId) || {};
                    return {
                        ...serializeTimestamps(companyData),
                        id: doc.id,
                        firstName: owner.firstName,
                        lastName: owner.lastName,
                        email: owner.email,
                    };
                });
                return NextResponse.json({ success: true, data: members });
            }
            case 'savePartner': {
                const { partner } = payload;
                const partnersCollection = db.collection('partners');
                if (partner.id) {
                    const { id, ...data } = partner;
                    await partnersCollection.doc(id).set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                    return NextResponse.json({ success: true, id });
                } else {
                    const newDocRef = partnersCollection.doc();
                    await newDocRef.set({ ...partner, id: newDocRef.id, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
                    return NextResponse.json({ success: true, id: newDocRef.id });
                }
            }
            case 'deletePartner': {
                const { partnerId } = payload;
                await db.collection('partners').doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }
            default:
                return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
