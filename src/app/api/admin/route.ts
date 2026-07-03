import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// Helper to convert Firestore Timestamps to JSON-serializable strings
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

/**
 * ADMIN MASTER API
 * Centralized authority for platform operations.
 * Enforces composite index compliance for collection group queries.
 */
export async function POST(req: NextRequest) {
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) throw new Error(`Admin SDK failed: ${initError}`);

        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized.');
        const token = authHeader.split('Bearer ')[1];
        
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        const db = getFirestore(app);

        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || 
                        decodedToken.email === 'mkoton100@gmail.com' || 
                        decodedToken.email === 'michael@logisticsflow.co.za' ||
                        decodedToken.admin === true;

        if (!isAdmin) {
            throw new Error("Access Denied: Administrative authority required.");
        }

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};

        switch (action) {
            case 'searchRegistry': {
                const { type, term, limit = 100 } = payload;
                const safeLimit = Math.min(limit, 500);
                
                let results: any[] = [];
                // Search across both collections
                const [leadsSnap, partnersSnap] = await Promise.all([
                    db.collection('leads').where('type', '==', type).limit(safeLimit).get(),
                    db.collection('partners').where('type', '==', type).limit(safeLimit).get()
                ]);
                
                results = [
                    ...leadsSnap.docs.map(d => ({ id: d.id, source: 'Lead', ...d.data() })),
                    ...partnersSnap.docs.map(d => ({ id: d.id, source: 'Partner', ...d.data() }))
                ];

                if (term) {
                    const lowTerm = term.toLowerCase();
                    results = results.filter(r => 
                        (r.companyName || '').toLowerCase().includes(lowTerm) ||
                        (r.contactPerson || '').toLowerCase().includes(lowTerm) ||
                        (r.email || '').toLowerCase().includes(lowTerm)
                    );
                }

                results.sort((a, b) => {
                    const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
                    const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
                    return dateB - dateA;
                });

                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getBrokerAgreements': {
                // COMPOSITE INDEX ALIGNMENT: Ordering by createdAt DESC across collection group
                const snap = await db.collectionGroup('brokerAgreements')
                    .orderBy('createdAt', 'desc')
                    .limit(100)
                    .get();

                const results = await Promise.all(snap.docs.map(async (d) => {
                    const data = d.data();
                    const brokerSnap = await db.collection('companies').doc(data.brokerId).get();
                    return {
                        id: d.id,
                        path: d.ref.path,
                        brokerName: brokerSnap.data()?.companyName || 'Unknown Broker',
                        ...data
                    };
                }));
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'updateBrokerAgreementStatus': {
                const { path, status } = payload;
                if (!path || !status) throw new Error("Path and status required.");
                await db.doc(path).update({ status, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }

            case 'getGlobalLoads': {
                // COMPOSITE INDEX ALIGNMENT: Ordering by createdAt DESC across collection group
                const snap = await db.collectionGroup('loads')
                    .orderBy('createdAt', 'desc')
                    .limit(200)
                    .get();

                const results = await Promise.all(snap.docs.map(async (d) => {
                    const data = d.data();
                    const brokerSnap = await db.collection('companies').doc(data.brokerId).get();
                    return {
                        id: d.id,
                        path: d.ref.path,
                        brokerName: brokerSnap.data()?.companyName || 'Unknown Broker',
                        ...data
                    };
                }));
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                const [lSnap, pSnap] = await Promise.all([
                    db.collection('leads').where('type', '==', type).limit(500).get(),
                    db.collection('partners').where('type', '==', type).limit(500).get()
                ]);
                const results = [
                    ...lSnap.docs.map(d => ({ id: d.id, source: 'Lead', ...d.data() })),
                    ...pSnap.docs.map(d => ({ id: d.id, source: 'Member', ...d.data() }))
                ];
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'savePartner': {
                const { partner, collection: coll = 'partners' } = payload;
                const ref = db.collection(coll).doc(partner.id || db.collection(coll).doc().id);
                await ref.set({ ...partner, id: ref.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const batch = db.batch();
                const coll = type === 'lead' ? 'leads' : 'partners';
                partners.forEach((p: any) => {
                    const id = p.record_id || p.id || db.collection(coll).doc().id;
                    const ref = db.collection(coll).doc(id);
                    batch.set(ref, { 
                        ...p, 
                        id, 
                        type: p.type || type, 
                        updatedAt: FieldValue.serverTimestamp(),
                        lastOutreachAt: null,
                        lastOutreachSubject: null,
                        lastOpenedAt: null,
                        lastAccessedAt: null
                    }, { merge: true });
                });
                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'logCommunication': {
                const { partnerId, subject, notes, collection: providedColl, type: channel } = payload;
                const targetColl = providedColl || 'partners';
                const parentRef = db.collection(targetColl).doc(partnerId);
                const logRef = parentRef.collection('communications').doc();
                await logRef.set({ 
                    id: logRef.id, 
                    type: channel || 'Email', 
                    subject, 
                    notes: notes || '', 
                    timestamp: FieldValue.serverTimestamp(), 
                    adminId: decodedToken.uid 
                });
                await parentRef.update({ 
                    lastOutreachAt: FieldValue.serverTimestamp(), 
                    lastOutreachSubject: subject, 
                    updatedAt: FieldValue.serverTimestamp() 
                });
                return NextResponse.json({ success: true });
            }

            case 'dispatchEngagement': {
                const { partnerId, subject, audience } = payload;
                const coll = (audience === 'transporters' || audience === 'suppliers' || audience === 'isa' || audience === 'finance' || audience === 'developers') ? 'partners' : 'leads';
                const logRef = db.collection(coll).doc(partnerId).collection('communications').doc();
                await logRef.set({
                    id: logRef.id,
                    type: 'Automated Dispatch',
                    subject,
                    timestamp: FieldValue.serverTimestamp(),
                    notes: `Background dispatch initiated via Transactional API for ${audience}.`
                });
                return NextResponse.json({ success: true });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(500).get();
                const members = await Promise.all(snap.docs.map(async (doc) => {
                    const data = doc.data();
                    const ownerSnap = await db.collection('users').doc(data.ownerId).get();
                    return { 
                        id: doc.id, 
                        ...data, 
                        firstName: ownerSnap.data()?.firstName || 'User', 
                        lastName: ownerSnap.data()?.lastName || '', 
                        email: ownerSnap.data()?.email || 'N/A' 
                    };
                }));
                return NextResponse.json({ success: true, data: members.map(serializeTimestamps) });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(500).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            default: return NextResponse.json({ success: false, error: "Action not supported." }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
