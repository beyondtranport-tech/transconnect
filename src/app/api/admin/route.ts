
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
                const collectionName = partner.type === 'lead' ? 'leads' : 'partners';
                const id = partner.id || db.collection(collectionName).doc().id;
                await db.collection(collectionName).doc(id).set({ 
                    ...partner, 
                    id, 
                    updatedAt: FieldValue.serverTimestamp() 
                }, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const batch = db.batch();
                const collectionName = type === 'lead' ? 'leads' : 'partners';
                
                partners.forEach((p: any) => {
                    const id = p.record_id || p.id || db.collection(collectionName).doc().id;
                    const standardized: any = { ...p };
                    
                    if (p.company_name || p.companyName) standardized.companyName = p.company_name || p.companyName;
                    if (p.email_address || p.email) standardized.email = p.email_address || p.email;
                    if (p.telephone_number || p.phone || p.landline) standardized.phone = p.telephone_number || p.phone || p.landline;
                    if (p.mobile_number || p.cell || p.direct_cell || p.mobile) standardized.mobile = p.mobile_number || p.cell || p.direct_cell || p.mobile;
                    if (p.physical_address || p.address) standardized.address = p.physical_address || p.address;
                    
                    if (p.contact_person || p.contactPerson) {
                        const full = p.contact_person || p.contactPerson;
                        standardized.contactPerson = full;
                        if (!standardized.firstName) {
                            const parts = full.trim().split(/\s+/);
                            standardized.firstName = parts[0] || '';
                            standardized.lastName = parts.slice(1).join(' ') || '';
                        }
                    }
                    
                    const docRef = db.collection(collectionName).doc(id);
                    batch.set(docRef, {
                        ...standardized,
                        id,
                        type: type === 'lead' ? undefined : type,
                        updatedAt: FieldValue.serverTimestamp()
                    }, { merge: true });

                    const logRef = docRef.collection('communications').doc();
                    batch.set(logRef, {
                        id: logRef.id,
                        type: 'AI Update',
                        subject: 'Forensic Data Updated',
                        notes: 'Forensic research results successfully imported and applied.',
                        timestamp: FieldValue.serverTimestamp()
                    });
                });
                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'logForensicInitiated': {
                const { partnerId, isLead } = payload;
                const parentCollection = isLead ? 'leads' : 'partners';
                const ref = db.collection(parentCollection).doc(partnerId);
                
                const logRef = ref.collection('communications').doc();
                const batch = db.batch();
                
                batch.set(logRef, {
                    id: logRef.id,
                    type: 'AI Research',
                    subject: 'Forensic Research Initiated',
                    notes: 'Forensic AI prompt copied for industrial intelligence search.',
                    timestamp: FieldValue.serverTimestamp()
                });
                
                batch.update(ref, {
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                });
                
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'logCommunication': {
                const { partnerId, type, subject, notes, isLead } = payload;
                const col = isLead ? 'leads' : 'partners';
                const ref = db.collection(col).doc(partnerId).collection('communications').doc();
                await ref.set({
                    id: ref.id, type, subject, notes,
                    timestamp: FieldValue.serverTimestamp()
                });
                await db.collection(col).doc(partnerId).set({
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
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
