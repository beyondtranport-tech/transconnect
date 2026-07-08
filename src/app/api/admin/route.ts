import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import sgMail from '@sendgrid/mail';

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
        for (const key in docData) serialized[key] = serializeTimestamps(docData[key]);
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

            case 'savePartner': {
                const { partner, collection: colName = 'partners' } = payload;
                const ref = partner.id ? db.collection(colName).doc(partner.id) : db.collection(colName).doc();
                await ref.set({
                    ...partner,
                    id: ref.id,
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            case 'deletePartner': {
                const { partnerId, source } = payload;
                const colName = source === 'Lead' ? 'leads' : 'partners';
                await db.collection(colName).doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                let snap;
                if (type === 'lead') {
                    snap = await db.collection('leads').get();
                } else {
                    snap = await db.collection('partners').where('type', '==', type).get();
                }
                const partners = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                return NextResponse.json({ success: true, data: partners.map(serializeTimestamps) });
            }

            case 'searchRegistry': {
                const { type, term, outreachFilter, limit = 100 } = payload;
                let collectionName = (type === 'all' || type === 'lead') ? 'leads' : 'partners';
                
                let query: any = db.collection(collectionName);
                if (collectionName === 'partners' && type !== 'all') {
                    query = query.where('type', '==', type);
                }

                const snap = await query.orderBy('updatedAt', 'desc').limit(limit).get();
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

            case 'getAudienceCommunications': {
                const { type } = payload;
                const snap = await db.collectionGroup('communications').orderBy('timestamp', 'desc').limit(100).get();
                const logs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                return NextResponse.json({ success: true, data: logs.map(serializeTimestamps) });
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

            case 'dispatchEngagement': {
                const { partnerId, email, subject, html, audience } = payload;
                const apiKey = process.env.SENDGRID_API_KEY;
                if (!apiKey) throw new Error("SENDGRID_API_KEY is not configured on the server.");

                sgMail.setApiKey(apiKey);
                await sgMail.send({
                    to: email,
                    from: 'michael@logisticsflow.co.za', 
                    subject: subject,
                    html: html,
                });

                const colName = ['partners', 'transporters', 'suppliers', 'investors', 'developers', 'isa', 'finance', 'associates'].includes(audience) ? 'partners' : 'leads';
                const logRef = db.collection(colName).doc(partnerId).collection('communications').doc();
                await logRef.set({
                    id: logRef.id,
                    type: 'Automated Dispatch',
                    subject: subject,
                    notes: `Automated ${audience} dispatch via SendGrid.`,
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

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const batch = db.batch();
                const collectionName = type === 'lead' ? 'leads' : 'partners';
                
                partners.forEach((p: any) => {
                    const ref = db.collection(collectionName).doc(p.record_id || p.id || db.collection(collectionName).doc().id);
                    batch.set(ref, {
                        ...p,
                        id: ref.id,
                        contactPerson: p.contactPerson || p.contact_person,
                        type: type === 'lead' ? 'lead' : type,
                        status: p.status || 'new',
                        updatedAt: FieldValue.serverTimestamp(),
                        createdAt: FieldValue.serverTimestamp()
                    }, { merge: true });
                });

                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(500).get();
                const logs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                return NextResponse.json({ success: true, data: logs.map(serializeTimestamps) });
            }

            default: return NextResponse.json({ success: false, error: `Action "${action}" not supported.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Failure [${currentAction}]:`, error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
