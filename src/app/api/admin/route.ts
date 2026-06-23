
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * LOGGING HELPER
 * Serializes Firestore Timestamps into ISO strings for client consumption.
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

const chunkArray = (arr: any[], size: number) => 
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

export async function POST(req: NextRequest) {
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) throw new Error(`Admin SDK failed: ${initError}`);

        const authorization = req.headers.get('authorization');
        if (!authorization?.startsWith('Bearer ')) throw new Error('Unauthorized.');
        const token = authorization.split('Bearer ')[1];
        
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        
        // Admin authorization
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';
        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};
        const db = getFirestore(app);

        switch (action) {
            /**
             * UNIFIED REGISTRY SEARCH
             * Merges leads and partners to provide a single source of truth for marketing.
             */
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
                
                // Fetch latest 500 from both for immediate dashboard responsiveness
                const [partnersSnap, leadsSnap] = await Promise.all([
                    db.collection('partners').limit(500).get(),
                    db.collection('leads').limit(500).get()
                ]);

                let data = [
                    ...partnersSnap.docs.map(d => ({ id: d.id, source: 'partners', ...serializeTimestamps(d.data()) })),
                    ...leadsSnap.docs.map(d => ({ id: d.id, source: 'leads', ...serializeTimestamps(d.data()) }))
                ];

                // 1. Audience / Type Filter
                if (type && type !== 'all' && type !== 'lead') {
                    const lowType = type.toLowerCase();
                    data = data.filter(p => 
                        (p.type?.toLowerCase() === lowType) || 
                        (p.role?.toLowerCase() === lowType) ||
                        (p.industrial_category?.toLowerCase().includes(lowType)) ||
                        (p.category?.toLowerCase().includes(lowType))
                    );
                }

                // 2. Industrial Category Filter
                if (category && category !== 'all') {
                    const lowCat = category.toLowerCase();
                    data = data.filter(p => 
                        (p.industrial_category?.toLowerCase() === lowCat) || 
                        (p.category?.toLowerCase() === lowCat)
                    );
                }

                // 3. Text Search
                if (searchCompany) {
                    const low = searchCompany.toLowerCase();
                    data = data.filter(item => (item.companyName || item.company_name || '').toLowerCase().includes(low));
                }
                
                if (searchKeyword) {
                    const low = searchKeyword.toLowerCase();
                    data = data.filter(item => (item.minedServiceWording || item.notes || '').toLowerCase().includes(low));
                }

                // 4. Data Integrity Filters
                if (integrityFilter && integrityFilter !== 'all') {
                    if (integrityFilter === 'has-email') data = data.filter(p => !!p.email);
                    else if (integrityFilter === 'no-email') data = data.filter(p => !p.email);
                    else if (integrityFilter === 'has-website') data = data.filter(p => !!p.website || !!p.website_url);
                }

                return NextResponse.json({ success: true, data: data.slice(0, 1000) });
            }

            /**
             * UNIFIED COMMUNICATIONS FEED
             * Pulls interaction logs from all entities matching the audience type.
             */
            case 'getAudienceCommunications': {
                const { type } = payload;
                const commsSnap = await db.collectionGroup('communications').orderBy('timestamp', 'desc').limit(200).get();
                
                if (commsSnap.empty) return NextResponse.json({ success: true, data: [] });

                // Find unique parents
                const parentIds = [...new Set(commsSnap.docs.map(d => d.ref.parent.parent!.id))];
                const parentIdChunks = chunkArray(parentIds, 30);
                const entities: any[] = [];

                for (const chunkIds of parentIdChunks) {
                    const [pSnap, lSnap] = await Promise.all([
                        db.collection('partners').where(FieldValue.documentId(), 'in', chunkIds).get(),
                        db.collection('leads').where(FieldValue.documentId(), 'in', chunkIds).get()
                    ]);
                    entities.push(...pSnap.docs.map(d => ({ id: d.id, source: 'partners', ...d.data() })));
                    entities.push(...lSnap.docs.map(d => ({ id: d.id, source: 'leads', ...d.data() })));
                }
                
                const entityMap = new Map(entities.map(e => [e.id, e]));

                const data = commsSnap.docs.map(d => {
                    const entId = d.ref.parent.parent!.id;
                    const entity = entityMap.get(entId);
                    
                    // Intelligent Role Mapping
                    const partnerType = entity?.type || entity?.role || entity?.industrial_category || 'lead';

                    return {
                        id: d.id,
                        partnerId: entId,
                        partnerName: entity?.companyName || entity?.company_name || entity?.trading_name || `${entity?.firstName || ''} ${entity?.lastName || ''}`.trim() || 'Unknown',
                        partnerType: partnerType,
                        ...serializeTimestamps(d.data())
                    };
                });

                // Filter by audience if requested
                const filtered = type && type !== 'all' 
                    ? data.filter(c => {
                        const lowType = type.toLowerCase();
                        const lowPartnerType = c.partnerType?.toLowerCase() || '';
                        return lowPartnerType.includes(lowType) || (lowType === 'supplier' && lowPartnerType !== 'transporter');
                    })
                    : data;

                return NextResponse.json({ success: true, data: filtered });
            }

            /**
             * UNIFIED TASK FEED
             */
            case 'getAudienceTasks': {
                const { type } = payload;
                const tasksSnap = await db.collectionGroup('tasks').orderBy('createdAt', 'desc').limit(200).get();
                
                if (tasksSnap.empty) return NextResponse.json({ success: true, data: [] });

                const parentIds = [...new Set(tasksSnap.docs.map(d => d.ref.parent.parent!.id))];
                const parentIdChunks = chunkArray(parentIds, 30);
                const entities: any[] = [];

                for (const chunkIds of parentIdChunks) {
                    const [pSnap, lSnap] = await Promise.all([
                        db.collection('partners').where(FieldValue.documentId(), 'in', chunkIds).get(),
                        db.collection('leads').where(FieldValue.documentId(), 'in', chunkIds).get()
                    ]);
                    entities.push(...pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                    entities.push(...lSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                }
                
                const staffSnap = await db.collection('platformStaff').get();
                const entityMap = new Map(entities.map(e => [e.id, e]));
                const staffMap = new Map(staffSnap.docs.map(d => [d.id, `${d.data().firstName} ${d.data().lastName}`]));

                const data = tasksSnap.docs.map(d => {
                    const taskData = d.data();
                    const entId = d.ref.parent.parent!.id;
                    const entity = entityMap.get(entId);
                    const partnerType = entity?.type || entity?.role || entity?.industrial_category || 'lead';

                    return {
                        id: d.id,
                        partnerId: entId,
                        partnerName: entity?.companyName || entity?.company_name || `${entity?.firstName || ''} ${entity?.lastName || ''}`.trim() || 'Unknown',
                        partnerType: partnerType,
                        assigneeName: staffMap.get(taskData.assigneeId) || 'Unassigned',
                        ...serializeTimestamps(taskData)
                    };
                });

                const filtered = type && type !== 'all' 
                    ? data.filter(t => {
                        const lowType = type.toLowerCase();
                        const lowPartnerType = t.partnerType?.toLowerCase() || '';
                        return lowPartnerType.includes(lowType) || (lowType === 'supplier' && lowPartnerType !== 'transporter');
                    })
                    : data;

                return NextResponse.json({ success: true, data: filtered });
            }

            /**
             * ROBUST COMMUNICATION LOGGING
             * Detects source collection automatically to prevent orphaned logs.
             */
            case 'logCommunication': {
                const { partnerId, type, subject, notes, collection: collName } = payload;
                
                let targetColl = collName;
                if (!targetColl) {
                    const [pDoc, lDoc] = await Promise.all([
                        db.collection('partners').doc(partnerId).get(),
                        db.collection('leads').doc(partnerId).get()
                    ]);
                    targetColl = pDoc.exists ? 'partners' : (lDoc.exists ? 'leads' : 'partners');
                }

                const logRef = db.collection(targetColl).doc(partnerId).collection('communications').doc();
                const batch = db.batch();
                
                batch.set(logRef, {
                    type, subject, notes,
                    timestamp: FieldValue.serverTimestamp(),
                    adminId: decodedToken.uid
                });
                
                batch.update(db.collection(targetColl).doc(partnerId), {
                    lastOutreachSubject: subject,
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                });

                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'logForensicInitiated': {
                const { partnerId, isLead } = payload;
                const coll = isLead ? 'leads' : 'partners';
                await db.collection(coll).doc(partnerId).update({
                    researchStatus: 'searching',
                    lastForensicAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'bulkLogForensicInitiated': {
                const { leadIds, type } = payload;
                const coll = type === 'lead' ? 'leads' : 'partners';
                const chunks = chunkArray(leadIds, 400);
                
                for (const chunk of chunks) {
                    const batch = db.batch();
                    chunk.forEach((id: string) => {
                        batch.update(db.collection(coll).doc(id), {
                            researchStatus: 'searching',
                            lastForensicAt: FieldValue.serverTimestamp(),
                            updatedAt: FieldValue.serverTimestamp()
                        });
                    });
                    await batch.commit();
                }
                return NextResponse.json({ success: true });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const coll = type === 'lead' ? 'leads' : 'partners';
                const chunks = chunkArray(partners, 400);
                
                for (const chunk of chunks) {
                    const batch = db.batch();
                    chunk.forEach((p: any) => {
                        const docRef = db.collection(coll).doc(p.record_id || p.id || db.collection(coll).doc().id);
                        batch.set(docRef, {
                            ...p,
                            status: p.status || 'new',
                            type: type,
                            createdAt: FieldValue.serverTimestamp(),
                            updatedAt: FieldValue.serverTimestamp()
                        }, { merge: true });
                    });
                    await batch.commit();
                }
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
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

            default:
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
