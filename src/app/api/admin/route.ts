
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
                const { term, category, type, integrityFilter, outreachFilter, enrichmentFilter, limit: requestedLimit, page = 1 } = payload;
                
                const limitValue = requestedLimit || 100;
                const offset = (page - 1) * limitValue;

                // 1. Fetch raw data from both sources
                const [pSnap, lSnap] = await Promise.all([
                    db.collection('partners').orderBy('updatedAt', 'desc').get(),
                    db.collection('leads').orderBy('updatedAt', 'desc').get()
                ]);

                // 2. Normalize and merge
                const normalized = [
                    ...pSnap.docs.map(d => ({ id: d.id, source: 'partners', ...d.data() })),
                    ...lSnap.docs.map(d => ({ id: d.id, source: 'leads', ...d.data() }))
                ].map(item => ({
                    ...item,
                    companyName: (item.companyName || item.company_name || item.trading_name || '').trim(),
                    email: (item.email || item.email_address || '').trim().toLowerCase(),
                    contactPerson: item.contactPerson || item.contact_person || (item.firstName ? `${item.firstName} ${item.lastName}` : '').trim(),
                    status: item.status || 'new',
                    entryType: item.industrial_category || item.category || 'General'
                }));

                // 3. Absolute De-duplication (Priority: Partners > Leads)
                const uniqueMap = new Map();
                normalized.forEach(item => {
                    const key = (item.companyName || item.email || item.id).toLowerCase();
                    if (!uniqueMap.has(key) || item.source === 'partners') {
                        uniqueMap.set(key, item);
                    }
                });

                let data = Array.from(uniqueMap.values());

                // 4. Apply Tab Type Filtering
                if (type && type !== 'all' && type !== 'lead') {
                    data = data.filter(p => p.type === type.toLowerCase());
                }

                // 5. Apply Forensic Variable Filters
                if (category && category !== 'all') {
                    data = data.filter(p => p.entryType === category);
                }

                if (term) {
                    const lowTerm = term.toLowerCase();
                    data = data.filter(p => 
                        p.companyName.toLowerCase().includes(lowTerm) || 
                        p.id.toLowerCase().includes(lowTerm) || 
                        p.email.toLowerCase().includes(lowTerm)
                    );
                }

                if (integrityFilter === 'has-email') data = data.filter(p => !!p.email);
                if (integrityFilter === 'no-email') data = data.filter(p => !p.email);
                
                // CRITICAL: Robust Outreach Filter
                if (outreachFilter === 'none') {
                    data = data.filter(p => !p.lastOutreachSubject && ['new', 'inactive'].includes(p.status));
                } else if (outreachFilter && outreachFilter !== 'all') {
                    data = data.filter(p => p.lastOutreachSubject === outreachFilter);
                }

                if (enrichmentFilter === 'enriched') {
                    data = data.filter(p => !!p.minedServiceWording || !!p.website || !!p.notes);
                } else if (enrichmentFilter === 'unenriched') {
                    data = data.filter(p => !p.minedServiceWording && !p.website && !p.notes);
                }

                // 6. Sort and Paginate
                data.sort((a,b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
                const totalCount = data.length;
                const paginatedData = data.slice(offset, offset + limitValue).map(serializeTimestamps);

                return NextResponse.json({ 
                    success: true, 
                    data: paginatedData,
                    totalCount,
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limitValue)
                });
            }

            case 'logCommunication': {
                const { partnerId, type, subject, notes, collection: providedColl } = payload;
                
                const [pDoc, lDoc] = await Promise.all([
                    db.collection('partners').doc(partnerId).get(),
                    db.collection('leads').doc(partnerId).get()
                ]);

                const targetColl = providedColl || (pDoc.exists ? 'partners' : (lDoc.exists ? 'leads' : 'partners'));
                const batch = db.batch();
                const parentRef = db.collection(targetColl).doc(partnerId);
                const logRef = parentRef.collection('communications').doc();
                
                batch.set(logRef, {
                    type, subject, notes,
                    timestamp: FieldValue.serverTimestamp(),
                    adminId: decodedToken.uid,
                    partnerId,
                    partnerName: (targetColl === 'partners' ? pDoc.data()?.companyName : lDoc.data()?.companyName) || 'Unknown Entity'
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

            case 'logForensicInitiated': {
                const { partnerId, isLead } = payload;
                const ref = db.collection(isLead ? 'leads' : 'partners').doc(partnerId);
                await ref.update({
                    researchStatus: 'searching',
                    status: 'contacted',
                    lastForensicAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'bulkLogForensicInitiated': {
                const { leadIds, type } = payload;
                const coll = type === 'lead' ? 'leads' : 'partners';
                const batch = db.batch();
                leadIds.forEach((id: string) => {
                    batch.update(db.collection(coll).doc(id), {
                        researchStatus: 'searching',
                        status: 'contacted',
                        lastForensicAt: FieldValue.serverTimestamp(),
                        updatedAt: FieldValue.serverTimestamp()
                    });
                });
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'getAudienceCommunications': {
                const { type } = payload;
                const snap = await db.collectionGroup('communications')
                    .orderBy('timestamp', 'desc')
                    .limit(200)
                    .get();
                
                let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                
                // Filter by audience logic (e.g. transporters or suppliers)
                if (type && type !== 'all') {
                    // Logic would go here to filter by partner/lead type associated with the log
                }

                return NextResponse.json({ success: true, data: serializeTimestamps(data) });
            }

            case 'getAudienceTasks': {
                const { type } = payload;
                const snap = await db.collectionGroup('tasks')
                    .where('status', '==', 'pending')
                    .orderBy('createdAt', 'desc')
                    .limit(100)
                    .get();
                
                return NextResponse.json({ success: true, data: serializeTimestamps(snap.docs.map(d => d.data())) });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('updatedAt', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                let q: any = db.collection('partners');
                if (type !== 'all') q = q.where('type', '==', type);
                const snap = await q.orderBy('updatedAt', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            default:
                return NextResponse.json({ success: false, error: `Action "${action}" unknown.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
