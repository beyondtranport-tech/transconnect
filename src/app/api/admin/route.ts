
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

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

        const adminEmails = ['mkoton100@gmail.com', 'beyondtransport@gmail.com', 'michael@logisticsflow.co.za'];
        const isAdmin = adminEmails.includes(decodedToken.email || '') || decodedToken.admin === true;

        if (!isAdmin) {
            throw new Error("Forbidden: Admin access required.");
        }

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};

        switch (action) {
            // --- CORE REGISTRY QUERIES ---
            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('updatedAt', 'desc').limit(1000).get();
                const members = await Promise.all(snap.docs.map(async (d) => {
                    const data = d.data();
                    const userSnap = await db.collection('users').doc(data.ownerId || 'N/A').get();
                    const userData = userSnap.data();
                    return {
                        id: d.id,
                        ...data,
                        firstName: userData?.firstName || 'N/A',
                        lastName: userData?.lastName || 'N/A',
                        email: userData?.email || 'N/A'
                    };
                }));
                return NextResponse.json({ success: true, data: serializeData(members) });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map(d => ({ id: d.id, ...d.data() }))) });
            }

            case 'searchRegistry': {
                const { type, term, limit: limitCount = 500 } = payload;
                let q: any;
                
                if (type === 'lead') {
                    q = db.collection('leads');
                } else if (type === 'transporter' || type === 'supplier' || type === 'finance' || type === 'distributor' || type === 'driver' || type === 'warehouse') {
                    q = db.collection('partners').where('type', '==', type);
                } else if (type === 'all') {
                    // Capped read across both for global search
                    const leads = await db.collection('leads').orderBy('updatedAt', 'desc').limit(100).get();
                    const partners = await db.collection('partners').orderBy('updatedAt', 'desc').limit(100).get();
                    const combined = [
                        ...leads.docs.map(d => ({ id: d.id, source: 'Lead', ...d.data() })),
                        ...partners.docs.map(d => ({ id: d.id, source: 'Partner', ...d.data() }))
                    ];
                    return NextResponse.json({ success: true, data: serializeData(combined) });
                } else {
                    q = db.collection('partners');
                }
                
                const snap = await q.orderBy('updatedAt', 'desc').limit(limitCount).get();
                let results = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }));

                if (term) {
                    const lowTerm = term.toLowerCase();
                    results = results.filter((r: any) => 
                        r.companyName?.toLowerCase().includes(lowTerm) || 
                        r.email?.toLowerCase().includes(lowTerm) ||
                        r.id.toLowerCase().includes(lowTerm)
                    );
                }

                return NextResponse.json({ success: true, data: serializeData(results) });
            }

            // --- LENDING HUB ACTIONS ---
            case 'getLendingData': {
                const { collectionName } = payload;
                const collMap: Record<string, string> = {
                    'facilities': 'lendingFacilities',
                    'agreements': 'lendingAgreements',
                    'assets': 'lendingAssets',
                    'securities': 'lendingSecurities',
                    'clients': 'lendingClients',
                    'debtors': 'lendingDebtors',
                    'collateral': 'lendingCollateral',
                    'documents': 'lendingDocuments',
                    'partners': 'lendingPartners'
                };
                const collectionToFetch = collMap[collectionName] || collectionName;
                const snap = await db.collection(collectionToFetch).orderBy('updatedAt', 'desc').limit(500).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map(d => ({ id: d.id, ...d.data() }))) });
            }

            case 'saveLendingFacility': {
                const { facility } = payload;
                const ref = db.collection('lendingFacilities').doc(facility.id || db.collection('lendingFacilities').doc().id);
                await ref.set({
                    ...facility,
                    id: ref.id,
                    updatedAt: FieldValue.serverTimestamp(),
                    createdAt: facility.createdAt || FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            case 'autoEnrichRecord': {
                const { id, type: recType } = payload;
                if (!id) throw new Error("Record ID required.");
                
                const col = (recType === 'lead') ? 'leads' : 'partners';
                const docRef = db.collection(col).doc(id);
                const docSnap = await docRef.get();
                if (!docSnap.exists) throw new Error("Record not found.");
                
                const data = docSnap.data()!;
                const companyName = data.companyName || `${data.firstName || ''} ${data.lastName || ''}`;
                
                const { enrichPartner } = await import('@/ai/flows/enrich-partner-flow');
                const enrichment = await enrichPartner({ companyName });
                
                await docRef.update({
                    ...enrichment,
                    status: 'qualified',
                    enhancementMethod: 'V13.1 AI',
                    lastEnrichedAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                });
                
                return NextResponse.json({ success: true, data: serializeData(enrichment) });
            }

            // --- CRM & COMMUNICATIONS ---
            case 'getAudienceCommunications': {
                const { type } = payload;
                const snap = await db.collectionGroup('communications')
                    .orderBy('timestamp', 'desc')
                    .limit(200)
                    .get();
                
                let results = snap.docs.map(d => ({ id: d.id, ...d.data(), path: d.ref.path }));
                if (type && type !== 'all') {
                    results = results.filter((r: any) => r.partnerType === type);
                }
                return NextResponse.json({ success: true, data: serializeData(results) });
            }

            case 'logCommunication': {
                const { partnerId, type: commType, subject, notes, collection: col = 'partners' } = payload;
                const ref = db.collection(col).doc(partnerId).collection('communications').doc();
                const logData = {
                    id: ref.id,
                    partnerId,
                    type: commType,
                    subject,
                    notes,
                    timestamp: FieldValue.serverTimestamp(),
                    adminId: decodedToken.uid
                };
                await ref.set(logData);
                
                // Also update the parent record's last activity
                await db.collection(col).doc(partnerId).update({
                    lastActivityAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    status: 'contacted'
                });

                return NextResponse.json({ success: true });
            }

            case 'getPipelineQueue': {
                const leadsSnap = await db.collection('leads')
                    .where('status', '==', 'contacted')
                    .orderBy('nextStepDueAt', 'asc')
                    .limit(100)
                    .get();
                
                const results = leadsSnap.docs.map(d => ({ id: d.id, type: 'lead', ...d.data() }));
                return NextResponse.json({ success: true, data: serializeData(results) });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(200).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map(d => ({ id: d.id, ...d.data() }))) });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map(d => ({ id: d.id, ...d.data() }))) });
            }

            case 'savePartner': {
                const { partner, collection: col = 'partners' } = payload;
                const ref = db.collection(col).doc(partner.id || db.collection(col).doc().id);
                await ref.set({ 
                    ...partner, 
                    id: ref.id, 
                    updatedAt: FieldValue.serverTimestamp() 
                }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            default: 
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
