import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import { enrichPartner } from '@/ai/flows/enrich-partner-flow';

export const dynamic = 'force-dynamic';

/**
 * UTILITY: Serialize Timestamps for JSON transport
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
        
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || 
                        decodedToken.email === 'mkoton100@gmail.com' ||
                        decodedToken.email === 'michael@logisticsflow.co.za';

        const userDoc = await getFirestore(app).collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.data();
        
        // Authorization: Allow Admins OR users with 'associate' role to use certain tracking actions
        const isAssociate = userData?.role === 'associate' || userData?.declaredPosition === 'associate';

        if (!isAdmin && !isAssociate) throw new Error("Forbidden: Elevated access required.");

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};
        const db = getFirestore(app);

        switch (action) {
            case 'logAudit': {
                const { action: auditAction, details, metadata } = payload;
                const logRef = db.collection('auditLogs').doc();
                await logRef.set({
                    id: logRef.id,
                    action: auditAction,
                    details,
                    metadata,
                    userId: decodedToken.uid,
                    userName: decodedToken.name || userData?.firstName || 'User',
                    companyId: userData?.companyId || null,
                    timestamp: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'getMembers': {
                if (!isAdmin) throw new Error("Admin only.");
                const companiesSnap = await db.collection('companies').orderBy('updatedAt', 'desc').limit(100).get();
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

            case 'getAuditLogs': {
                if (!isAdmin) throw new Error("Admin only.");
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getPartnersByType': {
                if (!isAdmin) throw new Error("Admin only.");
                const { type, limit = 100 } = payload;
                let query: any = db.collection('partners');
                if (type && type !== 'all') query = query.where('type', '==', type.toLowerCase());
                const snap = await query.orderBy('updatedAt', 'desc').limit(limit).get();
                const data = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                return NextResponse.json({ success: true, data: data.map(serializeTimestamps) });
            }

            case 'searchRegistry': {
                if (!isAdmin) throw new Error("Admin only.");
                const { term, type, limit = 20000 } = payload;
                const coll = (type === 'lead') ? 'leads' : 'partners';
                let query: any = db.collection(coll);
                if (type && type !== 'all' && type !== 'lead') query = query.where('type', '==', type.toLowerCase());
                const snap = await query.limit(limit).get();
                let results = snap.docs.map((d: any) => ({ id: d.id, source: coll, ...d.data() }));
                if (term) {
                    const low = term.toLowerCase();
                    results = results.filter((p: any) => JSON.stringify(p).toLowerCase().includes(low));
                }
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'logCommunication': {
                if (!isAdmin) throw new Error("Admin only.");
                const { partnerId, type, subject, notes, collection: collName = 'partners' } = payload;
                if (!partnerId || !type || !subject) throw new Error("Missing log data.");
                
                const parentRef = db.collection(collName).doc(partnerId);
                const logRef = parentRef.collection('communications').doc();
                
                const batch = db.batch();
                batch.set(logRef, {
                    id: logRef.id,
                    type,
                    subject,
                    notes,
                    timestamp: FieldValue.serverTimestamp(),
                    adminId: decodedToken.uid
                });
                
                batch.update(parentRef, {
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                });
                
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'autoEnrichRecord': {
                if (!isAdmin) throw new Error("Admin only.");
                const { id, type } = payload;
                const coll = (type === 'lead') ? 'leads' : 'partners';
                const docRef = db.collection(coll).doc(id);
                const docSnap = await docRef.get();
                if (!docSnap.exists) throw new Error("Record not found.");
                
                const data = docSnap.data()!;
                const companyName = data.companyName || data.company_name || data.trading_name || `${data.firstName} ${data.lastName}`;
                
                const enrichment = await enrichPartner({ companyName });
                
                const update = {
                    ...enrichment,
                    status: enrichment.email ? 'qualified' : 'contacted',
                    notes: `Automated Forensic Bridge completed on ${new Date().toISOString()}. Verified website: ${enrichment.website || 'No'}`,
                    updatedAt: FieldValue.serverTimestamp()
                };
                
                await docRef.update(update);
                return NextResponse.json({ success: true, data: update });
            }

            case 'savePartner': {
                if (!isAdmin) throw new Error("Admin only.");
                const { partner } = payload;
                const coll = (partner.source === 'leads' || !partner.type || partner.type === 'lead') ? 'leads' : 'partners';
                const id = partner.id || db.collection(coll).doc().id;
                await db.collection(coll).doc(id).set({ ...partner, id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'getPlatformStaff': {
                if (!isAdmin) throw new Error("Admin only.");
                const snap = await db.collection('platformStaff').where('status', '==', 'active').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
            }

            default: return NextResponse.json({ success: false, error: "Action invalid." }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Admin API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
