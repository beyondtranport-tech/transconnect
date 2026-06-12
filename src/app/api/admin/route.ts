
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

        const MAX_LOAD = 100;

        switch (action) {
            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(MAX_LOAD).get();
                if (snap.empty) return NextResponse.json({ success: true, data: [] });
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

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                if (!Array.isArray(partners)) throw new Error("Invalid payload: 'partners' must be an array.");
                
                const collectionName = type === 'lead' ? 'leads' : 'partners';
                const batch = db.batch();
                
                partners.forEach((p: any) => {
                    const docId = p.record_id || p.id || p.seq?.toString();
                    if (!docId) return;

                    const ref = db.collection(collectionName).doc(docId);
                    
                    let firstName = p.firstName || '';
                    let lastName = p.lastName || '';
                    const contactName = p.contact_person || p.contactPerson || p.contact_name;

                    if (contactName && (!firstName || firstName === 'Unknown')) {
                        const parts = contactName.split(' ');
                        firstName = parts[0] || 'Unknown';
                        lastName = parts.slice(1).join(' ') || 'Partner';
                    }

                    const dataToSave: any = {
                        ...p,
                        firstName: firstName || p.firstName || 'Unknown',
                        lastName: lastName || p.lastName || 'Partner',
                        companyName: p.company_name || p.companyName || p.trading_name || '',
                        contactPerson: contactName || '',
                        email: p.email_address || p.email || '',
                        phone: p.telephone_number || p.phone || '',
                        mobile: p.registry_line || p.mobile || '',
                        website: p.website || p.url || '',
                        address: p.physical_address || p.address || '',
                        notes: p.primary_services || p.notes || p.description || '',
                        updatedAt: FieldValue.serverTimestamp()
                    };
                    
                    if (type !== 'lead') dataToSave.type = type;

                    batch.set(ref, dataToSave, { merge: true });
                });
                
                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'bulkLogForensicInitiated': {
                const { leadIds } = payload;
                const batch = db.batch();
                leadIds.forEach((id: string) => {
                    const ref = db.collection('leads').doc(id);
                    batch.set(ref, { 
                        status: 'contacted', 
                        updatedAt: FieldValue.serverTimestamp() 
                    }, { merge: true });

                    const logRef = ref.collection('communications').doc();
                    batch.set(logRef, {
                        type: 'Meeting',
                        subject: 'AI Forensic Mining Initiated',
                        notes: 'Automated batch research command generated for external AI verification.',
                        timestamp: FieldValue.serverTimestamp()
                    });
                });
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(MAX_LOAD).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
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

            case 'deleteLeads': {
                const { leadIds } = payload;
                const batch = db.batch();
                leadIds.forEach((id: string) => {
                    batch.delete(db.collection('leads').doc(id));
                });
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'deletePartner': {
                await db.collection('partners').doc(payload.partnerId).delete();
                return NextResponse.json({ success: true });
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
                    type,
                    subject,
                    notes,
                    timestamp: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'logForensicInitiated': {
                const { partnerId, isLead } = payload;
                const collectionName = isLead ? 'leads' : 'partners';
                const ref = db.collection(collectionName).doc(partnerId);
                await ref.set({ 
                    status: 'contacted', 
                    updatedAt: FieldValue.serverTimestamp() 
                }, { merge: true });

                const logRef = ref.collection('communications').doc();
                await logRef.set({
                    type: 'Meeting',
                    subject: 'AI Forensic Mining Initiated',
                    notes: 'Direct forensic gap-analysis command generated for individual record verification.',
                    timestamp: FieldValue.serverTimestamp()
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
