
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
                
                if (process.env.SENDGRID_API_KEY && email) {
                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                    await sgMail.send({
                        to: email,
                        from: 'michael@logisticsflow.co.za',
                        subject,
                        html
                    });
                }

                const policySnap = await db.doc('configuration/engagementPolicy').get();
                const policy = policySnap.exists ? policySnap.data()?.steps : [];
                const nextStep = policy[stepIndex];
                
                const update: any = {
                    currentPipelineStep: stepIndex,
                    lastOutreachSubject: subject,
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                    lastOpenedAt: null,
                    lastAccessedAt: null
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
                await docRef.collection('communications').add({
                    type: 'Email (Auto-Pilot)',
                    subject,
                    timestamp: FieldValue.serverTimestamp(),
                    notes: `Automated dispatch for Step ${stepIndex}.`
                });

                return NextResponse.json({ success: true });
            }

            case 'dispatchEngagement': {
                const { partnerId, email, subject, html, collection: colOverride } = payload;
                const colName = colOverride || 'partners';
                const docRef = db.collection(colName).doc(partnerId);

                if (process.env.SENDGRID_API_KEY && email) {
                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                    await sgMail.send({
                        to: email,
                        from: 'michael@logisticsflow.co.za',
                        subject,
                        html
                    });
                }

                await docRef.update({
                    status: 'contacted',
                    lastOutreachSubject: subject,
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                    lastOpenedAt: null,
                    lastAccessedAt: null
                });

                await docRef.collection('communications').add({
                    type: 'Email (Automated)',
                    subject,
                    timestamp: FieldValue.serverTimestamp(),
                    notes: 'Sent via automated server-side dispatch.'
                });

                return NextResponse.json({ success: true });
            }

            case 'logCommunication': {
                const { partnerId, type, subject, notes, collection: colOverride } = payload;
                
                let colName = colOverride;
                if (!colName) {
                    const pSnap = await db.collection('partners').doc(partnerId).get();
                    colName = pSnap.exists ? 'partners' : 'leads';
                }

                const docRef = db.collection(colName).doc(partnerId);
                const batch = db.batch();
                
                const logRef = docRef.collection('communications').doc();
                batch.set(logRef, {
                    type,
                    subject,
                    notes,
                    timestamp: FieldValue.serverTimestamp(),
                    loggedBy: decodedToken.uid
                });

                batch.set(docRef, {
                    status: 'contacted',
                    lastOutreachSubject: subject,
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                    lastOpenedAt: null,
                    lastAccessedAt: null
                }, { merge: true });

                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'logForensicInitiated': {
                const { partnerId, isLead } = payload;
                const colName = isLead ? 'leads' : 'partners';
                const ref = db.collection(colName).doc(partnerId);
                await ref.update({
                    enhancementMethod: 'V13-AI',
                    lastEnrichedAt: FieldValue.serverTimestamp(),
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'bulkLogForensicInitiated': {
                const { leadIds, type } = payload;
                const colName = type === 'lead' ? 'leads' : 'partners';
                const batch = db.batch();
                leadIds.forEach((id: string) => {
                    batch.update(db.collection(colName).doc(id), {
                        enhancementMethod: 'V13-Batch',
                        lastEnrichedAt: FieldValue.serverTimestamp(),
                        status: 'contacted',
                        updatedAt: FieldValue.serverTimestamp()
                    });
                });
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'autoEnrichRecord': {
                const { id, type } = payload;
                const colName = type === 'lead' ? 'leads' : 'partners';
                const docRef = db.collection(colName).doc(id);
                const snap = await docRef.get();
                if (!snap.exists) throw new Error("Record not found");
                const data = snap.data()!;
                const companyName = data.companyName || data.firstName || 'Unknown';

                const { enrichPartner } = await import('@/ai/flows/enrich-partner-flow');
                const result = await enrichPartner({ companyName });

                await docRef.update({
                    ...result,
                    status: 'contacted',
                    enhancementMethod: 'V13-Auto',
                    lastEnrichedAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                });

                return NextResponse.json({ success: true, data: serializeData(result) });
            }

            case 'getPartnersByType': {
                const { type: queryType, limit: searchLimit = 100 } = payload;
                const limitNum = Number(searchLimit);
                const collectionName = (queryType === 'lead') ? 'leads' : 'partners';
                let q: any = db.collection(collectionName);
                if (collectionName === 'partners' && queryType !== 'all') {
                    q = q.where('type', '==', queryType);
                }
                const snap = await q.orderBy('updatedAt', 'desc').limit(limitNum).get();
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

            case 'deleteLeads': {
                const { leadIds } = payload;
                const batch = db.batch();
                leadIds.forEach((id: string) => batch.delete(db.collection('leads').doc(id)));
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'deletePartner': {
                const { partnerId, source } = payload;
                const colName = source === 'Lead' ? 'leads' : 'partners';
                await db.collection(colName).doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }

            case 'getAudienceCommunications': {
                const { type: audType } = payload;
                const snap = await db.collectionGroup('communications')
                    .orderBy('timestamp', 'desc')
                    .limit(200)
                    .get();
                
                const logs = await Promise.all(snap.docs.map(async (doc) => {
                    const data = doc.data();
                    const path = doc.ref.path;
                    const partnerId = path.split('/')[1];
                    const pRef = db.collection(path.startsWith('leads') ? 'leads' : 'partners').doc(partnerId);
                    const pSnap = await pRef.get();
                    const pData = pSnap.data();
                    
                    if (audType && pData?.type !== audType) return null;

                    return {
                        id: doc.id,
                        ...data,
                        partnerName: pData?.companyName || pData?.firstName || 'Unknown',
                        partnerType: pData?.type
                    };
                }));

                return NextResponse.json({ success: true, data: serializeData(logs.filter(l => l !== null)) });
            }

            case 'searchRegistry': {
                const { type: rType, limit: rLimit = 100, term = '' } = payload;
                const normalizedTerm = term.toLowerCase().trim();
                const limitNum = Number(rLimit);
                
                // 1. SCAN PARTNERS
                let pQuery: any = db.collection('partners');
                if (rType !== 'all') {
                    pQuery = pQuery.where('type', '==', rType);
                }
                const pSnap = await pQuery.orderBy('updatedAt', 'desc').limit(limitNum).get();
                const pResults = pSnap.docs.map(d => ({ ...d.data(), id: d.id, source: 'Member' }));

                // 2. SCAN LEADS
                let lQuery: any = db.collection('leads');
                if (rType !== 'all') {
                    const roleMap: Record<string, string> = {
                        'transporter': 'Transporter',
                        'supplier': 'Supplier',
                        'driver': 'Driver',
                        'finance': 'Funder',
                        'associate': 'Associate'
                    };
                    const roleTerm = roleMap[rType] || rType;
                    lQuery = lQuery.where('role', '==', roleTerm);
                }
                const lSnap = await lQuery.orderBy('updatedAt', 'desc').limit(limitNum).get();
                const lResults = lSnap.docs.map(d => ({ ...d.data(), id: d.id, source: 'Lead' }));

                // 3. MERGE & SORT
                let combined = [...pResults, ...lResults];
                if (normalizedTerm) {
                    combined = combined.filter(item => {
                        const name = (item.companyName || item.firstName || '').toLowerCase();
                        const email = (item.email || '').toLowerCase();
                        return name.includes(normalizedTerm) || email.includes(normalizedTerm);
                    });
                }

                combined.sort((a, b) => {
                    const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
                    const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
                    return dateB - dateA;
                });

                return NextResponse.json({ success: true, data: serializeData(combined.slice(0, limitNum)) });
            }

            default: 
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message || "Server error." }, { status: 500 });
    }
}
