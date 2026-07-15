import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Resilient Timestamp and FieldValue Serializer
 * Ensures all Firestore objects are converted to strings before JSON transmission.
 */
function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    
    if (docData instanceof Timestamp) {
        return docData.toDate().toISOString();
    }
    
    if (docData && typeof docData === 'object' && docData.constructor?.name === 'FieldValue') {
        return new Date().toISOString(); 
    }

    if (Array.isArray(docData)) {
        return docData.map(serializeTimestamps);
    }
    
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
        if (initError || !app) throw new Error(`Admin SDK failed to initialize: ${initError}`);

        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized: Missing or invalid token.');
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
            case 'savePartner': {
                const { partner, collection: colName = 'partners' } = payload;
                if (!partner) throw new Error("Payload error: Partner data is required.");

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
                        status: p.status || 'new',
                        updatedAt: FieldValue.serverTimestamp()
                    }, { merge: true });
                });
                
                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'autoEnrichRecord': {
                const { id, type: targetType } = payload;
                const colName = (targetType === 'lead' || !targetType) ? 'leads' : 'partners';
                const docRef = db.collection(colName).doc(id);
                const docSnap = await docRef.get();
                if (!docSnap.exists) throw new Error("Record not found.");
                
                const current = docSnap.data()!;
                const companyName = current.companyName || current.company_name || '';

                const { enrichPartner } = await import('@/ai/flows/enrich-partner-flow');
                
                try {
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
                } catch (flowError: any) {
                    const msg = flowError.message || "";
                    if (msg.includes('SEARCH_QUOTA_EXHAUSTED')) return NextResponse.json({ success: false, error: 'SEARCH_QUOTA_EXHAUSTED' }, { status: 429 });
                    if (msg.includes('429') || msg.includes('Quota') || msg.includes('exhausted')) return NextResponse.json({ success: false, error: 'AI_RATE_LIMIT_EXHAUSTED' }, { status: 429 });
                    throw flowError;
                }
            }

            case 'getAudienceCommunications': {
                const { type } = payload;
                const snap = await db.collectionGroup('communications')
                    .orderBy('timestamp', 'desc')
                    .limit(200)
                    .get();
                
                const results = await Promise.all(snap.docs.map(async doc => {
                    const data = doc.data();
                    const pathSegments = doc.ref.path.split('/');
                    const partnerId = pathSegments[1];
                    const parentColl = pathSegments[0];
                    
                    const partnerSnap = await db.collection(parentColl).doc(partnerId).get();
                    if (!partnerSnap.exists) return null;
                    
                    const pData = partnerSnap.data()!;
                    if (type && pData.type !== type && pData.industrial_category !== type) return null;

                    return {
                        id: doc.id,
                        ...data,
                        partnerName: pData.companyName || pData.firstName || 'Partner',
                        partnerType: pData.type || pData.industrial_category
                    };
                }));
                return NextResponse.json({ success: true, data: results.filter(Boolean).map(serializeTimestamps) });
            }

            case 'getGlobalAds': {
                const snap = await db.collectionGroup('adCampaigns').orderBy('createdAt', 'desc').get();
                const ads = await Promise.all(snap.docs.map(async d => {
                    const data = d.data();
                    const companySnap = await db.collection('companies').doc(data.companyId).get();
                    return { ...data, companyName: companySnap.data()?.companyName || 'Unknown' };
                }));
                return NextResponse.json({ success: true, data: ads.map(serializeTimestamps) });
            }

            case 'updateAdStatus': {
                const { adId, companyId, status } = payload;
                await db.doc(`companies/${companyId}/adCampaigns/${adId}`).update({ status, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }

            case 'getBrokerAgreements': {
                const snap = await db.collectionGroup('brokerAgreements').orderBy('createdAt', 'desc').get();
                const results = await Promise.all(snap.docs.map(async d => {
                    const data = d.data();
                    const companySnap = await db.collection('companies').doc(data.brokerId).get();
                    return { ...data, brokerName: companySnap.data()?.companyName || 'Member', path: d.ref.path };
                }));
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'updateBrokerAgreementStatus': {
                const { path, status } = payload;
                await db.doc(path).update({ status, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }

            case 'searchRegistry': {
                const { type, term, outreachFilter, limit = 100 } = payload;
                let collectionName = (type === 'all' || type === 'lead') ? 'leads' : 'partners';
                let q: any = db.collection(collectionName);
                
                if (collectionName === 'partners' && type !== 'all') {
                    q = q.where('type', '==', type);
                }

                const snap = await q.orderBy('updatedAt', 'desc').limit(Math.min(limit, 20000)).get();
                let results = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

                if (term) {
                    const lowTerm = term.toLowerCase();
                    results = results.filter((r: any) => 
                        (r.companyName || r.company_name || '').toLowerCase().includes(lowTerm) || 
                        (r.email || '').toLowerCase().includes(lowTerm)
                    );
                }

                if (outreachFilter === 'none') {
                    results = results.filter((r: any) => !r.lastOutreachAt);
                }

                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'logForensicInitiated': {
                const { partnerId, isLead } = payload;
                const colName = isLead ? 'leads' : 'partners';
                const partnerRef = db.collection(colName).doc(partnerId);
                await partnerRef.collection('communications').add({
                    subject: 'Forensic Research Initiated',
                    type: 'System',
                    notes: 'Clinical gap-analysis started via UI.',
                    timestamp: FieldValue.serverTimestamp()
                });
                await partnerRef.update({ status: 'contacted', updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
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

            case 'deleteLeads': {
                const { leadIds } = payload;
                const batch = db.batch();
                leadIds.forEach((id: string) => batch.delete(db.collection('leads').doc(id)));
                await batch.commit();
                return NextResponse.json({ success: true });
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

            default: 
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
