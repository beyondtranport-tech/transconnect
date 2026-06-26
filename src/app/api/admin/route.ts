
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * UTILITY: Serialize Timestamps
 * Ensures Firestore data is JSON-compatible for the frontend.
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
        
        // Root Admin Emails
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';
        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};
        const db = getFirestore(app);

        switch (action) {
            /**
             * MEMBER ROSTER & DASHBOARD
             */
            case 'getMembers': {
                const companiesSnap = await db.collection('companies').orderBy('updatedAt', 'desc').limit(1000).get();
                
                // Enrichment: Join with owner profile data
                const ownerIds = companiesSnap.docs.map(d => d.data().ownerId).filter(id => !!id);
                const userDetailsMap = new Map();
                
                if (ownerIds.length > 0) {
                    // Firebase 'in' query limit is 30.
                    const chunks = [];
                    for (let i = 0; i < ownerIds.length; i += 30) {
                        chunks.push(ownerIds.slice(i, i + 30));
                    }
                    
                    const userSnaps = await Promise.all(chunks.map(chunk => 
                        db.collection('users').where(FieldValue.documentId(), 'in', chunk).get()
                    ));

                    userSnaps.forEach(snap => {
                        snap.forEach(d => {
                            const data = d.data();
                            userDetailsMap.set(d.id, { 
                                firstName: data.firstName, 
                                lastName: data.lastName, 
                                email: data.email 
                            });
                        });
                    });
                }

                const data = companiesSnap.docs.map(doc => {
                    const companyData = doc.data();
                    const owner = userDetailsMap.get(companyData.ownerId) || {};
                    return {
                        id: doc.id,
                        ...companyData,
                        ...owner 
                    };
                });

                return NextResponse.json({ success: true, data: data.map(serializeTimestamps) });
            }

            /**
             * REGISTRY & LEADS
             */
            case 'getPartnersByType':
            case 'searchRegistry': {
                const { term, type, outreachFilter, limit = 20000 } = payload;
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

                const apiType = type || payload.type;
                if (apiType && apiType !== 'all' && apiType !== 'lead') {
                    normalized = normalized.filter(p => p.type === apiType.toLowerCase());
                } else if (apiType === 'lead') {
                    normalized = normalized.filter(p => p.source === 'leads');
                }

                if (outreachFilter === 'none') {
                    normalized = normalized.filter(p => !p.lastOutreachSubject && ['new', 'inactive', 'contacted'].includes(p.status));
                } else if (outreachFilter && outreachFilter !== 'all') {
                    normalized = normalized.filter(p => p.lastOutreachSubject === outreachFilter);
                }

                if (term) {
                    const lowTerm = term.toLowerCase();
                    normalized = normalized.filter(p => 
                        p.companyName.toLowerCase().includes(lowTerm) || 
                        p.id.toLowerCase().includes(lowTerm) || 
                        p.email.toLowerCase().includes(lowTerm) ||
                        p.contactPerson.toLowerCase().includes(lowTerm)
                    );
                }

                const uniqueMap = new Map();
                normalized.forEach(item => {
                    const key = (item.id || item.email || item.companyName).toLowerCase();
                    if (!uniqueMap.has(key)) uniqueMap.set(key, item);
                });

                let data = Array.from(uniqueMap.values());
                data.sort((a,b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
                
                return NextResponse.json({ success: true, data: data.map(serializeTimestamps) });
            }

            /**
             * OPS & AUDIT
             */
            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getContributions': {
                const snap = await db.collection('contributions').orderBy('createdAt', 'desc').limit(500).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getShops': {
                const snap = await db.collectionGroup('shops').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').orderBy('firstName', 'asc').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
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
                
                batch.set(parentRef, {
                    lastOutreachSubject: subject,
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });

                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'savePartner': {
                const { partner } = payload;
                const id = partner.id || db.collection('partners').doc().id;
                const ref = db.collection('partners').doc(id);
                await ref.set({ ...partner, id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'deletePartner': {
                const { partnerId } = payload;
                await db.collection('partners').doc(partnerId).delete();
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
