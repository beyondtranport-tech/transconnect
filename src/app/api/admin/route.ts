
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

        // Security Shield: Verify Admin status via email or custom claim
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
                        (r.companyName || '').toLowerCase().includes(lowTerm) ||
                        (r.company_name || '').toLowerCase().includes(lowTerm) ||
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

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'savePartner': {
                const { partner, collection: targetColl = 'partners' } = payload;
                const id = partner.id || db.collection(targetColl).doc().id;
                const ref = db.collection(targetColl).doc(id);
                await ref.set({ ...partner, id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'deletePartner': {
                const { partnerId, source = 'Partner' } = payload;
                const coll = source === 'Lead' ? 'leads' : 'partners';
                await db.collection(coll).doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }

            case 'logCommunication': {
                const { partnerId, subject, notes, collection: providedColl } = payload;
                const targetColl = providedColl || 'partners';
                const parentRef = db.collection(targetColl).doc(partnerId);
                const logRef = parentRef.collection('communications').doc();
                
                await logRef.set({ 
                    id: logRef.id, 
                    type: payload.type || 'Email', 
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
                if (!email || !html) throw new Error("Email and content required for dispatch.");

                // 1. Log the communication
                const isLead = partnerId.startsWith('DISC_') || partnerId.includes('lead');
                const targetColl = isLead ? 'leads' : 'partners';
                const parentRef = db.collection(targetColl).doc(partnerId);
                
                const logRef = parentRef.collection('communications').doc();
                await logRef.set({
                    id: logRef.id,
                    type: 'Email',
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

                // 2. Transmit via transactional bridge
                // Placeholder: In production, this would call SendGrid/AWS SES.
                // We simulate success for the prototype.
                console.log(`[DISPATCH] Sent to ${email}: ${subject}`);

                return NextResponse.json({ success: true, message: "Dispatched successfully." });
            }

            // --- FINANCIAL & WALLET ACTIONS ---

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

            case 'approvePayout': {
                const { companyId, payoutId, amount } = payload;
                const companyRef = db.collection('companies').doc(companyId);
                const payoutRef = companyRef.collection('payoutRequests').doc(payoutId);
                
                await db.runTransaction(async (transaction) => {
                    transaction.update(payoutRef, { status: 'approved', processedAt: FieldValue.serverTimestamp() });
                    transaction.update(companyRef, {
                        walletBalance: FieldValue.increment(-amount),
                        availableBalance: FieldValue.increment(-amount),
                        updatedAt: FieldValue.serverTimestamp()
                    });
                    
                    const txRef = companyRef.collection('transactions').doc();
                    transaction.set(txRef, {
                        transactionId: txRef.id,
                        type: 'debit',
                        amount,
                        date: FieldValue.serverTimestamp(),
                        description: 'Wallet Payout (Withdrawal)',
                        status: 'allocated',
                        chartOfAccountsCode: '7050'
                    });
                });
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

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map((d: any) => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            // --- LENDING PORTAL ACTIONS ---

            case 'getLendingData': {
                const { collectionName, clientId } = payload;
                let ref: any = db.collection(collectionName);
                if (clientId) ref = ref.where('clientId', '==', clientId);
                
                const snap = await ref.limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map((d:any) => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'saveLendingAgreement': {
                const { agreement } = payload;
                const id = agreement.id || db.collection('agreements').doc().id;
                await db.collection('agreements').doc(id).set({
                    ...agreement,
                    id,
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            default: return NextResponse.json({ success: false, error: `Action ${action} not supported.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error("ADMIN_API_ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
