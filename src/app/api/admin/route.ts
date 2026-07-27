
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
            case 'getPipelineQueue': {
                // Find leads/partners where nextStepDueAt < Now AND status is 'contacted' or 'new'
                const now = new Date();
                const leadsSnap = await db.collection('leads')
                    .where('nextStepDueAt', '<=', now)
                    .where('status', 'in', ['new', 'contacted'])
                    .limit(50)
                    .get();
                
                const partnersSnap = await db.collection('partners')
                    .where('nextStepDueAt', '<=', now)
                    .where('status', 'in', ['new', 'contacted'])
                    .limit(50)
                    .get();

                const results = [
                    ...leadsSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'lead' })),
                    ...partnersSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'partner' }))
                ];

                return NextResponse.json({ success: true, data: serializeData(results) });
            }

            case 'dispatchPipelineStep': {
                const { leadId, stepIndex, email, subject, html, collection: colOverride } = payload;
                const colName = colOverride || 'leads';
                const docRef = db.collection(colName).doc(leadId);
                
                // 1. Send via SendGrid
                if (process.env.SENDGRID_API_KEY) {
                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                    await sgMail.send({
                        to: email,
                        from: 'michael@logisticsflow.co.za',
                        subject,
                        html
                    });
                }

                // 2. Update record state
                const policySnap = await db.doc('configuration/engagementPolicy').get();
                const policy = policySnap.exists ? policySnap.data()?.steps : [];
                const nextStep = policy[stepIndex];
                
                const update: any = {
                    currentPipelineStep: stepIndex,
                    lastOutreachSubject: subject,
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                };

                if (nextStep) {
                    const dueAt = new Date();
                    dueAt.setHours(dueAt.getHours() + (nextStep.waitHours || 48));
                    update.nextStepDueAt = Timestamp.fromDate(dueAt);
                } else {
                    update.pipelineStatus = 'completed';
                    update.nextStepDueAt = null;
                }

                await docRef.update(update);
                
                // 3. Log interaction
                await docRef.collection('communications').add({
                    type: 'Email (Auto-Pilot)',
                    subject,
                    timestamp: FieldValue.serverTimestamp(),
                    notes: `Automated dispatch for Step ${stepIndex}.`
                });

                return NextResponse.json({ success: true });
            }

            case 'getPartnersByType': {
                const { type: queryType, limit: searchLimit = 100 } = payload;
                const collectionName = (queryType === 'lead') ? 'leads' : 'partners';
                let q: any = db.collection(collectionName);
                if (collectionName === 'partners' && queryType !== 'all') {
                    q = q.where('type', '==', queryType);
                }
                const snap = await q.orderBy('updatedAt', 'desc').limit(searchLimit).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))) });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('updatedAt', 'desc').limit(500).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }))) });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(200).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }))) });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').orderBy('firstName', 'asc').get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }))) });
            }

            case 'savePartner': {
                const { partner: pData, collection: colNameOverride } = payload;
                if (!pData) throw new Error("Partner data missing.");
                const colName = colNameOverride || (pData.source === 'Lead' || !pData.type || pData.type === 'lead' ? 'leads' : 'partners');
                const id = pData.id || db.collection(colName).doc().id;
                const ref = db.collection(colName).doc(id);
                
                await ref.set({
                    ...pData,
                    id,
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
                
                return NextResponse.json({ success: true, id });
            }

            case 'bulkSavePartners': {
                const { partners, type: partnerType } = payload;
                if (!Array.isArray(partners)) throw new Error("Invalid partners array.");
                const colName = partnerType === 'lead' ? 'leads' : 'partners';
                const batch = db.batch();
                
                partners.forEach((p: any) => {
                    const id = p.record_id || p.id || db.collection(colName).doc().id;
                    const ref = db.collection(colName).doc(id);
                    batch.set(ref, {
                        ...p,
                        id,
                        type: partnerType,
                        updatedAt: FieldValue.serverTimestamp()
                    }, { merge: true });
                });
                
                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            default: 
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message || "Server error." }, { status: 500 });
    }
}
