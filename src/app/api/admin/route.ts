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
                
                for (const p of partners) {
                    // Try to find existing record by name to update instead of duplicate
                    const companyNameClean = p.companyName.trim();
                    const existingLeads = await db.collection('leads').where('companyName', '==', companyNameClean).get();
                    
                    const ref = !existingLeads.empty ? existingLeads.docs[0].ref : db.collection('leads').doc();
                    
                    batch.set(ref, {
                        ...p,
                        id: ref.id,
                        role: type === 'transporter' ? 'Transporters' : type === 'supplier' ? 'Vendors' : type,
                        status: p.email ? 'qualified' : 'new',
                        updatedAt: FieldValue.serverTimestamp(),
                        createdAt: FieldValue.serverTimestamp() // set if new via merge
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
                
                // Process Leads first
                leadsSnap.docs.forEach(doc => {
                    mergedMap.set(doc.id, { id: doc.id, entryType: 'Lead', ...serializeTimestamps(doc.data()) });
                });
                
                // Overlay Partners (merging by ID if they exist in both)
                partnersSnap.docs.forEach(doc => {
                    const existing = mergedMap.get(doc.id);
                    const partnerData = serializeTimestamps(doc.data());
                    mergedMap.set(doc.id, { 
                        ...(existing || {}), 
                        ...partnerData, 
                        id: doc.id, 
                        entryType: existing ? 'Member' : 'Partner' 
                    });
                });

                return NextResponse.json({ success: true, data: Array.from(mergedMap.values()) });
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
            case 'logCommunication': {
                const { partnerId, type, subject, notes } = payload;
                const partnerRef = db.collection('partners').doc(partnerId);
                const leadRef = db.collection('leads').doc(partnerId);
                
                const updateData = { lastOutreachAt: FieldValue.serverTimestamp(), lastOutreachSubject: subject, status: 'contacted' };
                const updateBatch = db.batch();
                updateBatch.set(partnerRef, updateData, { merge: true });
                updateBatch.set(leadRef, updateData, { merge: true });
                
                const logRef = partnerRef.collection('communications').doc();
                updateBatch.set(logRef, { id: logRef.id, type, subject, notes: notes || '', timestamp: FieldValue.serverTimestamp(), loggedBy: requestorUid });
                
                await updateBatch.commit();
                return NextResponse.json({ success: true });
            }
            case 'getMembers': {
                const snap = await db.collection('companies').get();
                return NextResponse.json({ success: true, data: snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) })) });
            }
            default:
                return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
