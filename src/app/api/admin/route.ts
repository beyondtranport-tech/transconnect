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
                const { term, category, type, outreachFilter, enrichmentFilter, limit = 10000 } = payload;
                
                // Optimized Full Loading Strategy: Fetch entire segments as requested
                const [pSnap, lSnap] = await Promise.all([
                    db.collection('partners').limit(limit).get(),
                    db.collection('leads').limit(limit).get()
                ]);

                let normalized = [
                    ...pSnap.docs.map(d => ({ id: d.id, source: 'partners', ...d.data() })),
                    ...lSnap.docs.map(d => ({ id: d.id, source: 'leads', ...d.data() }))
                ].map(item => ({
                    ...item,
                    companyName: (item.companyName || item.company_name || item.trading_name || '').trim(),
                    email: (item.email || item.email_address || '').trim().toLowerCase(),
                    contactPerson: (item.contactPerson || item.contact_person || (item.firstName ? `${item.firstName} ${item.lastName}` : '')).trim(),
                    status: item.status || 'new',
                    entryType: item.industrial_category || item.category || item.entryType || item.classification || item.role || 'General'
                }));

                // 1. Primary Collection Filtering
                if (type && type !== 'all' && type !== 'lead') {
                    normalized = normalized.filter(p => p.type === type.toLowerCase());
                } else if (type === 'lead') {
                    normalized = normalized.filter(p => p.source === 'leads');
                }

                // 2. Specific Logic Filtering
                if (category && category !== 'all') {
                    normalized = normalized.filter(p => p.entryType === category || p.classification === category);
                }

                if (outreachFilter === 'none') {
                    normalized = normalized.filter(p => !p.lastOutreachSubject && (p.status === 'new' || p.status === 'contacted'));
                } else if (outreachFilter && outreachFilter !== 'all') {
                    normalized = normalized.filter(p => p.lastOutreachSubject === outreachFilter);
                }

                if (enrichmentFilter === 'enriched') {
                    normalized = normalized.filter(p => !!(p.minedServiceWording || p.notes || p.website));
                } else if (enrichmentFilter === 'unenriched') {
                    normalized = normalized.filter(p => !(p.minedServiceWording || p.notes || p.website));
                }

                // 3. Search Term
                if (term) {
                    const lowTerm = term.toLowerCase();
                    normalized = normalized.filter(p => 
                        p.companyName.toLowerCase().includes(lowTerm) || 
                        p.id.toLowerCase().includes(lowTerm) || 
                        p.email.toLowerCase().includes(lowTerm) ||
                        p.contactPerson.toLowerCase().includes(lowTerm)
                    );
                }

                // 4. Global De-duplication Logic
                const uniqueMap = new Map();
                normalized.forEach(item => {
                    const key = (item.companyName || item.email || item.id).toLowerCase();
                    if (!uniqueMap.has(key)) {
                        uniqueMap.set(key, item);
                    }
                });

                let data = Array.from(uniqueMap.values());

                // 5. Final Sort
                data.sort((a,b) => {
                    const timeA = new Date(a.updatedAt || 0).getTime();
                    const timeB = new Date(b.updatedAt || 0).getTime();
                    return timeB - timeA;
                });
                
                return NextResponse.json({ 
                    success: true, 
                    data: data.map(serializeTimestamps),
                    totalCount: data.length
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
                
                const partnerName = (targetColl === 'partners' ? pDoc.data()?.companyName : lDoc.data()?.companyName) || 'Unknown Entity';

                batch.set(logRef, {
                    type, subject, notes,
                    timestamp: FieldValue.serverTimestamp(),
                    adminId: decodedToken.uid,
                    partnerId,
                    partnerName: partnerName
                });
                
                batch.set(parentRef, {
                    lastOutreachSubject: subject,
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });

                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').orderBy('firstName', 'asc').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getPartnersByType': {
                const { type: pType, limit = 10000 } = payload;
                let q: any = db.collection('partners');
                if (pType && pType !== 'all') q = q.where('type', '==', pType);
                const snap = await q.orderBy('updatedAt', 'desc').limit(limit).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }
            
            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('updatedAt', 'desc').limit(10000).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'deletePartners': {
                const { partnerIds } = payload;
                const batch = db.batch();
                partnerIds.forEach((id: string) => {
                    batch.delete(db.collection('partners').doc(id));
                    batch.delete(db.collection('leads').doc(id));
                });
                await batch.commit();
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
