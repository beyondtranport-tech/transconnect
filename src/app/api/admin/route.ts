import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import { enrichPartner } from '@/ai/flows/enrich-partner-flow';

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
                const { type, term, status, outreachFilter, assigneeId, limit = 1000 } = payload;
                let results: any[] = [];

                if (type !== 'partner') {
                    let leadsQ: any = db.collection('leads');
                    if (type && type !== 'all' && type !== 'lead') {
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
                    if (status && status !== 'all') leadsQ = leadsQ.where('status', '==', status);
                    if (assigneeId && assigneeId !== 'all') leadsQ = leadsQ.where('assigneeId', '==', assigneeId === 'none' ? null : assigneeId);
                    if (term) leadsQ = leadsQ.where('companyName', '>=', term).where('companyName', '<=', term + '\uf8ff');
                    
                    const leadsSnap = await leadsQ.limit(limit).get();
                    results = [...results, ...leadsSnap.docs.map((d: any) => ({ id: d.id, source: 'Lead', ...d.data() }))];
                }

                if (type !== 'lead') {
                    let partnersQ: any = db.collection('partners');
                    if (type && type !== 'all' && type !== 'partner') partnersQ = partnersQ.where('type', '==', type);
                    if (status && status !== 'all') partnersQ = partnersQ.where('status', '==', status);
                    if (assigneeId && assigneeId !== 'all') partnersQ = partnersQ.where('assigneeId', '==', assigneeId === 'none' ? null : assigneeId);
                    if (term) partnersQ = partnersQ.where('companyName', '>=', term).where('companyName', '<=', term + '\uf8ff');

                    const partnersSnap = await partnersQ.limit(limit).get();
                    results = [...results, ...partnersSnap.docs.map((d: any) => ({ id: d.id, source: 'Partner', ...d.data() }))];
                }

                if (outreachFilter === 'none') {
                    results = results.filter(r => !r.lastOutreachSubject);
                } else if (outreachFilter && outreachFilter !== 'all') {
                    results = results.filter(r => r.lastOutreachSubject === outreachFilter);
                }

                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'autoEnrichRecord': {
                const { id, type } = payload;
                if (!id) throw new Error("ID required for auto-enrichment.");

                let targetCollection = type === 'lead' ? 'leads' : 'partners';
                let docRef = db.collection(targetCollection).doc(id);
                let docSnap = await docRef.get();
                
                if (!docSnap.exists) {
                    targetCollection = targetCollection === 'leads' ? 'partners' : 'leads';
                    docRef = db.collection(targetCollection).doc(id);
                    docSnap = await docRef.get();
                }
                
                if (!docSnap.exists) throw new Error(`Record ${id} not found in any registry.`);
                
                const record = docSnap.data()!;
                const companyName = record.companyName || record.company_name || record.trading_name || `${record.firstName} ${record.lastName}`;

                const enriched = await enrichPartner({ companyName });

                const update: any = {
                    ...enriched,
                    status: (enriched.email || enriched.website) ? 'qualified' : record.status,
                    updatedAt: FieldValue.serverTimestamp()
                };

                await docRef.update(update);
                return NextResponse.json({ success: true, data: enriched });
            }

            case 'logForensicInitiated': {
                const { partnerId, isLead } = payload;
                const coll = isLead ? 'leads' : 'partners';
                await db.collection(coll).doc(partnerId).update({
                    status: 'contacted',
                    lastOutreachSubject: 'Forensic Research',
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const batch = db.batch();
                const collectionName = (type === 'associate' || type === 'lead') ? 'leads' : 'partners';
                const collRef = db.collection(collectionName);

                partners.forEach((p: any) => {
                    const id = p.record_id || p.id || collRef.doc().id;
                    batch.set(collRef.doc(id), {
                        ...p,
                        id,
                        status: p.status || 'new',
                        updatedAt: FieldValue.serverTimestamp(),
                        createdAt: FieldValue.serverTimestamp()
                    }, { merge: true });
                });

                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'savePartner': {
                const { partner, collection: collName } = payload;
                const id = partner.id || db.collection(collName).doc().id;
                await db.collection(collName).doc(id).set({
                    ...partner,
                    id,
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'logCommunication': {
                const { partnerId, type: cType, subject, notes, collection: cName } = payload;
                
                let targetColl = cName;
                if (!targetColl) {
                    const leadsCheck = await db.collection('leads').doc(partnerId).get();
                    targetColl = leadsCheck.exists ? 'leads' : 'partners';
                }

                const parentRef = db.collection(targetColl).doc(partnerId);
                const logRef = parentRef.collection('communications').doc();
                
                const batch = db.batch();
                batch.set(logRef, { id: logRef.id, type: cType, subject, notes, timestamp: FieldValue.serverTimestamp(), adminId: decodedToken.uid });
                batch.update(parentRef, { lastOutreachAt: FieldValue.serverTimestamp(), lastOutreachSubject: subject, status: 'contacted', updatedAt: FieldValue.serverTimestamp() });
                
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map((d: any) => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map((d: any) => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('updatedAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map((d: any) => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map((d: any) => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            default: return NextResponse.json({ success: false, error: "Action invalid." }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Admin API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}