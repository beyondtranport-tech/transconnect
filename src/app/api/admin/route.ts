
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import { enrichPartner } from '@/ai/flows/enrich-partner-flow';

export const dynamic = 'force-dynamic';

/**
 * UTILITY: TIMESTAMP SERIALIZATION
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
    let currentAction = 'initialization';
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
        currentAction = action;

        switch (action) {
            case 'dispatchEngagement': {
                const { partnerId, email, subject, html, audience } = payload;
                
                // 1. Send via SendGrid if key is present
                const sgKey = process.env.SENDGRID_API_KEY;
                if (sgKey) {
                    const sgMail = require('@sendgrid/mail');
                    sgMail.setApiKey(sgKey);
                    const msg = {
                        to: email,
                        from: 'Michael <michael@logisticsflow.co.za>',
                        subject: subject,
                        html: html,
                    };
                    await sgMail.send(msg);
                }

                // 2. Log in sub-collection
                const colName = (audience === 'suppliers' || audience === 'transporters' || audience === 'partners' || audience === 'isa' || audience === 'investors' || audience === 'developers' || audience === 'associates' || audience === 'drivers') ? 'partners' : 'leads';
                const partnerRef = db.collection(colName).doc(partnerId);
                const logRef = partnerRef.collection('communications').doc();
                
                await logRef.set({
                    id: logRef.id,
                    type: 'Automated Dispatch',
                    subject: subject,
                    notes: `System-generated outreach sent to ${email}.`,
                    timestamp: FieldValue.serverTimestamp()
                });

                // 3. Update parent record
                await partnerRef.update({
                    status: 'contacted',
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    updatedAt: FieldValue.serverTimestamp()
                });

                return NextResponse.json({ success: true });
            }

            case 'findDuplicateLeads': {
                const snap = await db.collection('leads').get();
                const allLeads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                const groups: any[][] = [];
                const processed = new Set();

                for (const lead of allLeads) {
                    if (processed.has(lead.id)) continue;
                    const duplicates = allLeads.filter(l => 
                        l.id !== lead.id && 
                        (l.companyName?.toLowerCase() === (lead as any).companyName?.toLowerCase() || 
                         (l.email && l.email.toLowerCase() === (lead as any).email?.toLowerCase()))
                    );
                    if (duplicates.length > 0) {
                        const group = [lead, ...duplicates];
                        groups.push(group);
                        group.forEach(l => processed.add(l.id));
                    }
                }
                return NextResponse.json({ success: true, data: serializeTimestamps(groups) });
            }

            case 'deleteLeads': {
                const { leadIds } = payload;
                const batch = db.batch();
                leadIds.forEach((id: string) => batch.delete(db.collection('leads').doc(id)));
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'inviteLead': {
                const { leadId } = payload;
                await db.collection('leads').doc(leadId).update({
                    status: 'invited',
                    updatedAt: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true, message: "Lead status updated to 'invited'." });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                const staff = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                return NextResponse.json({ success: true, data: staff.map(serializeTimestamps) });
            }

            case 'savePlatformStaff': {
                const { staff } = payload;
                const ref = staff.id ? db.collection('platformStaff').doc(staff.id) : db.collection('platformStaff').doc();
                await ref.set({
                    ...staff,
                    id: ref.id,
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            case 'deletePlatformStaff': {
                const { staffId } = payload;
                await db.collection('platformStaff').doc(staffId).delete();
                return NextResponse.json({ success: true });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(1000).get();
                const members = await Promise.all(snap.docs.map(async (docSnap: any) => {
                    const data = docSnap.data();
                    const userSnap = await db.collection('users').doc(data.ownerId || 'system').get();
                    const uData = userSnap.exists ? userSnap.data() : {};
                    return { 
                        id: docSnap.id, 
                        ...data, 
                        firstName: uData?.firstName || 'Member', 
                        lastName: uData?.lastName || '', 
                        email: uData?.email || 'N/A' 
                    };
                }));
                return NextResponse.json({ success: true, data: members.map(serializeTimestamps) });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(1000).get();
                const leads = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                return NextResponse.json({ success: true, data: leads.map(serializeTimestamps) });
            }

            case 'getAudienceCommunications': {
                const snap = await db.collectionGroup('communications')
                    .orderBy('timestamp', 'desc')
                    .limit(200)
                    .get();
                
                const results = snap.docs.map((d: any) => {
                    const data = d.data();
                    const pathParts = d.ref.path.split('/');
                    const partnerId = pathParts[1];
                    const collName = pathParts[0];
                    return { id: d.id, partnerId, partnerCollection: collName, ...data };
                });

                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
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
                    batch.set(logRef, {
                        id: logRef.id,
                        subject: 'Forensic Batch Research',
                        type: 'System',
                        notes: 'Record included in automated forensic batch.',
                        timestamp: FieldValue.serverTimestamp()
                    });
                    batch.update(db.collection(colName).doc(id), {
                        status: 'contacted',
                        updatedAt: FieldValue.serverTimestamp()
                    });
                }
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'logCommunication': {
                const { partnerId, collection: colName = 'partners', type, subject, notes } = payload;
                const logRef = db.collection(colName).doc(partnerId).collection('communications').doc();
                await logRef.set({
                    id: logRef.id,
                    type,
                    subject,
                    notes: notes || '',
                    timestamp: FieldValue.serverTimestamp()
                });
                
                await db.collection(colName).doc(partnerId).update({
                    status: 'contacted',
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    updatedAt: FieldValue.serverTimestamp()
                });

                return NextResponse.json({ success: true });
            }

            case 'autoEnrichRecord': {
                const { id, type } = payload;
                const colName = type === 'lead' ? 'leads' : 'partners';
                const docRef = db.collection(colName).doc(id);
                const docSnap = await docRef.get();
                if (!docSnap.exists) throw new Error("Record not found.");

                const data = docSnap.data()!;
                const companyName = data.companyName || data.trading_name || `${data.firstName} ${data.lastName}`;
                
                const enriched = await enrichPartner({ companyName });
                
                const update = {
                    ...enriched,
                    status: 'qualified',
                    updatedAt: FieldValue.serverTimestamp()
                };

                await docRef.set(update, { merge: true });

                const logRef = docRef.collection('communications').doc();
                await logRef.set({
                    id: logRef.id,
                    subject: 'Forensic Bridge Successful',
                    type: 'System',
                    notes: 'AI automatically mapped domain and leadership data.',
                    timestamp: FieldValue.serverTimestamp()
                });

                return NextResponse.json({ success: true, data: serializeTimestamps(update) });
            }

            case 'bulkSavePartners': {
                const { partners: partnerList, type: targetType } = payload;
                const batch = db.batch();
                let collectionName = targetType === 'lead' ? 'leads' : 'partners';
                
                for (const p of partnerList) {
                    const id = p.record_id || p.id || db.collection(collectionName).doc().id;
                    const ref = db.collection(collectionName).doc(id);
                    batch.set(ref, {
                        ...p,
                        id,
                        type: targetType || p.type || 'supplier',
                        updatedAt: FieldValue.serverTimestamp()
                    }, { merge: true });
                }
                await batch.commit();
                return NextResponse.json({ success: true, count: partnerList.length });
            }

            case 'searchRegistry': {
                const { type, term, outreachFilter, limit = 100 } = payload;
                let collectionName = (type === 'all' || type === 'lead') ? 'leads' : 'partners';
                
                let query: any = db.collection(collectionName);
                if (collectionName === 'partners' && type !== 'all') {
                    query = query.where('type', '==', type);
                }

                const snap = await query.orderBy('updatedAt', 'desc').limit(Math.min(limit, 20000)).get();
                let results = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

                if (term) {
                    const lowTerm = term.toLowerCase();
                    results = results.filter((r: any) => 
                        (r.companyName || r.company_name || '').toLowerCase().includes(lowTerm) ||
                        (r.contactPerson || r.contact_person || '').toLowerCase().includes(lowTerm) ||
                        (r.email || r.email_address || '').toLowerCase().includes(lowTerm)
                    );
                }

                if (outreachFilter === 'none') {
                    results = results.filter((r: any) => !r.lastOutreachAt);
                }

                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(500).get();
                const logs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                return NextResponse.json({ success: true, data: logs.map(serializeTimestamps) });
            }

            case 'savePartner': {
                const { partner, collection: colName = 'partners' } = payload;
                const ref = db.collection(colName).doc(partner.id);
                await ref.set({
                    ...partner,
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true });
            }

            case 'deletePartner': {
                const { partnerId, source } = payload;
                const colName = source === 'Lead' ? 'leads' : 'partners';
                await db.collection(colName).doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }

            default: return NextResponse.json({ success: false, error: `Action "${action}" not supported.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Failure [${currentAction}]:`, error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

