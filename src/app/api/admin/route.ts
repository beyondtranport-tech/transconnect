import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import { enrichPartner } from '@/ai/flows/enrich-partner-flow';

export const dynamic = 'force-dynamic';

/**
 * UTILITY: TIMESTAMP SERIALIZATION
 * Ensures all Firestore Timestamps are converted to ISO strings for the client.
 */
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
    let currentAction = 'initialization';
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) throw new Error(`Admin SDK failed: ${initError}`);

        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized: Missing token.');
        const token = authHeader.split('Bearer ')[1];
        
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        const db = getFirestore(app);

        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || 
                        decodedToken.email === 'mkoton100@gmail.com' || 
                        decodedToken.email === 'michael@logisticsflow.co.za' ||
                        decodedToken.admin === true;

        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        const body = await req.json();
        const { action, payload } = body;
        currentAction = action;

        switch (action) {
            // --- MEMBER & USER OVERSIGHT ---
            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(1000).get();
                const members = await Promise.all(snap.docs.map(async (doc) => {
                    const data = doc.data();
                    const userSnap = await db.collection('users').doc(data.ownerId).get();
                    const uData = userSnap.exists ? userSnap.data() : {};
                    return { 
                        id: doc.id, 
                        ...data, 
                        firstName: uData?.firstName || 'Member', 
                        lastName: uData?.lastName || '', 
                        email: uData?.email || 'N/A' 
                    };
                }));
                return NextResponse.json({ success: true, data: members.map(serializeTimestamps) });
            }
            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(200).get();
                const logs = await Promise.all(snap.docs.map(async (doc) => {
                    const data = doc.data();
                    const userSnap = await db.collection('users').doc(data.userId || 'unknown').get();
                    const companySnap = await db.collection('companies').doc(data.companyId || 'N/A').get();
                    return { 
                        id: doc.id, 
                        ...data, 
                        userName: userSnap.exists ? userSnap.data()?.firstName : 'System',
                        companyName: companySnap.exists ? companySnap.data()?.companyName : 'Platform'
                    };
                }));
                return NextResponse.json({ success: true, data: logs.map(serializeTimestamps) });
            }

            // --- REGISTRY MANAGEMENT (CRM) ---
            case 'searchRegistry': {
                const { type, term, outreachFilter, limit = 100 } = payload;
                // Unified logic for all mall types
                let collectionName = (type === 'all' || type === 'lead') ? 'leads' : 'partners';
                
                let query: any = db.collection(collectionName);
                if (collectionName === 'partners' && type !== 'all') {
                    query = query.where('type', '==', type);
                }

                const snap = await query.orderBy('updatedAt', 'desc').limit(limit).get();
                let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                if (term) {
                    const lowTerm = term.toLowerCase();
                    results = results.filter((r: any) => 
                        (r.companyName || '').toLowerCase().includes(lowTerm) ||
                        (r.contactPerson || '').toLowerCase().includes(lowTerm) ||
                        (r.email || '').toLowerCase().includes(lowTerm)
                    );
                }

                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })).map(serializeTimestamps) });
            }

            case 'savePartner': {
                const { partner, collection = 'partners' } = payload;
                const ref = db.collection(collection).doc(partner.id || db.collection(collection).doc().id);
                await ref.set({ 
                    ...partner, 
                    id: ref.id, 
                    updatedAt: FieldValue.serverTimestamp(),
                    createdAt: partner.createdAt || FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            case 'deletePartner': {
                const { partnerId, source } = payload;
                const collection = source === 'Lead' ? 'leads' : 'partners';
                await db.collection(collection).doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const batch = db.batch();
                const collectionName = type === 'lead' ? 'leads' : 'partners';
                
                partners.forEach((p: any) => {
                    const ref = db.collection(collectionName).doc(p.record_id || p.id || db.collection(collectionName).doc().id);
                    batch.set(ref, {
                        ...p,
                        id: ref.id,
                        // AI output normalized to CRM schema
                        contactPerson: p.contactPerson || p.contact_person,
                        type: type === 'lead' ? 'lead' : type,
                        status: p.status || 'new',
                        updatedAt: FieldValue.serverTimestamp(),
                        createdAt: FieldValue.serverTimestamp()
                    }, { merge: true });
                });

                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'logCommunication': {
                const { partnerId, collection: colName = 'partners', type, subject, notes } = payload;
                const logRef = db.collection(colName).doc(partnerId).collection('communications').doc();
                await logRef.set({
                    id: logRef.id,
                    type,
                    subject,
                    notes: notes || '',
                    timestamp: FieldValue.serverTimestamp()
                });
                
                // Update outreach status on parent record
                await db.collection(colName).doc(partnerId).update({
                    status: 'contacted',
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    updatedAt: FieldValue.serverTimestamp()
                });

                return NextResponse.json({ success: true });
            }

            // --- LOADS & WAREHOUSE OVERSIGHT ---
            case 'getBrokerAgreements': {
                const snap = await db.collectionGroup('brokerAgreements').orderBy('createdAt', 'desc').get();
                const data = snap.docs.map(d => ({ id: d.id, path: d.ref.path, ...d.data() }));
                return NextResponse.json({ success: true, data: data.map(serializeTimestamps) });
            }

            case 'updateBrokerAgreementStatus': {
                const { path, status } = payload;
                await db.doc(path).update({ status, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }

            case 'getGlobalLoads': {
                const snap = await db.collectionGroup('loads').orderBy('createdAt', 'desc').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })).map(serializeTimestamps) });
            }

            case 'getWarehouseListings': {
                const snap = await db.collectionGroup('shops').where('shopType', '==', 'warehouse').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })).map(serializeTimestamps) });
            }

            // --- SALES & MARKETPLACE ---
            case 'getGlobalSales': {
                const snap = await db.collection('sales').orderBy('updatedAt', 'desc').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })).map(serializeTimestamps) });
            }

            case 'searchListings': {
                const snap = await db.collectionGroup('vehicleListings').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })).map(serializeTimestamps) });
            }

            case 'finalizeSale': {
                const { saleId, commissionRate } = payload;
                const saleRef = db.collection('sales').doc(saleId);
                const saleSnap = await saleRef.get();
                if (!saleSnap.exists) throw new Error("Sale node not found.");
                const saleData = saleSnap.data()!;

                await db.runTransaction(async (transaction) => {
                    transaction.update(saleRef, { status: 'concluded', updatedAt: FieldValue.serverTimestamp() });
                    // Disburse funds to seller wallet minus commission
                    const commission = saleData.agreedPrice * (commissionRate / 100);
                    const net = saleData.agreedPrice - commission;
                    
                    const sellerRef = db.collection('companies').doc(saleData.sellerId);
                    transaction.update(sellerRef, { 
                        walletBalance: FieldValue.increment(net),
                        availableBalance: FieldValue.increment(net),
                        pendingBalance: FieldValue.increment(-saleData.agreedPrice) 
                    });
                });
                return NextResponse.json({ success: true });
            }

            // --- FORENSIC AUTOMATION ---
            case 'logForensicInitiated': {
                const { partnerId, isLead } = payload;
                const col = isLead ? 'leads' : 'partners';
                await db.collection(col).doc(partnerId).update({
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'bulkLogForensicInitiated': {
                const { leadIds, type } = payload;
                const col = type === 'lead' ? 'leads' : 'partners';
                const batch = db.batch();
                leadIds.forEach((id: string) => {
                    batch.update(db.collection(col).doc(id), { status: 'contacted', updatedAt: FieldValue.serverTimestamp() });
                });
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'autoEnrichRecord': {
                const { id, type } = payload;
                const col = type === 'lead' ? 'leads' : 'partners';
                const ref = db.collection(col).doc(id);
                const snap = await ref.get();
                if (!snap.exists) throw new Error("Record not found");
                
                const data = snap.data()!;
                const enrichment = await enrichPartner({ 
                    companyName: data.companyName || data.company_name || `${data.firstName} ${data.lastName}` 
                });

                const update = {
                    ...enrichment,
                    status: 'qualified',
                    updatedAt: FieldValue.serverTimestamp()
                };

                await ref.update(update);
                return NextResponse.json({ success: true, data: update });
            }

            case 'bulkDeduplicate': {
                const { type } = payload;
                const snap = await db.collection('partners').where('type', '==', type).get();
                const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                const seen = new Set();
                let count = 0;
                for (const r of records) {
                    const key = (r.companyName || '').toLowerCase().trim();
                    if (seen.has(key)) {
                        await db.collection('partners').doc(r.id).delete();
                        count++;
                    } else {
                        seen.add(key);
                    }
                }
                return NextResponse.json({ success: true, count });
            }

            // --- STAFF MANAGEMENT ---
            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
            }

            case 'savePlatformStaff': {
                const { staff } = payload;
                const ref = db.collection('platformStaff').doc(staff.id || db.collection('platformStaff').doc().id);
                await ref.set({ ...staff, id: ref.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true });
            }

            case 'deletePlatformStaff': {
                await db.collection('platformStaff').doc(payload.staffId).delete();
                return NextResponse.json({ success: true });
            }

            case 'dispatchEngagement': {
                const { partnerId, email, subject } = payload;
                // Protocol to update parent record after background dispatch
                await db.collection('leads').doc(partnerId).update({
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    status: 'contacted'
                });
                return NextResponse.json({ success: true });
            }

            default: return NextResponse.json({ success: false, error: `Action "${action}" not supported.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Failure [${currentAction}]:`, error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
