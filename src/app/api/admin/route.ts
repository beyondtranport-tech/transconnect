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

        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || 
                        decodedToken.email === 'mkoton100@gmail.com' || 
                        decodedToken.email === 'michael@logisticsflow.co.za' ||
                        decodedToken.admin === true ||
                        ['0Y3IhZffEPNlMAIhURPnzRgNokL2', 'ylVC4F2FIYV8o9jjq13wCYiAyyM2'].includes(decodedToken.uid);

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};

        if (!isAdmin) {
             if (action !== 'getMemberEngagementPings') throw new Error("Forbidden: Admin access required.");
        }

        switch (action) {
            case 'getStaff': {
                const snap = await db.collectionGroup('staff').get();
                const data = snap.docs.map(doc => {
                    const docData = doc.data();
                    const pathSegments = doc.ref.path.split('/');
                    const companiesIdx = pathSegments.indexOf('companies');
                    const companyId = companiesIdx > -1 ? pathSegments[companiesIdx + 1] : null;
                    return {
                        ...docData,
                        id: doc.id,
                        companyId
                    };
                });
                return NextResponse.json({ success: true, data: serializeData(data) });
            }

            case 'savePlatformStaff': {
                const { staff } = payload;
                const ref = db.collection('platformStaff').doc(staff.id || db.collection('platformStaff').doc().id);
                await ref.set({ 
                    ...staff, 
                    id: ref.id, 
                    status: staff.status || 'active',
                    updatedAt: FieldValue.serverTimestamp() 
                }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            case 'deletePlatformStaff': {
                const { staffId } = payload;
                await db.collection('platformStaff').doc(staffId).delete();
                return NextResponse.json({ success: true });
            }

            case 'deleteStaffMember': {
                const { companyId, staffId } = payload;
                await db.doc(`companies/${companyId}/staff/${staffId}`).delete();
                return NextResponse.json({ success: true });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const batch = db.batch();
                partners.forEach((p: any) => {
                    const collection = (p.source === 'Lead' || !p.type || p.type === 'lead') ? 'leads' : 'partners';
                    const ref = db.collection(collection).doc(p.id || db.collection(collection).doc().id);
                    batch.set(ref, { 
                        ...p, 
                        id: ref.id, 
                        type: type || p.type || 'partner',
                        source: p.source || 'AI Discovery',
                        status: p.status || 'new',
                        updatedAt: FieldValue.serverTimestamp() 
                    }, { merge: true });
                });
                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() })) });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('updatedAt', 'desc').limit(500).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }))) });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(500).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }))) });
            }

            case 'searchRegistry': {
                const { type: rType, limit: rLimit = 100, term = '' } = payload;
                const limitNum = parseInt(String(rLimit), 10) || 100;
                
                let pQuery: any = db.collection('partners');
                if (rType !== 'all') pQuery = pQuery.where('type', '==', rType);
                const pSnap = await pQuery.orderBy('updatedAt', 'desc').limit(limitNum).get();
                const pResults = pSnap.docs.map((d: QueryDocumentSnapshot) => ({ ...d.data(), id: d.id, source: 'Member' }));

                let lQuery: any = db.collection('leads');
                if (rType !== 'all') {
                    const roleMap: Record<string, string> = { 'transporter': 'Transporter', 'supplier': 'Supplier', 'driver': 'Driver', 'finance': 'Funder', 'associate': 'Associate', 'debtor': 'Debtor' };
                    lQuery = lQuery.where('role', '==', roleMap[rType] || rType);
                }
                const lSnap = await lQuery.orderBy('updatedAt', 'desc').limit(limitNum).get();
                const lResults = lSnap.docs.map((d: QueryDocumentSnapshot) => ({ ...d.data(), id: d.id, source: 'Lead' }));

                let combined = [...pResults, ...lResults];
                if (term) {
                    const norm = term.toLowerCase().trim();
                    combined = combined.filter(item => (item.companyName || item.firstName || item.name || '').toLowerCase().includes(norm));
                }
                combined.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
                return NextResponse.json({ success: true, data: serializeData(combined.slice(0, limitNum)) });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }))) });
            }

            case 'logCommunication': {
                const { partnerId, subject, type: cType, notes, collection: col = 'partners' } = payload;
                const logRef = db.collection(col).doc(partnerId).collection('communications').doc();
                await logRef.set({
                    id: logRef.id,
                    subject,
                    type: cType,
                    notes,
                    timestamp: FieldValue.serverTimestamp(),
                    senderId: decodedToken.uid
                });
                
                await db.collection(col).doc(partnerId).update({
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                });
                
                return NextResponse.json({ success: true });
            }

            // --- LENDING HUB ACTIONS ---
            case 'getLendingData': {
                const { collectionName } = payload;
                const collMap: Record<string, string> = {
                    'facilities': 'lendingFacilities',
                    'agreements': 'lendingAgreements',
                    'assets': 'lendingAssets',
                    'securities': 'lendingSecurities',
                    'lendingClients': 'lendingClients',
                    'lendingPartners': 'lendingPartners'
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
                    status: facility.status || 'pending',
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            case 'updateFacilityStatus': {
                const { facilityId, status } = payload;
                await db.collection('lendingFacilities').doc(facilityId).update({
                    status,
                    updatedAt: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'deleteLendingFacility': {
                const { facilityId } = payload;
                await db.collection('lendingFacilities').doc(facilityId).delete();
                return NextResponse.json({ success: true });
            }

            case 'saveLendingAgreement': {
                const { agreement } = payload;
                const ref = db.collection('lendingAgreements').doc(agreement.id || db.collection('lendingAgreements').doc().id);
                await ref.set({
                    ...agreement,
                    id: ref.id,
                    status: agreement.status || 'pending',
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            case 'deleteLendingAgreement': {
                const { agreementId } = payload;
                await db.collection('lendingAgreements').doc(agreementId).delete();
                return NextResponse.json({ success: true });
            }

            case 'saveLendingAsset': {
                const { asset } = payload;
                const ref = db.collection('lendingAssets').doc(asset.id || db.collection('lendingAssets').doc().id);
                await ref.set({
                    ...asset,
                    id: ref.id,
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            case 'deleteLendingAsset': {
                const { assetId } = payload;
                await db.collection('lendingAssets').doc(assetId).delete();
                return NextResponse.json({ success: true });
            }

            case 'saveLendingSecurity': {
                const { security } = payload;
                const ref = db.collection('lendingSecurities').doc(security.id || db.collection('lendingSecurities').doc().id);
                await ref.set({
                    ...security,
                    id: ref.id,
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            case 'deleteLendingSecurity': {
                const { securityId } = payload;
                await db.collection('lendingSecurities').doc(securityId).delete();
                return NextResponse.json({ success: true });
            }

            case 'saveLendingPartner': {
                const { partner } = payload;
                const ref = db.collection('lendingPartners').doc(partner.id || db.collection('lendingPartners').doc().id);
                await ref.set({
                    ...partner,
                    id: ref.id,
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            case 'deleteLendingPartner': {
                const { partnerId, collection: collName = 'lendingClients' } = payload;
                await db.collection(collName).doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }

            default: 
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message || "Server error." }, { status: 500 });
    }
}
