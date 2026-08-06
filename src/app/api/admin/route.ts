import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * ADMINISTRATIVE API CORE - V29 STABILITY
 * Build Identifier: 2026-03-24T20:45:00Z
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
            case 'searchRegistry': {
                const { type, limit: limitVal = 100, term = '' } = payload;
                let collectionName = 'leads';
                if (['driver', 'transporter', 'supplier', 'finance', 'warehouse', 'distributor', 'isa', 'partner', 'developer'].includes(type)) {
                    collectionName = 'partners';
                }

                let q: any = db.collection(collectionName);
                if (type !== 'all' && type !== 'lead') {
                    q = q.where('type', '==', type);
                }

                const snap = await q.orderBy('updatedAt', 'desc').limit(limitVal).get();
                let results = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data(), source: collectionName === 'leads' ? 'Lead' : 'Member' }));

                if (term) {
                    const lowerTerm = term.toLowerCase();
                    results = results.filter((r: any) => 
                        (r.companyName || '').toLowerCase().includes(lowerTerm) || 
                        (r.id || '').toLowerCase().includes(lowerTerm)
                    );
                }

                return NextResponse.json({ success: true, data: serializeData(results) });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(500).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map(d => ({ id: d.id, ...d.data(), source: 'Lead' }))) });
            }

            case 'saveLendingFacility': {
                const { facility } = payload;
                const ref = facility.id ? db.collection('facilities').doc(facility.id) : db.collection('facilities').doc();
                const data = { ...facility, id: ref.id, updatedAt: FieldValue.serverTimestamp() };
                if (!facility.id) data.createdAt = FieldValue.serverTimestamp();
                await ref.set(data, { merge: true });
                return NextResponse.json({ success: true, data: { id: ref.id } });
            }

            case 'updateFacilityStatus': {
                const { facilityId, status } = payload;
                await db.collection('facilities').doc(facilityId).update({ status, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }

            case 'deleteLendingFacility': {
                const { facilityId } = payload;
                await db.collection('facilities').doc(facilityId).delete();
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

            case 'saveLendingAgreement': {
                const { agreement } = payload;
                const ref = agreement.id ? db.collection('agreements').doc(agreement.id) : db.collection('agreements').doc();
                const data = { ...agreement, id: ref.id, updatedAt: FieldValue.serverTimestamp() };
                if (!agreement.id) data.createdAt = FieldValue.serverTimestamp();
                await ref.set(data, { merge: true });
                return NextResponse.json({ success: true, data: { id: ref.id } });
            }

            case 'deleteLendingAgreement': {
                const { agreementId } = payload;
                await db.collection('agreements').doc(agreementId).delete();
                return NextResponse.json({ success: true });
            }

            case 'saveLendingPartner': {
                const { partner, collection: col = 'partners' } = payload;
                const ref = partner.id ? db.collection(col).doc(partner.id) : db.collection(col).doc();
                const data = { ...partner, id: ref.id, updatedAt: FieldValue.serverTimestamp() };
                if (!partner.id) data.createdAt = FieldValue.serverTimestamp();
                await ref.set(data, { merge: true });
                return NextResponse.json({ success: true, data: { id: ref.id } });
            }

            case 'executeLendingPayment': {
                const { paymentId, amount, isFinal } = payload;
                const ref = db.collection('lendingPayments').doc(paymentId);
                await db.runTransaction(async (transaction) => {
                    const snap = await transaction.get(ref);
                    if (!snap.exists) throw new Error("Payment node not found");
                    const data = snap.data()!;
                    const newPaid = (data.amountPaid || 0) + amount;
                    transaction.update(ref, {
                        amountPaid: newPaid,
                        status: isFinal ? 'completed' : 'pending',
                        updatedAt: FieldValue.serverTimestamp()
                    });
                });
                return NextResponse.json({ success: true });
            }

            case 'getLendingData': {
                const { collectionName, limit: limitVal = 100 } = payload;
                const snap = await db.collection(collectionName).orderBy('updatedAt', 'desc').limit(Math.min(limitVal, 100)).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map(d => ({ id: d.id, ...d.data() }))) });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').orderBy('firstName', 'asc').get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map(d => ({ id: d.id, ...d.data() }))) });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('updatedAt', 'desc').limit(500).get();
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
