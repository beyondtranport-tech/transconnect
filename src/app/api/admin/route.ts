
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import { enrichPartner } from '@/ai/flows/enrich-partner-flow';
import sgMail from '@sendgrid/mail';

export const dynamic = 'force-dynamic';

/**
 * Resilient Serialization Utility
 * Recursively sanitizes Firestore objects to ensure clean JSON transmission.
 */
function serializeTimestamps(docData: any): any {
    if (docData === null || docData === undefined) return docData;
    
    if (docData instanceof Timestamp) {
        return docData.toDate().toISOString();
    }
    
    if (docData && typeof docData === 'object' && docData.constructor?.name === 'FieldValue') {
        return new Date().toISOString(); 
    }

    if (Array.isArray(docData)) {
        return docData.map(serializeTimestamps);
    }
    
    if (typeof docData === 'object') {
        const serialized: { [key: string]: any } = {};
        for (const key in docData) {
            serialized[key] = serializeTimestamps(docData[key]);
        }
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
            case 'savePartner': {
                const { partner, collection: colName = 'partners' } = payload;
                if (!partner) throw new Error("Payload error: Partner data required.");

                const id = partner.id || db.collection(colName).doc().id;
                const partnerData = {
                    ...partner,
                    id,
                    updatedAt: FieldValue.serverTimestamp()
                };

                await db.collection(colName).doc(id).set(partnerData, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                if (!Array.isArray(partners)) throw new Error("Partners array expected.");
                
                const colName = (type === 'lead' || !type) ? 'leads' : 'partners';
                const batch = db.batch();
                
                partners.forEach((p: any) => {
                    const id = p.record_id || p.id || db.collection(colName).doc().id;
                    const ref = db.collection(colName).doc(id);
                    batch.set(ref, {
                        ...p,
                        id,
                        type: type || p.type || 'lead',
                        status: p.status || 'new',
                        updatedAt: FieldValue.serverTimestamp()
                    }, { merge: true });
                });
                
                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'dispatchEngagement': {
                const { partnerId, email, subject, html, collection: colOverride } = payload;
                
                if (!email || !emailRegex.test(email)) {
                    throw new Error("Dispatch Aborted: Recipient address is missing or invalid.");
                }
                if (!subject || !html) throw new Error("Missing mandatory content.");

                const apiKey = process.env.SENDGRID_API_KEY;
                if (!apiKey) throw new Error("Transactional Email API not configured (SENDGRID_API_KEY missing).");

                sgMail.setApiKey(apiKey);
                const msg = {
                    to: email,
                    from: 'Logistics Flow <noreply@logisticsflow.co.za>',
                    subject: subject,
                    html: html,
                    trackingSettings: {
                        clickTracking: { enable: true },
                        openTracking: { enable: true }
                    }
                };

                try {
                    await sgMail.send(msg);
                } catch (sgError: any) {
                    const detailedError = sgError.response?.body?.errors?.[0]?.message || sgError.message;
                    throw new Error(`SendGrid Error: ${detailedError}`);
                }

                const colName = colOverride || 'partners';
                const partnerRef = db.collection(colName).doc(partnerId);

                const logRef = partnerRef.collection('communications').doc();
                await logRef.set({
                    id: logRef.id,
                    type: 'Email',
                    subject: subject,
                    notes: 'Sent via Automated Transactional Dispatch.',
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
                const { id, type: recType } = payload;
                const colName = recType === 'lead' ? 'leads' : 'partners';
                const ref = db.collection(colName).doc(id);
                const snap = await ref.get();
                if (!snap.exists) throw new Error("Record not found.");
                
                const data = snap.data()!;
                const enrichment = await enrichPartner({ companyName: data.companyName || data.firstName });
                
                await ref.update({
                    ...enrichment,
                    lastEnrichedAt: FieldValue.serverTimestamp(),
                    enhancementMethod: 'Forensic V4',
                    status: 'qualified',
                    updatedAt: FieldValue.serverTimestamp()
                });
                
                return NextResponse.json({ success: true, data: enrichment });
            }

            case 'searchRegistry': {
                const { type: queryType, term, limit = 100 } = payload;
                const collectionName = (queryType === 'all' || queryType === 'lead') ? 'leads' : 'partners';
                let q: any = db.collection(collectionName);
                
                if (collectionName === 'partners' && queryType !== 'all') {
                    q = q.where('type', '==', queryType);
                }

                const snap = await q.orderBy('updatedAt', 'desc').limit(Math.min(limit, 20000)).get();
                let results = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

                if (term) {
                    const lowTerm = term.toLowerCase();
                    results = results.filter((r: any) => 
                        (r.companyName || '').toLowerCase().includes(lowTerm) || 
                        (r.email || '').toLowerCase().includes(lowTerm) ||
                        (r.industrial_tags || []).some((t: string) => t.toLowerCase().includes(lowTerm))
                    );
                }

                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('updatedAt', 'desc').get();
                const members = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                return NextResponse.json({ success: true, data: members.map(serializeTimestamps) });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').get();
                const leads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                return NextResponse.json({ success: true, data: leads.map(serializeTimestamps) });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
            }

            case 'deletePartner': {
                const { partnerId, source } = payload;
                const colName = source === 'Lead' ? 'leads' : 'partners';
                await db.collection(colName).doc(partnerId).delete();
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
                    subject: subject || 'Interaction',
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

            default: 
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        const errorMessage = error.response?.body?.errors?.[0]?.message || error.message || "An unknown server error occurred.";
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
