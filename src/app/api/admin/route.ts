import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import { enrichPartner } from '@/ai/flows/enrich-partner-flow';
import sgMail from '@sendgrid/mail';

export const dynamic = 'force-dynamic';

/**
 * Resilient Serialization Utility
 * Sanitizes Firestore objects to ensure clean JSON transmission.
 */
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
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map(d => ({ id: d.id, ...d.data() }))) });
            }

            case 'savePartner': {
                const { partner, collection: colName = 'partners' } = payload;
                const id = partner.id || db.collection(colName).doc().id;
                await db.collection(colName).doc(id).set({ ...partner, id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'logForensicInitiated': {
                const { partnerId, isLead } = payload;
                const colName = isLead ? 'leads' : 'partners';
                const partnerRef = db.collection(colName).doc(partnerId);
                const logRef = partnerRef.collection('communications').doc();
                await logRef.set({
                    id: logRef.id,
                    type: 'System',
                    subject: 'FORENSIC RESEARCH INITIATED',
                    notes: 'Forensic gap-analysis command generated for AI Studio.',
                    timestamp: FieldValue.serverTimestamp()
                });
                await partnerRef.update({ status: 'contacted', updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }

            case 'bulkLogForensicInitiated': {
                const { leadIds, type: recType } = payload;
                const colName = (recType === 'lead' || !recType) ? 'leads' : 'partners';
                const batch = db.batch();
                leadIds.forEach((id: string) => {
                    const partnerRef = db.collection(colName).doc(id);
                    const logRef = partnerRef.collection('communications').doc();
                    batch.set(logRef, {
                        id: logRef.id,
                        type: 'System',
                        subject: 'BULK FORENSIC INITIATED',
                        notes: 'Record included in V4 Batch Research command.',
                        timestamp: FieldValue.serverTimestamp()
                    });
                    batch.update(partnerRef, { status: 'contacted', updatedAt: FieldValue.serverTimestamp() });
                });
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                const snap = await db.collection('partners').where('type', '==', type).get();
                const leadsSnap = await db.collection('leads').where('role', '==', type.charAt(0).toUpperCase() + type.slice(1)).get();
                const combined = [
                    ...snap.docs.map(d => ({ ...d.data(), source: 'Member' })),
                    ...leadsSnap.docs.map(d => ({ ...d.data(), source: 'Lead' }))
                ];
                return NextResponse.json({ success: true, data: serializeData(combined) });
            }

            case 'invitePartner': {
                const { partnerId } = payload;
                await db.collection('partners').doc(partnerId).update({ 
                    invitationStatus: 'invited', 
                    status: 'invited',
                    updatedAt: FieldValue.serverTimestamp() 
                });
                return NextResponse.json({ success: true });
            }

            case 'getStaff':
            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
            }

            case 'deleteLeads': {
                const { leadIds } = payload;
                const batch = db.batch();
                leadIds.forEach((id: string) => batch.delete(db.collection('leads').doc(id)));
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'findDuplicateLeads': {
                const snap = await db.collection('leads').get();
                const leads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                const groups: any = {};
                leads.forEach((l: any) => {
                    const key = (l.companyName || l.email || l.id).toLowerCase().trim();
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(l);
                });
                const duplicates = Object.values(groups).filter((g: any) => g.length > 1);
                return NextResponse.json({ success: true, data: serializeData(duplicates) });
            }

            case 'dispatchEngagement': {
                const { partnerId, email, subject, html, collection: colOverride } = payload;
                if (!email || !emailRegex.test(email.trim())) throw new Error("Invalid email.");
                const apiKey = process.env.SENDGRID_API_KEY;
                if (!apiKey) throw new Error("SendGrid Key Missing.");
                sgMail.setApiKey(apiKey);
                await sgMail.send({ to: email.trim(), from: 'Logistics Flow <noreply@logisticsflow.co.za>', subject, html });
                const colName = colOverride || 'partners';
                const partnerRef = db.collection(colName).doc(partnerId);
                const logRef = partnerRef.collection('communications').doc();
                await logRef.set({ id: logRef.id, type: 'Email', subject, notes: 'Sent via SendGrid API.', timestamp: FieldValue.serverTimestamp() });
                await partnerRef.update({ status: 'contacted', lastOutreachSubject: subject, lastOutreachAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }

            case 'searchRegistry': {
                const { type: queryType, term, limit = 100 } = payload;
                const collectionName = (queryType === 'all' || queryType === 'lead') ? 'leads' : 'partners';
                let q: any = db.collection(collectionName);
                if (collectionName === 'partners' && queryType !== 'all') q = q.where('type', '==', queryType);
                const snap = await q.orderBy('updatedAt', 'desc').limit(Math.min(limit, 20000)).get();
                let results = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                if (term) {
                    const lowTerm = term.toLowerCase();
                    results = results.filter((r: any) => (r.companyName || '').toLowerCase().includes(lowTerm) || (r.email || '').toLowerCase().includes(lowTerm));
                }
                return NextResponse.json({ success: true, data: serializeData(results) });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('updatedAt', 'desc').get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map(d => ({ id: d.id, ...d.data() }))) });
            }

            case 'logCommunication': {
                const { partnerId, collection: colOverride, type, subject, notes } = payload;
                const colName = colOverride || 'partners';
                const partnerRef = db.collection(colName).doc(partnerId);
                const logRef = partnerRef.collection('communications').doc();
                await logRef.set({ id: logRef.id, type: type || 'Note', subject, notes: notes || '', timestamp: FieldValue.serverTimestamp() });
                await partnerRef.update({ status: 'contacted', lastOutreachSubject: subject, lastOutreachAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }

            default: 
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message || "Server error." }, { status: 500 });
    }
}
