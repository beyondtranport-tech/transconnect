
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

export async function POST(req: NextRequest) {
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) throw new Error(`Admin SDK failed: ${initError}`);

        const authorization = req.headers.get('authorization');
        if (!authorization?.startsWith('Bearer ')) throw new Error('Unauthorized.');
        const token = authorization.split('Bearer ')[1];
        
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        
        const { action, payload } = await req.json();
        const db = getFirestore(app);
        
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';
        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        const MAX_LOAD = 500;

        switch (action) {
            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(MAX_LOAD).get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                let q = db.collection('partners').orderBy('updatedAt', 'desc').limit(MAX_LOAD);
                if (type && type !== 'all') {
                    q = db.collection('partners').where('type', '==', type).orderBy('updatedAt', 'desc').limit(MAX_LOAD);
                }
                const snap = await q.get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(MAX_LOAD).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'logForensicInitiated': {
                const { partnerId, isLead } = payload;
                const collectionName = isLead ? 'leads' : 'partners';
                await db.collection(collectionName).doc(partnerId).set({
                    researchStatus: 'searching',
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true });
            }

            case 'bulkLogForensicInitiated': {
                const { leadIds, type } = payload;
                const collectionName = type === 'lead' ? 'leads' : 'partners';
                const batch = db.batch();
                leadIds.forEach((id: string) => {
                    batch.set(db.collection(collectionName).doc(id), {
                        researchStatus: 'searching',
                        updatedAt: FieldValue.serverTimestamp()
                    }, { merge: true });
                });
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                if (!Array.isArray(partners)) throw new Error("Invalid payload.");
                
                const collectionName = type === 'lead' ? 'leads' : 'partners';
                const batch = db.batch();
                
                partners.forEach((p: any) => {
                    const docId = p.record_id || p.id || p.seq?.toString();
                    if (!docId) return;

                    const ref = db.collection(collectionName).doc(docId);
                    
                    const normalizedP: any = {};
                    Object.keys(p).forEach(k => {
                        const cleanKey = k.toLowerCase().trim().replace(/[\s_-]+/g, '');
                        normalizedP[cleanKey] = p[k];
                    });

                    // Anti-Falsing logic for Websites
                    let website = normalizedP.website || normalizedP.officialwebsite || normalizedP.url || '';
                    if (website.toLowerCase().includes('sars.gov.za') || website.toLowerCase().includes('gov.za') || website.toLowerCase().includes('infoisinfo')) {
                        website = '';
                    }

                    const technicalNotes = normalizedP.notes || normalizedP.primaryservices || normalizedP.aboutus || normalizedP.services || '';
                    const address = normalizedP.address || normalizedP.physicaladdress || '';
                    const contactName = normalizedP.contactperson || normalizedP.humanname || '';

                    const updateData: any = { 
                        updatedAt: FieldValue.serverTimestamp()
                    };

                    const hasRealData = (technicalNotes && technicalNotes !== 'null') || (website && website !== 'null');
                    if (hasRealData) {
                        updateData.researchStatus = 'completed';
                        updateData.enrichedAt = FieldValue.serverTimestamp();
                    }

                    if (technicalNotes && technicalNotes !== 'null') updateData.notes = technicalNotes;
                    if (website && website !== 'null') updateData.website = website;
                    if (address && address !== 'null') updateData.address = address;
                    
                    if (contactName && contactName !== 'null') {
                        updateData.contactPerson = contactName;
                        const parts = contactName.split(' ');
                        updateData.firstName = parts[0];
                        if (parts.length > 1) updateData.lastName = parts.slice(1).join(' ');
                    }

                    if (normalizedP.email && normalizedP.email !== 'null') updateData.email = normalizedP.email;
                    if (normalizedP.mobile && normalizedP.mobile !== 'null') updateData.mobile = normalizedP.mobile;
                    if (normalizedP.phone && normalizedP.phone !== 'null') updateData.phone = normalizedP.phone;
                    
                    batch.set(ref, updateData, { merge: true });
                });
                
                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'savePartner': {
                const { partner } = payload;
                const collectionName = partner.type === 'lead' ? 'leads' : 'partners';
                const ref = partner.id ? db.collection(collectionName).doc(partner.id) : db.collection(collectionName).doc();
                const data = { ...partner, id: ref.id, updatedAt: FieldValue.serverTimestamp() };
                if (!partner.id) data.createdAt = FieldValue.serverTimestamp();
                await ref.set(data, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'refreshSupplierCategoryCounts':
            case 'refreshTransporterCategoryCounts':
            case 'refreshFinanceCategoryCounts':
            case 'refreshDriverCategoryCounts': {
                const typeMap: any = {
                    'refreshSupplierCategoryCounts': 'supplier',
                    'refreshTransporterCategoryCounts': 'transporter',
                    'refreshFinanceCategoryCounts': 'finance',
                    'refreshDriverCategoryCounts': 'driver'
                };
                const pType = typeMap[action];
                const snap = await db.collection('partners').where('type', '==', pType).get();
                const counts: any = {};
                snap.docs.forEach(d => {
                    const cat = d.data().industrial_category || d.data().category || 'General';
                    counts[cat] = (counts[cat] || 0) + 1;
                });
                const configId = action.includes('Supplier') ? 'supplierDiscoveryStats' : 
                                 action.includes('Transporter') ? 'transporterDiscoveryStats' :
                                 action.includes('Finance') ? 'financeDiscoveryStats' : 'driverDiscoveryStats';
                
                await db.collection('configuration').doc(configId).set({
                    counts,
                    lastUpdated: FieldValue.serverTimestamp()
                }, { merge: true });
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
