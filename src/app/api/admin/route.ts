
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Sanitizes and normalizes data for Firestore.
 * 1. Handles snake_case to camelCase mapping for AI Studio imports.
 * 2. Automatically removes properties with 'undefined' values to prevent Firestore crashes.
 */
function normalizeAndSanitize(obj: any): any {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(normalizeAndSanitize);
    
    const sanitized: any = {};
    for (const key in obj) {
        let val = obj[key];
        
        // Skip undefined values to prevent Firestore document write errors
        if (val === undefined) continue;

        // Map AI snake_case keys to camelCase CRM keys
        let newKey = key;
        if (key === 'company_name') newKey = 'companyName';
        if (key === 'physical_address') newKey = 'address';
        if (key === 'contact_person') newKey = 'contactPerson';
        if (key === 'email_address') newKey = 'email';
        if (key === 'telephone_number') newKey = 'phone';
        if (key === 'registry_line') newKey = 'mobile';
        if (key === 'industrial_category') newKey = 'industrial_category'; 
        
        sanitized[newKey] = normalizeAndSanitize(val);
    }
    return sanitized;
}

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

export async function POST(req: NextRequest) {
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) throw new Error(`Admin SDK failed: ${initError}`);

        const authorization = req.headers.get('authorization');
        if (!authorization?.startsWith('Bearer ')) throw new Error('Unauthorized.');
        const token = authorization.split('Bearer ')[1];
        
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        
        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};
        const db = getFirestore(app);
        
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';
        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        switch (action) {
            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(1000).get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'saveLead': {
                const { lead } = payload;
                const ref = lead.id ? db.collection('leads').doc(lead.id) : db.collection('leads').doc();
                await ref.set({ ...lead, id: ref.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true });
            }

            case 'inviteLead': {
                const { leadId } = payload;
                await db.collection('leads').doc(leadId).update({
                    status: 'invited',
                    invitedAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true, message: "Lead marked as invited." });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                let q = db.collection('partners').orderBy('updatedAt', 'desc').limit(1000);
                if (type && type !== 'all') {
                    q = db.collection('partners').where('type', '==', type).orderBy('updatedAt', 'desc').limit(1000);
                }
                const snap = await q.get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'savePartner': {
                const { partner } = payload;
                if (!partner) throw new Error("Partner data missing.");
                const ref = partner.id ? db.collection('partners').doc(partner.id) : db.collection('partners').doc();
                const sanitized = normalizeAndSanitize({
                    ...partner,
                    id: ref.id,
                    updatedAt: FieldValue.serverTimestamp()
                });
                await ref.set(sanitized, { merge: true });
                return NextResponse.json({ success: true });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const batch = db.batch();
                for (const p of partners) {
                    let ref;
                    const cName = p.companyName || p.company_name || p.trading_name || p.name || p.service_handle;
                    
                    if (p.record_id) {
                        ref = db.collection('partners').doc(p.record_id);
                    } else if (cName) {
                        const safeId = String(cName).replace(/[^a-z0-9]/gi, '_').toLowerCase();
                        ref = db.collection('partners').doc(`${type}_${safeId}`);
                    } else {
                        ref = db.collection('partners').doc();
                    }

                    const rawData = {
                        ...p,
                        type,
                        companyName: cName,
                        contactPerson: p.contactPerson || p.contact_person || p.leadership || (p.firstName ? `${p.firstName} ${p.lastName}` : null),
                        email: p.email || p.email_address || p.professional_contact,
                        phone: p.phone || p.telephone_number || p.landline,
                        mobile: p.mobile || p.registry_line || p.cell,
                        address: p.address || p.physical_address || p.location || p.operational_hub,
                        industrial_category: p.industrial_category || p.category || p.classification || p.service_classification,
                        minedServiceWording: p.minedServiceWording || p.technical_summary || p.notes,
                        industrialTags: p.industrialTags || p.tags || [],
                        updatedAt: FieldValue.serverTimestamp(),
                        enrichedAt: FieldValue.serverTimestamp(),
                        researchStatus: 'completed'
                    };
                    
                    const data = normalizeAndSanitize(rawData);
                    batch.set(ref, data, { merge: true });
                }
                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'getShops': {
                const snap = await db.collectionGroup('shops').get();
                const data = snap.docs.map(d => {
                    const pathSegments = d.ref.path.split('/');
                    const companyId = pathSegments[1]; 
                    return { 
                        id: d.id, 
                        companyId,
                        ...serializeTimestamps(d.data()) 
                    };
                });
                return NextResponse.json({ success: true, data });
            }

            case 'approveShop': {
                const { shopId, companyId } = payload;
                if (!shopId || !companyId) throw new Error("Missing shopId or companyId in sync request.");

                const internalShopRef = db.doc(`companies/${companyId}/shops/${shopId}`);
                const publicShopRef = db.doc(`shops/${shopId}`);
                
                const shopSnap = await internalShopRef.get();
                if (!shopSnap.exists) throw new Error(`Internal shop record not found at: ${internalShopRef.path}`);
                
                const shopData = shopSnap.data()!;
                const { id, ...sanitizedData } = shopData;

                const batch = db.batch();

                // 1. Update internal status
                batch.update(internalShopRef, { status: 'approved', updatedAt: FieldValue.serverTimestamp() });

                // 2. Clone to root public registry
                batch.set(publicShopRef, {
                    ...sanitizedData,
                    id: shopId,
                    companyId,
                    status: 'approved',
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });

                // 3. Sync all products to public sub-collection
                const productsSnap = await internalShopRef.collection('products').get();
                const publicProductsCol = publicShopRef.collection('products');
                
                const existingPublic = await publicProductsCol.get();
                existingPublic.forEach(d => batch.delete(d.ref));

                productsSnap.forEach(d => {
                    const pData = d.data();
                    batch.set(publicProductsCol.doc(d.id), { ...pData, id: d.id });
                });

                await batch.commit();

                return NextResponse.json({ success: true, message: "Shop and products synchronized to public registry." });
            }

            case 'rejectShop': {
                const { shopId, companyId } = payload;
                const internalShopRef = db.doc(`companies/${companyId}/shops/${shopId}`);
                const publicShopRef = db.doc(`shops/${shopId}`);

                await internalShopRef.update({ status: 'rejected', updatedAt: FieldValue.serverTimestamp() });
                await publicShopRef.delete(); 

                return NextResponse.json({ success: true });
            }

            case 'getContributions': {
                const snap = await db.collection('contributions').orderBy('createdAt', 'desc').limit(200).get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(200).get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'listAllUsers': {
                const listUsersResult = await adminAuth.listUsers(1000);
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

            case 'getWalletPayments': {
                const snap = await db.collectionGroup('walletPayments').get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getWalletTransactions': {
                const snap = await db.collectionGroup('transactions').orderBy('date', 'desc').limit(500).get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'approvePayout': {
                const { companyId, payoutId, amount } = payload;
                const companyRef = db.doc(`companies/${companyId}`);
                const payoutRef = companyRef.collection('payoutRequests').doc(payoutId);
                
                await db.runTransaction(async (transaction) => {
                    transaction.update(companyRef, {
                        walletBalance: FieldValue.increment(-amount),
                        availableBalance: FieldValue.increment(-amount),
                        updatedAt: FieldValue.serverTimestamp(),
                    });
                    transaction.update(payoutRef, { status: 'approved', updatedAt: FieldValue.serverTimestamp() });
                    
                    const txRef = companyRef.collection('transactions').doc();
                    transaction.set(txRef, {
                        transactionId: txRef.id,
                        type: 'debit',
                        amount,
                        date: FieldValue.serverTimestamp(),
                        description: 'Wallet Payout (Withdrawal)',
                        status: 'allocated',
                    });
                });
                return NextResponse.json({ success: true });
            }

            case 'rejectPayout': {
                const { companyId, payoutId } = payload;
                await db.doc(`companies/${companyId}/payoutRequests/${payoutId}`).update({
                    status: 'rejected',
                    updatedAt: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'getPendingAgreements': {
                const snap = await db.collectionGroup('agreements').where('status', '==', 'proposed').get();
                const data = snap.docs.map(d => {
                    const path = d.ref.path.split('/');
                    return { id: d.id, companyId: path[1], shopId: path[3], ...serializeTimestamps(d.data()) };
                });
                return NextResponse.json({ success: true, data });
            }

            case 'getLendingData': {
                const { collectionName } = payload;
                const snap = await db.collection(collectionName).get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'updateMemberStatus': {
                const { companyId, status } = payload;
                await db.collection('companies').doc(companyId).update({
                    status,
                    updatedAt: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'deleteMember': {
                const { companyId } = payload;
                await db.collection('companies').doc(companyId).delete();
                return NextResponse.json({ success: true });
            }

            default:
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
