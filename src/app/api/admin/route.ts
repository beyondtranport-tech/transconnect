
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
                const { type, term, outreachFilter, limit = 200 } = payload;
                let results: any[] = [];

                // 1. Search Leads
                let leadsQ: any = db.collection('leads');
                if (type && type !== 'all' && type !== 'lead') {
                    const typeMap: Record<string, string[]> = {
                        'associate': ['associate', 'Digital Partners', 'Digital Partner'],
                        'isa': ['isa', 'ISA Agents', 'ISA Agent'],
                        'supplier': ['supplier', 'vendor', 'Suppliers', 'Supplier', 'Vendors'],
                        'transporter': ['transporter', 'Transporters', 'Transporter'],
                        'finance': ['finance', 'Finance Companies', 'Finance Partner'],
                        'driver': ['driver', 'Drivers', 'Driver']
                    };
                    const possibleRoles = typeMap[type] || [type];
                    leadsQ = leadsQ.where('role', 'in', possibleRoles);
                }
                if (term) leadsQ = leadsQ.where('companyName', '>=', term).where('companyName', '<=', term + '\uf8ff');
                
                const leadsSnap = await leadsQ.limit(limit).get();
                results = [...results, ...leadsSnap.docs.map(d => ({ id: d.id, source: 'Lead', ...d.data() }))];

                // 2. Search Partners
                let partnersQ: any = db.collection('partners');
                if (type && type !== 'all' && type !== 'partner') partnersQ = partnersQ.where('type', '==', type);
                if (term) partnersQ = partnersQ.where('companyName', '>=', term).where('companyName', '<=', term + '\uf8ff');

                const partnersSnap = await partnersQ.limit(limit).get();
                results = [...results, ...partnersSnap.docs.map(d => ({ id: d.id, source: 'Partner', ...d.data() }))];

                // 3. Search Companies (Members)
                let companiesQ: any = db.collection('companies');
                if (term) companiesQ = companiesQ.where('companyName', '>=', term).where('companyName', '<=', term + '\uf8ff');

                const companiesSnap = await companiesQ.limit(limit).get();
                results = [...results, ...companiesSnap.docs.map(d => ({ id: d.id, source: 'Member', ...d.data() }))];

                if (outreachFilter === 'none') {
                    results = results.filter(r => !r.lastOutreachSubject);
                } else if (outreachFilter && outreachFilter !== 'all') {
                    results = results.filter(r => r.lastOutreachSubject === outreachFilter);
                }

                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                if (!Array.isArray(partners)) throw new Error("Partners must be an array.");
                
                const batch = db.batch();
                // Associates and prospects usually go to 'leads' for conversion tracking
                // If they are explicitly 'partners', use partners collection
                const collectionName = (type === 'associate' || type === 'lead') ? 'leads' : 'partners';
                const collRef = db.collection(collectionName);

                partners.forEach(p => {
                    const id = p.record_id || p.id || collRef.doc().id;
                    const docRef = collRef.doc(id);
                    batch.set(docRef, {
                        ...p,
                        id,
                        status: p.status || 'new',
                        role: p.role || (type === 'associate' ? 'Digital Partner' : type),
                        type: p.type || type,
                        updatedAt: FieldValue.serverTimestamp(),
                        createdAt: FieldValue.serverTimestamp()
                    }, { merge: true });
                });

                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
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

            case 'deletePartner': {
                const { partnerId } = payload;
                await db.collection('partners').doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }

            case 'logCommunication': {
                const { partnerId, type: commType, subject, notes, collection: collName = 'partners' } = payload;
                const parentRef = db.collection(collName).doc(partnerId);
                const logRef = parentRef.collection('communications').doc();
                
                const batch = db.batch();
                batch.set(logRef, {
                    id: logRef.id,
                    type: commType,
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

            case 'savePlatformStaff': {
                const { staff } = payload;
                const id = staff.id || db.collection('platformStaff').doc().id;
                await db.collection('platformStaff').doc(id).set({
                    ...staff,
                    id,
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                const snap = await db.collection('partners').where('type', '==', type).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('updatedAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getStaff': {
                const snap = await db.collectionGroup('staff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, companyId: d.ref.parent.parent?.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getShops': {
                const snap = await db.collectionGroup('shops').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, companyId: d.ref.parent.parent?.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getContributions': {
                const snap = await db.collection('contributions').orderBy('createdAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getWalletPayments': {
                const snap = await db.collectionGroup('walletPayments').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, companyId: d.ref.parent.parent?.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getWalletTransactions': {
                const snap = await db.collectionGroup('transactions').orderBy('date', 'desc').limit(500).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, companyId: d.ref.parent.parent?.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getAudienceCommunications': {
                const { type } = payload;
                // Simplified for prototype: get recent communications for this type
                const snap = await db.collectionGroup('communications').orderBy('timestamp', 'desc').limit(200).get();
                const filtered = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data: filtered });
            }

            case 'getAudienceTasks': {
                const { type } = payload;
                const snap = await db.collectionGroup('tasks').orderBy('createdAt', 'desc').limit(200).get();
                const filtered = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data: filtered });
            }

            case 'listAllUsers': {
                const snap = await adminAuth.listUsers(1000);
                return NextResponse.json({ success: true, data: snap.users });
            }

            default: return NextResponse.json({ success: false, error: "Action invalid." }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Admin API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
