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
             * HIGH-EFFICIENCY REGISTRY SEARCH
             * Normalized for Lead and Partner data keys.
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
                
                let partnersPromise;
                let leadsPromise;

                if (category && category !== 'all') {
                    partnersPromise = db.collection('partners').where('industrial_category', '==', category).get();
                    leadsPromise = db.collection('leads').where('industrial_category', '==', category).get();
                } else {
                    partnersPromise = db.collection('partners').orderBy('updatedAt', 'desc').limit(1000).get();
                    leadsPromise = db.collection('leads').orderBy('updatedAt', 'desc').limit(1000).get();
                }

                const [partnersSnap, leadsSnap] = await Promise.all([partnersPromise, leadsPromise]);

                // Normalize data structures so UI components use consistent keys
                let data = [
                    ...partnersSnap.docs.map(d => {
                        const raw = d.data();
                        return { 
                            id: d.id, 
                            source: 'partners', 
                            email: raw.email || raw.email_address || '',
                            phone: raw.phone || raw.telephone_number || '',
                            mobile: raw.mobile || raw.registry_line || '',
                            companyName: raw.companyName || raw.company_name || raw.trading_name || '',
                            contactPerson: raw.contactPerson || raw.contact_person || '',
                            ...serializeTimestamps(raw) 
                        };
                    }),
                    ...leadsSnap.docs.map(d => {
                        const raw = d.data();
                        return { 
                            id: d.id, 
                            source: 'leads', 
                            email: raw.email || raw.email_address || '',
                            phone: raw.phone || raw.telephone_number || '',
                            mobile: raw.mobile || raw.registry_line || '',
                            companyName: raw.companyName || raw.company_name || raw.trading_name || '',
                            contactPerson: raw.contactPerson || raw.contact_person || '',
                            ...serializeTimestamps(raw) 
                        };
                    })
                ];

                // 2. Audience / Type Filter
                if (type && type !== 'all' && type !== 'lead') {
                    const lowType = type.toLowerCase();
                    data = data.filter(p => 
                        (p.type?.toLowerCase() === lowType) || 
                        (p.role?.toLowerCase() === lowType) ||
                        (p.industrial_category?.toLowerCase().includes(lowType)) ||
                        (p.category?.toLowerCase().includes(lowType))
                    );
                }

                // Text Search
                if (searchCompany) {
                    const low = searchCompany.toLowerCase();
                    data = data.filter(item => (item.companyName || '').toLowerCase().includes(low));
                }
                
                if (searchKeyword) {
                    const low = searchKeyword.toLowerCase();
                    data = data.filter(item => (item.minedServiceWording || item.notes || '').toLowerCase().includes(low));
                }

                // Data Integrity Filters (Using normalized keys)
                if (integrityFilter && integrityFilter !== 'all') {
                    if (integrityFilter === 'has-email') {
                        data = data.filter(p => !!p.email && p.email.includes('@'));
                    } else if (integrityFilter === 'no-email') {
                        data = data.filter(p => !p.email);
                    } else if (integrityFilter === 'has-website') {
                        data = data.filter(p => !!p.website || !!p.website_url);
                    }
                }

                return NextResponse.json({ success: true, data: data.slice(0, 1000) });
            }

            /**
             * UNIFIED COMMUNICATIONS FEED
             */
            case 'getAudienceCommunications': {
                const { type } = payload;
                const commsSnap = await db.collectionGroup('communications').orderBy('timestamp', 'desc').limit(200).get();
                
                if (commsSnap.empty) return NextResponse.json({ success: true, data: [] });

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
                    const partnerType = entity?.type || entity?.role || entity?.industrial_category || 'lead';

                    return {
                        id: d.id,
                        partnerId: entId,
                        partnerName: entity?.companyName || entity?.company_name || entity?.trading_name || `${entity?.firstName || ''} ${entity?.lastName || ''}`.trim() || 'Unknown',
                        partnerType: partnerType,
                        ...serializeTimestamps(d.data())
                    };
                });

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
