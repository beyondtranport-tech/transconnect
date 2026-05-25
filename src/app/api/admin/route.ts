'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

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
        if (initError || !app) {
            throw new Error(`Admin SDK not initialized: ${initError}`);
        }

        const authorization = req.headers.get('authorization');
        if (!authorization?.startsWith('Bearer ')) {
            throw new Error('Unauthorized: Missing or invalid token.');
        }
        const token = authorization.split('Bearer ')[1];
        
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        const requestorUid = decodedToken.uid;
        
        const { action, payload } = await req.json();
        const db = getFirestore(app);
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';

        if (!isAdmin) {
             const allowedUserActions = ['saveCompanyLead', 'acceptCommercialAgreement', 'getAuditLogs', 'unpublishShop', 'logCommunication'];
             if (!allowedUserActions.includes(action)) {
                 throw new Error("Forbidden: Admin access required.");
             }
        }

        switch (action) {
            case 'logCommunication': {
                const { partnerId, type, subject, notes } = payload;
                const partnerRef = db.collection('partners').doc(partnerId);
                const leadRef = db.collection('leads').doc(partnerId);
                
                const [partnerSnap, leadSnap] = await Promise.all([partnerRef.get(), leadRef.get()]);
                
                const updateData = {
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp(),
                };

                // Update BOTH if they exist, or the appropriate one
                const updateBatch = db.batch();
                if (partnerSnap.exists) updateBatch.set(partnerRef, updateData, { merge: true });
                if (leadSnap.exists) updateBatch.set(leadRef, updateData, { merge: true });
                
                // Always log to the subcollection of the one that exists (prioritize Partner)
                const logTargetRef = partnerSnap.exists ? partnerRef : leadSnap.exists ? leadRef : partnerRef;
                const logRef = logTargetRef.collection('communications').doc();
                
                updateBatch.set(logRef, {
                    id: logRef.id,
                    type,
                    subject,
                    notes: notes || '',
                    timestamp: FieldValue.serverTimestamp(),
                    loggedBy: requestorUid,
                });
                
                await updateBatch.commit();
                return NextResponse.json({ success: true });
            }
            case 'getPartnersByType': {
                const { type } = payload;
                const roleMapping: Record<string, string> = {
                    'transporter': 'Transporters',
                    'supplier': 'Vendors',
                    'partner': 'Strategic Partners',
                    'isa': 'ISA Agents (Elite)',
                    'investor': 'Investors',
                    'developer': 'Developers'
                };
                const leadRole = roleMapping[type] || type;

                const [partnersSnap, leadsSnap] = await Promise.all([
                    db.collection('partners').where('type', '==', type).get(),
                    db.collection('leads').where('role', '==', leadRole).get()
                ]);

                // Intelligent merge by ID to preserve outreach history across collections
                const mergedMap = new Map();
                
                leadsSnap.docs.forEach(doc => {
                    mergedMap.set(doc.id, { id: doc.id, entryType: 'Lead', ...serializeTimestamps(doc.data()) });
                });
                
                partnersSnap.docs.forEach(doc => {
                    const existing = mergedMap.get(doc.id);
                    const partnerData = serializeTimestamps(doc.data());
                    // Merge partner data, keeping outreach fields if partner doc has them, or fallback to lead doc fields
                    mergedMap.set(doc.id, { 
                        ...(existing || {}), 
                        ...partnerData, 
                        id: doc.id, 
                        entryType: 'Partner' 
                    });
                });

                return NextResponse.json({ success: true, data: Array.from(mergedMap.values()) });
            }
            case 'getMembers': {
                const companiesSnap = await db.collection('companies').get();
                const userDocs = await db.collection('users').get();
                const userMap = new Map(userDocs.docs.map(d => [d.id, d.data()]));
                const data = companiesSnap.docs.map(doc => {
                    const c = doc.data();
                    const u = userMap.get(c.ownerId) || {};
                    return { id: doc.id, ...serializeTimestamps(c), firstName: u.firstName, lastName: u.lastName, email: u.email };
                });
                return NextResponse.json({ success: true, data });
            }
            case 'getAuditLogs': {
                const logsSnap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                const data = logsSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }
            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }
            case 'savePlatformStaff': {
                const { staff } = payload;
                const ref = staff.id ? db.collection('platformStaff').doc(staff.id) : db.collection('platformStaff').doc();
                await ref.set({ ...staff, id: ref.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }
            case 'deletePlatformStaff': {
                await db.collection('platformStaff').doc(payload.staffId).delete();
                return NextResponse.json({ success: true });
            }
            case 'saveLead': {
                const { lead } = payload;
                const ref = lead.id ? db.collection('leads').doc(lead.id) : db.collection('leads').doc();
                await ref.set({ ...lead, id: ref.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }
            case 'deleteLead': {
                await db.collection('leads').doc(payload.leadId).delete();
                return NextResponse.json({ success: true });
            }
            case 'savePartner': {
                const { partner } = payload;
                const ref = partner.id ? db.collection('partners').doc(partner.id) : db.collection('partners').doc();
                await ref.set({ ...partner, id: ref.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }
            case 'deletePartner': {
                await db.collection('partners').doc(payload.partnerId).delete();
                return NextResponse.json({ success: true });
            }
            default:
                return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
