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
        if (name.includes('forward')) result.entryType = 'Forwarder';
        else if (name.includes('distrib')) result.entryType = 'Distribution';
        else if (name.includes('warehouse')) result.entryType = 'Warehousing';
        else if (name.includes('logistics')) result.entryType = 'Logistics';
        else if (name.includes('truck') || name.includes('transport')) result.entryType = 'Transport';
        else if (name.includes('bank') || name.includes('finance')) result.entryType = 'Asset Finance';
        else if (name.includes('insur')) result.entryType = 'Insurance';
        else result.entryType = result.entryType || 'General';
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
             const allowedUserActions = ['getAuditLogs', 'logCommunication', 'bulkSavePartners', 'getPartnersByType', 'markLeadsAsResearching', 'getPlatformStaff', 'findDuplicateLeads', 'deleteLeads', 'resetResearchQueue', 'bulkUpdateOutreach', 'bulkCategorizeLeads', 'getSupplierCategoryCounts', 'refreshSupplierCategoryCounts', 'refreshFinanceCategoryCounts'];
             if (!allowedUserActions.includes(action)) throw new Error("Forbidden.");
        }

        switch (action) {
            case 'refreshSupplierCategoryCounts': {
                const supplierRoles = ['Vendors', 'Vendor', 'Supplier', 'Suppliers'];
                const leadsSnap = await db.collection('leads').where('role', 'in', supplierRoles).get();
                const counts: Record<string, number> = {};
                leadsSnap.docs.forEach(doc => {
                    const cat = doc.data().entryType || 'General';
                    counts[cat] = (counts[cat] || 0) + 1;
                });
                await db.collection('configuration').doc('supplierDiscoveryStats').set({ counts, lastUpdated: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, data: counts });
            }

            case 'refreshFinanceCategoryCounts': {
                const financeRoles = ['Investors', 'Investor', 'Finance', 'Funder', 'Lender'];
                const leadsSnap = await db.collection('leads').where('role', 'in', financeRoles).get();
                const counts: Record<string, number> = {};
                leadsSnap.docs.forEach(doc => {
                    const cat = doc.data().entryType || 'General';
                    counts[cat] = (counts[cat] || 0) + 1;
                });
                await db.collection('configuration').doc('financeDiscoveryStats').set({ counts, lastUpdated: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, data: counts });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                if (type === 'all') {
                    const [pSnap, lSnap] = await Promise.all([db.collection('partners').get(), db.collection('leads').get()]);
                    const mergedMap = new Map();
                    [...pSnap.docs, ...lSnap.docs].forEach(doc => mergedMap.set(doc.id, { id: doc.id, ...serializeTimestamps(doc.data()) }));
                    return NextResponse.json({ success: true, data: Array.from(mergedMap.values()) });
                }

                const inclusiveRoleMapping: Record<string, string[]> = {
                    'transporter': ['Transporters', 'Transporter', 'Logistics', 'Transport'],
                    'supplier': ['Vendors', 'Vendor', 'Supplier', 'Suppliers'],
                    'partner': ['Strategic Partners', 'Partner'],
                    'isa': ['ISA Agents (Elite)', 'ISA'],
                    'investor': ['Investors', 'Investor', 'Finance', 'Funder', 'Lender'],
                    'developer': ['Developers', 'Developer']
                };

                const rolesToSearch = inclusiveRoleMapping[type] || [type];
                const [pSnap, lSnap] = await Promise.all([
                    db.collection('partners').where('type', '==', type).get(),
                    db.collection('leads').where('role', 'in', rolesToSearch).get()
                ]);

                const mergedMap = new Map();
                [...pSnap.docs, ...lSnap.docs].forEach(doc => {
                    const existing = mergedMap.get(doc.id);
                    mergedMap.set(doc.id, { ...(existing || {}), ...serializeTimestamps(doc.data()), id: doc.id });
                });
                return NextResponse.json({ success: true, data: Array.from(mergedMap.values()) });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const batch = db.batch();
                let updatedCount = 0;
                const roleMap: Record<string, string> = {
                    'supplier': 'Vendors',
                    'transporter': 'Transporters',
                    'isa': 'ISA Agents (Elite)',
                    'partner': 'Strategic Partners',
                    'investor': 'Investors'
                };

                for (const p of partners) {
                    const normalized = normalizePartnerData(p);
                    const targetId = normalized.record_id || `IMP_${type.toUpperCase()}_${Math.random().toString(36).substring(7)}`;
                    const updateData = {
                        ...normalized,
                        id: targetId,
                        role: normalized.role || roleMap[type] || 'General',
                        status: 'new',
                        researchStatus: 'completed',
                        updatedAt: FieldValue.serverTimestamp()
                    };
                    batch.set(db.collection('leads').doc(targetId), updateData, { merge: true });
                    batch.set(db.collection('partners').doc(targetId), { ...updateData, type }, { merge: true });
                    updatedCount++;
                }
                await batch.commit();
                return NextResponse.json({ success: true, updatedCount });
            }

            case 'savePartner': {
                const { partner } = payload;
                const id = partner.id || db.collection('partners').doc().id;
                const update = { ...partner, id, updatedAt: FieldValue.serverTimestamp() };
                await Promise.all([
                    db.collection('partners').doc(id).set(update, { merge: true }),
                    db.collection('leads').doc(id).set(update, { merge: true })
                ]);
                return NextResponse.json({ success: true });
            }

            case 'deletePartner': {
                const { partnerId } = payload;
                await Promise.all([
                    db.collection('partners').doc(partnerId).delete(),
                    db.collection('leads').doc(partnerId).delete()
                ]);
                return NextResponse.json({ success: true });
            }

            case 'logCommunication': {
                const { partnerId, type, subject, notes } = payload;
                const logRef = db.collection('partners').doc(partnerId).collection('communications').doc();
                await Promise.all([
                    logRef.set({ type, subject, notes: notes || '', timestamp: FieldValue.serverTimestamp() }),
                    db.collection('partners').doc(partnerId).update({ lastOutreachAt: FieldValue.serverTimestamp(), lastOutreachSubject: subject, status: 'contacted' }),
                    db.collection('leads').doc(partnerId).update({ lastOutreachAt: FieldValue.serverTimestamp(), lastOutreachSubject: subject, status: 'contacted' })
                ]);
                return NextResponse.json({ success: true });
            }

            case 'getPlatformStaff': {
                const staffSnap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: staffSnap.docs.map(d => ({ id: d.id, ...d.data() })) });
            }

            case 'markLeadsAsResearching': {
                const { leadIds } = payload;
                const batch = db.batch();
                leadIds.forEach((id: string) => {
                    batch.set(db.collection('leads').doc(id), { researchStatus: 'researching', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                    batch.set(db.collection('partners').doc(id), { researchStatus: 'researching', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                });
                await batch.commit();
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
