import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * ADMINISTRATIVE API CORE - RESOURCE PROTECTED
 * Build Identifier: 2026-03-24T17:00:00Z (Lending V28 - Deletion & Unlock Protocols)
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
                    'securities': 'lendingSecurities',
                    'collateral': 'lendingCollateral',
                    'documents': 'lendingDocuments',
                    'lendingPayments': 'lendingPayments'
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

            case 'deleteLendingAgreement': {
                const { agreementId } = payload;
                if (!agreementId) throw new Error("Agreement ID required.");
                await db.collection('lendingAgreements').doc(agreementId).delete();
                return NextResponse.json({ success: true });
            }

            case 'createLendingPayment': {
                const { payment } = payload;
                const ref = db.collection('lendingPayments').doc();
                await ref.set({ ...payment, id: ref.id, amountPaid: 0, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true, data: { id: ref.id } });
            }

            case 'executeLendingPayment': {
                const { paymentId, assetId, amount, method, isFinal } = payload;
                const batch = db.batch();
                const pRef = db.collection('lendingPayments').doc(paymentId);
                batch.update(pRef, {
                    amountPaid: FieldValue.increment(amount),
                    status: isFinal ? 'completed' : 'pending',
                    lastSettledAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                });
                if (isFinal && assetId) {
                    const aRef = db.collection('lendingAssets').doc(assetId);
                    batch.update(aRef, { status: 'financed', updatedAt: FieldValue.serverTimestamp() });
                }
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'saveLendingAsset': {
                const { asset } = payload;
                const ref = asset.id ? db.collection('lendingAssets').doc(asset.id) : db.collection('lendingAssets').doc();
                const data = { ...asset, id: ref.id, updatedAt: FieldValue.serverTimestamp() };
                if (!asset.id) data.createdAt = FieldValue.serverTimestamp();
                await ref.set(data, { merge: true });
                return NextResponse.json({ success: true, data: { id: ref.id } });
            }

            case 'deleteLendingAsset': {
                const { assetId } = payload;
                await db.collection('lendingAssets').doc(assetId).delete();
                return NextResponse.json({ success: true });
            }

            case 'saveLendingPartner': {
                const { collection: colName, partner } = payload;
                if (!colName) throw new Error("Collection target required.");
                const ref = partner.id ? db.collection(colName).doc(partner.id) : db.collection(colName).doc();
                const data = { ...partner, id: ref.id, updatedAt: FieldValue.serverTimestamp() };
                if (!partner.id) data.createdAt = FieldValue.serverTimestamp();
                await ref.set(data, { merge: true });
                return NextResponse.json({ success: true, data: { id: ref.id } });
            }

            case 'deleteLendingPartner': {
                const { collection: colName, partnerId } = payload;
                await db.collection(colName).doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }

            case 'saveLendingFacility': {
                const { facility } = payload;
                const ref = facility.id ? db.collection('lendingFacilities').doc(facility.id) : db.collection('lendingFacilities').doc();
                const data = { ...facility, id: ref.id, updatedAt: FieldValue.serverTimestamp() };
                if (!facility.id) data.createdAt = FieldValue.serverTimestamp();
                await ref.set(data, { merge: true });
                return NextResponse.json({ success: true, data: { id: ref.id } });
            }

            case 'deleteLendingFacility': {
                const { facilityId } = payload;
                await db.collection('lendingFacilities').doc(facilityId).delete();
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

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').orderBy('firstName', 'asc').get();
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
