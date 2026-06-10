
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue, FieldPath } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Serializes Firestore objects for JSON response.
 */
function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    const newDocData: { [key: string]: any } = {};
    for (const key in docData) {
        const value = docData[key];
        if (value instanceof Timestamp) {
            newDocData[key] = value.toDate().toISOString();
        } else if (value && typeof value === 'object' && value._methodName === 'serverTimestamp') {
            newDocData[key] = new Date().toISOString();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            newDocData[key] = serializeTimestamps(value);
        } else {
            newDocData[key] = value;
        }
    }
    return newDocData;
}

/**
 * Split array into chunks for batch processing.
 */
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

export async function POST(req: NextRequest) {
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) throw new Error(`Admin SDK failed: ${initError}`);

        const authorization = req.headers.get('authorization');
        if (!authorization?.startsWith('Bearer ')) throw new Error('Unauthorized.');
        const token = authorization.split('Bearer ')[1];
        
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        
        const { action, payload } = await req.json();
        const db = getFirestore(app);
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';

        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        switch (action) {
            // --- PLATFORM OVERSIGHT ---
            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(100).get();
                const data = await Promise.all(snap.docs.map(async (d) => {
                    const cData = d.data();
                    const userSnap = await db.collection('users').doc(cData.ownerId).get();
                    const uData = userSnap.exists ? userSnap.data() : {};
                    return { 
                        ...serializeTimestamps(cData), 
                        id: d.id,
                        firstName: uData?.firstName || 'N/A',
                        lastName: uData?.lastName || '',
                        email: uData?.email || 'N/A'
                    };
                }));
                return NextResponse.json({ success: true, data });
            }

            case 'getShops': {
                // Using a capped collectionGroup query to protect quota
                const snap = await db.collectionGroup('shops').orderBy('updatedAt', 'desc').limit(100).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getContributions': {
                const snap = await db.collection('contributions').orderBy('createdAt', 'desc').limit(100).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getStaff': {
                const snap = await db.collectionGroup('staff').limit(100).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            // --- CRM & PARTNERS ---
            case 'getPartnersByType': {
                const { type } = payload;
                let q = db.collection('partners').orderBy('updatedAt', 'desc').limit(100);
                if (type !== 'all') {
                    // Requires Index: partners | type: ASC, updatedAt: DESC
                    q = db.collection('partners').where('type', '==', type).orderBy('updatedAt', 'desc').limit(100);
                }
                const snap = await q.get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(100).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'searchRegistry': {
                const { term, type } = payload;
                let q = db.collection('leads')
                    .where('companyName', '>=', term)
                    .where('companyName', '<=', term + '\uf8ff')
                    .limit(100);
                
                if (type && type !== 'all') {
                    q = q.where('type', '==', type);
                }

                const snap = await q.get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'savePartner': {
                const { partner } = payload;
                const id = partner.id || db.collection('partners').doc().id;
                
                // Handle service_handle mapping if present
                if (partner.service_handle && !partner.firstName) {
                    const parts = partner.service_handle.trim().split(' ');
                    partner.firstName = parts[0];
                    partner.lastName = parts.slice(1).join(' ');
                }

                await db.collection('partners').doc(id).set({ 
                    ...partner, 
                    id, 
                    updatedAt: FieldValue.serverTimestamp() 
                }, { merge: true });
                
                return NextResponse.json({ success: true, id });
            }

            case 'logCommunication': {
                const { partnerId, type, subject, notes } = payload;
                const ref = db.collection('partners').doc(partnerId).collection('communications').doc();
                await ref.set({
                    id: ref.id, type, subject, notes,
                    timestamp: FieldValue.serverTimestamp()
                });
                await db.collection('partners').doc(partnerId).set({
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
                
                // Also mirror to leads if it exists
                await db.collection('leads').doc(partnerId).set({
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true }).catch(() => {}); // Ignore if lead doesn't exist

                return NextResponse.json({ success: true });
            }

            case 'markLeadsAsResearching': {
                const { leadIds } = payload;
                const chunks = chunkArray(leadIds, 50);
                for (const chunk of chunks) {
                    const batch = db.batch();
                    chunk.forEach(id => {
                        batch.update(db.collection('leads').doc(id), { 
                            researchStatus: 'researching', 
                            updatedAt: FieldValue.serverTimestamp() 
                        });
                        batch.set(db.collection('partners').doc(id), {
                            researchStatus: 'researching',
                            updatedAt: FieldValue.serverTimestamp()
                        }, { merge: true });
                    });
                    await batch.commit();
                }
                return NextResponse.json({ success: true });
            }

            case 'deleteLeads': {
                const { leadIds } = payload;
                const chunks = chunkArray(leadIds, 50);
                for (const chunk of chunks) {
                    const batch = db.batch();
                    chunk.forEach(id => {
                        batch.delete(db.collection('leads').doc(id));
                        batch.delete(db.collection('partners').doc(id));
                    });
                    await batch.commit();
                }
                return NextResponse.json({ success: true });
            }

            // --- FINANCIAL OPERATIONS ---
            case 'getWalletPayments': {
                const snap = await db.collectionGroup('walletPayments').orderBy('createdAt', 'desc').limit(100).get();
                const data = snap.docs.map(doc => ({ id: doc.id, companyId: doc.ref.parent.parent?.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getWalletTransactions': {
                const snap = await db.collectionGroup('transactions').orderBy('date', 'desc').limit(100).get();
                const data = snap.docs.map(doc => ({ id: doc.id, companyId: doc.ref.parent.parent?.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'approveWalletPayment': {
                const { companyId, paymentId, amount, description, reconciliationId } = payload;
                await db.runTransaction(async (transaction) => {
                    const companyRef = db.collection('companies').doc(companyId);
                    const txRef = companyRef.collection('transactions').doc();
                    
                    transaction.update(companyRef, {
                        walletBalance: FieldValue.increment(amount),
                        availableBalance: FieldValue.increment(amount),
                        updatedAt: FieldValue.serverTimestamp()
                    });
                    
                    transaction.set(txRef, {
                        transactionId: txRef.id,
                        type: 'credit',
                        amount,
                        description,
                        reconciliationId,
                        date: FieldValue.serverTimestamp(),
                        status: 'allocated'
                    });
                    
                    transaction.delete(companyRef.collection('walletPayments').doc(paymentId));
                });
                return NextResponse.json({ success: true });
            }

            case 'approvePayout': {
                const { companyId, payoutId, amount } = payload;
                await db.runTransaction(async (transaction) => {
                    const companyRef = db.collection('companies').doc(companyId);
                    const txRef = companyRef.collection('transactions').doc();
                    
                    transaction.update(companyRef, {
                        walletBalance: FieldValue.increment(-amount),
                        availableBalance: FieldValue.increment(-amount),
                        updatedAt: FieldValue.serverTimestamp()
                    });
                    
                    transaction.set(txRef, {
                        transactionId: txRef.id,
                        type: 'debit',
                        amount,
                        description: 'Withdrawal (Approved)',
                        date: FieldValue.serverTimestamp(),
                        status: 'allocated'
                    });
                    
                    transaction.update(companyRef.collection('payoutRequests').doc(payoutId), {
                        status: 'approved',
                        processedAt: FieldValue.serverTimestamp()
                    });
                });
                return NextResponse.json({ success: true });
            }

            case 'rejectPayout': {
                const { companyId, payoutId } = payload;
                await db.collection('companies').doc(companyId).collection('payoutRequests').doc(payoutId).update({
                    status: 'rejected',
                    updatedAt: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            // --- NEGOTIATIONS ---
            case 'getPendingAgreements': {
                const snap = await db.collectionGroup('agreements').where('status', '==', 'proposed').limit(50).get();
                const data = await Promise.all(snap.docs.map(async (d) => {
                    const pathParts = d.ref.path.split('/');
                    const shopId = pathParts[3];
                    const shopSnap = await db.collectionGroup('shops').where('id', '==', shopId).limit(1).get();
                    const shopData = !shopSnap.empty ? shopSnap.docs[0].data() : {};
                    return { 
                        id: d.id, 
                        ...serializeTimestamps(d.data()), 
                        shopName: shopData.shopName || 'Unknown Shop',
                        companyId: pathParts[1],
                        shopId: shopId
                    };
                }));
                return NextResponse.json({ success: true, data });
            }

            case 'acceptCommercialAgreement': {
                const { companyId, shopId, agreementId } = payload;
                const agreementsRef = db.collection(`companies/${companyId}/shops/${shopId}/agreements`);
                await db.runTransaction(async (transaction) => {
                    const activeQuery = agreementsRef.where('status', '==', 'active');
                    const activeSnap = await transaction.get(activeQuery);
                    activeSnap.docs.forEach(doc => transaction.update(doc.ref, { status: 'archived' }));
                    transaction.update(agreementsRef.doc(agreementId), { 
                        status: 'active', 
                        updatedAt: FieldValue.serverTimestamp(),
                        effectiveDate: FieldValue.serverTimestamp()
                    });
                    // Sync the rate to the shop document
                    const agreementSnap = await transaction.get(agreementsRef.doc(agreementId));
                    transaction.update(db.doc(`companies/${companyId}/shops/${shopId}`), {
                        platformCommission: agreementSnap.data()?.percentage || 2.5
                    });
                });
                return NextResponse.json({ success: true });
            }

            // --- STAFF MANAGEMENT ---
            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'savePlatformStaff': {
                const { staff } = payload;
                const id = staff.id || db.collection('platformStaff').doc().id;
                await db.collection('platformStaff').doc(id).set({ 
                    ...staff, 
                    id, 
                    updatedAt: FieldValue.serverTimestamp() 
                }, { merge: true });
                return NextResponse.json({ success: true });
            }

            case 'deletePlatformStaff': {
                const { staffId } = payload;
                await db.collection('platformStaff').doc(staffId).delete();
                return NextResponse.json({ success: true });
            }

            // --- SYSTEM LOGS ---
            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            default:
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
