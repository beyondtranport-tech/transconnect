
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
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

const chunkArray = (arr: any[], size: number) => 
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

const supplierCategories = ["Accessories", "Air", "Anti-Theft Devices", "Auto Electrical", "Batteries", "Brakes", "Cleaning Products", "Diesel", "Differential", "Engine Refurbish", "Filters", "Injectors", "Lights", "Mechanical repairs", "Oils & Lubricants", "Parts", "Prop Shafts", "Second Hand Trailers", "Second Hand Trucks", "Transport", "Tarpaulins", "Tow in", "Trailer repairs", "Truck Accessories", "Truck Parts", "Truck repairs", "Turbo", "Tyres"];
const transporterCategories = ["Long Haul", "Refrigerated", "Flatbed", "Tipper", "Hazmat", "LTL", "Cross-Border", "Local Distribution", "Container Transport", "Abnormal Loads"];

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
                const { term, searchCompany, searchKeyword, searchTag, category, type, integrityFilter, outreachFilter, limit: requestedLimit } = payload;
                
                let partnersQuery: any = db.collection('partners');
                let leadsQuery: any = db.collection('leads');

                if (category && category !== 'all') {
                    partnersQuery = partnersQuery.where('industrial_category', '==', category);
                    leadsQuery = leadsQuery.where('industrial_category', '==', category);
                }

                if (type && type !== 'all' && type !== 'lead') {
                    const typeLower = type.toLowerCase();
                    partnersQuery = partnersQuery.where('type', '==', typeLower);
                }

                const limitValue = requestedLimit || 100;

                const [pSnap, lSnap] = await Promise.all([
                    partnersQuery.orderBy('updatedAt', 'desc').limit(limitValue).get(),
                    leadsQuery.orderBy('updatedAt', 'desc').limit(limitValue).get()
                ]);

                let data = [
                    ...pSnap.docs.map(d => ({ id: d.id, source: 'partners', ...serializeTimestamps(d.data()) })),
                    ...lSnap.docs.map(d => ({ id: d.id, source: 'leads', ...serializeTimestamps(d.data()) }))
                ];

                data = data.map(item => ({
                    ...item,
                    companyName: item.companyName || item.company_name || item.trading_name || '',
                    email: item.email || item.email_address || '',
                    phone: item.phone || item.telephone_number || '',
                    mobile: item.mobile || item.registry_line || '',
                    contactPerson: item.contactPerson || item.contact_person || (item.firstName ? `${item.firstName} ${item.lastName}` : ''),
                    status: item.status || 'new',
                    entryType: item.industrial_category || item.category || 'General'
                }));

                if (term || searchCompany || searchKeyword || searchTag) {
                    const lowTerm = (term || searchCompany || '').toLowerCase();
                    const lowKey = (searchKeyword || '').toLowerCase();
                    const lowTag = (searchTag || '').toLowerCase();

                    data = data.filter(p => {
                        const matchesTerm = !lowTerm || p.companyName.toLowerCase().includes(lowTerm) || p.id.toLowerCase().includes(lowTerm) || p.email.toLowerCase().includes(lowTerm);
                        const matchesKey = !lowKey || (p.minedServiceWording || p.notes || '').toLowerCase().includes(lowKey);
                        const matchesTag = !lowTag || (p.industrialTags || []).some((t: string) => t.toLowerCase().includes(lowTag));
                        return matchesTerm && matchesKey && matchesTag;
                    });
                }

                if (integrityFilter === 'has-email') data = data.filter(p => !!p.email);
                if (integrityFilter === 'no-email') data = data.filter(p => !p.email);
                
                // NEW: Handle "No Outreach" filter
                if (outreachFilter === 'none') {
                    data = data.filter(p => !p.lastOutreachSubject);
                } else if (outreachFilter && outreachFilter !== 'all') {
                    data = data.filter(p => p.lastOutreachSubject === outreachFilter);
                }

                data.sort((a,b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

                return NextResponse.json({ success: true, data: data.slice(0, limitValue) });
            }

            case 'logCommunication': {
                const { partnerId, type, subject, notes } = payload;
                
                const [pDoc, lDoc] = await Promise.all([
                    db.collection('partners').doc(partnerId).get(),
                    db.collection('leads').doc(partnerId).get()
                ]);

                const targetColl = pDoc.exists ? 'partners' : (lDoc.exists ? 'leads' : 'partners');
                const batch = db.batch();
                const parentRef = db.collection(targetColl).doc(partnerId);
                const logRef = parentRef.collection('communications').doc();
                
                batch.set(logRef, {
                    type, subject, notes,
                    timestamp: FieldValue.serverTimestamp(),
                    adminId: decodedToken.uid
                });
                
                batch.update(parentRef, {
                    lastOutreachSubject: subject,
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                });

                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'getAudienceCommunications': {
                const { type } = payload;
                const commsSnap = await db.collectionGroup('communications').orderBy('timestamp', 'desc').limit(500).get();
                const entities: any[] = [];
                const parentIds = [...new Set(commsSnap.docs.map(d => d.ref.parent.parent!.id))];
                
                if (parentIds.length > 0) {
                    const idChunks = chunkArray(parentIds, 30);
                    for (const chunk of idChunks) {
                        const [pSnap, lSnap] = await Promise.all([
                            db.collection('partners').where(FieldValue.documentId(), 'in', chunk).get(),
                            db.collection('leads').where(FieldValue.documentId(), 'in', chunk).get()
                        ]);
                        entities.push(...pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                        entities.push(...lSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                    }
                }
                
                const entityMap = new Map(entities.map(e => [e.id, e]));
                let data = commsSnap.docs.map(d => {
                    const entId = d.ref.parent.parent!.id;
                    const ent = entityMap.get(entId);
                    
                    let mappedType = ent?.type || 'lead';
                    if (ent?.industrial_category) {
                        if (supplierCategories.includes(ent.industrial_category)) mappedType = 'supplier';
                        else if (transporterCategories.includes(ent.industrial_category)) mappedType = 'transporter';
                    }

                    return {
                        id: d.id,
                        partnerName: ent?.companyName || ent?.company_name || ent?.trading_name || 'Unknown',
                        partnerType: mappedType,
                        ...serializeTimestamps(d.data())
                    };
                });

                if (type && type !== 'all') {
                    const filter = type.toLowerCase().replace(/s$/, ''); 
                    data = data.filter(item => String(item.partnerType).toLowerCase().includes(filter));
                }

                return NextResponse.json({ success: true, data: data.slice(0, 100) });
            }

            case 'getAudienceTasks': {
                const { type } = payload;
                const tasksSnap = await db.collectionGroup('tasks').orderBy('createdAt', 'desc').limit(500).get();
                const entities: any[] = [];
                const parentIds = [...new Set(tasksSnap.docs.map(d => d.ref.parent.parent!.id))];
                
                if (parentIds.length > 0) {
                    const idChunks = chunkArray(parentIds, 30);
                    for (const chunk of idChunks) {
                        const [pSnap, lSnap] = await Promise.all([
                            db.collection('partners').where(FieldValue.documentId(), 'in', chunk).get(),
                            db.collection('leads').where(FieldValue.documentId(), 'in', chunk).get()
                        ]);
                        entities.push(...pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                        entities.push(...lSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                    }
                }
                
                const entityMap = new Map(entities.map(e => [e.id, e]));
                let data = tasksSnap.docs.map(d => {
                    const entId = d.ref.parent.parent!.id;
                    const ent = entityMap.get(entId);
                    
                    let mappedType = ent?.type || 'lead';
                    if (ent?.industrial_category) {
                        if (supplierCategories.includes(ent.industrial_category)) mappedType = 'supplier';
                        else if (transporterCategories.includes(ent.industrial_category)) mappedType = 'transporter';
                    }

                    return {
                        id: d.id,
                        partnerName: ent?.companyName || ent?.company_name || ent?.trading_name || 'Unknown',
                        partnerType: mappedType,
                        ...serializeTimestamps(d.data())
                    };
                });

                if (type && type !== 'all') {
                    const filter = type.toLowerCase().replace(/s$/, '');
                    data = data.filter(item => String(item.partnerType).toLowerCase().includes(filter));
                }

                return NextResponse.json({ success: true, data: data.slice(0, 100) });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('updatedAt', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'savePartner': {
                const { partner } = payload;
                const ref = db.collection(partner.type === 'lead' ? 'leads' : 'partners').doc(partner.id || db.collection('partners').doc().id);
                await ref.set({ ...partner, id: ref.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const batch = db.batch();
                const coll = type === 'lead' ? 'leads' : 'partners';
                partners.forEach((p: any) => {
                    const id = p.record_id || db.collection(coll).doc().id;
                    const ref = db.collection(coll).doc(id);
                    batch.set(ref, { 
                        ...p, 
                        id, 
                        type: type === 'lead' ? 'lead' : type,
                        updatedAt: FieldValue.serverTimestamp() 
                    }, { merge: true });
                });
                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'logForensicInitiated': {
                const { partnerId, isLead } = payload;
                const ref = db.collection(isLead ? 'leads' : 'partners').doc(partnerId);
                await ref.update({ researchStatus: 'searching', lastForensicAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }

            default:
                return NextResponse.json({ success: false, error: `Action "${action}" unknown.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
