import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// Helper to convert Firestore Timestamps to JSON-serializable strings
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

/**
 * ADMIN MASTER API
 * Centralized authority for platform operations, financial reconciliation, 
 * and forensic registry management.
 */
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

        // Security Shield: Verify Admin status
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || 
                        decodedToken.email === 'mkoton100@gmail.com' || 
                        decodedToken.email === 'michael@logisticsflow.co.za' ||
                        decodedToken.admin === true;

        if (!isAdmin) {
            throw new Error("Access Denied: Administrative authority required.");
        }

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};

        if (!action) throw new Error("No operational action provided.");

        switch (action) {
            // --- REGISTRY & CRM ACTIONS ---
            
            case 'searchRegistry': {
                const { type, term, limit = 20000, outreachFilter } = payload;
                let results: any[] = [];
                
                if (type === 'all') {
                    const [leadsSnap, partnersSnap] = await Promise.all([
                        db.collection('leads').limit(1000).get(),
                        db.collection('partners').limit(1000).get()
                    ]);
                    results = [
                        ...leadsSnap.docs.map(d => ({ id: d.id, source: 'Lead', ...d.data() })),
                        ...partnersSnap.docs.map(d => ({ id: d.id, source: 'Partner', ...d.data() }))
                    ];
                } else {
                    const [leadsSnap, partnersSnap] = await Promise.all([
                        db.collection('leads').where('type', '==', type).limit(limit).get(),
                        db.collection('partners').where('type', '==', type).limit(limit).get()
                    ]);
                    results = [
                        ...leadsSnap.docs.map(d => ({ id: d.id, source: 'Lead', ...d.data() })),
                        ...partnersSnap.docs.map(d => ({ id: d.id, source: 'Partner', ...d.data() }))
                    ];
                }

                if (term) {
                    const lowTerm = term.toLowerCase();
                    results = results.filter(r => 
                        (r.companyName || r.company_name || '').toLowerCase().includes(lowTerm) ||
                        (r.contactPerson || r.contact_person || '').toLowerCase().includes(lowTerm) ||
                        (r.id || '').toLowerCase().includes(lowTerm)
                    );
                }

                if (outreachFilter === 'none') {
                    results = results.filter(r => !r.lastOutreachAt);
                }

                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                const [pSnap, lSnap] = await Promise.all([
                    db.collection('partners').where('type', '==', type).get(),
                    db.collection('leads').where('type', '==', type).get()
                ]);
                const results = [
                    ...pSnap.docs.map(d => ({ id: d.id, source: 'Partner', ...d.data() })),
                    ...lSnap.docs.map(d => ({ id: d.id, source: 'Lead', ...d.data() }))
                ];
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'savePartner': {
                const { partner, collection: targetColl = 'partners' } = payload;
                const id = partner.id || db.collection(targetColl).doc().id;
                const ref = db.collection(targetColl).doc(id);
                await ref.set({ ...partner, id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const batch = db.batch();
                const coll = type === 'lead' ? 'leads' : 'partners';
                
                partners.forEach((p: any) => {
                    const id = p.record_id || p.id || db.collection(coll).doc().id;
                    const ref = db.collection(coll).doc(id);
                    batch.set(ref, { 
                        ...p, 
                        id, 
                        type: p.type || type, 
                        updatedAt: FieldValue.serverTimestamp() 
                    }, { merge: true });
                });
                
                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'findDuplicates': {
                const { type } = payload;
                const [lSnap, pSnap] = await Promise.all([
                    db.collection('leads').where('type', '==', type).get(),
                    db.collection('partners').where('type', '==', type).get()
                ]);
                const records = [
                    ...lSnap.docs.map(d => ({ id: d.id, source: 'Lead', ...d.data() })),
                    ...pSnap.docs.map(d => ({ id: d.id, source: 'Partner', ...d.data() }))
                ];
                
                const groups: Record<string, any[]> = {};
                records.forEach((r: any) => {
                    const name = (r.companyName || r.company_name || r.trading_name || '').toLowerCase().trim();
                    const email = (r.email || r.email_address || '').toLowerCase().trim();
                    
                    // Group only if we have both name and email for forensic certainty
                    if (!name || !email) return;
                    
                    const compositeKey = `${name}|${email}`;
                    if (!groups[compositeKey]) groups[compositeKey] = [];
                    groups[compositeKey].push(r);
                });
                
                const duplicates = Object.values(groups).filter(g => g.length > 1);
                return NextResponse.json({ success: true, data: duplicates.map(serializeTimestamps) });
            }

            case 'deleteLeads': {
                const { leadIds } = payload;
                const batch = db.batch();
                leadIds.forEach((id: string) => {
                    batch.delete(db.collection('leads').doc(id));
                });
                await batch.commit();
                return NextResponse.json({ success: true });
            }
            
            case 'deletePartners': {
                const { partnerIds } = payload;
                const batch = db.batch();
                partnerIds.forEach((id: string) => {
                    batch.delete(db.collection('partners').doc(id));
                });
                await batch.commit();
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
                return NextResponse.json({ success: true });
            }

            case 'deletePlatformStaff': {
                await db.collection('platformStaff').doc(payload.staffId).delete();
                return NextResponse.json({ success: true });
            }

            case 'logCommunication': {
                const { partnerId, subject, notes, collection: providedColl, type: channel } = payload;
                const targetColl = providedColl || 'partners';
                const parentRef = db.collection(targetColl).doc(partnerId);
                const logRef = parentRef.collection('communications').doc();
                
                await logRef.set({ 
                    id: logRef.id, 
                    type: channel || 'Email', 
                    subject, 
                    notes: notes || '', 
                    timestamp: FieldValue.serverTimestamp(), 
                    adminId: decodedToken.uid 
                });
                
                await parentRef.update({ 
                    lastOutreachAt: FieldValue.serverTimestamp(), 
                    lastOutreachSubject: subject, 
                    updatedAt: FieldValue.serverTimestamp() 
                });
                
                return NextResponse.json({ success: true });
            }

            case 'dispatchEngagement': {
                const { partnerId, email, subject, html, audience } = payload;
                const isLead = partnerId.startsWith('DISC_') || partnerId.includes('lead');
                const targetColl = isLead ? 'leads' : 'partners';
                const parentRef = db.collection(targetColl).doc(partnerId);
                
                const logRef = parentRef.collection('communications').doc();
                await logRef.set({
                    id: logRef.id,
                    type: 'Email (Automated)',
                    subject: `Automated: ${subject}`,
                    notes: `Transactional dispatch via system bridge. Audience: ${audience}`,
                    timestamp: FieldValue.serverTimestamp(),
                    adminId: decodedToken.uid
                });

                await parentRef.update({
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true, message: "Dispatched and Logged." });
            }

            case 'getAudienceCommunications': {
                const { type } = payload;
                const snap = await db.collectionGroup('communications').orderBy('timestamp', 'desc').limit(200).get();
                const filtered = snap.docs
                    .map(doc => ({ id: doc.id, path: doc.ref.path, ...doc.data() }))
                    .filter((log: any) => log.path.includes(`/${type}s/`) || log.path.includes(`/leads/`));
                
                return NextResponse.json({ success: true, data: filtered.map(serializeTimestamps) });
            }

            case 'getAudienceTasks': {
                const { type } = payload;
                const snap = await db.collectionGroup('tasks').orderBy('createdAt', 'desc').limit(200).get();
                const filtered = snap.docs
                    .map(doc => ({ id: doc.id, path: doc.ref.path, ...doc.data() }))
                    .filter((t: any) => t.path.includes(`/${type}s/`) || t.path.includes(`/leads/`));
                
                return NextResponse.json({ success: true, data: filtered.map(serializeTimestamps) });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').get();
                const members = await Promise.all(snap.docs.map(async (doc) => {
                    const data = doc.data();
                    const ownerSnap = await db.collection('users').doc(data.ownerId).get();
                    const ownerData = ownerSnap.data();
                    return {
                        id: doc.id,
                        ...serializeTimestamps(data),
                        firstName: ownerData?.firstName || 'Unknown',
                        lastName: ownerData?.lastName || '',
                        email: ownerData?.email || 'N/A'
                    };
                }));
                return NextResponse.json({ success: true, data: members });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map((d: any) => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getLendingData': {
                const { collectionName } = payload;
                const snap = await db.collection(collectionName).limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map((d:any) => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'saveLendingAgreement': {
                const { agreement } = payload;
                const id = agreement.id || db.collection('agreements').doc().id;
                await db.collection('agreements').doc(id).set({ ...agreement, id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'approvePayout': {
                const { companyId, payoutId, amount } = payload;
                const batch = db.batch();
                const companyRef = db.collection('companies').doc(companyId);
                const payoutRef = companyRef.collection('payoutRequests').doc(payoutId);
                const txRef = companyRef.collection('transactions').doc();

                batch.update(companyRef, {
                    walletBalance: FieldValue.increment(-amount),
                    availableBalance: FieldValue.increment(-amount),
                    updatedAt: FieldValue.serverTimestamp()
                });
                batch.update(payoutRef, { status: 'approved', updatedAt: FieldValue.serverTimestamp() });
                batch.set(txRef, {
                    id: txRef.id,
                    type: 'debit',
                    amount,
                    description: 'Wallet Payout (Approved)',
                    date: FieldValue.serverTimestamp(),
                    status: 'allocated'
                });
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'rejectPayout': {
                const { companyId, payoutId } = payload;
                await db.collection('companies').doc(companyId).collection('payoutRequests').doc(payoutId).update({
                    status: 'rejected',
                    updatedAt: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'autoEnrichRecord': {
                const { id, type } = payload;
                const coll = type === 'lead' ? 'leads' : 'partners';
                const ref = db.collection(coll).doc(id);
                const snap = await ref.get();
                if (!snap.exists) throw new Error("Record not found.");
                
                const data = snap.data()!;
                const companyName = data.companyName || data.trading_name || `${data.firstName} ${data.lastName}`;
                
                const { enrichPartner } = await import('@/ai/flows/enrich-partner-flow');
                const result = await enrichPartner({ companyName });
                
                const update = {
                    ...result,
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                };
                
                await ref.update(update);
                return NextResponse.json({ success: true, data: result });
            }

            case 'bulkLogForensicInitiated': {
                const { leadIds, type } = payload;
                const batch = db.batch();
                const coll = type === 'lead' ? 'leads' : 'partners';
                leadIds.forEach((id: string) => {
                    batch.update(db.collection(coll).doc(id), {
                        status: 'contacted',
                        updatedAt: FieldValue.serverTimestamp()
                    });
                });
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            default: return NextResponse.json({ success: false, error: `Action ${action} not supported.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error("ADMIN_API_ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
