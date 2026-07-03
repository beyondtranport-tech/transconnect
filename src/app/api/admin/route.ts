import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import { enrichPartner } from '@/ai/flows/enrich-partner-flow';

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

        if (!isAdmin) {
            throw new Error("Access Denied: Administrative authority required.");
        }

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};

        switch (action) {
            case 'logCommunication': {
                const { partnerId, type, subject, notes, collection = 'partners' } = payload;
                if (!partnerId || !subject) throw new Error("Missing logging details.");
                
                const logRef = db.collection(collection).doc(partnerId).collection('communications').doc();
                await logRef.set({
                    id: logRef.id,
                    type,
                    subject,
                    notes,
                    adminId: decodedToken.uid,
                    timestamp: FieldValue.serverTimestamp()
                });
                
                // Update parent record for quick oversight visibility
                await db.collection(collection).doc(partnerId).update({
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                });
                
                return NextResponse.json({ success: true });
            }

            case 'autoEnrichRecord': {
                const { id, type = 'partner' } = payload;
                const collection = type === 'lead' ? 'leads' : 'partners';
                const docRef = db.collection(collection).doc(id);
                const docSnap = await docRef.get();
                if (!docSnap.exists) throw new Error("Record not found.");

                const data = docSnap.data()!;
                const companyName = data.companyName || data.trading_name || `${data.firstName} ${data.lastName}`;
                
                const enriched = await enrichPartner({ companyName });
                
                const update: any = { ...enriched, updatedAt: FieldValue.serverTimestamp() };
                if (enriched.email || enriched.mobile) update.status = 'qualified';
                
                await docRef.update(update);
                return NextResponse.json({ success: true, data: enriched });
            }

            case 'dispatchEngagement': {
                const { partnerId, email, subject, html, audience } = payload;
                // This is a placeholder for a Transactional Mail integration (e.g. SendGrid)
                console.log(`[SIMULATED DISPATCH] To: ${email} | Subject: ${subject}`);
                
                const coll = ['investors', 'finance', 'developers'].includes(audience) ? 'partners' : 'leads';
                
                await db.collection(coll).doc(partnerId).update({
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    status: 'invited',
                    updatedAt: FieldValue.serverTimestamp()
                });

                return NextResponse.json({ success: true });
            }

            case 'getAudienceCommunications': {
                const { type } = payload;
                const snap = await db.collectionGroup('communications')
                    .orderBy('timestamp', 'desc')
                    .limit(50)
                    .get();
                
                const logs = await Promise.all(snap.docs.map(async (d) => {
                    const data = d.data();
                    const pathParts = d.ref.path.split('/');
                    const parentId = pathParts[1];
                    const parentColl = pathParts[0];
                    const parentSnap = await db.collection(parentColl).doc(parentId).get();
                    const pData = parentSnap.data();
                    
                    return {
                        id: d.id,
                        partnerName: pData?.companyName || pData?.firstName || 'Unknown',
                        partnerType: pData?.type || parentColl,
                        ...data
                    };
                }));

                return NextResponse.json({ success: true, data: logs.map(serializeTimestamps) });
            }

            case 'approvePayout': {
                const { companyId, payoutId, amount } = payload;
                const batch = db.batch();
                const companyRef = db.collection('companies').doc(companyId);
                const payoutRef = companyRef.collection('payoutRequests').doc(payoutId);

                batch.update(companyRef, {
                    walletBalance: FieldValue.increment(-amount),
                    availableBalance: FieldValue.increment(-amount),
                    updatedAt: FieldValue.serverTimestamp()
                });
                
                batch.update(payoutRef, { status: 'completed', updatedAt: FieldValue.serverTimestamp() });
                
                await batch.commit();
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

            case 'getBrokerAgreements': {
                const snap = await db.collectionGroup('brokerAgreements').orderBy('createdAt', 'desc').limit(100).get();
                const results = await Promise.all(snap.docs.map(async (d) => {
                    const data = d.data();
                    const brokerSnap = await db.collection('companies').doc(data.brokerId).get();
                    return { id: d.id, path: d.ref.path, brokerName: brokerSnap.data()?.companyName || 'Unknown Broker', ...data };
                }));
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getGlobalLoads': {
                const snap = await db.collectionGroup('loads').orderBy('createdAt', 'desc').limit(200).get();
                const results = await Promise.all(snap.docs.map(async (d) => {
                    const data = d.data();
                    const brokerSnap = await db.collection('companies').doc(data.brokerId).get();
                    return { id: d.id, path: d.ref.path, brokerName: brokerSnap.data()?.companyName || 'Unknown Broker', ...data };
                }));
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'searchRegistry': {
                const { type, term, limit = 100 } = payload;
                let queryRef: any = db.collection('partners');
                if (type !== 'all') queryRef = queryRef.where('type', '==', type);
                
                const snap = await queryRef.orderBy('updatedAt', 'desc').limit(limit).get();
                let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                if (term) {
                    const low = term.toLowerCase();
                    results = results.filter(r => (r.companyName || '').toLowerCase().includes(low) || (r.email || '').toLowerCase().includes(low));
                }
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(500).get();
                const members = await Promise.all(snap.docs.map(async (doc) => {
                    const data = doc.data();
                    const ownerSnap = await db.collection('users').doc(data.ownerId).get();
                    return { id: doc.id, ...data, firstName: ownerSnap.data()?.firstName || 'User', lastName: ownerSnap.data()?.lastName || '', email: ownerSnap.data()?.email || 'N/A' };
                }));
                return NextResponse.json({ success: true, data: members.map(serializeTimestamps) });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'listAllUsers': {
                const adminAuth = getAuth(app);
                const listUsers = await adminAuth.listUsers(1000);
                return NextResponse.json({ success: true, data: listUsers.users });
            }

            default: return NextResponse.json({ success: false, error: "Action not supported." }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
