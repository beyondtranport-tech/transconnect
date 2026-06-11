
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Serializes Firestore timestamps and special FieldValue placeholders into JSON-safe formats.
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
        
        // Critical Admin Check
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';
        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        switch (action) {
            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(100).get();
                const data = await Promise.all(snap.docs.map(async (d) => {
                    const cData = d.data();
                    const userSnap = await db.collection('users').doc(cData.ownerId).get();
                    const uData = userSnap.exists ? userSnap.data() : {};
                    return { 
                        ...serializeTimestamps(cData), 
                        id: d.id,
                        firstName: uData?.firstName || 'N/A',
                        lastName: uData?.lastName || '',
                        email: uData?.email || 'N/A'
                    };
                }));
                return NextResponse.json({ success: true, data });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                let q = db.collection('partners').orderBy('updatedAt', 'desc').limit(100);
                if (type && type !== 'all') {
                    q = db.collection('partners').where('type', '==', type).orderBy('updatedAt', 'desc').limit(100);
                }
                const snap = await q.get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(100).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'searchRegistry': {
                const { term, type } = payload;
                const collectionName = ['driver', 'supplier', 'transporter', 'finance', 'partner', 'isa', 'investor'].includes(type) ? 'partners' : 'leads';
                
                // Using a standardized search limit to prevent quota spikes
                let q = db.collection(collectionName)
                    .where('companyName', '>=', term)
                    .where('companyName', '<=', term + '\uf8ff')
                    .limit(100);
                
                if (type && type !== 'all' && type !== 'lead') {
                    q = q.where('type', '==', type);
                }

                const snap = await q.get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'savePartner': {
                const { partner } = payload;
                const id = partner.id || db.collection('partners').doc().id;
                await db.collection('partners').doc(id).set({ 
                    ...partner, 
                    id, 
                    updatedAt: FieldValue.serverTimestamp() 
                }, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const batch = db.batch();
                partners.forEach((p: any) => {
                    const id = p.record_id || p.id || db.collection('partners').doc().id;
                    const standardized: any = { ...p };
                    
                    if (p.company_name || p.companyName) standardized.companyName = p.company_name || p.companyName;
                    if (p.email_address || p.email) standardized.email = p.email_address || p.email;
                    if (p.telephone_number || p.phone || p.landline) standardized.phone = p.telephone_number || p.phone || p.landline;
                    if (p.mobile_number || p.cell || p.direct_cell || p.mobile) standardized.mobile = p.mobile_number || p.cell || p.direct_cell || p.mobile;
                    if (p.physical_address || p.address) standardized.address = p.physical_address || p.address;
                    if (p.contact_person || p.contactPerson) standardized.contactPerson = p.contact_person || p.contactPerson;
                    
                    delete standardized.record_id;
                    delete standardized.company_name;
                    delete standardized.email_address;
                    delete standardized.telephone_number;
                    delete standardized.mobile_number;
                    delete standardized.cell;
                    delete standardized.direct_cell;
                    delete standardized.physical_address;
                    delete standardized.contact_person;

                    batch.set(db.collection(type === 'lead' ? 'leads' : 'partners').doc(id), {
                        ...standardized,
                        id,
                        type: type === 'lead' ? undefined : type,
                        updatedAt: FieldValue.serverTimestamp()
                    }, { merge: true });
                });
                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'refreshSupplierCategoryCounts':
            case 'refreshTransporterCategoryCounts':
            case 'refreshDriverCategoryCounts':
            case 'refreshFinanceCategoryCounts': {
                const type = action.includes('Supplier') ? 'supplier' : action.includes('Transporter') ? 'transporter' : action.includes('Driver') ? 'driver' : 'finance';
                const statsKey = `${type}DiscoveryStats`;
                
                const roleMap: Record<string, string[]> = {
                    supplier: ['Supplier', 'Vendor'],
                    transporter: ['Transporter', 'Logistics'],
                    driver: ['Driver'],
                    finance: ['Finance', 'Funder', 'Banks']
                };

                const roles = roleMap[type] || [];

                const [partnersSnap, leadsSnap] = await Promise.all([
                    db.collection('partners').where('type', '==', type).limit(1000).get(),
                    db.collection('leads').where('role', 'in', roles).limit(1000).get()
                ]);
                
                const counts: Record<string, number> = {};
                const processDocs = (snap: any) => {
                    snap.docs.forEach((doc: any) => {
                        const data = doc.data();
                        const cat = data.entryType || data.industrial_category || data.category || 'General';
                        counts[cat] = (counts[cat] || 0) + 1;
                    });
                };
                
                processDocs(partnersSnap);
                processDocs(leadsSnap);

                await db.collection('configuration').doc(statsKey).set({
                    counts,
                    lastUpdated: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'logCommunication': {
                const { partnerId, type, subject, notes } = payload;
                const ref = db.collection('partners').doc(partnerId).collection('communications').doc();
                await ref.set({
                    id: ref.id, type, subject, notes,
                    timestamp: FieldValue.serverTimestamp()
                });
                await db.collection('partners').doc(partnerId).set({
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
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
                leadIds.forEach((id: string) => batch.delete(db.collection('leads').doc(id)));
                await batch.commit();
                return NextResponse.json({ success: true, count: leadIds.length });
            }

            case 'getShops': {
                const snap = await db.collectionGroup('shops').orderBy('updatedAt', 'desc').limit(100).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getContributions': {
                const snap = await db.collection('contributions').orderBy('createdAt', 'desc').limit(100).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getStaff': {
                const snap = await db.collectionGroup('staff').limit(100).get();
                const data = snap.docs.map(doc => ({ 
                    id: doc.id, 
                    companyId: doc.ref.parent.parent?.id,
                    ...serializeTimestamps(doc.data()) 
                }));
                return NextResponse.json({ success: true, data });
            }

            case 'listAllUsers': {
                const auth = getAuth(app);
                const listUsers = await auth.listUsers(100);
                const data = listUsers.users.map(u => ({
                    uid: u.uid,
                    email: u.email,
                    displayName: u.displayName,
                    disabled: u.disabled,
                    creationTime: u.metadata.creationTime,
                    lastSignInTime: u.metadata.lastSignInTime
                }));
                return NextResponse.json({ success: true, data });
            }

            default:
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
