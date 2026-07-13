
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import { enrichPartner } from '@/ai/flows/enrich-partner-flow';

export const dynamic = 'force-dynamic';

/**
 * UTILITY: TIMESTAMP SERIALIZATION
 * Ensures Firestore objects are JSON-serializable for the frontend.
 */
function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    if (docData instanceof Timestamp) return docData.toDate().toISOString();
    if (Array.isArray(docData)) return docData.map(serializeTimestamps);
    if (typeof docData === 'object' && docData !== null) {
        const serialized: { [key: string]: any } = {};
        for (const key in docData) {
            serialized[key] = serializeTimestamps(docData[key]);
        }
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
        const { action, payload } = body;

        switch (action) {
            case 'dispatchEngagement': {
                const { partnerId, email, subject, html, collection: colOverride } = payload;
                const colName = colOverride || 'partners';
                const partnerRef = db.collection(colName).doc(partnerId);

                const cleanSubject = subject.replace('Logistics Flow: ', '').split('(')[0].trim();

                const sgKey = process.env.SENDGRID_API_KEY;
                if (sgKey) {
                    try {
                        const sgMail = require('@sendgrid/mail');
                        sgMail.setApiKey(sgKey);
                        await sgMail.send({
                            to: email,
                            from: 'Michael <michael@logisticsflow.co.za>',
                            subject: subject,
                            html: html,
                        });
                    } catch (e) { console.error("SendGrid failed", e); }
                }

                const logRef = partnerRef.collection('communications').doc();
                await logRef.set({
                    id: logRef.id,
                    type: 'Automated Dispatch',
                    subject: cleanSubject,
                    notes: `System outreach sent to ${email}.`,
                    timestamp: FieldValue.serverTimestamp()
                });

                await partnerRef.update({
                    status: 'contacted',
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: cleanSubject,
                    updatedAt: FieldValue.serverTimestamp()
                });

                return NextResponse.json({ success: true });
            }

            case 'logCommunication': {
                const { partnerId, collection: colOverride, type, subject, notes } = payload;
                const colName = colOverride || 'partners';
                const partnerRef = db.collection(colName).doc(partnerId);

                const logRef = partnerRef.collection('communications').doc();
                await logRef.set({
                    id: logRef.id,
                    type: type || 'Note',
                    subject: subject || 'General Interaction',
                    notes: notes || '',
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

            case 'autoEnrichRecord': {
                const { id, type: targetType } = payload;
                const colName = (targetType === 'lead' || !targetType) ? 'leads' : 'partners';
                const docRef = db.collection(colName).doc(id);
                const docSnap = await docRef.get();
                if (!docSnap.exists) throw new Error("Record not found.");
                
                const current = docSnap.data()!;
                const companyName = current.companyName || current.company_name || '';
                
                const enrichment = await enrichPartner({ companyName });
                
                await docRef.set({ 
                    ...enrichment, 
                    status: 'contacted',
                    lastOutreachSubject: 'Forensic Bridge',
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    enhancementMethod: 'Forensic Bridge',
                    lastEnrichedAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp() 
                }, { merge: true });

                const logRef = docRef.collection('communications').doc();
                await logRef.set({
                    id: logRef.id,
                    subject: 'Forensic Research (Auto-Bridge)',
                    type: 'System',
                    notes: 'Automated gap-analysis completed via Forensic Bridge.',
                    timestamp: FieldValue.serverTimestamp()
                });
                
                return NextResponse.json({ success: true, data: enrichment });
            }

            case 'logForensicInitiated': {
                const { partnerId, isLead } = payload;
                const colName = isLead ? 'leads' : 'partners';
                const logRef = db.collection(colName).doc(partnerId).collection('communications').doc();
                await logRef.set({
                    id: logRef.id,
                    subject: 'Forensic Research Initiated',
                    type: 'System',
                    notes: 'AI research session launched to bridge data gaps.',
                    timestamp: FieldValue.serverTimestamp()
                });
                await db.collection(colName).doc(partnerId).update({ 
                    status: 'contacted', 
                    lastOutreachSubject: 'Research Initiated',
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp() 
                });
                return NextResponse.json({ success: true });
            }

            case 'bulkLogForensicInitiated': {
                const { leadIds, type: targetType } = payload;
                const colName = targetType === 'lead' ? 'leads' : 'partners';
                const batch = db.batch();
                for (const id of leadIds) {
                    const logRef = db.collection(colName).doc(id).collection('communications').doc();
                    batch.set(logRef, { id: logRef.id, subject: 'Forensic Batch Research', type: 'System', notes: 'Included in automated forensic batch.', timestamp: FieldValue.serverTimestamp() });
                    batch.update(db.collection(colName).doc(id), { 
                        status: 'contacted', 
                        lastOutreachSubject: 'Batch Research',
                        lastOutreachAt: FieldValue.serverTimestamp(),
                        updatedAt: FieldValue.serverTimestamp() 
                    });
                }
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'bulkSavePartners': {
                const { partners: partnerList, type: targetType } = payload;
                const batch = db.batch();
                let collectionName = (targetType === 'lead' || !targetType) ? 'leads' : 'partners';
                for (const p of partnerList) {
                    const id = p.record_id || p.id || db.collection(collectionName).doc().id;
                    const hasTechnicalData = !!p.minedServiceWording || !!p.marketingManager || !!p.ceo;
                    
                    batch.set(db.collection(collectionName).doc(id), { 
                        ...p, 
                        id, 
                        type: targetType || p.type || 'supplier', 
                        status: hasTechnicalData ? 'contacted' : (p.status || 'new'),
                        lastOutreachSubject: hasTechnicalData ? 'Gap Analysis' : (p.lastOutreachSubject || null),
                        lastOutreachAt: hasTechnicalData ? FieldValue.serverTimestamp() : (p.lastOutreachAt || null),
                        enhancementMethod: hasTechnicalData ? 'Gap Analysis' : null,
                        lastEnrichedAt: hasTechnicalData ? FieldValue.serverTimestamp() : null,
                        updatedAt: FieldValue.serverTimestamp() 
                    }, { merge: true });
                }
                await batch.commit();
                return NextResponse.json({ success: true, count: partnerList.length });
            }

            case 'savePartner': {
                const { partner, collection: colName = 'partners' } = payload;
                const id = partner.id || db.collection(colName).doc().id;
                const partnerData = {
                    ...partner,
                    id,
                    updatedAt: FieldValue.serverTimestamp()
                };
                await db.collection(colName).doc(id).set(partnerData, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'searchRegistry': {
                const { type, term, outreachFilter, limit = 100 } = payload;
                let collectionName = (type === 'all' || type === 'lead') ? 'leads' : 'partners';
                let q: any = db.collection(collectionName);
                if (collectionName === 'partners' && type !== 'all') q = q.where('type', '==', type);
                const snap = await q.orderBy('updatedAt', 'desc').limit(Math.min(limit, 20000)).get();
                let results = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                if (term) {
                    const lowTerm = term.toLowerCase();
                    results = results.filter((r: any) => (r.companyName || r.company_name || '').toLowerCase().includes(lowTerm) || (r.email || '').toLowerCase().includes(lowTerm));
                }
                if (outreachFilter === 'none') results = results.filter((r: any) => !r.lastOutreachAt);
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getAudienceCommunications': {
                const snap = await db.collectionGroup('communications').orderBy('timestamp', 'desc').limit(200).get();
                const logs = snap.docs.map((d: any) => {
                    const data = d.data();
                    const path = d.ref.path;
                    const partnerName = path.includes('partners/') ? 'Strategic Partner' : 'Registry Lead';
                    return { ...data, id: d.id, partnerName };
                });
                return NextResponse.json({ success: true, data: logs.map(serializeTimestamps) });
            }

            case 'getAudienceTasks': {
                const snap = await db.collectionGroup('tasks').orderBy('createdAt', 'desc').limit(200).get();
                const tasks = snap.docs.map((d: any) => ({ ...d.data(), id: d.id }));
                return NextResponse.json({ success: true, data: tasks.map(serializeTimestamps) });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(1000).get();
                const members = await Promise.all(snap.docs.map(async (docSnap: any) => {
                    const data = docSnap.data();
                    const userSnap = await db.collection('users').doc(data.ownerId || 'system').get();
                    const uData = userSnap.exists ? userSnap.data() : {};
                    return { id: docSnap.id, ...data, firstName: uData?.firstName || 'Member', lastName: uData?.lastName || '', email: uData?.email || 'N/A' };
                }));
                return NextResponse.json({ success: true, data: members.map(serializeTimestamps) });
            }

            case 'approvePayout': {
                const { companyId, payoutId, amount } = payload;
                const companyRef = db.collection('companies').doc(companyId);
                const payoutRef = companyRef.collection('payoutRequests').doc(payoutId);

                await db.runTransaction(async (t) => {
                    t.update(companyRef, {
                        walletBalance: FieldValue.increment(-amount),
                        availableBalance: FieldValue.increment(-amount),
                        updatedAt: FieldValue.serverTimestamp()
                    });
                    t.update(payoutRef, { status: 'approved', updatedAt: FieldValue.serverTimestamp() });
                });
                return NextResponse.json({ success: true });
            }

            case 'rejectPayout': {
                const { companyId, payoutId } = payload;
                await db.collection('companies').doc(companyId).collection('payoutRequests').doc(payoutId).update({
                    status: 'rejected',
                    updatedAt: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'deletePartner': {
                const { partnerId, source } = payload;
                const colName = source === 'Lead' ? 'leads' : 'partners';
                await db.collection(colName).doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }

            case 'deleteLeads': {
                const { leadIds } = payload;
                const batch = db.batch();
                leadIds.forEach((id: string) => batch.delete(db.collection('leads').doc(id)));
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            default: return NextResponse.json({ success: false, error: `Action "${action}" not supported.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Failure:`, error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
