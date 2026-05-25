import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

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
        
        const { action, payload } = await req.json();
        const db = getFirestore(app);
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';

        if (!isAdmin) {
             const allowedUserActions = ['getAuditLogs', 'logCommunication', 'bulkSavePartners', 'getPartnersByType', 'markLeadsAsResearching', 'getPlatformStaff', 'findDuplicateLeads', 'deleteLeads', 'resetResearchQueue'];
             if (!allowedUserActions.includes(action)) throw new Error("Forbidden.");
        }

        switch (action) {
            case 'findDuplicateLeads': {
                const snap = await db.collection('leads').get();
                const grouped = new Map<string, any[]>();
                
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    const name = (data.companyName || '').trim().toLowerCase();
                    if (!name) return;
                    
                    if (!grouped.has(name)) grouped.set(name, []);
                    grouped.get(name)!.push({ id: doc.id, ...serializeTimestamps(data) });
                });
                
                const duplicates = Array.from(grouped.values()).filter(group => group.length > 1);
                return NextResponse.json({ success: true, data: duplicates });
            }
            case 'deleteLeads': {
                const { leadIds } = payload;
                if (!Array.isArray(leadIds)) throw new Error("Invalid leadIds array.");
                
                const batch = db.batch();
                leadIds.forEach(id => {
                    batch.delete(db.collection('leads').doc(id));
                    batch.delete(db.collection('partners').doc(id));
                });
                
                await batch.commit();
                return NextResponse.json({ success: true });
            }
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
                    const companyNameClean = (p.companyName || '').trim();
                    if (!companyNameClean) continue;

                    // Update all possible matches by name to prevent shadow records
                    const existingLeads = await db.collection('leads').where('companyName', '==', companyNameClean).get();
                    const ref = !existingLeads.empty ? existingLeads.docs[0].ref : db.collection('leads').doc();
                    const partnerRef = db.collection('partners').doc(ref.id);
                    
                    const existingData = !existingLeads.empty ? existingLeads.docs[0].data() : null;
                    const existingStatus = existingData?.status || 'new';

                    const hasContactInfo = !!(p.email_address || p.email || p.telephone_number || p.phone);
                    // If we found data, it's qualified. If we were researching and found nothing, keep it as contacted.
                    const newStatus = hasContactInfo ? 'qualified' : (existingStatus === 'contacted' ? 'contacted' : 'new');

                    const updateData = {
                        ...p,
                        id: ref.id,
                        role: leadRole,
                        status: newStatus,
                        updatedAt: FieldValue.serverTimestamp(),
                        createdAt: existingData ? existingData.createdAt : FieldValue.serverTimestamp()
                    };

                    batch.set(ref, updateData, { merge: true });
                    batch.set(partnerRef, { 
                        ...updateData,
                        type: type 
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
                
                // Broaden role matching to handle singular/plural variations in the database
                const rolesToSearch = [leadRole];
                if (leadRole.endsWith('s')) rolesToSearch.push(leadRole.slice(0, -1));
                else rolesToSearch.push(leadRole + 's');

                const [partnersSnap, leadsSnap] = await Promise.all([
                    db.collection('partners').where('type', '==', type).get(),
                    db.collection('leads').where('role', 'in', rolesToSearch).get()
                ]);

                const mergedMap = new Map();
                // Priority 1: Partners (Registered Members)
                partnersSnap.docs.forEach(doc => {
                    mergedMap.set(doc.id, { id: doc.id, entryType: 'Member', ...serializeTimestamps(doc.data()) });
                });
                
                // Priority 2: Leads (Prospective Data)
                leadsSnap.docs.forEach(doc => {
                    const existing = mergedMap.get(doc.id);
                    const leadData = doc.data();
                    
                    const finalStatus = (existing?.status === 'active' || existing?.status === 'qualified') 
                        ? existing.status 
                        : (leadData.status || existing?.status || 'new');

                    mergedMap.set(doc.id, { 
                        ...(existing || {}), 
                        ...serializeTimestamps(leadData), 
                        status: finalStatus,
                        id: doc.id, 
                        entryType: existing ? 'Member' : 'Lead' 
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
                    
                    const updateData = { 
                        status: 'contacted', 
                        lastOutreachSubject: 'Manual AI Research', 
                        lastOutreachAt: FieldValue.serverTimestamp(), 
                        updatedAt: FieldValue.serverTimestamp() 
                    };

                    batch.set(leadRef, updateData, { merge: true });
                    batch.set(partnerRef, { status: 'contacted', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                }
                
                await batch.commit();
                return NextResponse.json({ success: true });
            }
            case 'resetResearchQueue': {
                const { type } = payload;
                const roleMapping: Record<string, string> = {
                    'transporter': 'Transporters',
                    'supplier': 'Vendors'
                };
                const leadRole = roleMapping[type] || type;
                const rolesToSearch = [leadRole];
                if (leadRole.endsWith('s')) rolesToSearch.push(leadRole.slice(0, -1));
                else rolesToSearch.push(leadRole + 's');

                const snap = await db.collection('leads')
                    .where('role', 'in', rolesToSearch)
                    .where('status', '==', 'contacted')
                    .get();
                
                const batch = db.batch();
                let count = 0;
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    // Only reset if they still don't have an email
                    if (!data.email && !data.email_address) {
                        batch.update(doc.ref, { status: 'new', lastOutreachSubject: null, lastOutreachAt: null });
                        batch.update(db.collection('partners').doc(doc.id), { status: 'new' });
                        count++;
                    }
                });
                if (count > 0) await batch.commit();
                return NextResponse.json({ success: true, count });
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
                const leadRef = db.collection('leads').doc(ref.id);
                
                const data = { ...partner, id: ref.id, updatedAt: FieldValue.serverTimestamp() };
                
                const batch = db.batch();
                batch.set(ref, data, { merge: true });
                batch.set(leadRef, data, { merge: true });
                await batch.commit();
                
                return NextResponse.json({ success: true });
            }
            case 'deletePartner': {
                const batch = db.batch();
                batch.delete(db.collection('partners').doc(payload.partnerId));
                batch.delete(db.collection('leads').doc(payload.partnerId));
                await batch.commit();
                return NextResponse.json({ success: true });
            }
            case 'saveLead': {
                const { lead } = payload;
                const ref = lead.id ? db.collection('leads').doc(lead.id) : db.collection('leads').doc();
                const partnerRef = db.collection('partners').doc(ref.id);
                
                const data = { ...lead, id: ref.id, updatedAt: FieldValue.serverTimestamp() };
                
                const batch = db.batch();
                batch.set(ref, data, { merge: true });
                batch.set(partnerRef, data, { merge: true });
                await batch.commit();
                
                return NextResponse.json({ success: true });
            }
            case 'deleteLead': {
                const { leadId } = payload;
                const batch = db.batch();
                batch.delete(db.collection('leads').doc(leadId));
                batch.delete(db.collection('partners').doc(leadId));
                await batch.commit();
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
                        pendingShops: shopsSnap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })),
                        proposedAgreements: agreementsSnap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }))
                    } 
                });
            }
            case 'logCommunication': {
                const { partnerId, type, subject, notes } = payload;
                const ref = db.collection('partners').doc(partnerId).collection('communications').doc();
                const logData = {
                    id: ref.id,
                    type,
                    subject,
                    notes: notes || '',
                    timestamp: FieldValue.serverTimestamp()
                };
                await ref.set(logData);
                
                const parentRef = db.collection('partners').doc(partnerId);
                const leadRef = db.collection('leads').doc(partnerId);
                const update = {
                    lastOutreachSubject: subject,
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                };
                await Promise.all([
                    parentRef.set(update, { merge: true }),
                    leadRef.set(update, { merge: true })
                ]);
                
                return NextResponse.json({ success: true });
            }
            default:
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
