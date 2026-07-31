
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

            case 'getLendingData': {
                const { collectionName } = payload;
                const collMap: Record<string, string> = {
                    'facilities': 'lendingFacilities',
                    'clients': 'lendingClients',
                    'debtors': 'lendingDebtors',
                    'agreements': 'lendingAgreements',
                    'assets': 'lendingAssets',
                    'securities': 'lendingSecurities',
                    'collateral': 'lendingCollateral',
                    'documents': 'lendingDocuments'
                };
                const collectionToFetch = collMap[collectionName] || collectionName;
                const snap = await db.collection(collectionToFetch).orderBy('updatedAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map(d => ({ id: d.id, ...d.data() }))) });
            }

            case 'saveLendingFacility': {
                const { facility } = payload;
                if (!facility) throw new Error("Missing facility payload.");
                
                const facilityId = facility.id || db.collection('lendingFacilities').doc().id;
                const ref = db.collection('lendingFacilities').doc(facilityId);
                
                const dataToSave = {
                    ...facility,
                    id: facilityId,
                    parentId: facility.parentId || null,
                    limit: Number(facility.limit) || 0,
                    facilityClass: facility.facilityClass || 'global',
                    ownerType: facility.ownerType || 'client',
                    updatedAt: FieldValue.serverTimestamp(),
                    createdAt: facility.createdAt ? (typeof facility.createdAt === 'string' ? Timestamp.fromDate(new Date(facility.createdAt)) : facility.createdAt) : FieldValue.serverTimestamp()
                };
                
                await ref.set(dataToSave, { merge: true });
                return NextResponse.json({ success: true, data: { id: facilityId } });
            }

            case 'updateFacilityStatus': {
                const { facilityId, status } = payload;
                await db.collection('lendingFacilities').doc(facilityId).update({ status, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }

            case 'deleteLendingFacility': {
                const { facilityId } = payload;
                await db.collection('lendingFacilities').doc(facilityId).delete();
                return NextResponse.json({ success: true });
            }

            case 'searchRegistry': {
                const { type, term, limit: limitCount = 500 } = payload;
                let q: any;
                if (type === 'lead') q = db.collection('leads');
                else if (['transporter', 'supplier', 'finance', 'distributor', 'driver', 'warehouse', 'isa', 'investor', 'developer'].includes(type)) {
                    q = db.collection('partners').where('type', '==', type);
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

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map(d => ({ id: d.id, ...d.data() }))) });
            }

            default: 
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
