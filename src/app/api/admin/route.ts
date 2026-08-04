import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * ADMINISTRATIVE API CORE - RESOURCE PROTECTED
 * Build Identifier: 2026-03-18T14:00:00Z (Lending V22 - State Transitions)
 */

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

        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};

        switch (action) {
            case 'getLendingData': {
                const { collectionName, limit = 100 } = payload;
                const collMap: Record<string, string> = {
                    'facilities': 'lendingFacilities',
                    'lendingClients': 'lendingClients',
                    'lendingDebtors': 'lendingDebtors',
                    'lendingSuppliers': 'lendingSuppliers',
                    'agreements': 'lendingAgreements',
                    'lendingAssets': 'lendingAssets',
                    'payments': 'lendingPayments'
                };
                const collectionToFetch = collMap[collectionName] || collectionName;
                const snap = await db.collection(collectionToFetch).orderBy('updatedAt', 'desc').limit(Math.min(limit, 100)).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map(d => ({ id: d.id, ...d.data() }))) });
            }

            case 'saveLendingAgreement': {
                const { agreement } = payload;
                const ref = agreement.id ? db.collection('lendingAgreements').doc(agreement.id) : db.collection('lendingAgreements').doc();
                const data = { ...agreement, id: ref.id, updatedAt: FieldValue.serverTimestamp() };
                if (!agreement.id) data.createdAt = FieldValue.serverTimestamp();
                await ref.set(data, { merge: true });
                return NextResponse.json({ success: true, data: { id: ref.id } });
            }

            case 'createLendingPayment': {
                const { payment } = payload;
                const ref = db.collection('lendingPayments').doc();
                await ref.set({ ...payment, id: ref.id, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true, data: { id: ref.id } });
            }

            case 'executeLendingPayment': {
                const { paymentId, assetId, method, notes } = payload;
                const batch = db.batch();
                
                // 1. Close Payment Node
                const pRef = db.collection('lendingPayments').doc(paymentId);
                batch.update(pRef, {
                    status: 'completed',
                    settlementMethod: method,
                    settlementNote: notes,
                    settledAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                });

                // 2. Move Asset Standing (Take out of stock)
                if (assetId) {
                    const aRef = db.collection('lendingAssets').doc(assetId);
                    batch.update(aRef, {
                        status: 'financed',
                        updatedAt: FieldValue.serverTimestamp()
                    });
                }

                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('updatedAt', 'desc').limit(100).get();
                const members = await Promise.all(snap.docs.map(async (d) => {
                    const data = d.data();
                    const userSnap = await db.collection('users').doc(data.ownerId || 'N/A').get();
                    const userData = userSnap.data();
                    return { id: d.id, ...data, firstName: userData?.firstName || 'N/A', lastName: userData?.lastName || 'N/A', email: userData?.email || 'N/A' };
                }));
                return NextResponse.json({ success: true, data: serializeData(members) });
            }

            case 'searchRegistry': {
                const { type, term, limit: limitCount = 100 } = payload;
                let q: any;
                if (type === 'lead') q = db.collection('leads');
                else if (['transporter', 'supplier', 'finance', 'driver', 'warehouse', 'isa', 'investor', 'associate'].includes(type)) {
                    q = db.collection('partners').where('type', '==', type);
                } else q = db.collection('partners');
                
                const snap = await q.orderBy('updatedAt', 'desc').limit(Math.min(limitCount, 100)).get();
                let results = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }));
                if (term) {
                    const lowTerm = term.toLowerCase();
                    results = results.filter((r: any) => r.companyName?.toLowerCase().includes(lowTerm) || r.email?.toLowerCase().includes(lowTerm));
                }
                return NextResponse.json({ success: true, data: serializeData(results) });
            }

            default: 
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
