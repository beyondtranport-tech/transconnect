
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import sgMail from '@sendgrid/mail';

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
            // --- LENDING PORTAL COMPLETION ACTIONS ---
            case 'getLendingData': {
                const { collectionName, clientId } = payload;
                let q: any = db.collection(collectionName);
                if (clientId) q = q.where('clientId', '==', clientId);
                const snap = await q.orderBy('updatedAt', 'desc').limit(200).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }))) });
            }

            case 'saveLendingClient': {
                const { client } = payload;
                const ref = db.collection('lendingClients').doc(client.id || db.collection('lendingClients').doc().id);
                await ref.set({ ...client, id: ref.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            case 'saveLendingAgreement': {
                const { agreement } = payload;
                const ref = db.collection('agreements').doc(agreement.id || db.collection('agreements').doc().id);
                await ref.set({ ...agreement, id: ref.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            case 'saveLendingAsset': {
                const { asset } = payload;
                const ref = db.collection('lendingAssets').doc(asset.id || db.collection('lendingAssets').doc().id);
                await ref.set({ ...asset, id: ref.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            case 'saveLendingSecurity': {
                const { security, clientId, agreementId } = payload;
                const ref = db.collection('lendingClients').doc(clientId).collection('agreements').doc(agreementId).collection('securities').doc();
                await ref.set({ ...security, id: ref.id, createdAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }

            case 'saveLendingFacility': {
                const { facility } = payload;
                const ref = db.collection('facilities').doc(facility.id || db.collection('facilities').doc().id);
                await ref.set({ ...facility, id: ref.id, status: 'active', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true });
            }

            // --- LEGACY ACTIONS ---
            case 'getGlobalHandshakes': {
                const snap = await db.collection('engagementPings').orderBy('timestamp', 'desc').limit(200).get();
                return NextResponse.json({ success: true, data: serializeData(snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }))) });
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
                const normalizedTerm = term.toLowerCase().trim();
                const limitNum = parseInt(String(rLimit), 10) || 100;
                
                let pQuery: any = db.collection('partners');
                if (rType !== 'all') pQuery = pQuery.where('type', '==', rType);
                const pSnap = await pQuery.orderBy('updatedAt', 'desc').limit(limitNum).get();
                const pResults = pSnap.docs.map((d: QueryDocumentSnapshot) => ({ ...d.data(), id: d.id, source: 'Member' }));

                let lQuery: any = db.collection('leads');
                if (rType !== 'all') {
                    const roleMap: Record<string, string> = { 'transporter': 'Transporter', 'supplier': 'Supplier', 'driver': 'Driver', 'finance': 'Funder', 'associate': 'Associate' };
                    lQuery = lQuery.where('role', '==', roleMap[rType] || rType);
                }
                const lSnap = await lQuery.orderBy('updatedAt', 'desc').limit(limitNum).get();
                const lResults = lSnap.docs.map((d: QueryDocumentSnapshot) => ({ ...d.data(), id: d.id, source: 'Lead' }));

                let combined = [...pResults, ...lResults];
                if (normalizedTerm) {
                    combined = combined.filter(item => {
                        const name = (item.companyName || item.firstName || '').toLowerCase();
                        const email = (item.email || '').toLowerCase();
                        return name.includes(normalizedTerm) || email.includes(normalizedTerm);
                    });
                }
                combined.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
                return NextResponse.json({ success: true, data: serializeData(combined.slice(0, limitNum)) });
            }

            default: 
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message || "Server error." }, { status: 500 });
    }
}
