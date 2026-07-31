
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
            case 'getLendingData': {
                const { collectionName } = payload;
                const collMap: Record<string, string> = {
                    'facilities': 'lendingFacilities',
                    'agreements': 'lendingAgreements',
                    'assets': 'lendingAssets',
                    'securities': 'lendingSecurities',
                    'clients': 'lendingClients',
                    'debtors': 'lendingClients',
                    'collateral': 'lendingCollateral',
                    'documents': 'lendingDocuments',
                    'partners': 'lendingPartners'
                };
                const collectionToFetch = collMap[collectionName] || collectionName;
                const snap = await db.collection(collectionToFetch).orderBy('updatedAt', 'desc').limit(500).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map(d => ({ id: d.id, ...d.data() }))) });
            }

            case 'saveLendingDocument': {
                const { document } = payload;
                const ref = db.collection('lendingDocuments').doc(document.id || db.collection('lendingDocuments').doc().id);
                await ref.set({
                    ...document,
                    id: ref.id,
                    updatedAt: FieldValue.serverTimestamp(),
                    createdAt: document.createdAt || FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            case 'saveLendingSecurity': {
                const { security } = payload;
                const ref = db.collection('lendingSecurities').doc(security.id || db.collection('lendingSecurities').doc().id);
                await ref.set({
                    ...security,
                    id: ref.id,
                    updatedAt: FieldValue.serverTimestamp(),
                    createdAt: security.createdAt || FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            case 'saveLendingCollateral': {
                const { collateral } = payload;
                const ref = db.collection('lendingCollateral').doc(collateral.id || db.collection('lendingCollateral').doc().id);
                await ref.set({
                    ...collateral,
                    id: ref.id,
                    updatedAt: FieldValue.serverTimestamp(),
                    createdAt: collateral.createdAt || FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
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
