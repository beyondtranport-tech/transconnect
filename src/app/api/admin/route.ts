
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
        
        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};
        const db = getFirestore(app);
        
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';
        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        const limitSize = 500;
        const offsetVal = Number(payload?.offset) || 0;

        switch (action) {
            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(limitSize).offset(offsetVal).get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                let q = db.collection('partners').orderBy('updatedAt', 'desc').limit(limitSize).offset(offsetVal);
                if (type && type !== 'all') {
                    q = db.collection('partners').where('type', '==', type).orderBy('updatedAt', 'desc').limit(limitSize).offset(offsetVal);
                }
                const snap = await q.get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(limitSize).offset(offsetVal).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getShops': {
                const snap = await db.collectionGroup('shops').orderBy('updatedAt', 'desc').get();
                const data = snap.docs.map(doc => ({ id: doc.id, companyId: doc.ref.parent.parent?.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getContributions': {
                const snap = await db.collection('contributions').orderBy('createdAt', 'desc').limit(100).get();
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
                    const normalizedP: any = {};
                    Object.keys(p).forEach(k => {
                        const cleanKey = k.toLowerCase().trim().replace(/[\s_-]+/g, '');
                        normalizedP[cleanKey] = p[k];
                    });

                    const docId = normalizedP.recordid || normalizedP.id;
                    if (!docId) return;

                    const ref = db.collection(collectionName).doc(docId);
                    
                    let website = normalizedP.website || normalizedP.officialwebsite || normalizedP.url || '';
                    const blacklist = ['sars.gov.za', 'gov.za', 'linkedin.com', 'facebook.com', 'infoisinfo', 'sayellow', 'yellosa', 'braby', 'easyinfo', 'hotfrog', 'cylex', 'yalwa', 'yelp'];
                    if (blacklist.some(d => website.toLowerCase().includes(d))) {
                        website = '';
                    }

                    const technicalNotes = normalizedP.notes || normalizedP.technicalsummary || normalizedP.primaryservices || '';
                    const address = normalizedP.address || normalizedP.physicaladdress || '';
                    const contactName = normalizedP.contactperson || normalizedP.humanname || '';

                    const updateData: any = { 
                        updatedAt: FieldValue.serverTimestamp()
                    };

                    const hasRealData = (technicalNotes && technicalNotes !== 'null' && technicalNotes.length > 5) || 
                                      (website && website !== 'null' && website.length > 5);
                    
                    if (hasRealData) {
                        updateData.researchStatus = 'completed';
                        updateData.enrichedAt = FieldValue.serverTimestamp();
                    }

                    if (technicalNotes && technicalNotes !== 'null') updateData.notes = technicalNotes;
                    if (website && website !== 'null') updateData.website = website;
                    if (address && address !== 'null') updateData.address = address;
                    if (contactName && contactName !== 'null') updateData.contactPerson = contactName;
                    if (normalizedP.email && normalizedP.email !== 'null') updateData.email = normalizedP.email;
                    if (normalizedP.mobile && normalizedP.mobile !== 'null') updateData.mobile = normalizedP.mobile;
                    if (normalizedP.phone && normalizedP.phone !== 'null') updateData.phone = normalizedP.phone;
                    
                    batch.set(ref, updateData, { merge: true });
                });
                
                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'refreshTransporterCategoryCounts':
            case 'refreshSupplierCategoryCounts':
            case 'refreshFinanceCategoryCounts':
            case 'refreshDriverCategoryCounts': {
                const typeMap: Record<string, string> = {
                    refreshTransporterCategoryCounts: 'transporter',
                    refreshSupplierCategoryCounts: 'supplier',
                    refreshFinanceCategoryCounts: 'finance',
                    refreshDriverCategoryCounts: 'driver'
                };
                const configIdMap: Record<string, string> = {
                    refreshTransporterCategoryCounts: 'transporterDiscoveryStats',
                    refreshSupplierCategoryCounts: 'supplierDiscoveryStats',
                    refreshFinanceCategoryCounts: 'financeDiscoveryStats',
                    refreshDriverCategoryCounts: 'driverDiscoveryStats'
                };
                
                const targetType = typeMap[action];
                const configId = configIdMap[action];
                const collectionName = targetType === 'driver' ? 'partners' : 'leads';

                const snap = await db.collection(collectionName).where('type', '==', targetType).get();
                const counts: Record<string, number> = {};
                
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    const category = data.industrial_category || data.category || data.entryType || 'General';
                    counts[category] = (counts[category] || 0) + 1;
                });

                await db.collection('configuration').doc(configId).set({
                    counts,
                    lastUpdated: FieldValue.serverTimestamp()
                }, { merge: true });

                return NextResponse.json({ success: true });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'logCommunication': {
                const { partnerId, type, subject, notes } = payload;
                const col = payload.isLead ? 'leads' : 'partners';
                const ref = db.collection(col).doc(partnerId).collection('communications').doc();
                await ref.set({
                    id: ref.id,
                    type,
                    subject,
                    notes: notes || '',
                    timestamp: FieldValue.serverTimestamp(),
                });
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
