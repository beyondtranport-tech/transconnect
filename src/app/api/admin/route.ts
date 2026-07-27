
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
            case 'getPipelineQueue': {
                const now = new Date();
                const snap = await db.collection('leads')
                    .where('pipelineStatus', '==', 'running')
                    .where('nextStepDueAt', '<=', Timestamp.fromDate(now))
                    .limit(20)
                    .get();
                
                return NextResponse.json({ 
                    success: true, 
                    data: serializeData(snap.docs.map(d => ({ id: d.id, ...d.data() }))) 
                });
            }

            case 'dispatchPipelineStep': {
                const { leadId, stepIndex, email, subject, html } = payload;
                if (!email) throw new Error("Email required for dispatch.");
                
                const apiKey = process.env.SENDGRID_API_KEY;
                if (!apiKey) throw new Error("SendGrid Key Missing.");
                sgMail.setApiKey(apiKey);
                
                await sgMail.send({ 
                    to: email.trim(), 
                    from: 'Logistics Flow <noreply@logisticsflow.co.za>', 
                    subject, 
                    html 
                });

                const leadRef = db.collection('leads').doc(leadId);
                const policySnap = await db.doc('configuration/engagementPolicy').get();
                const policy = policySnap.data()?.steps || [];
                const nextStep = policy[stepIndex + 1];

                const update: any = {
                    lastOutreachSubject: subject,
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    currentPipelineStep: stepIndex,
                    updatedAt: FieldValue.serverTimestamp()
                };

                if (nextStep) {
                    const dueDate = new Date();
                    dueDate.setHours(dueDate.getHours() + (nextStep.waitHours || 72));
                    update.nextStepDueAt = Timestamp.fromDate(dueDate);
                } else {
                    update.pipelineStatus = 'completed';
                    update.nextStepDueAt = null;
                }

                await leadRef.update(update);
                await leadRef.collection('communications').add({
                    type: 'Email',
                    subject,
                    notes: `Automated Pipeline Step ${stepIndex}.`,
                    timestamp: FieldValue.serverTimestamp()
                });

                return NextResponse.json({ success: true });
            }

            case 'savePartner': {
                const { partner: pData, collection: colNameOverride } = payload;
                if (!pData) throw new Error("Partner data is required.");
                const colName = colNameOverride || (pData.source === 'Lead' || !pData.type || pData.type === 'lead' ? 'leads' : 'partners');
                const id = pData.id || db.collection(colName).doc().id;
                const ref = db.collection(colName).doc(id);
                
                const cleanData: any = {};
                Object.keys(pData).forEach(key => {
                    if (pData[key] !== undefined) cleanData[key] = pData[key];
                });

                await ref.set({
                    ...cleanData,
                    id,
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
                
                return NextResponse.json({ success: true, id });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(500).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }))) });
            }

            case 'logCommunication': {
                const { partnerId, type: commType, subject, notes, collection: colOverride } = payload;
                const colName = colOverride || 'partners';
                const parentRef = db.collection(colName).doc(partnerId);
                const logRef = parentRef.collection('communications').doc();
                
                const batch = db.batch();
                
                batch.set(logRef, {
                    id: logRef.id,
                    type: commType,
                    subject,
                    notes: notes || '',
                    timestamp: FieldValue.serverTimestamp()
                });

                batch.update(parentRef, {
                    status: 'contacted',
                    lastOutreachSubject: subject,
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                });

                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'searchRegistry': {
                const { type: queryType, term, limit: searchLimit = 100 } = payload;
                const collectionName = (queryType === 'all' || queryType === 'lead') ? 'leads' : 'partners';
                let q: any = db.collection(collectionName);
                if (collectionName === 'partners' && queryType !== 'all') q = q.where('type', '==', queryType);
                
                const finalLimit = Math.min(searchLimit, 1000);
                const snap = await q.orderBy('updatedAt', 'desc').limit(finalLimit).get();
                
                let results = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }));
                if (term) {
                    const lowTerm = term.toLowerCase();
                    results = results.filter((r: any) => 
                        (r.companyName || '').toLowerCase().includes(lowTerm) || 
                        (r.email || '').toLowerCase().includes(lowTerm)
                    );
                }
                return NextResponse.json({ success: true, data: serializeData(results) });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('updatedAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }))) });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').orderBy('firstName', 'asc').get();
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
