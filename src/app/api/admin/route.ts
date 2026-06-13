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
                    
                    // NORMALIZATION ENGINE - Converts CamelCase and Spaced keys to slug-format
                    const normalizedP: any = {};
                    Object.keys(p).forEach(k => {
                        const cleanKey = k.toLowerCase().trim().replace(/[\s_-]+/g, '');
                        normalizedP[cleanKey] = p[k];
                    });

                    // Technical Mapping Prioritization
                    const technicalNotes = normalizedP.notes || normalizedP.primaryservices || normalizedP.services || normalizedP.aboutus || normalizedP.about || normalizedP.description || '';
                    const website = normalizedP.website || normalizedP.officialwebsite || normalizedP.url || '';
                    const contactName = normalizedP.contactperson || normalizedP.humanidentity || normalizedP.humanname || normalizedP.name || '';
                    const physicalAddress = normalizedP.address || normalizedP.physicaladdress || normalizedP.location || normalizedP.headquarters || '';

                    let firstName = normalizedP.firstname || '';
                    let lastName = normalizedP.lastname || '';

                    if (contactName && !firstName) {
                        const parts = contactName.split(' ');
                        firstName = parts[0];
                        lastName = parts.slice(1).join(' ') || 'Partner';
                    }

                    // Strategic Merge: Only update fields that have meaningful values from the AI
                    const updateData: any = { updatedAt: FieldValue.serverTimestamp() };
                    if (firstName) updateData.firstName = firstName;
                    if (lastName) updateData.lastName = lastName;
                    if (normalizedP.companyname) updateData.companyName = normalizedP.companyname;
                    if (contactName) updateData.contactPerson = contactName;
                    if (normalizedP.emailaddress || normalizedP.email) updateData.email = normalizedP.emailaddress || normalizedP.email;
                    if (normalizedP.phone || normalizedP.landline) updateData.phone = normalizedP.phone || normalizedP.landline;
                    if (normalizedP.mobile || normalizedP.cell) updateData.mobile = normalizedP.mobile || normalizedP.cell;
                    if (website) updateData.website = website;
                    if (physicalAddress) updateData.address = physicalAddress;
                    if (technicalNotes) updateData.notes = technicalNotes;
                    
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

            case 'logCommunication': {
                const { partnerId, type, subject, notes } = payload;
                // Unified mirror logging for leads vs partners
                const parentType = payload.isLead ? 'leads' : 'partners';
                const ref = db.collection(parentType).doc(partnerId).collection('communications').doc();
                await ref.set({
                    type,
                    subject,
                    notes,
                    timestamp: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }
            
            case 'bulkLogForensicInitiated': {
                const { leadIds } = payload;
                const batch = db.batch();
                
                leadIds.forEach((id: string) => {
                    const logRef = db.collection('leads').doc(id).collection('communications').doc();
                    batch.set(logRef, {
                        type: 'Email',
                        subject: 'Batch Research Initiated',
                        notes: 'AI Agent commanded to perform technical forensic mapping of website, physical address, and services.',
                        timestamp: FieldValue.serverTimestamp()
                    });
                    
                    batch.update(db.collection('leads').doc(id), {
                        status: 'contacted',
                        updatedAt: FieldValue.serverTimestamp()
                    });
                });
                
                await batch.commit();
                return NextResponse.json({ success: true });
            }
            
            case 'logForensicInitiated': {
                const { partnerId, isLead } = payload;
                const collectionName = isLead ? 'leads' : 'partners';
                
                const logRef = db.collection(collectionName).doc(partnerId).collection('communications').doc();
                await logRef.set({
                    type: 'Email',
                    subject: 'Forensic Research Triggered',
                    notes: 'Manual request for technical gap-analysis initiated.',
                    timestamp: FieldValue.serverTimestamp()
                });
                
                await db.collection(collectionName).doc(partnerId).update({
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
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
