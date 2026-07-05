
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
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) throw new Error(`Admin SDK failed: ${initError}`);

        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized.');
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
            case 'deletePartner': {
                const { partnerId, source = 'Partner' } = payload;
                const coll = source === 'Lead' ? 'leads' : 'partners';
                await db.collection(coll).doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }
            case 'invitePartner': {
                const { partnerId } = payload;
                await db.collection('partners').doc(partnerId).update({ 
                    invitationStatus: 'invited', 
                    status: 'invited', 
                    updatedAt: FieldValue.serverTimestamp() 
                });
                return NextResponse.json({ success: true });
            }

            // --- SUPPLIER MALL (SHOPS) ---
            case 'getShops': {
                const snap = await db.collectionGroup('shops').orderBy('updatedAt', 'desc').get();
                const shops = snap.docs.map(d => ({ id: d.id, path: d.ref.path, ...d.data() }));
                return NextResponse.json({ success: true, data: shops.map(serializeTimestamps) });
            }
            case 'approveShop': {
                const { shopId, companyId } = payload;
                const shopRef = db.doc(`companies/${companyId}/shops/${shopId}`);
                const publicRef = db.collection('shops').doc(shopId);
                
                await db.runTransaction(async (transaction) => {
                    const shopSnap = await transaction.get(shopRef);
                    if (!shopSnap.exists) throw new Error("Shop record not found.");
                    const data = shopSnap.data()!;
                    
                    transaction.update(shopRef, { status: 'approved', updatedAt: FieldValue.serverTimestamp() });
                    transaction.set(publicRef, { 
                        ...data, 
                        status: 'approved', 
                        updatedAt: FieldValue.serverTimestamp(),
                        companyId 
                    }, { merge: true });
                });
                return NextResponse.json({ success: true });
            }

            // --- LOADS MALL ---
            case 'getBrokerAgreements': {
                const snap = await db.collectionGroup('brokerAgreements').orderBy('status', 'asc').orderBy('createdAt', 'desc').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, path: d.ref.path, ...d.data() })).map(serializeTimestamps) });
            }
            case 'getGlobalLoads': {
                const snap = await db.collectionGroup('loads').orderBy('status', 'asc').orderBy('createdAt', 'desc').limit(200).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })).map(serializeTimestamps) });
            }

            // --- FORENSIC OVERSIGHT & COMMUNICATION ---
            case 'logCommunication': {
                const { partnerId, type, subject, notes, collection = 'partners' } = payload;
                const logRef = db.collection(collection).doc(partnerId).collection('communications').doc();
                await logRef.set({ 
                    id: logRef.id, 
                    type, 
                    subject, 
                    notes, 
                    adminId: decodedToken.uid, 
                    timestamp: FieldValue.serverTimestamp() 
                });
                await db.collection(collection).doc(partnerId).update({ 
                    lastOutreachAt: FieldValue.serverTimestamp(), 
                    lastOutreachSubject: subject, 
                    updatedAt: FieldValue.serverTimestamp() 
                });
                return NextResponse.json({ success: true });
            }
            case 'getAudienceCommunications': {
                const { type } = payload; // e.g. 'transporter'
                const partnersSnap = await db.collection('partners').where('type', '==', type).get();
                const partnerIds = partnersSnap.docs.map(d => d.id);
                
                if (partnerIds.length === 0) return NextResponse.json({ success: true, data: [] });

                const commsPromises = partnerIds.map(id => 
                    db.collection('partners').doc(id).collection('communications').orderBy('timestamp', 'desc').get()
                );
                const results = await Promise.all(commsPromises);
                const allComms = results.flatMap((snap, i) => snap.docs.map(d => ({
                    ...d.data(),
                    partnerName: partnersSnap.docs[i].data().companyName || partnersSnap.docs[i].data().firstName,
                    partnerType: type
                })));

                return NextResponse.json({ success: true, data: allComms.sort((a:any, b:any) => b.timestamp - a.timestamp).map(serializeTimestamps) });
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

            default: return NextResponse.json({ success: false, error: "Action not supported." }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Failure [${action}]:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
