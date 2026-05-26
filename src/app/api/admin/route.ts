import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    const newDocData: { [key: string]: any } = {};
    for (const key in docData) {
        const value = docData[key];
        if (value instanceof Timestamp) {
            newDocData[key] = value.toDate().toISOString();
        } else if (value && typeof value === 'object' && value._methodName === 'serverTimestamp') {
            newDocData[key] = new Date().toISOString();
        } else {
            newDocData[key] = value;
        }
    }
    return newDocData;
}

/**
 * Universal Data Normalization
 * Strictly maps diverse AI fields to standard CRM fields (firstName, lastName, email, etc.)
 */
function normalizePartnerData(data: any) {
    const result: any = { ...data };

    const isPlaceholder = (val: string) => 
        !val || 
        ['member', 'candidate', 'null', 'n/a', 'none', 'undefined', 'n a'].includes(val.toString().toLowerCase().trim());

    // Standardize IDs
    if (data.record_id) result.record_id = data.record_id;
    else if (data.id) result.record_id = data.id;

    // 1. Map Core Identifiers
    const maps = {
        companyName: ['company_name', 'company', 'name', 'business_name'],
        email: ['email_address', 'emailAddress', 'mail', 'email'],
        phone: ['telephone_number', 'telephone', 'phone_number', 'cell', 'mobile'],
        address: ['physical_address', 'physicalAddress', 'location'],
        website: ['url', 'site', 'website', 'website_url']
    };

    Object.entries(maps).forEach(([standardKey, aiKeys]) => {
        for (const key of aiKeys) {
            const val = data[key]?.toString().trim();
            if (val && !isPlaceholder(val)) {
                result[standardKey] = val;
                break;
            }
        }
    });

    // 2. Handle Contact Person & Identity
    const rawContact = (data.contact_person || data.contactPerson || data.contact || '').toString().trim();
    if (rawContact && !isPlaceholder(rawContact)) {
        result.contactPerson = rawContact;
        
        // Reconstruct first/last names if currently placeholders or empty
        const currentFirst = (result.firstName || '').toString().toLowerCase();
        if (!currentFirst || currentFirst === 'member' || currentFirst === 'candidate') {
            const parts = rawContact.split(' ');
            result.firstName = parts[0] || 'Member';
            result.lastName = parts.slice(1).join(' ') || 'Candidate';
        }
    }

    return result;
}

/**
 * Improved name normalization for duplicate detection
 */
function normalizeNameForMatch(name: string): string {
    return (name || '')
        .toString()
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\b(pty|ltd|cc|corp|inc|limited|proprietary|south africa|sa)\b/g, '') // Remove legal suffixes
        .replace(/\s+/g, ' ') // Collapse spaces
        .trim();
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
             const allowedUserActions = ['getAuditLogs', 'logCommunication', 'bulkSavePartners', 'getPartnersByType', 'markLeadsAsResearching', 'getPlatformStaff', 'findDuplicateLeads', 'deleteLeads', 'resetResearchQueue', 'bulkUpdateOutreach'];
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
                    const normalized = normalizePartnerData(p);
                    
                    let leadRef;
                    let existingData = null;

                    // ID-FIRST MATCHING
                    if (normalized.record_id && normalized.record_id.length > 5) {
                        leadRef = db.collection('leads').doc(normalized.record_id);
                        const docSnap = await leadRef.get();
                        if (docSnap.exists) existingData = docSnap.data();
                    } else {
                        // Fallback to name matching
                        const companyNameClean = (normalized.companyName || '').trim();
                        if (!companyNameClean) continue;
                        const existingLeads = await db.collection('leads').where('companyName', '==', companyNameClean).get();
                        if (!existingLeads.empty) {
                            leadRef = existingLeads.docs[0].ref;
                            existingData = existingLeads.docs[0].data();
                        } else {
                            leadRef = db.collection('leads').doc();
                        }
                    }

                    const partnerRef = db.collection('partners').doc(leadRef.id);
                    const email = (normalized.email || '').toString().toLowerCase().trim();
                    const hasContactInfo = !!email && email !== 'null' && email !== 'n/a';
                    
                    const updateData = {
                        ...normalized,
                        id: leadRef.id,
                        role: leadRole,
                        status: hasContactInfo ? 'qualified' : (existingData?.status || 'contacted'),
                        researchStatus: 'completed',
                        updatedAt: FieldValue.serverTimestamp(),
                        createdAt: existingData ? (existingData.createdAt || FieldValue.serverTimestamp()) : FieldValue.serverTimestamp()
                    };

                    batch.set(leadRef, updateData, { merge: true });
                    batch.set(partnerRef, { ...updateData, type: type }, { merge: true });
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
                const rolesToSearch = [leadRole];
                if (leadRole.endsWith('s')) rolesToSearch.push(leadRole.slice(0, -1));
                else rolesToSearch.push(leadRole + 's');

                const [partnersSnap, leadsSnap] = await Promise.all([
                    db.collection('partners').where('type', '==', type).get(),
                    db.collection('leads').where('role', 'in', rolesToSearch).get()
                ]);

                const mergedMap = new Map();
                partnersSnap.docs.forEach(doc => {
                    const data = doc.data();
                    mergedMap.set(doc.id, { id: doc.id, entryType: 'Member', ...serializeTimestamps(data) });
                });
                
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
                    const update = { 
                        status: 'contacted', 
                        researchStatus: 'researching',
                        updatedAt: FieldValue.serverTimestamp() 
                    };
                    batch.set(db.collection('leads').doc(id), update, { merge: true });
                    batch.set(db.collection('partners').doc(id), update, { merge: true });
                }
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
                const ref = payload.partner.id ? db.collection('partners').doc(payload.partner.id) : db.collection('partners').doc();
                const normalized = normalizePartnerData(payload.partner);
                const data = { ...normalized, id: ref.id, updatedAt: FieldValue.serverTimestamp() };
                const batch = db.batch();
                batch.set(ref, data, { merge: true });
                batch.set(db.collection('leads').doc(ref.id), data, { merge: true });
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
                const ref = payload.lead.id ? db.collection('leads').doc(payload.lead.id) : db.collection('leads').doc();
                const normalized = normalizePartnerData(payload.lead);
                const data = { ...normalized, id: ref.id, updatedAt: FieldValue.serverTimestamp() };
                const batch = db.batch();
                batch.set(ref, data, { merge: true });
                batch.set(db.collection('partners').doc(ref.id), data, { merge: true });
                await batch.commit();
                return NextResponse.json({ success: true });
            }
            case 'deleteLead': {
                const batch = db.batch();
                batch.delete(db.collection('leads').doc(payload.leadId));
                batch.delete(db.collection('partners').doc(payload.leadId));
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
                await ref.set({ id: ref.id, type, subject, notes: notes || '', timestamp: FieldValue.serverTimestamp() });
                const update = { lastOutreachSubject: subject, lastOutreachAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
                await Promise.all([
                    db.collection('partners').doc(partnerId).set(update, { merge: true }),
                    db.collection('leads').doc(partnerId).set(update, { merge: true })
                ]);
                return NextResponse.json({ success: true });
            }
            case 'bulkUpdateOutreach': {
                const { entries, subject } = payload;
                if (!entries || !Array.isArray(entries)) throw new Error("Invalid entries.");
                const snap = await db.collection('leads').get();
                const nameMap = new Map();
                const emailMap = new Map();
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    const name = (data.companyName || '').trim().toLowerCase();
                    const email = (data.email || '').trim().toLowerCase();
                    if (name) { if (!nameMap.has(name)) nameMap.set(name, []); nameMap.get(name).push(doc); }
                    if (email) { if (!emailMap.has(email)) emailMap.set(email, []); emailMap.get(email).push(doc); }
                });
                const batch = db.batch();
                let count = 0;
                const processed = new Set();
                for (const entry of entries) {
                    const clean = entry.trim().toLowerCase();
                    if (!clean) continue;
                    const matches = [...(nameMap.get(clean) || []), ...(emailMap.get(clean) || [])];
                    matches.forEach(docRef => {
                        if (!processed.has(docRef.id)) {
                            const update = { lastOutreachSubject: subject, lastOutreachAt: FieldValue.serverTimestamp(), status: 'contacted', updatedAt: FieldValue.serverTimestamp() };
                            batch.update(docRef.ref, update);
                            batch.set(db.collection('partners').doc(docRef.id), update, { merge: true });
                            processed.add(docRef.id);
                            count++;
                        }
                    });
                }
                if (count > 0) await batch.commit();
                return NextResponse.json({ success: true, count });
            }
            case 'findDuplicateLeads': {
                // Cross-collection duplicate check
                const [leadsSnap, partnersSnap] = await Promise.all([
                    db.collection('leads').get(),
                    db.collection('partners').get()
                ]);

                const masterList: any[] = [];
                leadsSnap.docs.forEach(doc => masterList.push({ id: doc.id, source: 'Lead', ...doc.data() }));
                partnersSnap.docs.forEach(doc => masterList.push({ id: doc.id, source: 'Member', ...doc.data() }));

                const nameMap = new Map<string, any[]>();
                masterList.forEach(item => {
                    const name = normalizeNameForMatch(item.companyName);
                    if (!name) return;
                    if (!nameMap.has(name)) nameMap.set(name, []);
                    nameMap.get(name)!.push(item);
                });

                const duplicates = Array.from(nameMap.entries())
                    .filter(([name, group]) => {
                        // A duplicate is identified by DIFFERENT IDs for the SAME company name
                        const uniqueIds = new Set(group.map(g => g.id));
                        return uniqueIds.size > 1;
                    })
                    .map(([name, group]) => {
                        // De-duplicate records by ID within the group (if the same ID is in both collections)
                        const uniqueRecords: any[] = [];
                        const seenIds = new Set();
                        group.forEach(rec => {
                            if (!seenIds.has(rec.id)) {
                                seenIds.add(rec.id);
                                uniqueRecords.push(rec);
                            }
                        });
                        return uniqueRecords;
                    });

                return NextResponse.json({ success: true, data: duplicates });
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
            case 'resetResearchQueue': {
                const snap = await db.collection('leads').where('researchStatus', '==', 'researching').get();
                const batch = db.batch();
                let count = 0;
                snap.docs.forEach(doc => {
                    const reset = { researchStatus: FieldValue.delete(), status: 'new' };
                    batch.update(doc.ref, reset);
                    batch.set(db.collection('partners').doc(doc.id), reset, { merge: true });
                    count++;
                });
                await batch.commit();
                return NextResponse.json({ success: true, count });
            }
            default:
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
