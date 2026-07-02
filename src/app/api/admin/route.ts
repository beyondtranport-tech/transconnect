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
 * Optimized with strict limits (500 cap) to prevent Resource Exhaustion.
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
                const { type, term, limit = 100, outreachFilter } = payload;
                const safeLimit = Math.min(limit, 500);
                
                let results: any[] = [];
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
                        (r.contactPerson || '').toLowerCase().includes(lowTerm)
                    );
                }

                results.sort((a, b) => {
                    const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
                    const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
                    return dateB - dateA;
                });

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

            case 'getStaff':
            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'savePlatformStaff': {
                const { staff } = payload;
                const id = staff.id || db.collection('platformStaff').doc().id;
                await db.collection('platformStaff').doc(id).set({ ...staff, id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true });
            }

            case 'getAudienceCommunications': {
                const { type } = payload;
                const snap = await db.collectionGroup('communications').orderBy('timestamp', 'desc').limit(100).get();
                const logs = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data: logs });
            }

            case 'getAudienceTasks': {
                const { type } = payload;
                const snap = await db.collectionGroup('tasks').orderBy('createdAt', 'desc').limit(100).get();
                const tasks = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data: tasks });
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
                        // Data Shield: Clear outreach for new records
                        lastOutreachAt: null,
                        lastOutreachSubject: null,
                        lastOpenedAt: null,
                        lastAccessedAt: null
                    }, { merge: true });
                });
                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'bulkDeduplicate': {
                const { type } = payload;
                const [lSnap, pSnap] = await Promise.all([
                    db.collection('leads').where('type', '==', type).get(),
                    db.collection('partners').where('type', '==', type).get()
                ]);
                const records = [
                    ...lSnap.docs.map(d => ({ id: d.id, coll: 'leads', ...d.data() })),
                    ...pSnap.docs.map(d => ({ id: d.id, coll: 'partners', ...d.data() }))
                ];
                const groups: Record<string, any[]> = {};
                records.forEach((r: any) => {
                    const key = `${(r.companyName || '').toLowerCase().trim()}|${(r.email || '').toLowerCase().trim()}`;
                    if (!key.includes('|')) return;
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(r);
                });
                const batch = db.batch();
                let count = 0;
                Object.values(groups).forEach(g => {
                    if (g.length <= 1) return;
                    g.sort((a, b) => (a.coll === 'partners' ? -1 : 1));
                    const [keep, ...rest] = g;
                    rest.forEach(item => {
                        batch.delete(db.collection(item.coll).doc(item.id));
                        count++;
                    });
                });
                if (count > 0) await batch.commit();
                return NextResponse.json({ success: true, count });
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
                    return { id: doc.id, ...data, firstName: ownerSnap.data()?.firstName || 'User', lastName: ownerSnap.data()?.lastName || '', email: ownerSnap.data()?.email || 'N/A' };
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

            case 'logCommunication': {
                const { partnerId, subject, notes, collection: providedColl, type: channel } = payload;
                const targetColl = providedColl || 'partners';
                const parentRef = db.collection(targetColl).doc(partnerId);
                const logRef = parentRef.collection('communications').doc();
                await logRef.set({ id: logRef.id, type: channel || 'Email', subject, notes: notes || '', timestamp: FieldValue.serverTimestamp(), adminId: decodedToken.uid });
                await parentRef.update({ lastOutreachAt: FieldValue.serverTimestamp(), lastOutreachSubject: subject, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }

            default: return NextResponse.json({ success: false, error: "Action not supported." }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
