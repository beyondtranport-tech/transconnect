
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
 * Enhanced for NCR and Finance forensics.
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
        companyName: ['company_name', 'companyName', 'company', 'name', 'business_name', 'business', 'legal_name'],
        trading_name: ['trading_name', 'tradingName', 'trade_name'],
        email: ['email_address', 'emailAddress', 'mail', 'email', 'e_mail'],
        phone: ['telephone_number', 'telephone', 'phone_number', 'cell', 'mobile', 'contact_number', 'tel', 'phone'],
        address: ['physical_address', 'physicalAddress', 'location', 'address', 'street'],
        website: ['url', 'site', 'website', 'website_url', 'web'],
        entryType: ['industrial_category', 'category', 'industrialCategory', 'entry_type', 'entryType'],
        role: ['role', 'position', 'type_label'],
        registration_date: ['registration_date', 'final_registration_date', 'reg_date']
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
        const activity = (data.business_activity || '').toLowerCase();
        
        if (name.includes('bank')) result.entryType = 'Banks';
        else if (name.includes('forward') || activity.includes('customs')) result.entryType = 'AEO';
        else if (name.includes('distrib')) result.entryType = 'Distribution';
        else if (name.includes('warehouse')) result.entryType = 'Warehousing';
        else if (name.includes('logistics')) result.entryType = 'Logistics';
        else if (name.includes('truck') || name.includes('transport')) result.entryType = 'Transport';
        else if (name.includes('finance') || activity.includes('lending')) result.entryType = 'Niche Lenders';
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
             const allowedUserActions = ['getAuditLogs', 'logCommunication', 'bulkSavePartners', 'getPartnersByType', 'markLeadsAsResearching', 'getPlatformStaff', 'findDuplicateLeads', 'deleteLeads', 'resetResearchQueue', 'bulkUpdateOutreach', 'bulkCategorizeLeads', 'getSupplierCategoryCounts', 'refreshSupplierCategoryCounts', 'refreshFinanceCategoryCounts', 'getMembers', 'getShops', 'getContributions'];
             if (!allowedUserActions.includes(action)) throw new Error("Forbidden.");
        }

        switch (action) {
            case 'findDuplicateLeads': {
                const leadsSnap = await db.collection('leads').get();
                const membersSnap = await db.collection('companies').get();
                
                const allRecords: any[] = [];
                leadsSnap.docs.forEach(doc => allRecords.push({ ...doc.data(), id: doc.id, source: 'Lead' }));
                membersSnap.docs.forEach(doc => allRecords.push({ ...doc.data(), id: doc.id, source: 'Member' }));

                const groups = new Map<string, any[]>();
                allRecords.forEach(record => {
                    const name = (record.companyName || '').toString().toLowerCase().trim();
                    if (name.length < 3) return;
                    
                    if (!groups.has(name)) groups.set(name, []);
                    groups.get(name)!.push(record);
                });

                const duplicates = Array.from(groups.values()).filter(group => group.length > 1);
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

            case 'resetResearchQueue': {
                const { type } = payload; 
                const snap = await db.collection('leads')
                    .where('researchStatus', '==', 'researching')
                    .get();
                
                const batch = db.batch();
                let count = 0;
                snap.docs.forEach(doc => {
                    batch.update(doc.ref, { researchStatus: 'pending', updatedAt: FieldValue.serverTimestamp() });
                    batch.update(db.collection('partners').doc(doc.id), { researchStatus: 'pending', updatedAt: FieldValue.serverTimestamp() });
                    count++;
                });
                await batch.commit();
                return NextResponse.json({ success: true, count });
            }

            case 'bulkUpdateOutreach': {
                const { entries, subject } = payload;
                const batch = db.batch();
                let count = 0;

                for (const entry of entries) {
                    const isEmail = entry.includes('@');
                    const field = isEmail ? 'email' : 'companyName';
                    const snap = await db.collection('leads').where(field, '==', entry).limit(1).get();
                    
                    if (!snap.empty) {
                        const docRef = snap.docs[0].ref;
                        batch.update(docRef, {
                            status: 'contacted',
                            lastOutreachAt: FieldValue.serverTimestamp(),
                            lastOutreachSubject: subject,
                            updatedAt: FieldValue.serverTimestamp()
                        });
                        batch.update(db.collection('partners').doc(docRef.id), {
                            status: 'contacted',
                            lastOutreachAt: FieldValue.serverTimestamp(),
                            lastOutreachSubject: subject,
                            updatedAt: FieldValue.serverTimestamp()
                        });
                        count++;
                    }
                }
                await batch.commit();
                return NextResponse.json({ success: true, count });
            }

            case 'bulkCategorizeLeads': {
                const snap = await db.collection('leads').get();
                const batch = db.batch();
                let count = 0;

                snap.docs.forEach(doc => {
                    const data = doc.data();
                    const normalized = normalizePartnerData(data);
                    if (normalized.entryType && normalized.entryType !== data.entryType) {
                        batch.update(doc.ref, { entryType: normalized.entryType, updatedAt: FieldValue.serverTimestamp() });
                        batch.update(db.collection('partners').doc(doc.id), { entryType: normalized.entryType, updatedAt: FieldValue.serverTimestamp() });
                        count++;
                    }
                });
                await batch.commit();
                return NextResponse.json({ success: true, count });
            }

            case 'getMembers': {
                const companiesSnap = await db.collection('companies').get();
                const members: any[] = [];
                for (const companyDoc of companiesSnap.docs) {
                    const companyData = companyDoc.data();
                    let userData = null;
                    
                    if (companyData.ownerId && typeof companyData.ownerId === 'string') {
                        const userDoc = await db.collection('users').doc(companyData.ownerId).get();
                        userData = userDoc.data();
                    }
                    
                    members.push({
                        id: companyDoc.id,
                        ...serializeTimestamps(companyData),
                        firstName: userData?.firstName || 'Unknown',
                        lastName: userData?.lastName || 'Member',
                        email: userData?.email || 'N/A'
                    });
                }
                return NextResponse.json({ success: true, data: members });
            }

            case 'getShops': {
                const shopsSnap = await db.collectionGroup('shops').get();
                const shops = shopsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...serializeTimestamps(doc.data())
                }));
                return NextResponse.json({ success: true, data: shops });
            }

            case 'getContributions': {
                const snap = await db.collection('contributions').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                const logs = await Promise.all(snap.docs.map(async d => {
                    const data = d.data();
                    
                    let userName = 'System';
                    let companyName = 'N/A';

                    if (data.userId && typeof data.userId === 'string' && data.userId.length > 0) {
                        const userDoc = await db.collection('users').doc(data.userId).get();
                        const userData = userDoc.data();
                        if (userData) {
                            userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                        }
                    }

                    if (data.companyId && typeof data.companyId === 'string' && data.companyId.length > 0) {
                        const companyDoc = await db.collection('companies').doc(data.companyId).get();
                        const companyData = companyDoc.data();
                        if (companyData) {
                            companyName = companyData.companyName || 'N/A';
                        }
                    }

                    return {
                        id: d.id,
                        ...serializeTimestamps(data),
                        userName,
                        companyName
                    };
                }));
                return NextResponse.json({ success: true, data: logs });
            }

            case 'listAllUsers': {
                const usersResult = await adminAuth.listUsers();
                const users = usersResult.users.map(u => ({
                    uid: u.uid,
                    email: u.email,
                    displayName: u.displayName,
                    disabled: u.disabled,
                    metadata: u.metadata,
                    creationTime: u.metadata.creationTime,
                    lastSignInTime: u.metadata.lastSignInTime,
                }));
                return NextResponse.json({ success: true, data: users });
            }

            case 'approveShop': {
                const { shopId, companyId } = payload;
                if (!shopId || !companyId) throw new Error("Missing shopId or companyId");
                
                const shopRef = db.doc(`companies/${companyId}/shops/${shopId}`);
                await shopRef.update({ status: 'approved', updatedAt: FieldValue.serverTimestamp() });
                
                const shopDoc = await shopRef.get();
                const shopData = shopDoc.data();
                if (shopData) {
                    await db.collection('shops').doc(shopId).set({
                        ...shopData,
                        status: 'approved',
                        updatedAt: FieldValue.serverTimestamp()
                    }, { merge: true });
                }
                return NextResponse.json({ success: true });
            }

            case 'rejectShop': {
                const { shopId, companyId } = payload;
                if (!shopId || !companyId) throw new Error("Missing shopId or companyId");
                
                await db.doc(`companies/${companyId}/shops/${shopId}`).update({ 
                    status: 'rejected', 
                    updatedAt: FieldValue.serverTimestamp() 
                });
                await db.collection('shops').doc(shopId).delete();
                return NextResponse.json({ success: true });
            }

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
                if (!partnerId) throw new Error("Missing partnerId");
                await Promise.all([
                    db.collection('partners').doc(partnerId).delete(),
                    db.collection('leads').doc(partnerId).delete()
                ]);
                return NextResponse.json({ success: true });
            }

            case 'logCommunication': {
                const { partnerId, type, subject, notes } = payload;
                if (!partnerId) throw new Error("Missing partnerId");
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
                    if (id && typeof id === 'string') {
                        batch.set(db.collection('leads').doc(id), { researchStatus: 'researching', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                        batch.set(db.collection('partners').doc(id), { researchStatus: 'researching', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                    }
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
