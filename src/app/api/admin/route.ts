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
 * Centralized authority for platform operations and forensic registry management.
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
                const { type, term, limit = 20000, outreachFilter } = payload;
                let results: any[] = [];
                
                const [leadsSnap, partnersSnap] = await Promise.all([
                    db.collection('leads').where('type', '==', type).limit(limit).get(),
                    db.collection('partners').where('type', '==', type).limit(limit).get()
                ]);
                
                results = [
                    ...leadsSnap.docs.map(d => ({ id: d.id, source: 'Lead', ...d.data() })),
                    ...partnersSnap.docs.map(d => ({ id: d.id, source: 'Partner', ...d.data() }))
                ];

                if (term) {
                    const lowTerm = term.toLowerCase();
                    results = results.filter(r => 
                        (r.companyName || r.company_name || '').toLowerCase().includes(lowTerm) ||
                        (r.contactPerson || r.contact_person || '').toLowerCase().includes(lowTerm)
                    );
                }
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                const [pSnap, lSnap] = await Promise.all([
                    db.collection('partners').where('type', '==', type).get(),
                    db.collection('leads').where('type', '==', type).get()
                ]);
                const results = [
                    ...pSnap.docs.map(d => ({ id: d.id, source: 'Partner', ...d.data() })),
                    ...lSnap.docs.map(d => ({ id: d.id, source: 'Lead', ...d.data() }))
                ];
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const batch = db.batch();
                const coll = type === 'lead' ? 'leads' : 'partners';
                
                partners.forEach((p: any) => {
                    let id = p.record_id || p.id;
                    if (!id) {
                        const name = p.companyName || p.company_name || 'entry';
                        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
                        id = `DISC_${type.toUpperCase()}_${slug}_${Math.random().toString(36).substring(2, 7)}`;
                    }

                    const ref = db.collection(coll).doc(id);
                    const updateData = { 
                        ...p, 
                        id, 
                        type: p.type || type, 
                        updatedAt: FieldValue.serverTimestamp() 
                    };

                    // FORENSIC SHIELD: Reset outreach trackers for new discoveries to prevent legacy data inheritance
                    if (p.status === 'new' || !p.status) {
                        updateData.lastOutreachAt = null;
                        updateData.lastOutreachSubject = null;
                        updateData.lastOpenedAt = null;
                        updateData.lastAccessedAt = null;
                    }

                    batch.set(ref, updateData, { merge: true });
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
                    ...lSnap.docs.map(d => ({ id: d.id, source: 'Lead', ...d.data() })),
                    ...pSnap.docs.map(d => ({ id: d.id, source: 'Partner', ...d.data() }))
                ];
                
                const groups: Record<string, any[]> = {};
                records.forEach((r: any) => {
                    const name = (r.companyName || r.company_name || '').toLowerCase().trim();
                    const email = (r.email || r.email_address || '').toLowerCase().trim();
                    if (!name || !email) return;
                    const compositeKey = `${name}|${email}`;
                    if (!groups[compositeKey]) groups[compositeKey] = [];
                    groups[compositeKey].push(r);
                });
                
                const batch = db.batch();
                let deleteCount = 0;
                Object.values(groups).forEach(group => {
                    if (group.length <= 1) return;
                    group.sort((a, b) => (a.source === 'Partner' ? -1 : 1));
                    const [keep, ...toDelete] = group;
                    toDelete.forEach(item => {
                        const coll = item.source === 'Lead' ? 'leads' : 'partners';
                        batch.delete(db.collection(coll).doc(item.id));
                        deleteCount++;
                    });
                });
                if (deleteCount > 0) await batch.commit();
                return NextResponse.json({ success: true, count: deleteCount });
            }

            case 'savePartner': {
                const { partner, collection: targetColl = 'partners' } = payload;
                const id = partner.id || db.collection(targetColl).doc().id;
                await db.collection(targetColl).doc(id).set({ ...partner, id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').get();
                const members = await Promise.all(snap.docs.map(async (doc) => {
                    const data = doc.data();
                    const ownerSnap = await db.collection('users').doc(data.ownerId).get();
                    return { id: doc.id, ...data, firstName: ownerSnap.data()?.firstName || 'User', lastName: ownerSnap.data()?.lastName || '', email: ownerSnap.data()?.email || 'N/A' };
                }));
                return NextResponse.json({ success: true, data: members.map(serializeTimestamps) });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

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

            case 'deletePlatformStaff': {
                await db.collection('platformStaff').doc(payload.staffId).delete();
                return NextResponse.json({ success: true });
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
