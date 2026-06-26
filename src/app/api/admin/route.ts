import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * UTILITY: Serialize Timestamps
 * Ensures Firestore data is JSON-compatible for the frontend.
 */
function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    if (docData instanceof Timestamp) {
        return docData.toDate().toISOString();
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
        if (initError || !app) throw new Error(`Admin SDK failed: ${initError}`);

        const authorization = req.headers.get('authorization');
        if (!authorization?.startsWith('Bearer ')) throw new Error('Unauthorized.');
        const token = authorization.split('Bearer ')[1];
        
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        
        // Root Admin Emails
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || 
                        decodedToken.email === 'mkoton100@gmail.com' ||
                        decodedToken.email === 'michael@logisticsflow.co.za';

        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};
        const db = getFirestore(app);

        switch (action) {
            case 'logForensicInitiated': {
                const { partnerId, isLead } = payload;
                const coll = isLead ? 'leads' : 'partners';
                await db.collection(coll).doc(partnerId).set({
                    status: 'contacted',
                    notes: 'Forensic research initiated via AI Gap-Analysis.',
                    updatedAt: serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true });
            }

            case 'bulkLogForensicInitiated': {
                const { leadIds, type } = payload;
                const coll = type === 'lead' ? 'leads' : 'partners';
                const batch = db.batch();
                leadIds.forEach((id: string) => {
                    batch.set(db.collection(coll).doc(id), {
                        status: 'contacted',
                        notes: 'Batch Forensic Discovery initiated.',
                        updatedAt: FieldValue.serverTimestamp()
                    }, { merge: true });
                });
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'getMembers': {
                const companiesSnap = await db.collection('companies').orderBy('updatedAt', 'desc').limit(1000).get();
                const ownerIds = companiesSnap.docs.map(d => d.data().ownerId).filter(id => !!id);
                const userDetailsMap = new Map();
                if (ownerIds.length > 0) {
                    const chunks = [];
                    for (let i = 0; i < ownerIds.length; i += 30) chunks.push(ownerIds.slice(i, i + 30));
                    const userSnaps = await Promise.all(chunks.map(chunk => db.collection('users').where(FieldValue.documentId(), 'in', chunk).get()));
                    userSnaps.forEach(snap => snap.forEach(d => userDetailsMap.set(d.id, d.data())));
                }
                const data = companiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), ...userDetailsMap.get(doc.data().ownerId) }));
                return NextResponse.json({ success: true, data: data.map(serializeTimestamps) });
            }

            case 'searchRegistry': {
                const { term, type, outreachFilter, limit = 20000 } = payload;
                const [pSnap, lSnap] = await Promise.all([
                    db.collection('partners').limit(limit).get(),
                    db.collection('leads').limit(limit).get()
                ]);
                let normalized = [
                    ...pSnap.docs.map(d => ({ id: d.id, source: 'partners', ...d.data() })),
                    ...lSnap.docs.map(d => ({ id: d.id, source: 'leads', ...d.data() }))
                ];
                if (type && type !== 'all' && type !== 'lead') normalized = normalized.filter(p => p.type === type.toLowerCase());
                else if (type === 'lead') normalized = normalized.filter(p => p.source === 'leads');
                if (term) {
                    const low = term.toLowerCase();
                    normalized = normalized.filter(p => JSON.stringify(p).toLowerCase().includes(low));
                }
                return NextResponse.json({ success: true, data: normalized.map(serializeTimestamps) });
            }

            case 'savePartner': {
                const { partner } = payload;
                const coll = (partner.source === 'leads' || !partner.type || partner.type === 'lead') ? 'leads' : 'partners';
                const id = partner.id || db.collection(coll).doc().id;
                await db.collection(coll).doc(id).set({ ...partner, id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const coll = type === 'lead' ? 'leads' : 'partners';
                const batch = db.batch();
                partners.forEach((p: any) => {
                    const id = p.record_id || db.collection(coll).doc().id;
                    batch.set(db.collection(coll).doc(id), { 
                        ...p, 
                        id, 
                        type: type === 'lead' ? 'lead' : type,
                        updatedAt: FieldValue.serverTimestamp() 
                    }, { merge: true });
                });
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            default: return NextResponse.json({ success: false, error: "Action invalid." }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
