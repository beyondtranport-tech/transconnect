
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

// Helper to convert Firestore Timestamps to JSON-serializable strings
function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    const newDocData: { [key: string]: any } = {};
    for (const key in docData) {
        const value = docData[key];
        if (value instanceof Timestamp) {
            newDocData[key] = value.toDate().toISOString();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            newDocData[key] = serializeTimestamps(value);
        } else {
            newDocData[key] = value;
        }
    }
    return newDocData;
}

export async function POST(req: NextRequest) {
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) throw new Error(`Admin SDK not initialized: ${initError}`);

        const authorization = req.headers.get('authorization');
        if (!authorization?.startsWith('Bearer ')) throw new Error('Unauthorized.');
        const token = authorization.split('Bearer ')[1];
        
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        const requestorUid = decodedToken.uid;
        
        const { action, payload } = await req.json();
        const db = getFirestore(app);
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';

        if (!isAdmin) {
             const allowedUserActions = ['getAuditLogs', 'logCommunication', 'bulkSavePartners'];
             if (!allowedUserActions.includes(action)) throw new Error("Forbidden.");
        }

        switch (action) {
            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const batch = db.batch();
                const roleMapping: Record<string, string> = {
                    'transporter': 'Transporters',
                    'supplier': 'Vendors',
                    'partner': 'Strategic Partners',
                    'isa': 'ISA Agents (Elite)'
                };
                const leadRole = roleMapping[type] || type;
                
                for (const p of partners) {
                    const companyNameClean = p.companyName.trim();
                    const existingLeads = await db.collection('leads').where('companyName', '==', companyNameClean).get();
                    const ref = !existingLeads.empty ? existingLeads.docs[0].ref : db.collection('leads').doc();
                    
                    batch.set(ref, {
                        ...p,
                        id: ref.id,
                        role: leadRole,
                        status: p.email ? 'qualified' : 'new',
                        updatedAt: FieldValue.serverTimestamp(),
                        createdAt: FieldValue.serverTimestamp() 
                    }, { merge: true });
                }
                
                await batch.commit();
                return NextResponse.json({ success: true });
            }
            case 'getPartnersByType': {
                const { type } = payload;
                const roleMapping: Record<string, string> = {
                    'transporter': 'Transporters',
                    'supplier': 'Vendors',
                    'partner': 'Strategic Partners',
                    'isa': 'ISA Agents (Elite)'
                };
                const leadRole = roleMapping[type] || type;

                const [partnersSnap, leadsSnap] = await Promise.all([
                    db.collection('partners').where('type', '==', type).get(),
                    db.collection('leads').where('role', '==', leadRole).get()
                ]);

                const mergedMap = new Map();
                leadsSnap.docs.forEach(doc => {
                    mergedMap.set(doc.id, { id: doc.id, entryType: 'Lead', ...serializeTimestamps(doc.data()) });
                });
                partnersSnap.docs.forEach(doc => {
                    const existing = mergedMap.get(doc.id);
                    mergedMap.set(doc.id, { 
                        ...(existing || {}), 
                        ...serializeTimestamps(doc.data()), 
                        id: doc.id, 
                        entryType: existing ? 'Member' : 'Partner' 
                    });
                });
                return NextResponse.json({ success: true, data: Array.from(mergedMap.values()) });
            }
            case 'markLeadsAsResearching': {
                const { leadIds } = payload;
                const batch = db.batch();
                for (const id of leadIds) {
                    const leadRef = db.collection('leads').doc(id);
                    const partnerRef = db.collection('partners').doc(id);
                    const updateData = { status: 'contacted', lastOutreachSubject: 'AI Research Batch', lastOutreachAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
                    batch.set(leadRef, updateData, { merge: true });
                    batch.set(partnerRef, updateData, { merge: true });
                }
                await batch.commit();
                return NextResponse.json({ success: true });
            }
            case 'deleteLeads': {
                const { leadIds } = payload;
                const batch = db.batch();
                for (const id of leadIds) {
                    batch.delete(db.collection('leads').doc(id));
                    batch.delete(db.collection('partners').doc(id));
                }
                await batch.commit();
                return NextResponse.json({ success: true });
            }
            case 'findDuplicateLeads': {
                const snap = await db.collection('leads').get();
                const grouped = new Map<string, any[]>();
                snap.docs.forEach(doc => {
                    const name = (doc.data().companyName || '').toLowerCase().trim();
                    if (!name) return;
                    if (!grouped.has(name)) grouped.set(name, []);
                    grouped.get(name)!.push({ id: doc.id, ...serializeTimestamps(doc.data()) });
                });
                const duplicates = Array.from(grouped.values()).filter(group => group.length > 1);
                return NextResponse.json({ success: true, data: duplicates });
            }
            case 'getShops': {
                const snap = await db.collectionGroup('shops').get();
                return NextResponse.json({ success: true, data: snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) })) });
            }
            case 'approveShop': {
                const { shopId, companyId } = payload;
                await db.doc(`companies/${companyId}/shops/${shopId}`).update({ status: 'approved', updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }
            case 'rejectShop': {
                const { shopId, companyId } = payload;
                await db.doc(`companies/${companyId}/shops/${shopId}`).update({ status: 'rejected', updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }
            case 'logCommunication': {
                const { partnerId, type, subject, notes } = payload;
                const updateData = { lastOutreachAt: FieldValue.serverTimestamp(), lastOutreachSubject: subject, status: 'contacted' };
                const batch = db.batch();
                batch.set(db.collection('partners').doc(partnerId), updateData, { merge: true });
                batch.set(db.collection('leads').doc(partnerId), updateData, { merge: true });
                const logRef = db.collection('partners').doc(partnerId).collection('communications').doc();
                batch.set(logRef, { id: logRef.id, type, subject, notes: notes || '', timestamp: FieldValue.serverTimestamp(), loggedBy: requestorUid });
                await batch.commit();
                return NextResponse.json({ success: true });
            }
            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) })) });
            }
            case 'getMembers': {
                const snap = await db.collection('companies').get();
                return NextResponse.json({ success: true, data: snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) })) });
            }
            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) })) });
            }
            case 'savePlatformStaff': {
                const ref = payload.staff.id ? db.collection('platformStaff').doc(payload.staff.id) : db.collection('platformStaff').doc();
                await ref.set({ ...payload.staff, id: ref.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true });
            }
            case 'deletePlatformStaff': {
                await db.collection('platformStaff').doc(payload.staffId).delete();
                return NextResponse.json({ success: true });
            }
            case 'savePartner': {
                const { partner } = payload;
                const ref = partner.id ? db.collection('partners').doc(partner.id) : db.collection('partners').doc();
                await ref.set({ ...partner, id: ref.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true });
            }
            case 'deletePartner': {
                await db.collection('partners').doc(payload.partnerId).delete();
                return NextResponse.json({ success: true });
            }
            case 'getDashboardQueues': {
                const [shopsSnap, agreementsSnap] = await Promise.all([
                    db.collectionGroup('shops').where('status', '==', 'pending_review').get(),
                    db.collectionGroup('agreements').where('status', '==', 'proposed').get()
                ]);
                return NextResponse.json({ 
                    success: true, 
                    data: { 
                        pendingShops: shopsSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) })),
                        proposedAgreements: agreementsSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }))
                    } 
                });
            }
            case 'getContributions': {
                const snap = await db.collection('contributions').orderBy('createdAt', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) })) });
            }
            case 'getWalletPayments': {
                const snap = await db.collectionGroup('walletPayments').get();
                return NextResponse.json({ success: true, data: snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) })) });
            }
            case 'getPendingAgreements': {
                const snap = await db.collectionGroup('agreements').where('status', '==', 'proposed').get();
                return NextResponse.json({ success: true, data: snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) })) });
            }
            default:
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
