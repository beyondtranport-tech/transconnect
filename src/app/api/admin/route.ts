
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import sgMail from '@sendgrid/mail';

export const dynamic = 'force-dynamic';

function serializeData(docData: any): any {
    if (docData === null || docData === undefined) return docData;
    if (docData instanceof Timestamp) return docData.toDate().toISOString();
    if (docData && typeof docData === 'object' && docData.constructor?.name === 'FieldValue') return new Date().toISOString(); 
    if (Array.isArray(docData)) return docData.map(serializeData);
    if (typeof docData === 'object') {
        const serialized: { [key: string]: any } = {};
        for (const key in docData) serialized[key] = serializeData(docData[key]);
        return serialized;
    }
    return docData;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
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
        const action = (body.action || '').trim();
        const payload = body.payload || {};

        switch (action) {
            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(200).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }))) });
            }

            case 'getShops': {
                const snap = await db.collectionGroup('shops').get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }))) });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').orderBy('firstName', 'asc').get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }))) });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }))) });
            }

            case 'savePartner': {
                const { partner, collection: colName = 'partners' } = payload;
                const id = partner.id || db.collection(colName).doc().id;
                await db.collection(colName).doc(id).set({ ...partner, id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'deletePartner': {
                const { partnerId, source } = payload;
                const col = source === 'Lead' ? 'leads' : 'partners';
                await db.collection(col).doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const batch = db.batch();
                partners.forEach((p: any) => {
                    const id = p.record_id || p.id || db.collection('partners').doc().id;
                    const col = (type === 'lead' || p.source === 'Lead') ? 'leads' : 'partners';
                    batch.set(db.collection(col).doc(id), {
                        ...p,
                        id,
                        type: type || p.type || 'partner',
                        updatedAt: FieldValue.serverTimestamp()
                    }, { merge: true });
                });
                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'logCommunication': {
                const { partnerId, type: commType, subject, notes, collection: colOverride } = payload;
                const colName = colOverride || 'partners';
                const logRef = db.collection(colName).doc(partnerId).collection('communications').doc();
                await logRef.set({
                    id: logRef.id,
                    type: commType,
                    subject,
                    notes,
                    timestamp: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'getIncentives': {
                const snap = await db.collection('configuration/communityIncentives/active').orderBy('createdAt', 'desc').get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }))) });
            }

            case 'getAudienceCommunications': {
                const snap = await db.collectionGroup('communications').orderBy('timestamp', 'desc').limit(200).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }))) });
            }

            case 'getAudienceTasks': {
                const snap = await db.collectionGroup('tasks').orderBy('createdAt', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }))) });
            }

            case 'getBrokerAgreements': {
                const snap = await db.collectionGroup('brokerAgreements').get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, path: d.ref.path, ...d.data() }))) });
            }

            case 'dispatchEngagement': {
                const { partnerId, email, subject, html, collection: colOverride } = payload;
                if (!email || !emailRegex.test(email.trim())) throw new Error("Invalid email.");
                const apiKey = process.env.SENDGRID_API_KEY;
                if (!apiKey) throw new Error("SendGrid Key Missing.");
                sgMail.setApiKey(apiKey);
                await sgMail.send({ 
                    to: email.trim(), 
                    from: 'Logistics Flow <noreply@logisticsflow.co.za>', 
                    subject, 
                    html 
                });
                const colName = colOverride || 'partners';
                const partnerRef = db.collection(colName).doc(partnerId);
                const logRef = partnerRef.collection('communications').doc();
                await logRef.set({ 
                    id: logRef.id, 
                    type: 'Email', 
                    subject, 
                    notes: 'Sent via SendGrid API.', 
                    timestamp: FieldValue.serverTimestamp() 
                });
                await partnerRef.update({ 
                    status: 'contacted', 
                    lastOutreachSubject: subject, 
                    lastOutreachAt: FieldValue.serverTimestamp(), 
                    updatedAt: FieldValue.serverTimestamp() 
                });
                return NextResponse.json({ success: true });
            }

            case 'searchRegistry': {
                const { type: queryType, term, limit = 100 } = payload;
                const collectionName = (queryType === 'all' || queryType === 'lead') ? 'leads' : 'partners';
                let q: any = db.collection(collectionName);
                if (collectionName === 'partners' && queryType !== 'all') q = q.where('type', '==', queryType);
                const snap = await q.orderBy('updatedAt', 'desc').limit(Math.min(limit, 20000)).get();
                let results = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }));
                if (term) {
                    const lowTerm = term.toLowerCase();
                    results = results.filter((r: any) => (r.companyName || '').toLowerCase().includes(lowTerm) || (r.email || '').toLowerCase().includes(lowTerm));
                }
                return NextResponse.json({ success: true, data: serializeData(results) });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('updatedAt', 'desc').get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }))) });
            }

            default: 
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message || "Server error." }, { status: 500 });
    }
}
