
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

        // Increased limit for "Full Records" preference
        const MAX_LOAD = 10000;

        switch (action) {
            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(MAX_LOAD).get();
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
                    
                    // Intelligent Mapping for AI Variation
                    if (p.company_name || p.companyName) standardized.companyName = p.company_name || p.companyName;
                    if (p.email_address || p.email) standardized.email = p.email_address || p.email;
                    if (p.telephone_number || p.phone || p.landline) standardized.phone = p.telephone_number || p.phone || p.landline;
                    if (p.mobile_number || p.cell || p.direct_cell || p.mobile) standardized.mobile = p.mobile_number || p.cell || p.direct_cell || p.mobile;
                    if (p.physical_address || p.address) standardized.address = p.physical_address || p.address;
                    if (p.contact_person || p.contactPerson) standardized.contactPerson = p.contact_person || p.contactPerson;
                    
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

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
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
