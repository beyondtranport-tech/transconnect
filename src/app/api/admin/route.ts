import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * High-Performance Serialization
 * Optimized for datasets of 5,000+ records.
 */
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
 * Robust Data Normalization Layer
 * Maps fragmented AI/External field names into standard CRM schema.
 * Ensures "Edit" forms are fully populated after import.
 */
function normalizePartnerData(data: any) {
    const normalized = { ...data };
    
    // Normalize Company Name
    const rawCompany = (data.companyName || data.company_name || data.company || '').toString().trim();
    if (rawCompany) normalized.companyName = rawCompany;

    // Normalize Email
    const rawEmail = (data.email || '').toString().toLowerCase().trim();
    const aiEmail = (data.email_address || data.emailAddress || '').toString().toLowerCase().trim();
    const isInvalid = (val: string) => !val || val === 'null' || val === 'n/a' || val === 'none' || val === 'undefined';

    if (isInvalid(rawEmail) && !isInvalid(aiEmail)) {
        normalized.email = aiEmail;
    }

    // Normalize Phone
    const rawPhone = (data.phone || data.telephone_number || data.telephoneNumber || data.telephone || data.cell || '').toString().trim();
    if (isInvalid(normalized.phone) && !isInvalid(rawPhone)) {
        normalized.phone = rawPhone;
    }

    // Normalize Address
    const rawAddress = (data.address || data.physical_address || data.physicalAddress || '').toString().trim();
    if (isInvalid(normalized.address) && !isInvalid(rawAddress)) {
        normalized.address = rawAddress;
    }

    // Normalize Website
    const rawUrl = (data.url || data.website || data.site || '').toString().trim();
    if (isInvalid(normalized.website) && !isInvalid(rawUrl)) {
        normalized.website = rawUrl;
    }

    // Normalize Contact Person & Identity Construction (Crucial for CRM Edit Forms)
    const contactPerson = (data.contactPerson || data.contact_person || data.contactPersonName || data.contact || '').toString().trim();
    if (!isInvalid(contactPerson)) {
        normalized.contactPerson = contactPerson;
        
        // If first/last names are missing (common in AI imports), reconstruct them from contactPerson
        if (!normalized.firstName || !normalized.lastName || normalized.firstName === 'Member') {
            const parts = contactPerson.split(' ');
            normalized.firstName = parts[0] || 'Member';
            normalized.lastName = parts.slice(1).join(' ') || 'Candidate';
        }
    }

    return normalized;
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
                    const companyNameClean = (normalized.companyName || '').trim();
                    if (!companyNameClean) continue;

                    // Search for existing by company name to merge data
                    const existingLeads = await db.collection('leads').where('companyName', '==', companyNameClean).get();
                    const ref = !existingLeads.empty ? existingLeads.docs[0].ref : db.collection('leads').doc();
                    const partnerRef = db.collection('partners').doc(ref.id);
                    
                    const existingData = !existingLeads.empty ? existingLeads.docs[0].data() : null;
                    const email = (normalized.email || '').toString().toLowerCase().trim();
                    const hasContactInfo = !!email && email !== 'null' && email !== 'n/a';
                    
                    const updateData = {
                        ...normalized,
                        id: ref.id,
                        role: leadRole,
                        status: hasContactInfo ? 'qualified' : (existingData?.status || 'contacted'),
                        researchStatus: 'completed', // Mark as Green in UI
                        updatedAt: FieldValue.serverTimestamp(),
                        createdAt: existingData ? existingData.createdAt : FieldValue.serverTimestamp()
                    };

                    batch.set(ref, updateData, { merge: true });
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
                    const data = normalizePartnerData(doc.data());
                    mergedMap.set(doc.id, { id: doc.id, entryType: 'Member', ...serializeTimestamps(data) });
                });
                
                leadsSnap.docs.forEach(doc => {
                    const existing = mergedMap.get(doc.id);
                    const leadData = normalizePartnerData(doc.data());
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
                    batch.set(db.collection('partners').doc(id), { status: 'contacted', researchStatus: 'researching', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                }
                await batch.commit();
                return NextResponse.json({ success: true });
            }
            case 'resetResearchQueue': {
                const { type } = payload;
                const roleMapping: Record<string, string> = {
                    'transporter': 'Transporters',
                    'supplier': 'Vendors',
                    'partner': 'Strategic Partners',
                    'isa': 'ISA Agents (Elite)'
                };
                const leadRole = roleMapping[type] || type;
                
                const snap = await db.collection('leads')
                    .where('role', '==', leadRole)
                    .where('researchStatus', '==', 'researching')
                    .get();

                const batch = db.batch();
                let count = 0;
                snap.docs.forEach(doc => {
                    const update = { researchStatus: null, status: 'new', updatedAt: FieldValue.serverTimestamp() };
                    batch.update(doc.ref, update);
                    batch.set(db.collection('partners').doc(doc.id), update, { merge: true });
                    count++;
                });

                if (count > 0) await batch.commit();
                return NextResponse.json({ success: true, count });
            }
            case 'findDuplicateLeads': {
                const snap = await db.collection('leads').get();
                const grouped = new Map<string, any[]>();
                snap.docs.forEach(doc => {
                    const data = normalizePartnerData(doc.data());
                    const name = (data.companyName || '').trim().toLowerCase();
                    if (!name) return;
                    if (!grouped.has(name)) grouped.set(name, []);
                    grouped.get(name)!.push({ id: doc.id, ...serializeTimestamps(data) });
                });
                const duplicates = Array.from(grouped.values()).filter(group => group.length > 1);
                return NextResponse.json({ success: true, data: duplicates });
            }
            case 'deleteLeads': {
                const batch = db.batch();
                payload.leadIds.forEach((id: string) => {
                    batch.delete(db.collection('leads').doc(id));
                    batch.delete(db.collection('partners').doc(id));
                });
                await batch.commit();
                return NextResponse.json({ success: true });
            }
            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) })) });
            }
            case 'getMembers': {
                const snap = await db.collection('companies').get();
                return NextResponse.json({ success: true, data: snap.docs.map(doc => {
                    const data = normalizePartnerData(doc.data());
                    return { id: doc.id, ...serializeTimestamps(data) };
                }) });
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
            default:
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
