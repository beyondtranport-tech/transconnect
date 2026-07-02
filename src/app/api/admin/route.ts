
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

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

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};

        if (!action) throw new Error("No action provided.");

        switch (action) {
            case 'getMemberFacilities': {
                const { companyId } = payload;
                if (!companyId) throw new Error("companyId required.");
                const snap = await db.collection(`companies/${companyId}/facilities`).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getPartnersByType': {
                if (!isAdmin) throw new Error("Admin access required.");
                const { type } = payload;
                const partnersSnap = await db.collection('partners').where('type', '==', type).get();
                const leadsSnap = await db.collection('leads').where('type', '==', type).get();
                const results = [
                    ...partnersSnap.docs.map(d => ({ id: d.id, source: 'Partner', ...d.data() })),
                    ...leadsSnap.docs.map(d => ({ id: d.id, source: 'Lead', ...d.data() }))
                ];
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getAudienceCommunications': {
                if (!isAdmin) throw new Error("Admin access required.");
                // Fetch latest interaction logs from across the platform
                const snap = await db.collectionGroup('communications').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getAudienceTasks': {
                if (!isAdmin) throw new Error("Admin access required.");
                const snap = await db.collectionGroup('tasks').orderBy('createdAt', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'searchRegistry': {
                if (!isAdmin) throw new Error("Admin access required.");
                const { type, term, limit = 1000 } = payload;
                const leadsSnap = await db.collection('leads').limit(limit).get();
                const partnersSnap = await db.collection('partners').limit(limit).get();
                const allRecords = [
                    ...leadsSnap.docs.map(d => ({ id: d.id, source: 'Lead', ...d.data() })),
                    ...partnersSnap.docs.map(d => ({ id: d.id, source: 'Partner', ...d.data() }))
                ];
                const results = allRecords.filter(r => {
                    const matchesType = !type || type === 'all' || r.type === type;
                    const matchesTerm = !term || (r.companyName || '').toLowerCase().includes(term.toLowerCase());
                    return matchesType && matchesTerm;
                });
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getMembers': {
                if (!isAdmin) throw new Error("Admin access required.");
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').get();
                const members = await Promise.all(snap.docs.map(async (doc) => {
                    const data = doc.data();
                    const ownerSnap = await db.collection('users').doc(data.ownerId).get();
                    const ownerData = ownerSnap.data();
                    return {
                        id: doc.id,
                        ...serializeTimestamps(data),
                        firstName: ownerData?.firstName || 'Unknown',
                        lastName: ownerData?.lastName || '',
                        email: ownerData?.email || 'N/A'
                    };
                }));
                return NextResponse.json({ success: true, data: members });
            }

            case 'getLeads': {
                if (!isAdmin) throw new Error("Admin access required.");
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'savePartner': {
                if (!isAdmin) throw new Error("Admin access required.");
                const { partner, collection: targetColl = 'partners' } = payload;
                const id = partner.id || db.collection(targetColl).doc().id;
                const ref = db.collection(targetColl).doc(id);
                await ref.set({ ...partner, id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'logCommunication': {
                if (!isAdmin) throw new Error("Admin access required.");
                const { partnerId, subject, notes, collection: providedColl } = payload;
                const targetColl = providedColl || 'partners';
                const parentRef = db.collection(targetColl).doc(partnerId);
                const logRef = parentRef.collection('communications').doc();
                await logRef.set({ 
                    id: logRef.id, 
                    type: payload.type || 'Email', 
                    subject, 
                    notes, 
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

            case 'getPlatformStaff': {
                if (!isAdmin) throw new Error("Admin access required.");
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map((d: any) => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getAuditLogs': {
                if (!isAdmin) throw new Error("Admin access required.");
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map((d: any) => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            default: return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
