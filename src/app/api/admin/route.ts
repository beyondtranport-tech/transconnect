
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * UTILITY: Serialize Timestamps for JSON transport
 */
function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    if (docData instanceof Timestamp) {
        return docData.toDate().toISOString();
    }
    if (Array.isArray(docData)) {
        return docData.map(serializeTimestamps);
    }
    if (typeof docData === 'object' && docData !== null) {
        const serialized: { [key: string]: any } = {};
        for (const key in docData) {
            serialized[key] = serializeTimestamps(docData[key]);
        }
        return serialized;
    }
    return docData;
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
        
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || 
                        decodedToken.email === 'mkoton100@gmail.com' ||
                        decodedToken.email === 'michael@logisticsflow.co.za' ||
                        decodedToken.admin === true;

        const db = getFirestore(app);
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.data();
        
        const isAssociate = userData?.role === 'associate' || userData?.declaredPosition === 'associate';

        if (!isAdmin && !isAssociate) throw new Error("Forbidden: Elevated access required.");

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};

        switch (action) {
            case 'searchRegistry': {
                const { type, term, limit = 1000 } = payload;
                let results: any[] = [];

                // 1. Search Leads Collection
                if (type !== 'partner') {
                    let leadsQ: any = db.collection('leads');
                    
                    if (type !== 'all' && type !== 'lead') {
                        // Map internal IDs to common display titles found in lead roles
                        const typeMap: Record<string, string[]> = {
                            'associate': ['associate', 'Digital Partners', 'Digital Partner'],
                            'isa': ['isa', 'ISA Agents', 'ISA Agent'],
                            'supplier': ['supplier', 'vendor', 'Suppliers', 'Supplier', 'Vendors'],
                            'transporter': ['transporter', 'Transporters', 'Transporter'],
                            'finance': ['finance', 'financier', 'Finance Companies', 'Finance Partner'],
                            'driver': ['driver', 'Drivers', 'Driver']
                        };
                        const possibleRoles = typeMap[type] || [type];
                        leadsQ = leadsQ.where('role', 'in', possibleRoles);
                    }

                    if (term) {
                        leadsQ = leadsQ.where('companyName', '>=', term).where('companyName', '<=', term + '\uf8ff');
                    }
                    
                    const leadsSnap = await leadsQ.limit(limit).get();
                    results = [...results, ...leadsSnap.docs.map(d => ({ 
                        id: d.id, 
                        source: 'Lead', 
                        ...d.data(),
                        type: type === 'all' || type === 'lead' ? (d.data().role?.toLowerCase() || 'lead') : type
                    }))];
                }

                // 2. Search Partners Collection
                if (type !== 'lead') {
                    let partnersQ: any = db.collection('partners');
                    if (type !== 'all' && type !== 'partner') {
                        partnersQ = partnersQ.where('type', '==', type);
                    }
                    if (term) {
                        partnersQ = partnersQ.where('companyName', '>=', term).where('companyName', '<=', term + '\uf8ff');
                    }
                    const partnersSnap = await partnersQ.limit(limit).get();
                    results = [...results, ...partnersSnap.docs.map(d => ({ id: d.id, source: 'Partner', ...d.data() }))];
                }

                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                const typeMap: Record<string, string[]> = {
                    'associate': ['associate', 'Digital Partners', 'Digital Partner'],
                    'isa': ['isa', 'ISA Agents', 'ISA Agent'],
                    'supplier': ['supplier', 'vendor', 'Suppliers', 'Supplier', 'Vendors'],
                    'transporter': ['transporter', 'Transporters', 'Transporter'],
                    'finance': ['finance', 'financier', 'Finance Companies', 'Finance Partner'],
                    'driver': ['driver', 'Drivers', 'Driver']
                };
                const possibleRoles = typeMap[type] || [type];

                const leadsSnap = await db.collection('leads').where('role', 'in', possibleRoles).get();
                const partnersSnap = await db.collection('partners').where('type', '==', type).get();
                
                const results = [
                    ...leadsSnap.docs.map(d => ({ id: d.id, source: 'Lead', ...d.data() })),
                    ...partnersSnap.docs.map(d => ({ id: d.id, source: 'Partner', ...d.data() }))
                ];

                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'savePartner': {
                const { partner } = payload;
                if (!partner || !partner.type) throw new Error("Invalid partner data.");
                
                const collection = partner.source === 'Lead' ? 'leads' : 'partners';
                const id = partner.id || db.collection(collection).doc().id;
                
                const data = {
                    ...partner,
                    id,
                    updatedAt: FieldValue.serverTimestamp()
                };
                if (!partner.id) data.createdAt = FieldValue.serverTimestamp();

                await db.collection(collection).doc(id).set(data, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'deletePartner': {
                const { partnerId, source } = payload;
                const collection = source === 'Lead' ? 'leads' : 'partners';
                await db.collection(collection).doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'savePlatformStaff': {
                const { staff } = payload;
                const id = staff.id || db.collection('platformStaff').doc().id;
                const data = { ...staff, id, updatedAt: FieldValue.serverTimestamp() };
                if (!staff.id) data.createdAt = FieldValue.serverTimestamp();
                await db.collection('platformStaff').doc(id).set(data, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'getAudienceCommunications': {
                const { type } = payload;
                const partnersSnap = await db.collection('partners').where('type', '==', type).get();
                const partnerIds = partnersSnap.docs.map(d => d.id);
                
                let allLogs: any[] = [];
                if (partnerIds.length > 0) {
                    const logPromises = partnerIds.map(pid => 
                        db.collection('partners').doc(pid).collection('communications').orderBy('timestamp', 'desc').limit(5).get()
                    );
                    
                    const logSnaps = await Promise.all(logPromises);
                    logSnaps.forEach((snap, idx) => {
                        const partner = partnersSnap.docs.find(d => d.id === partnerIds[idx])?.data();
                        snap.forEach(d => allLogs.push({ 
                            ...d.data(), 
                            id: d.id, 
                            partnerName: partner?.companyName || partner?.firstName || 'Partner' 
                        }));
                    });
                }

                return NextResponse.json({ success: true, data: allLogs.sort((a,b) => b.timestamp - a.timestamp).map(serializeTimestamps) });
            }

            case 'getAudienceTasks': {
                const { type } = payload;
                const partnersSnap = await db.collection('partners').where('type', '==', type).get();
                
                let allTasks: any[] = [];
                if (!partnersSnap.empty) {
                    const taskPromises = partnersSnap.docs.map(doc => 
                        doc.ref.collection('tasks').where('status', '==', 'pending').get()
                    );
                    
                    const taskSnaps = await Promise.all(taskPromises);
                    taskSnaps.forEach((snap, idx) => {
                        const partner = partnersSnap.docs[idx].data();
                        snap.forEach(d => allTasks.push({ 
                            ...d.data(), 
                            id: d.id, 
                            partnerName: partner?.companyName || partner?.firstName || 'Partner' 
                        }));
                    });
                }

                return NextResponse.json({ success: true, data: allTasks.map(serializeTimestamps) });
            }

            case 'getMyNetwork': {
                const companyId = userData?.companyId;
                if (!companyId) throw new Error("Missing company profile.");
                
                const [leadsSnap, membersSnap] = await Promise.all([
                    db.collection('leads').where('referrerId', '==', companyId).get(),
                    db.collection('companies').where('referrerId', '==', companyId).get()
                ]);

                const leads = leadsSnap.docs.map(d => ({ id: d.id, source: 'Lead', ...d.data() }));
                const members = membersSnap.docs.map(d => ({ id: d.id, source: 'Member', ...d.data() }));
                
                return NextResponse.json({ success: true, data: [...leads, ...members].map(serializeTimestamps) });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('updatedAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'logAudit': {
                const { action: auditAction, details, metadata } = payload;
                const logRef = db.collection('auditLogs').doc();
                await logRef.set({
                    id: logRef.id,
                    action: auditAction,
                    details,
                    metadata,
                    userId: decodedToken.uid,
                    userName: decodedToken.name || userData?.firstName || 'User',
                    companyId: userData?.companyId || null,
                    timestamp: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'saveCompanyLead': {
                const { lead, companyId } = payload;
                if (!lead || !lead.companyName) throw new Error("Invalid lead data.");
                
                const finalReferrerId = companyId || userData?.companyId;
                if (!finalReferrerId) throw new Error("Could not attribute lead: No company ID found.");

                const id = lead.id || db.collection('leads').doc().id;
                const leadData = {
                    ...lead,
                    id,
                    referrerId: finalReferrerId,
                    referrerName: userData?.companyName || userData?.firstName || 'Partner',
                    updatedAt: FieldValue.serverTimestamp(),
                };
                
                if (!lead.id) leadData.createdAt = FieldValue.serverTimestamp();
                await db.collection('leads').doc(id).set(leadData, { merge: true });
                
                return NextResponse.json({ success: true, id });
            }

            case 'logCommunication': {
                const { partnerId, type, subject, notes, collection: collName = 'leads' } = payload;
                if (!partnerId || !type || !subject) throw new Error("Missing log data.");
                
                const parentRef = db.collection(collName).doc(partnerId);
                const logRef = parentRef.collection('communications').doc();
                
                const batch = db.batch();
                batch.set(logRef, {
                    id: logRef.id,
                    type,
                    subject,
                    notes,
                    timestamp: FieldValue.serverTimestamp(),
                    adminId: decodedToken.uid
                });
                
                batch.update(parentRef, {
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                });
                
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            default: return NextResponse.json({ success: false, error: "Action invalid." }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Admin API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
