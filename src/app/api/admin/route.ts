
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

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
                        decodedToken.email === 'michael@logisticsflow.co.za' ||
                        decodedToken.admin === true;

        const db = getFirestore(app);
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.data();
        
        const isAssociate = userData?.role === 'associate' || userData?.declaredPosition === 'associate';

        if (!isAdmin && !isAssociate) throw new Error("Forbidden: Elevated access required.");

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};

        switch (action) {
            case 'searchRegistry': {
                const { type, term, limit = 100 } = payload;
                let results: any[] = [];

                if (type === 'lead' || type === 'all') {
                    let q: any = db.collection('leads');
                    if (term) {
                        q = q.where('companyName', '>=', term).where('companyName', '<=', term + '\uf8ff');
                    }
                    const snap = await q.orderBy('companyName').limit(limit).get();
                    results = [...results, ...snap.docs.map(d => ({ id: d.id, source: 'Lead', ...d.data() }))];
                }

                if (type !== 'lead') {
                    let q: any = db.collection('partners');
                    if (type !== 'all') {
                        q = q.where('type', '==', type);
                    }
                    if (term) {
                        q = q.where('companyName', '>=', term).where('companyName', '<=', term + '\uf8ff');
                    }
                    const snap = await q.limit(limit).get();
                    results = [...results, ...snap.docs.map(d => ({ id: d.id, source: 'Partner', ...d.data() }))];
                }

                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                const snap = await db.collection('partners').where('type', '==', type).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'savePartner': {
                const { partner } = payload;
                if (!partner || !partner.type) throw new Error("Invalid partner data.");
                
                const id = partner.id || db.collection('partners').doc().id;
                const data = {
                    ...partner,
                    id,
                    updatedAt: FieldValue.serverTimestamp()
                };
                if (!partner.id) data.createdAt = FieldValue.serverTimestamp();

                await db.collection('partners').doc(id).set(data, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'deletePartner': {
                const { partnerId } = payload;
                await db.collection('partners').doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'savePlatformStaff': {
                const { staff } = payload;
                const id = staff.id || db.collection('platformStaff').doc().id;
                await db.collection('platformStaff').doc(id).set({ ...staff, id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'getAudienceCommunications': {
                const { type } = payload;
                // Complex aggregation: finding all communications for a specific type of partner
                const partnersSnap = await db.collection('partners').where('type', '==', type).get();
                const partnerIds = partnersSnap.docs.map(d => d.id);
                
                if (partnerIds.length === 0) return NextResponse.json({ success: true, data: [] });

                let allLogs: any[] = [];
                // Chunk to stay within Firestore 'in' limit of 30 if using queries, 
                // but since these are subcollections, we iterate.
                const logPromises = partnerIds.slice(0, 20).map(pid => 
                    db.collection('partners').doc(pid).collection('communications').orderBy('timestamp', 'desc').limit(5).get()
                );
                
                const logSnaps = await Promise.all(logPromises);
                logSnaps.forEach((snap, idx) => {
                    const partner = partnersSnap.docs.find(d => d.id === partnerIds[idx])?.data();
                    snap.forEach(d => allLogs.push({ 
                        ...d.data(), 
                        id: d.id, 
                        partnerName: partner?.companyName || partner?.firstName || 'Partner' 
                    }));
                });

                return NextResponse.json({ success: true, data: allLogs.sort((a,b) => b.timestamp - a.timestamp).map(serializeTimestamps) });
            }

            case 'getAudienceTasks': {
                const { type } = payload;
                const partnersSnap = await db.collection('partners').where('type', '==', type).get();
                const partnerIds = partnersSnap.docs.map(d => d.id);
                
                if (partnerIds.length === 0) return NextResponse.json({ success: true, data: [] });

                let allTasks: any[] = [];
                const taskPromises = partnerIds.slice(0, 20).map(pid => 
                    db.collection('partners').doc(pid).collection('tasks').where('status', '==', 'pending').get()
                );
                
                const taskSnaps = await Promise.all(taskPromises);
                taskSnaps.forEach((snap, idx) => {
                    const partner = partnersSnap.docs.find(d => d.id === partnerIds[idx])?.data();
                    snap.forEach(d => allTasks.push({ 
                        ...d.data(), 
                        id: d.id, 
                        partnerName: partner?.companyName || partner?.firstName || 'Partner' 
                    }));
                });

                return NextResponse.json({ success: true, data: allTasks.map(serializeTimestamps) });
            }

            case 'getMyNetwork': {
                const companyId = userData?.companyId;
                if (!companyId) throw new Error("Missing company profile.");
                
                const leadsSnap = await db.collection('leads').where('referrerId', '==', companyId).get();
                const leads = leadsSnap.docs.map(d => ({ id: d.id, source: 'Lead', ...d.data() }));
                
                const membersSnap = await db.collection('companies').where('referrerId', '==', companyId).get();
                const members = membersSnap.docs.map(d => ({ id: d.id, source: 'Member', ...d.data() }));
                
                return NextResponse.json({ success: true, data: [...leads, ...members].map(serializeTimestamps) });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('updatedAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

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

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'saveCompanyLead': {
                const { lead, companyId } = payload;
                if (!lead || !lead.companyName) throw new Error("Invalid lead data.");
                
                const finalReferrerId = companyId || userData?.companyId;
                if (!finalReferrerId) throw new Error("Could not attribute lead: No company ID found.");

                const id = lead.id || db.collection('leads').doc().id;
                const leadData = {
                    ...lead,
                    id,
                    referrerId: finalReferrerId,
                    updatedAt: FieldValue.serverTimestamp(),
                };
                
                if (!lead.id) leadData.createdAt = FieldValue.serverTimestamp();
                await db.collection('leads').doc(id).set(leadData, { merge: true });
                
                return NextResponse.json({ success: true, id });
            }

            case 'logCommunication': {
                const { partnerId, type, subject, notes, collection: collName = 'leads' } = payload;
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

            default: return NextResponse.json({ success: false, error: "Action invalid." }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Admin API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
