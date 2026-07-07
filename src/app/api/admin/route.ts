
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * UTILITY: TIMESTAMP SERIALIZATION
 * Ensures all Firestore Timestamps are converted to ISO strings for the client.
 */
function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    if (docData instanceof Timestamp) return docData.toDate().toISOString();
    if (Array.isArray(docData)) return docData.map(serializeTimestamps);
    if (typeof docData === 'object' && docData !== null) {
        const serialized: { [key: string]: any } = {};
        for (const key in docData) serialized[key] = serializeTimestamps(docData[key]);
        return serialized;
    }
    return docData;
}

export async function POST(req: NextRequest) {
    let currentAction = 'initialization';
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
                        decodedToken.admin === true;

        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        const body = await req.json();
        const { action, payload } = body;
        currentAction = action;

        switch (action) {
            // --- MEMBER & USER OVERSIGHT ---
            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(1000).get();
                const members = await Promise.all(snap.docs.map(async (doc) => {
                    const data = doc.data();
                    const ownerSnap = await db.collection('users').doc(data.ownerId).get();
                    return { 
                        id: doc.id, 
                        ...data, 
                        firstName: ownerSnap.data()?.firstName || 'Member', 
                        lastName: ownerSnap.data()?.lastName || '', 
                        email: ownerSnap.data()?.email || 'N/A' 
                    };
                }));
                return NextResponse.json({ success: true, data: members.map(serializeTimestamps) });
            }
            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(200).get();
                const logs = await Promise.all(snap.docs.map(async (doc) => {
                    const data = doc.data();
                    const userSnap = await db.collection('users').doc(data.userId).get();
                    return { id: doc.id, ...data, userName: userSnap.data()?.firstName || 'System' };
                }));
                return NextResponse.json({ success: true, data: logs.map(serializeTimestamps) });
            }

            // --- REGISTRY MANAGEMENT (CRM) ---
            case 'searchRegistry': {
                const { type, term, outreachFilter, limit = 100 } = payload;
                
                // Determine source collection based on type
                let collectionName = 'leads';
                const partnerTypes = ['driver', 'transporter', 'supplier', 'finance', 'warehouse', 'distributor', 'isa', 'investor', 'developer', 'associate', 'partner', 'loads', 'buy-sell'];
                if (partnerTypes.includes(type)) {
                    collectionName = 'partners';
                }

                let query: any = db.collection(collectionName);

                // If in partners, filter by explicit type
                if (collectionName === 'partners') {
                    query = query.where('type', '==', type);
                }

                // Capped read for performance
                const snap = await query.orderBy('updatedAt', 'desc').limit(limit).get();
                let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                // In-memory filtering for flexible prototype search
                if (term) {
                    const lowTerm = term.toLowerCase();
                    results = results.filter((r: any) => 
                        (r.companyName || '').toLowerCase().includes(lowTerm) ||
                        (r.contactPerson || '').toLowerCase().includes(lowTerm) ||
                        (r.email || '').toLowerCase().includes(lowTerm)
                    );
                }

                if (outreachFilter === 'none') {
                    results = results.filter((r: any) => !r.lastOutreachAt);
                }

                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                const snap = await db.collection('partners').where('type', '==', type).orderBy('updatedAt', 'desc').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })).map(serializeTimestamps) });
            }

            case 'savePartner': {
                const { partner, collection = 'partners' } = payload;
                const ref = db.collection(collection).doc(partner.id || db.collection(collection).doc().id);
                await ref.set({ 
                    ...partner, 
                    id: ref.id, 
                    updatedAt: FieldValue.serverTimestamp(),
                    createdAt: partner.createdAt || FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const batch = db.batch();
                const collectionName = type === 'lead' ? 'leads' : 'partners';
                
                partners.forEach((p: any) => {
                    const ref = db.collection(collectionName).doc(p.record_id || p.id || db.collection(collectionName).doc().id);
                    batch.set(ref, {
                        ...p,
                        id: ref.id,
                        type: type === 'lead' ? 'lead' : type,
                        source: p.source || 'AI Discovery',
                        status: p.status || 'new',
                        updatedAt: FieldValue.serverTimestamp(),
                        createdAt: FieldValue.serverTimestamp()
                    }, { merge: true });
                });

                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'logCommunication': {
                const { partnerId, type, subject, notes, collection = 'partners' } = payload;
                const logRef = db.collection(collection).doc(partnerId).collection('communications').doc();
                
                await db.runTransaction(async (transaction) => {
                    transaction.set(logRef, {
                        id: logRef.id,
                        type,
                        subject,
                        notes,
                        timestamp: FieldValue.serverTimestamp(),
                        adminId: decodedToken.uid,
                        adminName: decodedToken.name || 'Admin'
                    });

                    // Update parent last outreach
                    transaction.update(db.collection(collection).doc(partnerId), {
                        lastOutreachAt: FieldValue.serverTimestamp(),
                        lastOutreachSubject: subject,
                        status: 'contacted',
                        updatedAt: FieldValue.serverTimestamp()
                    });
                });
                return NextResponse.json({ success: true });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })).map(serializeTimestamps) });
            }

            // --- STAFF MANAGEMENT ---
            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
            }
            case 'savePlatformStaff': {
                const { staff } = payload;
                const ref = db.collection('platformStaff').doc(staff.id || db.collection('platformStaff').doc().id);
                await ref.set({ ...staff, id: ref.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true });
            }

            default: return NextResponse.json({ success: false, error: `Action "${action}" not supported.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Failure [${currentAction}]:`, error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Internal Server Error' 
        }, { status: 500 });
    }
}
