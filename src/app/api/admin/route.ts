
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
            'ceo of company', 'owner of company', 'md of company', '[must_be_unique_for_every_item]'
        ].includes(low) || low.length < 2;
    }

    const idKeys = ['record_id', 'recordId', 'id', 'record', 'uid', 'recordid'];
    for (const key of idKeys) {
        const val = data[key]?.toString().trim();
        if (val && val.length > 5 && !isPlaceholder(val)) {
            result.record_id = val;
            break;
        }
    }

    const maps = {
        companyName: ['company_name', 'companyName', 'company', 'name', 'business_name', 'business'],
        email: ['email_address', 'emailAddress', 'mail', 'email', 'e_mail'],
        phone: ['telephone_number', 'telephone', 'phone_number', 'cell', 'mobile', 'contact_number', 'tel', 'phone'],
        address: ['physical_address', 'physicalAddress', 'location', 'address', 'street'],
        website: ['url', 'site', 'website', 'website_url', 'web'],
        entryType: ['industrial_category', 'category', 'industrialCategory', 'entry_type', 'entryType'],
        role: ['role', 'position', 'type_label']
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

    if (!result.entryType || result.entryType === 'General') {
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
            result.entryType = result.entryType || 'General';
        }
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
                const [companiesSnap, usersSnap, leadsSnap, partnersSnap] = await Promise.all([
                    db.collection('companies').get(),
                    db.collection('users').get(),
                    db.collection('leads').where('status', 'in', ['active', 'invited', 'qualified']).get(),
                    db.collection('partners').where('status', 'in', ['active', 'invited', 'qualified']).get()
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
                        source: company.leadId ? 'AI Funnel Success' : 'Direct Registration'
                    };
                });

                const engagedMap = new Map();
                [...leadsSnap.docs, ...partnersSnap.docs].forEach(doc => {
                    if (!companyLeadIds.has(doc.id)) {
                        engagedMap.set(doc.id, doc.data());
                    }
                });

                const engagedLeads = Array.from(engagedMap.entries()).map(([id, rawLead]) => {
                    const lead = normalizePartnerData(rawLead);
                    return {
                        id: id,
                        ...serializeTimestamps(rawLead),
                        companyName: lead.companyName || 'Provisional Co.',
                        firstName: lead.firstName || 'Member',
                        lastName: lead.lastName || '(Lead)',
                        email: lead.email || 'N/A',
                        membershipId: 'free',
                        status: rawLead.status || 'new',
                        source: 'AI Funnel Success',
                        leadId: id,
                        provisional: true
                    };
                });

                return NextResponse.json({ success: true, data: [...liveMembers, ...engagedLeads] });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                
                if (type === 'all') {
                    const [partnersSnap, leadsSnap] = await Promise.all([
                        db.collection('partners').get(),
                        db.collection('leads').get()
                    ]);
                    
                    const mergedMap = new Map();
                    [...partnersSnap.docs, ...leadsSnap.docs].forEach(doc => {
                        const data = doc.data();
                        mergedMap.set(doc.id, { id: doc.id, ...serializeTimestamps(data) });
                    });
                    
                    return NextResponse.json({ success: true, data: Array.from(mergedMap.values()) });
                }

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

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const batch = db.batch();
                let updatedCount = 0;
                const processedIdsInBatch = new Set<string>();

                const roleMap: Record<string, string> = {
                    'supplier': 'Vendors',
                    'transporter': 'Transporters',
                    'isa': 'ISA Agents (Elite)',
                    'partner': 'Strategic Partners'
                };

                // Fetch existing IDs to prevent overwrite sessions
                const existingLeadsSnap = await db.collection('leads').get();
                const existingIds = new Set(existingLeadsSnap.docs.map(d => d.id));

                for (const p of partners) {
                    const normalized = normalizePartnerData(p);
                    
                    let targetId = normalized.record_id;
                    const nameKey = (normalized.companyName || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '');
                    
                    // If ID is missing, repeated in batch, or already exists for a DIFFERENT company in DB
                    const isMissingOrBatchDuplicate = !targetId || processedIdsInBatch.has(targetId);
                    const isExistingCollision = targetId && existingIds.has(targetId);

                    if (isMissingOrBatchDuplicate || isExistingCollision) {
                        targetId = `DISCOVERY_${type.toUpperCase()}_${nameKey}_${Math.random().toString(36).substring(7)}`;
                    }
                    processedIdsInBatch.add(targetId);

                    const leadRef = db.collection('leads').doc(targetId);
                    const partnerRef = db.collection('partners').doc(targetId);
                    
                    const updateData: any = {
                        ...normalized,
                        id: targetId,
                        role: normalized.role || roleMap[type] || 'General',
                        status: 'new',
                        researchStatus: 'completed',
                        updatedAt: FieldValue.serverTimestamp()
                    };
                    
                    batch.set(leadRef, updateData, { merge: true });
                    batch.set(partnerRef, { ...updateData, type: type }, { merge: true });
                    updatedCount++;
                }
                await batch.commit();
                return NextResponse.json({ success: true, message: `Import complete. ${updatedCount} records processed.`, updatedCount });
            }

            // ... other cases remain unchanged ...
            
            default:
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
