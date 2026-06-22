
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

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
        
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';
        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};
        const db = getFirestore(app);

        switch (action) {
            case 'searchRegistry': {
                const { 
                    searchCompany, 
                    searchKeyword, 
                    searchTag, 
                    category, 
                    type, 
                    integrityFilter, 
                    outreachFilter 
                } = payload;
                
                const collectionName = (type === 'lead') ? 'leads' : 'partners';
                
                let query: any = db.collection(collectionName);
                
                if (category && category !== 'all') {
                    query = query.where('industrial_category', '==', category);
                } else if (type && type !== 'all' && type !== 'lead') {
                    query = query.where('type', '==', type);
                }

                const snap = category && category !== 'all' 
                    ? await query.limit(10000).get() 
                    : await query.orderBy('updatedAt', 'desc').limit(5000).get();
                
                let data = snap.docs.map((d: QueryDocumentSnapshot) => ({ 
                    id: d.id, 
                    ...serializeTimestamps(d.data()) 
                }));

                if (searchCompany) {
                    const low = searchCompany.toLowerCase();
                    data = data.filter((item: any) => 
                        (item.companyName || item.company_name || '').toLowerCase().includes(low)
                    );
                }
                
                if (searchKeyword) {
                    const low = searchKeyword.toLowerCase();
                    data = data.filter((item: any) => 
                        (item.minedServiceWording || item.notes || '').toLowerCase().includes(low)
                    );
                }

                if (searchTag) {
                    const low = searchTag.toLowerCase();
                    data = data.filter((item: any) => 
                        (item.industrialTags || []).some((t: string) => t.toLowerCase().includes(low))
                    );
                }

                if (integrityFilter && integrityFilter !== 'all') {
                    if (integrityFilter === 'has-email') data = data.filter((p: any) => !!p.email);
                    else if (integrityFilter === 'no-email') data = data.filter((p: any) => !p.email);
                    else if (integrityFilter === 'has-phone') data = data.filter((p: any) => !!(p.phone || p.mobile));
                    else if (integrityFilter === 'no-phone') data = data.filter((p: any) => !(p.phone || p.mobile));
                    else if (integrityFilter === 'has-website') data = data.filter((p: any) => !!p.website);
                    else if (integrityFilter === 'no-website') data = data.filter((p: any) => !p.website);
                }

                if (outreachFilter && outreachFilter !== 'all') {
                    data = data.filter((p: any) => p.lastOutreachSubject === outreachFilter);
                }

                return NextResponse.json({ success: true, data: data.slice(0, 1000) });
            }

            case 'getAudienceCommunications': {
                const { type } = payload;
                const commsSnap = await db.collectionGroup('communications').orderBy('timestamp', 'desc').limit(500).get();
                const parentIds = [...new Set(commsSnap.docs.map(d => d.ref.path.split('/').slice(-3, -2)[0]))];
                
                const [partnersSnap, leadsSnap] = await Promise.all([
                    db.collection('partners').where(FieldValue.documentId(), 'in', parentIds.length > 0 ? parentIds : ['none']).get(),
                    db.collection('leads').where(FieldValue.documentId(), 'in', parentIds.length > 0 ? parentIds : ['none']).get()
                ]);
                
                const entities = [...partnersSnap.docs, ...leadsSnap.docs].map(d => ({ id: d.id, ...d.data() }));
                const entityMap = new Map(entities.map(e => [e.id, e]));

                const data = commsSnap.docs.map(d => {
                    const entId = d.ref.path.split('/').slice(-3, -2)[0];
                    const entity = entityMap.get(entId);
                    return {
                        id: d.id,
                        partnerId: entId,
                        partnerName: entity?.companyName || entity?.trading_name || entity?.company_name || `${entity?.firstName || ''} ${entity?.lastName || ''}`.trim() || 'Unknown',
                        partnerType: entity?.type || entity?.role || 'lead',
                        ...serializeTimestamps(d.data())
                    };
                });

                const filtered = type && type !== 'all' 
                    ? data.filter(c => c.partnerType?.toLowerCase().includes(type.toLowerCase())) 
                    : data;

                return NextResponse.json({ success: true, data: filtered });
            }

            case 'getAudienceTasks': {
                const { type } = payload;
                const tasksSnap = await db.collectionGroup('tasks').orderBy('createdAt', 'desc').limit(500).get();
                const parentIds = [...new Set(tasksSnap.docs.map(d => d.ref.path.split('/').slice(-3, -2)[0]))];
                
                const [partnersSnap, leadsSnap, staffSnap] = await Promise.all([
                    db.collection('partners').where(FieldValue.documentId(), 'in', parentIds.length > 0 ? parentIds : ['none']).get(),
                    db.collection('leads').where(FieldValue.documentId(), 'in', parentIds.length > 0 ? parentIds : ['none']).get(),
                    db.collection('platformStaff').get()
                ]);
                
                const entities = [...partnersSnap.docs, ...leadsSnap.docs].map(d => ({ id: d.id, ...d.data() }));
                const entityMap = new Map(entities.map(e => [e.id, e]));
                const staffMap = new Map(staffSnap.docs.map(d => [d.id, `${d.data().firstName} ${d.data().lastName}`]));

                const data = tasksSnap.docs.map(d => {
                    const taskData = d.data();
                    const entId = d.ref.path.split('/').slice(-3, -2)[0];
                    const entity = entityMap.get(entId);
                    return {
                        id: d.id,
                        partnerId: entId,
                        partnerName: entity?.companyName || entity?.trading_name || entity?.company_name || `${entity?.firstName || ''} ${entity?.lastName || ''}`.trim() || 'Unknown',
                        partnerType: entity?.type || entity?.role || 'lead',
                        assigneeName: staffMap.get(taskData.assigneeId) || 'Unassigned',
                        ...serializeTimestamps(taskData)
                    };
                });

                const filtered = type && type !== 'all' 
                    ? data.filter(t => t.partnerType?.toLowerCase().includes(type.toLowerCase())) 
                    : data;

                return NextResponse.json({ success: true, data: filtered });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(200).get();
                const data = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                const data = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('updatedAt', 'desc').limit(100).get();
                const data = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getPartnersByType': {
                const type = payload.type || 'all';
                let q: any = db.collection('partners');
                if (type !== 'all') {
                    q = q.where('type', '==', type);
                }
                const snap = await q.orderBy('updatedAt', 'desc').limit(100).get();
                const data = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'logCommunication': {
                const { partnerId, type, subject, notes, collection: collName = 'partners' } = payload;
                const logRef = db.collection(collName).doc(partnerId).collection('communications').doc();
                
                const batch = db.batch();
                batch.set(logRef, {
                    type, subject, notes,
                    timestamp: FieldValue.serverTimestamp(),
                    adminId: decodedToken.uid
                });
                
                batch.update(db.collection(collName).doc(partnerId), {
                    lastOutreachSubject: subject,
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                });

                await batch.commit();
                return NextResponse.json({ success: true });
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

            case 'logForensicInitiated': {
                const { partnerId, isLead } = payload;
                const collName = isLead ? 'leads' : 'partners';
                await db.collection(collName).doc(partnerId).update({
                    researchStatus: 'searching',
                    lastForensicAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'bulkLogForensicInitiated': {
                const { leadIds, type } = payload;
                const collName = type === 'lead' ? 'leads' : 'partners';
                const batch = db.batch();
                leadIds.forEach((id: string) => {
                    batch.update(db.collection(collName).doc(id), {
                        researchStatus: 'searching',
                        lastForensicAt: FieldValue.serverTimestamp(),
                        updatedAt: FieldValue.serverTimestamp()
                    });
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
