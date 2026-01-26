
      
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
        if (action === 'provisionLeadAccount') {
            const { lead } = payload;
            if (!lead || !lead.companyId) {
                throw new Error("companyId is required for this action.");
            }
            const userDoc = await db.collection('users').doc(requestorUid).get();
            if (userDoc.data()?.companyId !== lead.companyId) {
                if (!isAdmin) {
                    throw new Error("Forbidden: You can only provision leads for your own company.");
                }
            }
        } else if (!isAdmin) {
            throw new Error("Forbidden: Admin access required.");
        }
        // --- END AUTHORIZATION ---

        switch (action) {
            case 'provisionLeadAccount': {
                const { lead } = payload;
                if (!lead || !lead.email) {
                    throw new Error("Lead data with email is required.");
                }

                // 1. Check if user already exists in Auth
                try {
                    await getAuth(app).getUserByEmail(lead.email);
                    throw new Error("A user with this email already exists in Firebase Authentication.");
                } catch (error: any) {
                    if (error.code !== 'auth/user-not-found') {
                        throw error;
                    }
                }

                // 2. Create or find the lead document
                const leadsCollectionRef = db.collection(`companies/${lead.companyId}/leads`);
                let leadDocRef;
                
                if (lead.id) { // This is an edit/update of an unprovisioned lead
                    leadDocRef = leadsCollectionRef.doc(lead.id);
                } else { // This is a brand new lead
                    leadDocRef = leadsCollectionRef.doc();
                    lead.id = leadDocRef.id; // Assign the new ID to the lead object
                }
                
                // Save the full lead document
                await leadDocRef.set({
                    ...lead,
                    createdAt: lead.createdAt || FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                }, { merge: true });

                // 3. Create the Auth user
                const userRecord = await getAuth(app).createUser({
                    email: lead.email,
                    displayName: lead.contactPerson || lead.companyName,
                });

                // 4. Generate the password reset/sign-up link
                const actionCodeSettings = {
                    url: `${req.nextUrl.origin}/signin?email=${encodeURIComponent(lead.email)}`,
                    handleCodeInApp: true,
                };
                const resetLink = await getAuth(app).generatePasswordResetLink(lead.email, actionCodeSettings);

                // 5. Update the lead document with the new auth info
                const updateData = {
                    status: 'invited',
                    authUid: userRecord.uid,
                    updatedAt: FieldValue.serverTimestamp(),
                };
                await leadDocRef.set(updateData, { merge: true });

                return NextResponse.json({ success: true, resetLink });
            }
            case 'getUserDoc': {
                const { uid } = payload;
                if (!uid) {
                    throw new Error("Missing uid for getUserDoc.");
                }
                const userDoc = await db.collection('users').doc(uid).get();
                if (!userDoc.exists) {
                    return NextResponse.json({ success: true, data: null });
                }
                return NextResponse.json({ success: true, data: serializeTimestamps(userDoc.data()) });
            }
            case 'getAuditLogs': {
                let logsQuery;

                logsQuery = db.collection('auditLogs').orderBy('timestamp', 'desc').limit(200);

                const logsSnap = await logsQuery.get();
                if (logsSnap.empty) {
                    return NextResponse.json({ success: true, data: [] });
                }

                const userIds = new Set<string>();
                logsSnap.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.userId) userIds.add(data.userId);
                });
                
                const userDocs = await db.collection('users').where(FieldPath.documentId(), 'in', Array.from(userIds)).get();
                const userMap = new Map(userDocs.docs.map(doc => [doc.id, doc.data()]));
                
                const companyIds = new Set<string>();
                 logsSnap.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.companyId) companyIds.add(data.companyId);
                });

                let companyMap = new Map();
                if (companyIds.size > 0) {
                    const companiesSnap = await db.collection('companies').where(FieldPath.documentId(), 'in', Array.from(companyIds)).get();
                    companyMap = new Map(companiesSnap.docs.map(doc => [doc.id, doc.data()]));
                }


                const enrichedLogs = logsSnap.docs.map(doc => {
                    const logData = doc.data();
                    const user = userMap.get(logData.userId);
                    const company = companyMap.get(logData.companyId);
                    
                    return {
                        id: doc.id,
                        ...serializeTimestamps(logData),
                        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
                        companyName: company ? company.companyName : 'N/A',
                    };
                });

                return NextResponse.json({ success: true, data: enrichedLogs });
            }
            case 'getLeads': {
                const leadsSnap = await db.collection('leads').orderBy('createdAt', 'desc').get();
                const data = leadsSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }
            case 'saveLead': {
                const { lead } = payload;
                if (!lead) throw new Error("Lead data is required.");

                let docRef;
                let data;

                if (lead.id) { // Update existing lead
                    docRef = db.collection('leads').doc(lead.id);
                    data = { ...lead, updatedAt: FieldValue.serverTimestamp() };
                    delete data.id; // Don't save the ID inside the document
                    await docRef.set(data, { merge: true });
                } else { // Create new lead
                    docRef = db.collection('leads').doc();
                    data = { ...lead, id: docRef.id, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
                    await docRef.set(data);
                }
                return NextResponse.json({ success: true, id: docRef.id });
            }
            case 'deleteLead': {
                const { leadId } = payload;
                if (!leadId) throw new Error("leadId is required.");
                await db.collection('leads').doc(leadId).delete();
                return NextResponse.json({ success: true });
            }
            case 'saveLeads': {
                const { leads } = payload;
                if (!Array.isArray(leads)) {
                    throw new Error("Payload must contain an array of leads.");
                }

                const batch = db.batch();
                const leadsCollection = db.collection('leads');
                
                leads.forEach((lead: any) => {
                    const docRef = leadsCollection.doc();
                    batch.set(docRef, {
                        ...lead,
                        id: docRef.id,
                        status: 'new',
                        createdAt: FieldValue.serverTimestamp(),
                        updatedAt: FieldValue.serverTimestamp(),
                    });
                });
                
                await batch.commit();
                return NextResponse.json({ success: true, message: `${leads.length} leads saved successfully.` });
            }
             case 'findDuplicateLeads': {
                const leadsSnap = await db.collection('leads').get();
                const leads = leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const groups: { [key: string]: any[] } = {};
                leads.forEach(lead => {
                    const key = (lead.companyName || '').trim().toLowerCase();
                    if (!key) return; // Skip leads without a company name
                    if (!groups[key]) {
                        groups[key] = [];
                    }
                    groups[key].push(lead);
                });

                const duplicates = Object.values(groups).filter(group => group.length > 1);
                
                const serializedDuplicates = duplicates.map(group => 
                    group.map(lead => serializeTimestamps(lead))
                );

                return NextResponse.json({ success: true, data: serializedDuplicates });
            }
            case 'deleteLeads': {
                const { leadIds } = payload;
                if (!Array.isArray(leadIds) || leadIds.length === 0) {
                    throw new Error("leadIds array is required.");
                }
                const batch = db.batch();
                leadIds.forEach(id => {
                    batch.delete(db.collection('leads').doc(id));
                });
                await batch.commit();
                return NextResponse.json({ success: true, message: `${leadIds.length} leads deleted.` });
            }
            case 'savePartner': {
                const { partner } = payload;
                if (!partner) throw new Error("Partner data is required.");

                let docRef;
                let data;

                if (partner.id) { // Update
                    docRef = db.collection('partners').doc(partner.id);
                    data = { ...partner, updatedAt: FieldValue.serverTimestamp() };
                    delete data.id;
                    await docRef.set(data, { merge: true });
                } else { // Create
                    docRef = db.collection('partners').doc();
                    data = { ...partner, id: docRef.id, invitationStatus: 'pending', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
                    await docRef.set(data);
                }
                return NextResponse.json({ success: true, id: docRef.id });
            }
            case 'deletePartner': {
                const { partnerId } = payload;
                if (!partnerId) throw new Error("partnerId is required.");
                await db.collection('partners').doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }
            // Admin-only actions below this point
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
                    postedBy: requestorUid,
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
                        userId: requestorUid,
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
                        userId: requestorUid,
                        action: 'delete',
                        timestamp: FieldValue.serverTimestamp(),
                        before: serializeTimestamps(beforeData),
                        after: null,
                    });
                });
                return NextResponse.json({ success: true, message: "Member deleted and action audited." });
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
            case 'updateStaffStatus': {
                const { companyId, staffId, status } = payload;
                if (!companyId || !staffId || !status) {
                    throw new Error("Missing companyId, staffId, or status.");
                }
                
                const staffRef = db.doc(`companies/${companyId}/staff/${staffId}`);
                await staffRef.update({ status, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true, message: "Staff status updated." });
            }
            default:
                return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`API Error in /api/admin route:`, error);
        const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
        return NextResponse.json({ success: false, error: error.message }, { status });
    }
}
      
    