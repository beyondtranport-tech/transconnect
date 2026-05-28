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
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            newDocData[key] = serializeTimestamps(value);
        } else {
            newDocData[key] = value;
        }
    }
    return newDocData;
}

/**
 * Universal Data Normalization & Intelligent Categorization
 */
function normalizePartnerData(data: any) {
    const result: any = {};

    const isPlaceholder = (val: any) => {
        if (!val) return true;
        const low = val.toString().toLowerCase().trim();
        if (low.startsWith('the director of') || low.startsWith('the manager of') || low.startsWith('the owner of')) return true;
        return [
            'member', 'candidate', 'null', 'n/a', 'none', 'undefined', 'n a', 'unknown', 
            'null@null.com', 'the director', 'the manager', 'director', 'manager', 
            'branch manager', 'managing director', 'ceo of', 'the owner', 'owner',
            'ceo of company', 'owner of company', 'md of company'
        ].includes(low) || low.length < 2;
    }

    const idKeys = ['record_id', 'recordId', 'id', 'record', 'uid', 'recordid'];
    for (const key of idKeys) {
        const val = data[key]?.toString().trim();
        if (val && val.length > 5 && !['null', 'none'].includes(val.toLowerCase())) {
            result.record_id = val;
            break;
        }
    }

    const maps = {
        companyName: ['company_name', 'companyName', 'company', 'name', 'business_name', 'business'],
        email: ['email_address', 'emailAddress', 'mail', 'email', 'e_mail'],
        phone: ['telephone_number', 'telephone', 'phone_number', 'cell', 'mobile', 'contact_number', 'tel', 'phone'],
        address: ['physical_address', 'physicalAddress', 'location', 'address', 'street'],
        website: ['url', 'site', 'website', 'website_url', 'web']
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

    const contactKeys = ['contact_person', 'contactPerson', 'contact', 'person', 'owner', 'director', 'manager', 'leadership'];
    let contactVal = '';
    for (const key of contactKeys) {
        const val = data[key]?.toString().trim();
        if (val && !isPlaceholder(val)) {
            contactVal = val;
            break;
        }
    }

    if (contactVal) {
        result.contactPerson = contactVal;
        const parts = contactVal.split(' ');
        result.firstName = parts[0];
        result.lastName = parts.slice(1).join(' ') || '';
    }

    const name = (result.companyName || '').toLowerCase();
    if (name.includes('forward')) {
        result.entryType = 'Forwarder';
    } else if (name.includes('distrib')) {
        result.entryType = 'Distribution';
    } else if (name.includes('warehouse')) {
        result.entryType = 'Warehousing';
    } else if (name.includes('logistics') || name.includes('supply')) {
        result.entryType = 'Logistics';
    } else if (name.includes('truck') || name.includes('transport') || name.includes('haul') || name.includes('carrier') || name.includes('vervoer')) {
        result.entryType = 'Transport';
    } else if (name.includes('courier') || name.includes('express')) {
        result.entryType = 'Courier';
    } else if (name.includes('shipping') || name.includes('maritime') || name.includes('port')) {
        result.entryType = 'Port';
    } else {
        result.entryType = 'General';
    }

    return result;
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
             const allowedUserActions = ['getAuditLogs', 'logCommunication', 'bulkSavePartners', 'getPartnersByType', 'markLeadsAsResearching', 'getPlatformStaff', 'findDuplicateLeads', 'deleteLeads', 'resetResearchQueue', 'bulkUpdateOutreach', 'bulkCategorizeLeads'];
             if (!allowedUserActions.includes(action)) throw new Error("Forbidden.");
        }

        switch (action) {
            case 'getMembers': {
                // FETCH: Companies (Live), Users (Identities), and engaged Leads (Funnel Successes)
                const [companiesSnap, usersSnap, leadsSnap] = await Promise.all([
                    db.collection('companies').get(),
                    db.collection('users').get(),
                    db.collection('leads').where('status', 'in', ['active', 'invited', 'qualified']).get()
                ]);

                const userMap = new Map();
                usersSnap.docs.forEach(u => userMap.set(u.id, u.data()));

                const companyLeadIds = new Set();
                const liveMembers = companiesSnap.docs.map(doc => {
                    const company = doc.data();
                    const owner = userMap.get(company.ownerId) || {};
                    if (company.leadId) companyLeadIds.add(company.leadId);
                    return {
                        id: doc.id,
                        ...serializeTimestamps(company),
                        firstName: owner.firstName || 'User',
                        lastName: owner.lastName || (doc.id.slice(0, 4)),
                        email: owner.email || 'N/A',
                        source: company.leadId ? 'AI Converted' : 'Organic Sign-up'
                    };
                });

                // PROVISIONAL MEMBERS: Leads that reached the success stage but haven't signed up yet
                const engagedLeads = leadsSnap.docs
                    .filter(doc => !companyLeadIds.has(doc.id))
                    .map(doc => {
                        const rawLead = doc.data();
                        const lead = normalizePartnerData(rawLead);
                        return {
                            id: doc.id,
                            ...serializeTimestamps(rawLead),
                            companyName: lead.companyName || 'Provisional Co.',
                            firstName: lead.firstName || 'Member',
                            lastName: lead.lastName || '(Lead)',
                            email: lead.email || 'N/A',
                            membershipId: 'free',
                            status: rawLead.status || 'new',
                            source: 'AI Funnel',
                            leadId: doc.id,
                            provisional: true
                        };
                    });

                return NextResponse.json({ success: true, data: [...liveMembers, ...engagedLeads] });
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

                const [partnersSnap, leadsSnap, companiesSnap] = await Promise.all([
                    db.collection('partners').where('type', '==', type).get(),
                    db.collection('leads').where('role', 'in', rolesToSearch).get(),
                    db.collection('companies').get()
                ]);

                const companyLeadIndex = new Map();
                companiesSnap.docs.forEach(c => {
                    const cData = c.data();
                    if (cData.leadId) companyLeadIndex.set(cData.leadId, c.id);
                });

                const mergedMap = new Map();
                partnersSnap.docs.forEach(doc => {
                    const pData = doc.data();
                    const isLive = companyLeadIndex.has(doc.id);
                    mergedMap.set(doc.id, { 
                        id: doc.id, 
                        entryType: isLive ? 'Member' : 'Lead',
                        ...serializeTimestamps(pData),
                        status: isLive ? 'active' : (pData.status || 'new')
                    });
                });
                
                leadsSnap.docs.forEach(doc => {
                    const existing = mergedMap.get(doc.id);
                    const leadData = doc.data();
                    const isLive = companyLeadIndex.has(doc.id);
                    mergedMap.set(doc.id, { 
                        ...(existing || {}), 
                        ...serializeTimestamps(leadData), 
                        id: doc.id, 
                        entryType: isLive ? 'Member' : (existing ? (existing.entryType) : 'Lead'),
                        status: isLive ? 'active' : (leadData.status || (existing?.status) || 'new')
                    });
                });
                return NextResponse.json({ success: true, data: Array.from(mergedMap.values()) });
            }

            case 'bulkCategorizeLeads': {
                const snap = await db.collection('leads').get();
                const partnersSnap = await db.collection('partners').get();
                const batch = db.batch();
                let count = 0;
                
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    const normalized = normalizePartnerData(data);
                    if (normalized.entryType !== data.entryType) {
                        const update = { entryType: normalized.entryType, updatedAt: FieldValue.serverTimestamp() };
                        batch.set(doc.ref, update, { merge: true });
                        count++;
                    }
                });

                partnersSnap.docs.forEach(doc => {
                    const data = doc.data();
                    const normalized = normalizePartnerData(data);
                    if (normalized.entryType !== data.entryType) {
                        const update = { entryType: normalized.entryType, updatedAt: FieldValue.serverTimestamp() };
                        batch.set(doc.ref, update, { merge: true });
                    }
                });

                if (count > 0) await batch.commit();
                return NextResponse.json({ success: true, count });
            }
            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) })) });
            }
            case 'savePlatformStaff': {
                const { staff } = payload;
                const ref = staff.id ? db.collection('platformStaff').doc(staff.id) : db.collection('platformStaff').doc();
                await ref.set({ ...staff, id: ref.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true });
            }
            case 'deletePlatformStaff': {
                await db.collection('platformStaff').doc(payload.staffId).delete();
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
                        pendingShops: shopsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                        proposedAgreements: agreementsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
                    } 
                });
            }
            case 'findDuplicateLeads': {
                const snap = await db.collection('leads').get();
                const groups: Record<string, any[]> = {};
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    const name = (data.companyName || '').trim().toLowerCase();
                    if (name) {
                        if (!groups[name]) groups[name] = [];
                        groups[name].push({ id: doc.id, source: 'Lead', ...data });
                    }
                });
                const duplicates = Object.values(groups).filter(g => g.length > 1);
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
            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const batch = db.batch();
                let updatedCount = 0;
                for (const p of partners) {
                    const normalized = normalizePartnerData(p);
                    const targetId = normalized.record_id;
                    if (!targetId) continue;
                    const leadRef = db.collection('leads').doc(targetId);
                    const partnerRef = db.collection('partners').doc(targetId);
                    
                    const currentSnap = await leadRef.get();
                    const currentData = currentSnap.data();

                    let nextStatus = currentData?.status || 'new';
                    if (!['active', 'registered'].includes(nextStatus)) {
                        if (normalized.email && normalized.contactPerson) {
                            nextStatus = 'qualified';
                        } else {
                            nextStatus = 'contacted'; 
                        }
                    }

                    const updateData: any = {
                        ...normalized,
                        status: nextStatus,
                        researchStatus: 'completed',
                        updatedAt: FieldValue.serverTimestamp()
                    };
                    
                    batch.set(leadRef, updateData, { merge: true });
                    batch.set(partnerRef, { ...updateData, type: currentData?.type || type }, { merge: true });
                    updatedCount++;
                }
                await batch.commit();
                return NextResponse.json({ success: true, message: `Import complete. ${updatedCount} records updated.`, updatedCount });
            }
            case 'resetResearchQueue': {
                const [leadsSnap, partnersSnap] = await Promise.all([
                    db.collection('leads').where('researchStatus', '==', 'researching').get(),
                    db.collection('partners').where('researchStatus', '==', 'researching').get()
                ]);
                const batch = db.batch();
                let count = 0;
                const processed = new Set();
                const resetObj = { researchStatus: FieldValue.delete() };
                leadsSnap.docs.forEach(doc => {
                    batch.update(doc.ref, resetObj);
                    batch.set(db.collection('partners').doc(doc.id), resetObj, { merge: true });
                    processed.add(doc.id);
                    count++;
                });
                partnersSnap.docs.forEach(doc => {
                    if (!processed.has(doc.id)) {
                        batch.update(doc.ref, resetObj);
                        batch.set(db.collection('leads').doc(doc.id), resetObj, { merge: true });
                        count++;
                    }
                });
                if (count > 0) await batch.commit();
                return NextResponse.json({ success: true, count });
            }
            case 'markLeadsAsResearching': {
                const { leadIds } = payload;
                const batch = db.batch();
                for (const id of leadIds) {
                    const update = { 
                        researchStatus: 'researching',
                        status: 'contacted', 
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
            case 'logCommunication': {
                const { partnerId, type, subject, notes } = payload;
                const ref = db.collection('partners').doc(partnerId).collection('communications').doc();
                await ref.set({ id: ref.id, type, subject, notes: notes || '', timestamp: FieldValue.serverTimestamp() });
                
                const newStatus = subject.toLowerCase().includes('handshake') ? 'invited' : 'contacted';
                
                const update = { 
                    lastOutreachSubject: subject, 
                    lastOutreachAt: FieldValue.serverTimestamp(), 
                    status: newStatus,
                    updatedAt: FieldValue.serverTimestamp() 
                };
                
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
                    if (name) { if (!nameMap.has(name)) nameMap.set(name, []); nameMap.set(name, [...nameMap.get(name), doc]); }
                    if (email) { if (!emailMap.has(email)) emailMap.set(email, []); emailMap.set(email, [...emailMap.get(email), doc]); }
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
