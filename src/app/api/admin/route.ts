
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

        switch (action) {
            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                let q = db.collection('partners').orderBy('updatedAt', 'desc').limit(10000);
                if (type && type !== 'all') {
                    q = db.collection('partners').where('type', '==', type).orderBy('updatedAt', 'desc').limit(10000);
                }
                const snap = await q.get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(10000).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getShops': {
                const snap = await db.collectionGroup('shops').where('status', '==', 'approved').orderBy('updatedAt', 'desc').get();
                const data = snap.docs.map(doc => ({ id: doc.id, companyId: doc.ref.parent.parent?.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
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

                const snap = await db.collection('partners').where('type', '==', targetType).get();
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

            case 'savePartner': {
                const { partner } = payload;
                if (!partner.id) {
                    const ref = db.collection('partners').doc();
                    await ref.set({ ...partner, id: ref.id, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
                } else {
                    await db.collection('partners').doc(partner.id).update({ ...partner, updatedAt: FieldValue.serverTimestamp() });
                }
                return NextResponse.json({ success: true });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const batch = db.batch();
                for (const p of partners) {
                    let ref;
                    const cName = p.companyName || p.company_name || p.trading_name || p.name || p.service_handle;
                    
                    if (p.record_id) {
                        ref = db.collection('partners').doc(p.record_id);
                    } else if (cName) {
                        const safeId = String(cName).replace(/[^a-z0-9]/gi, '_').toLowerCase();
                        ref = db.collection('partners').doc(`${type}_${safeId}`);
                    } else {
                        ref = db.collection('partners').doc();
                    }

                    const data = {
                        ...p,
                        type,
                        // Normalization Logic: Map AI Forensic keys to Registry keys
                        companyName: cName,
                        contactPerson: p.contactPerson || p.contact_person || p.leadership || (p.firstName ? `${p.firstName} ${p.lastName}` : null),
                        email: p.email || p.email_address || p.professional_contact,
                        phone: p.phone || p.telephone_number || p.landline,
                        mobile: p.mobile || p.registry_line || p.cell,
                        address: p.address || p.physical_address || p.location || p.operational_hub,
                        industrial_category: p.industrial_category || p.category || p.classification || p.service_classification,
                        updatedAt: FieldValue.serverTimestamp(),
                        enrichedAt: (p.notes || p.website || p.contact_person || p.contact_person) ? FieldValue.serverTimestamp() : null,
                        researchStatus: (p.notes || p.website) ? 'completed' : 'new'
                    };
                    
                    // Clean up raw sequence keys from AI output
                    delete (data as any).seq;
                    delete (data as any).sequence;
                    
                    batch.set(ref, data, { merge: true });
                }
                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'logForensicInitiated': {
                const { partnerId, isLead } = payload;
                const coll = isLead ? 'leads' : 'partners';
                await db.collection(coll).doc(partnerId).update({
                    researchStatus: 'searching',
                    updatedAt: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'bulkLogForensicInitiated': {
                const { leadIds, type } = payload;
                const coll = type === 'lead' ? 'leads' : 'partners';
                const batch = db.batch();
                leadIds.forEach((id: string) => {
                    batch.update(db.collection(coll).doc(id), {
                        researchStatus: 'searching',
                        updatedAt: FieldValue.serverTimestamp()
                    });
                });
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'deletePartner': {
                const { partnerId } = payload;
                await db.collection('partners').doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }

            case 'deleteLeads': {
                const { leadIds } = payload;
                const batch = db.batch();
                leadIds.forEach((id: string) => {
                    batch.delete(db.collection('leads').doc(id));
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
