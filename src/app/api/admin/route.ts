
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

interface LeadData {
    id: string;
    companyName?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    role?: string;
    status?: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'invited' | 'registered';
    notes?: string;
    address?: string;
    website?: string;
    createdAt?: any;
    updatedAt?: any;
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
        } else if (action === 'unpublishShop') { // Authorization for new action
            if (payload.companyId !== userCompanyIdForAuth && !isAdmin) {
                throw new Error("Forbidden: You can only unpublish your own shop.");
            }
        }
         else if (!isAdmin) {
            // Most other actions in this route are admin-only
             const allowedUserActions = ['saveCompanyLead', 'acceptCommercialAgreement', 'getAuditLogs', 'unpublishShop'];
             if (!allowedUserActions.includes(action)) {
                 throw new Error("Forbidden: Admin access required.");
             }
        }
        // --- END AUTHORIZATION ---

        switch (action) {
            case 'saveLendingSecurity': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { security } = payload;
                if (!security || !security.clientId || !security.agreementId) throw new Error("clientId, agreementId, and security data are required.");
                
                const { id: securityId, ...dataToSave } = security;
                const collectionRef = db.collection(`lendingClients/${dataToSave.clientId}/agreements/${dataToSave.agreementId}/securities`);
                
                if (securityId) { // Update
                    const docRef = collectionRef.doc(securityId);
                    await docRef.set({ ...dataToSave, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                    return NextResponse.json({ success: true, id: securityId });
                } else { // Create
                    const newDocRef = collectionRef.doc();
                    await newDocRef.set({ ...dataToSave, id: newDocRef.id, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
                    return NextResponse.json({ success: true, id: newDocRef.id });
                }
            }
            case 'deleteLendingSecurity': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { clientId, agreementId, securityId } = payload;
                if (!clientId || !agreementId || !securityId) throw new Error("clientId, agreementId, and securityId are required.");
                
                // TODO: Also delete file from storage
                await db.doc(`lendingClients/${clientId}/agreements/${agreementId}/securities/${securityId}`).delete();
                return NextResponse.json({ success: true, message: "Security document deleted." });
            }
            case 'getLendingClientById': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { clientId } = payload;
                if (!clientId) throw new Error("clientId is required.");
                const docSnap = await db.collection('lendingClients').doc(clientId).get();
                if (!docSnap.exists) {
                    return NextResponse.json({ success: true, data: null });
                }
                return NextResponse.json({ success: true, data: { id: docSnap.id, ...serializeTimestamps(docSnap.data()) } });
            }
            case 'saveLendingFacility': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { facility } = payload;
                if (!facility || !facility.clientId) throw new Error("Client ID and facility data are required.");
                const { id, ...data } = facility;
                const collectionRef = db.collection(`lendingClients/${facility.clientId}/facilities`);
                if (id) {
                    await collectionRef.doc(id).set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                } else {
                    const newDoc = collectionRef.doc();
                    await newDoc.set({ ...data, id: newDoc.id, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
                }
                return NextResponse.json({ success: true });
            }
            case 'deleteLendingFacility': {
                 if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { clientId, facilityId } = payload;
                if (!clientId || !facilityId) throw new Error("Client ID and Facility ID are required.");
                await db.doc(`lendingClients/${clientId}/facilities/${facilityId}`).delete();
                return NextResponse.json({ success: true });
            }
            case 'getLendingData': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { collectionName } = payload;
                if (!collectionName || !['lendingClients', 'lendingPartners', 'lendingAssets', 'agreements', 'facilities', 'transactions', 'securities'].includes(collectionName)) {
                    throw new Error("Invalid or missing collectionName for getLendingData.");
                }

                let snapshot;
                if (['agreements', 'facilities', 'transactions', 'securities'].includes(collectionName)) {
                    snapshot = await db.collectionGroup(collectionName).get();
                } else {
                    snapshot = await db.collection(collectionName).get();
                }

                const data = snapshot.docs.map(doc => {
                    const docData = doc.data();
                    const pathSegments = doc.ref.path.split('/');
                    
                    let clientId;
                    if (pathSegments.includes('lendingClients')) {
                       clientId = pathSegments[pathSegments.indexOf('lendingClients') + 1];
                    } else if (docData.clientId) {
                       clientId = docData.clientId
                    }

                    let agreementId;
                    if (pathSegments.includes('agreements')) {
                        agreementId = pathSegments[pathSegments.indexOf('agreements') + 1];
                    } else if (docData.agreementId) {
                        agreementId = docData.agreementId;
                    }
                    
                    return { id: doc.id, ...serializeTimestamps(docData), clientId, agreementId };
                }).filter(Boolean);

                return NextResponse.json({ success: true, data });
            }
            case 'deleteLendingAgreement': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { clientId, agreementId } = payload;
                if (!clientId || !agreementId) {
                    throw new Error("clientId and agreementId are required.");
                }
                const agreementRef = db.doc(`lendingClients/${clientId}/agreements/${agreementId}`);
                await agreementRef.delete();
                return NextResponse.json({ success: true, message: "Agreement deleted successfully." });
            }
            case 'updateAssetStatus': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { assetId, status } = payload;
                if (!assetId || !status) {
                    throw new Error("assetId and status are required.");
                }
                const validStatuses = ['available', 'financed', 'sold', 'decommissioned'];
                if (!validStatuses.includes(status)) {
                    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
                }

                const assetRef = db.doc(`lendingAssets/${assetId}`);
                await assetRef.update({
                    status: status,
                    updatedAt: FieldValue.serverTimestamp(),
                });
                return NextResponse.json({ success: true, message: "Asset status updated." });
            }
            case 'updateAgreementStatus': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { clientId, agreementId, status } = payload;
                if (!clientId || !agreementId || !status) {
                    throw new Error("clientId, agreementId, and status are required.");
                }
                const validStatuses = ['pending', 'credit', 'payout', 'active', 'completed', 'defaulted'];
                if (!validStatuses.includes(status)) {
                    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
                }

                const agreementRef = db.doc(`lendingClients/${clientId}/agreements/${agreementId}`);
                
                await db.runTransaction(async (transaction) => {
                    const agreementDoc = await transaction.get(agreementRef);
                    if (!agreementDoc.exists) {
                        throw new Error("Agreement not found.");
                    }
                    const agreementData = agreementDoc.data()!;

                    // Update the agreement status
                    transaction.update(agreementRef, {
                        status: status,
                        updatedAt: FieldValue.serverTimestamp(),
                    });

                    // If setting to 'active' and an asset is linked, update the asset's status to 'financed'
                    if (status === 'active' && agreementData.assetId) {
                        const assetRef = db.doc(`lendingAssets/${agreementData.assetId}`);
                        transaction.update(assetRef, {
                            status: 'financed',
                            updatedAt: FieldValue.serverTimestamp()
                        });
                    }

                    // If reverting from active and an asset is linked, update asset status back to 'available'
                    if (agreementData.status === 'active' && status !== 'active' && agreementData.assetId) {
                         const assetRef = db.doc(`lendingAssets/${agreementData.assetId}`);
                         transaction.update(assetRef, {
                            status: 'available',
                            updatedAt: FieldValue.serverTimestamp(),
                        });
                    }
                });
                
                return NextResponse.json({ success: true, message: "Agreement status updated." });
            }
            case 'saveLendingAgreement': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { agreement } = payload;
                if (!agreement || !agreement.clientId) throw new Error("clientId and agreement data are required.");
            
                const { id: agreementId, ...dataToSave } = agreement;
                const collectionRef = db.collection(`lendingClients/${dataToSave.clientId}/agreements`);
            
                await db.runTransaction(async (transaction) => {
                    let oldAssetId: string | null = null;
                    if (agreementId) { // This is an update
                        const docRef = collectionRef.doc(agreementId);
                        const oldDoc = await transaction.get(docRef);
                        if (oldDoc.exists) {
                            oldAssetId = oldDoc.data()?.assetId || null;
                        }
                        transaction.set(docRef, { ...dataToSave, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                    } else { // This is a creation
                        const newDocRef = collectionRef.doc();
                        transaction.set(newDocRef, { ...dataToSave, id: newDocRef.id, status: 'pending', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
                    }
            
                    const newAssetId = dataToSave.assetId || null;
            
                    // If asset has changed, update statuses
                    if (oldAssetId !== newAssetId) {
                        // If there was an old asset, make it available again
                        if (oldAssetId) {
                            const oldAssetRef = db.doc(`lendingAssets/${oldAssetId}`);
                            transaction.update(oldAssetRef, { status: 'available' });
                        }
                        // If there's a new asset, mark it as financed
                        if (newAssetId) {
                            const newAssetRef = db.doc(`lendingAssets/${newAssetId}`);
                            transaction.update(newAssetRef, { status: 'financed' });
                        }
                    }
                });
            
                return NextResponse.json({ success: true, id: agreementId || 'new' });
            }
            case 'saveLendingAsset': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { asset } = payload;
                if (!asset || !asset.clientId) throw new Error("clientId and asset data are required.");
                
                const collectionRef = db.collection('lendingAssets');
                const { id, ...assetData } = asset;
                
                if (id) { // Update existing asset
                    const docRef = collectionRef.doc(id);
                    await docRef.set({ ...assetData, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                    return NextResponse.json({ success: true, id: id });
                } else { // Create new asset
                    const newDocRef = collectionRef.doc();
                    await newDocRef.set({ ...assetData, id: newDocRef.id, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), status: 'available' });
                    return NextResponse.json({ success: true, id: newDocRef.id });
                }
            }
            case 'deleteLendingAsset': {
                if (!isAdmin) throw new Error("Forbidden: Admin access required.");
                const { assetId } = payload;
                if (!assetId) {
                    throw new Error("assetId is required.");
                }
                await db.collection('lendingAssets').doc(assetId).delete();
                return NextResponse.json({ success: true, message: 'Asset deleted successfully.' });
            }
            case 'unpublishShop': {
                const { companyId, shopId } = payload;
                if (!companyId || !shopId) {
                    throw new Error("Missing companyId or shopId.");
                }

                const memberShopRef = db.doc(`companies/${companyId}/shops/${shopId}`);
                const publicShopRef = db.doc(`shops/${shopId}`);
                const batch = db.batch();

                // 1. Revert member's shop status to 'draft'
                batch.update(memberShopRef, { status: 'draft', updatedAt: FieldValue.serverTimestamp() });

                // 2. Delete all products in the public subcollection
                const publicProductsSnap = await publicShopRef.collection('products').get();
                if (!publicProductsSnap.empty) {
                    publicProductsSnap.docs.forEach(doc => batch.delete(doc.ref));
                }

                // 3. Delete the main public shop document
                batch.delete(publicShopRef);

                await batch.commit();
                
                return NextResponse.json({ success: true, message: 'Shop has been unpublished and reverted to a draft.' });
            }
            case 'saveLendingPartner': {
                if (!isAdmin) {
                    throw new Error("Forbidden: Admin access required.");
                }
                const { partner } = payload;
                if (!partner) throw new Error("Partner data is required.");

                const partnersCollection = db.collection('lendingPartners');
                let docRef;
                let data;

                if (partner.id) { // Update
                    docRef = partnersCollection.doc(partner.id);
                    data = { ...partner, updatedAt: FieldValue.serverTimestamp() };
                    delete data.id;
                    await docRef.set(data, { merge: true });
                } else { // Create
                    docRef = partnersCollection.doc();
                    data = { ...partner, id: docRef.id, status: partner.status || 'draft', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
                    await docRef.set(data);
                }
                return NextResponse.json({ success: true, id: docRef.id });
            }
             case 'deleteLendingPartner': {
                if (!isAdmin) {
                    throw new Error("Forbidden: Admin access required.");
                }
                const { partnerId, collection } = payload;
                if (!partnerId || !collection) throw new Error("partnerId and collection name are required.");

                if(collection !== 'lendingClients' && collection !== 'lendingPartners') {
                    throw new Error("Invalid collection name.");
                }

                await db.collection(collection).doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }
            case 'saveLendingClient': {
                if (!isAdmin) {
                    throw new Error("Forbidden: Admin access required.");
                }
                const { client } = payload;
                if (!client) throw new Error("Client data is required.");

                const clientsCollection = db.collection('lendingClients');
                let docRef;
                let data;

                if (client.id) { // Update
                    docRef = clientsCollection.doc(client.id);
                    data = { ...client, updatedAt: FieldValue.serverTimestamp() };
                    delete data.id;
                    await docRef.set(data, { merge: true });
                } else { // Create
                    docRef = clientsCollection.doc();
                    data = { ...client, id: docRef.id, status: client.status || 'draft', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
                    await docRef.set(data);
                }
                return NextResponse.json({ success: true, id: docRef.id });
            }
            case 'listAllUsers': {
                const listUsersResult = await getAuth(app).listUsers();
                const users = listUsersResult.users.map(userRecord => {
                    return {
                        uid: userRecord.uid,
                        email: userRecord.email,
                        displayName: userRecord.displayName,
                        disabled: userRecord.disabled,
                        creationTime: userRecord.metadata.creationTime,
                        lastSignInTime: userRecord.metadata.lastSignInTime,
                    };
                });
                return NextResponse.json({ success: true, data: users });
            }
            case 'getPartnersByType': {
                const { type } = payload;
                if (!type || !['partner', 'isa', 'investor', 'developer'].includes(type)) {
                    throw new Error("A valid partner type ('partner', 'isa', 'investor', 'developer') is required.");
                }
                const partnersSnap = await db.collection('partners').where('type', '==', type).get();
                const data = partnersSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }
            case 'getPartnerById': {
                const { partnerId } = payload;
                if (!partnerId) {
                    throw new Error("partnerId is required.");
                }
                const partnerDoc = await db.collection('partners').doc(partnerId).get();
                if (!partnerDoc.exists) {
                    return NextResponse.json({ success: true, data: null });
                }
                return NextResponse.json({ success: true, data: { id: partnerDoc.id, ...serializeTimestamps(partnerDoc.data()) } });
            }
            case 'approvePayout': {
                const { companyId, payoutId, amount } = payload;
                if (!companyId || !payoutId || typeof amount !== 'number') {
                    throw new Error("Missing data for approving payout.");
                }
                const companyRef = db.doc(`companies/${companyId}`);
                const payoutRef = db.doc(`companies/${companyId}/payoutRequests/${payoutId}`);

                await db.runTransaction(async (transaction) => {
                    const companyDoc = await transaction.get(companyRef);
                    if (!companyDoc.exists) throw new Error("Company not found.");

                    const companyData = companyDoc.data()!;
                    const currentAvailableBalance = companyData.availableBalance || 0;

                    if (isNaN(currentAvailableBalance) || currentAvailableBalance < amount) {
                         throw new Error(`Insufficient available funds for payout. Available Balance: ${currentAvailableBalance}, Requested Amount: ${amount}.`);
                    }

                    // Debit both total wallet and available balance
                    transaction.update(companyRef, {
                        walletBalance: FieldValue.increment(-amount),
                        availableBalance: FieldValue.increment(-amount),
                        updatedAt: FieldValue.serverTimestamp()
                    });

                    // Create debit transaction log
                    const transactionRef = db.collection(`companies/${companyId}/transactions`).doc();
                    transaction.set(transactionRef, {
                        transactionId: transactionRef.id,
                        type: 'debit',
                        amount: amount,
                        date: FieldValue.serverTimestamp(),
                        description: `Wallet Payout to Bank`,
                        status: 'allocated',
                        isAdjustment: false,
                        chartOfAccountsCode: '2110', // Accounts Payable
                        postedBy: requestorUid,
                    });

                    // Mark payout as completed
                    transaction.update(payoutRef, {
                        status: 'completed',
                        processedAt: FieldValue.serverTimestamp()
                    });
                });

                return NextResponse.json({ success: true, message: "Payout approved and processed." });
            }
            case 'rejectPayout': {
                const { companyId, payoutId, reason } = payload;
                if (!companyId || !payoutId) {
                    throw new Error("Missing companyId or payoutId for rejecting payout.");
                }
                const payoutRef = db.doc(`companies/${companyId}/payoutRequests/${payoutId}`);
                
                await payoutRef.update({
                    status: 'rejected',
                    processedAt: FieldValue.serverTimestamp(),
                    rejectionReason: reason || 'Rejected by admin.',
                });

                return NextResponse.json({ success: true, message: "Payout request has been rejected." });
            }
            case 'getDashboardQueues': {
                const allShopsSnap = await db.collectionGroup('shops').get();
                const shopMap = new Map();
                allShopsSnap.forEach(doc => {
                    shopMap.set(doc.id, doc.data().shopName);
                });

                const pendingShops = allShopsSnap.docs
                    .map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }))
                    .filter((shop: any) => shop.status === 'pending_review')
                    .sort((a: any, b: any) => {
                        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                        return dateB - dateA;
                    });
                
                const allAgreementsSnap = await db.collectionGroup('agreements').get();
                
                const latestProposals = new Map<string, any>();
                allAgreementsSnap.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.status !== 'proposed') return;

                    const pathSegments = doc.ref.path.split('/');
                    const shopId = pathSegments.length >= 4 ? pathSegments[3] : null;
                    if (!shopId) return;

                    const existing = latestProposals.get(shopId);
                    const docTimestamp = data.createdAt ? new Date(serializeTimestamps(data).createdAt).getTime() : 0;
                    
                    const existingTimestamp = existing ? new Date(existing.createdAt).getTime() : 0;

                    if (!existing || docTimestamp > existingTimestamp) {
                        latestProposals.set(shopId, {
                            ...serializeTimestamps(data),
                            id: doc.id,
                            shopId: shopId,
                            shopName: shopMap.get(shopId) || 'Unknown Shop',
                        });
                    }
                });

                const proposedAgreements = Array.from(latestProposals.values())
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                return NextResponse.json({ success: true, data: { pendingShops, proposedAgreements } });
            }
            case 'getPendingAgreements': {
                const allShopsSnap = await db.collectionGroup('shops').get();
                const shopMap = new Map<string, string>();
                allShopsSnap.forEach(doc => {
                    shopMap.set(doc.id, doc.data().shopName || 'Unnamed Shop');
                });
            
                const allAgreementsSnap = await db.collectionGroup('agreements').get();
                
                const proposedAgreements = allAgreementsSnap.docs.map(doc => {
                    const data = doc.data();
                    const pathSegments = doc.ref.path.split('/');
                    const companyId = pathSegments.length > 1 ? pathSegments[1] : null;
                    const shopId = pathSegments.length > 3 ? pathSegments[3] : null;
                    
                    return {
                        ...serializeTimestamps(data),
                        id: doc.id,
                        shopId: shopId,
                        companyId: companyId,
                        shopName: shopMap.get(shopId || ''),
                    };
                }).filter(agreement => agreement.status === 'proposed');

                const latestProposals = new Map<string, any>();
                proposedAgreements.forEach(agreement => {
                    if (!agreement.shopId) return;
                    const existing = latestProposals.get(agreement.shopId);
                    const docTimestamp = agreement.createdAt ? new Date(agreement.createdAt).getTime() : 0;
                    
                    if (!existing || docTimestamp > (existing.createdAt ? new Date(existing.createdAt).getTime() : 0)) {
                        latestProposals.set(agreement.shopId, agreement);
                    }
                });
                
                const sortedAgreements = Array.from(latestProposals.values())
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                
                return NextResponse.json({ success: true, data: sortedAgreements });
            }
            case 'acceptCommercialAgreement': {
                const { companyId, shopId, agreementId, userId } = payload;
                if (!companyId || !shopId || !agreementId || !userId) {
                    throw new Error("Missing required data for accepting agreement.");
                }
            
                const agreementsRef = db.collection(`companies/${companyId}/shops/${shopId}/agreements`);
                
                await db.runTransaction(async (transaction) => {
                    const agreementsSnap = await transaction.get(agreementsRef);
                    
                    agreementsSnap.docs.forEach(doc => {
                        if (doc.id !== agreementId && (doc.data().status === 'active' || doc.data().status === 'proposed')) {
                            transaction.update(doc.ref, { status: 'archived', updatedAt: FieldValue.serverTimestamp() });
                        }
                    });
                    
                    const newAgreementRef = agreementsRef.doc(agreementId);
                    transaction.update(newAgreementRef, { 
                        status: 'active',
                        acceptedBy: userId,
                        effectiveDate: FieldValue.serverTimestamp(),
                        updatedAt: FieldValue.serverTimestamp() 
                    });
                });
                
                return NextResponse.json({ success: true, message: 'Agreement accepted.' });
            }
             case 'proposeCounterOffer': {
                const { companyId, shopId, agreementId, newPercentage, adminId } = payload;
                if (!companyId || !shopId || !agreementId || typeof newPercentage !== 'number' || !adminId) {
                    throw new Error("Missing required data for counter offer.");
                }
                const agreementRef = db.doc(`companies/${companyId}/shops/${shopId}/agreements/${agreementId}`);
                
                await agreementRef.update({
                    percentage: newPercentage,
                    proposedBy: adminId,
                    updatedAt: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true, message: `Counter-offer of ${newPercentage}% submitted.` });
            }
            case 'invitePartner': {
                 const { partnerId } = payload;
                if (!partnerId) throw new Error("partnerId is required.");

                const partnerDocRef = db.collection('partners').doc(partnerId);
                const partnerSnap = await partnerDocRef.get();
                if (!partnerSnap.exists) throw new Error("Partner not found.");
                
                const partnerData = partnerSnap.data()!;
                const { email } = partnerData;
                
                if (!email) throw new Error("Partner does not have an email to invite.");
                
                await partnerDocRef.update({
                    invitationStatus: 'invited',
                    updatedAt: FieldValue.serverTimestamp(),
                });

                return NextResponse.json({
                    success: true,
                    message: "Partner status updated to 'invited'."
                });
            }
             case 'saveCompanyLead': {
                const { companyId, lead } = payload;
                if (!companyId || !lead) throw new Error("companyId and lead data are required.");
                
                const leadsCollectionRef = db.collection(`companies/${companyId}/leads`);
                let docRef;
                let data;
                
                if (lead.id) {
                    docRef = leadsCollectionRef.doc(lead.id);
                    data = { ...lead, updatedAt: FieldValue.serverTimestamp() };
                    delete data.id;
                    await docRef.set(data, { merge: true });
                } else {
                    docRef = leadsCollectionRef.doc();
                    data = { ...lead, id: docRef.id, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
                    await docRef.set(data);
                }
                return NextResponse.json({ success: true, id: docRef.id });
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

                if (isAdmin) {
                    logsQuery = db.collection('auditLogs').orderBy('timestamp', 'desc').limit(200);
                } else {
                    if (!userCompanyIdForAuth) {
                        return NextResponse.json({ success: true, data: [] });
                    }
                    logsQuery = db.collection('auditLogs')
                                  .where('companyId', '==', userCompanyIdForAuth)
                                  .orderBy('timestamp', 'desc')
                                  .limit(50);
                }

                const logsSnap = await logsQuery.get();
                if (logsSnap.empty) {
                    return NextResponse.json({ success: true, data: [] });
                }

                const userIds = new Set<string>();
                logsSnap.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.userId) userIds.add(data.userId);
                });
                
                let userMap = new Map();
                if (userIds.size > 0) {
                    const userDocs = await db.collection('users').where(FieldPath.documentId(), 'in', Array.from(userIds)).get();
                    userMap = new Map(userDocs.docs.map(doc => [doc.id, doc.data()]));
                }
                
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
            case 'inviteLead': {
                const { leadId } = payload;
                if (!leadId) throw new Error("leadId is required.");
                const leadRef = db.collection('leads').doc(leadId);
                await leadRef.update({
                    status: 'invited',
                    updatedAt: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true, message: "Lead status updated to 'invited'." });
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
                const leads = leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LeadData[];

                const groups: { [key: string]: LeadData[] } = {};
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
                const paymentsSnap = await db.collectionGroup('walletPayments').get();
                const data = paymentsSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }
            case 'getWalletTransactions': {
                 const transactionsSnap = await db.collectionGroup('transactions').get();
                const data = transactionsSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
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
                const snapshot = await db.collectionGroup('shops').get();
                const data = snapshot.docs.map(doc => {
                    const docData = doc.data();
                    const pathSegments = doc.ref.path.split('/');
                    
                    // This logic ensures we only get shops from the private company subcollections
                    if (pathSegments.length < 4 || pathSegments[0] !== 'companies' || pathSegments[2] !== 'shops') {
                        return null;
                    }
                    
                    const companyId = pathSegments[1];
                    
                    return { 
                        id: doc.id, 
                        ...serializeTimestamps(docData),
                        companyId: companyId,
                    };
                }).filter(item => item !== null); 

                data.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
                });

                return NextResponse.json({ success: true, data: data });
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
                 if (!companyId || paymentId === undefined || typeof amount !== 'number' || !description) {
                    throw new Error("Missing required payload for approveWalletPayment.");
                 }

                 const batch = db.batch();
                 
                 const companyRef = db.doc(`companies/${companyId}`);
                 batch.update(companyRef, { walletBalance: FieldValue.increment(amount), availableBalance: FieldValue.increment(amount) });
                 
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
                if (!shopDoc.exists) throw new Error(`Shop with ID ${shopId} not found for company ${companyId}.`);
                const shopData = shopDoc.data()!;
                const wasAlreadyApproved = shopData.status === 'approved';
                const memberProductsSnap = await memberShopRef.collection('products').get();
                const publicProductsCollection = publicShopRef.collection('products');
                
                const loyaltyConfigDoc = await db.collection('configuration').doc('loyaltySettings').get();

                // Step 1: Delete all old products in a separate batch.
                const existingPublicProductsSnap = await publicProductsCollection.get();
                if (!existingPublicProductsSnap.empty) {
                    const deleteBatch = db.batch();
                    existingPublicProductsSnap.docs.forEach(doc => deleteBatch.delete(doc.ref));
                    await deleteBatch.commit();
                }
                
                // Step 2: Write all new data in a second batch.
                const writeBatch = db.batch();
                const { createdAt, updatedAt, ...restOfShopData } = shopData;
                
                writeBatch.set(publicShopRef, {
                    ...restOfShopData,
                    companyId, 
                    status: 'approved',
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });

                memberProductsSnap.docs.forEach(productDoc => {
                    const newPublicProductRef = publicProductsCollection.doc(productDoc.id);
                    writeBatch.set(newPublicProductRef, productDoc.data());
                });
                
                writeBatch.update(memberShopRef, { status: 'approved', updatedAt: FieldValue.serverTimestamp() });

                if (!wasAlreadyApproved && loyaltyConfigDoc.exists) {
                    const shopCreationPoints = loyaltyConfigDoc.data()?.shopCreationPoints || 100;
                    const companyRef = db.doc(`companies/${companyId}`);
                    writeBatch.update(companyRef, { rewardPoints: FieldValue.increment(shopCreationPoints) });
                }
                
                await writeBatch.commit();

                const message = wasAlreadyApproved 
                    ? 'Shop products successfully re-synced.'
                    : 'Shop and its products have been approved and published.';
                return NextResponse.json({ success: true, message });
            }
            case 'rejectShop': {
                const { companyId, shopId } = payload;
                if (!companyId || !shopId) {
                    throw new Error("Missing companyId or shopId.");
                }

                const memberShopRef = db.doc(`companies/${companyId}/shops/${shopId}`);
                const publicShopRef = db.doc(`shops/${shopId}`);
                
                const batch = db.batch();
                
                batch.update(memberShopRef, { status: 'rejected' });
                batch.delete(publicShopRef);
                
                await batch.commit();

                return NextResponse.json({ success: true, message: "Shop has been rejected." });
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
