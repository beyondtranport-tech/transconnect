
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue, FieldPath } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    const newDocData: { [key: string]: any } = {};
    for (const key in docData) {
        const value = docData[key];
        if (value instanceof Timestamp) {
            newDocData[key] = value.toDate().toISOString();
        } else if (value && typeof value === 'object' && value._methodName === 'serverTimestamp') {
            newDocData[key] = new Date().toISOString();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            newDocData[key] = serializeTimestamps(value);
        } else {
            newDocData[key] = value;
        }
    }
    return newDocData;
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
        
        const { action, payload } = await req.json();
        const db = getFirestore(app);
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';

        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        switch (action) {
            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getMembers': {
                // QUOTA PROTECTION: Limit initial load to 200 members
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(200).get();
                const data = await Promise.all(snap.docs.map(async (d) => {
                    const cData = d.data();
                    const userSnap = await db.collection('users').doc(cData.ownerId).get();
                    const uData = userSnap.exists ? userSnap.data() : {};
                    return { 
                        ...serializeTimestamps(cData), 
                        id: d.id,
                        firstName: uData?.firstName || 'N/A',
                        lastName: uData?.lastName || '',
                        email: uData?.email || 'N/A'
                    };
                }));
                return NextResponse.json({ success: true, data });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                // QUOTA PROTECTION: Limit initial load to 200 records to prevent 429
                let q = db.collection('partners').orderBy('updatedAt', 'desc').limit(200);
                
                if (type !== 'all') {
                    q = db.collection('partners').where('type', '==', type).orderBy('updatedAt', 'desc').limit(200);
                }
                
                const snap = await q.get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getLeads': {
                // QUOTA PROTECTION: The primary killer of quotas is loading the whole lead db
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(200).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'searchRegistry': {
                const { term, type } = payload;
                if (!term || term.length < 3) return NextResponse.json({ success: true, data: [] });

                // Search by company name (starts with)
                const leadsSnap = await db.collection('leads')
                    .where('companyName', '>=', term)
                    .where('companyName', '<=', term + '\uf8ff')
                    .limit(50)
                    .get();

                const data = leadsSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'saveLead':
            case 'savePartner': {
                const { lead, partner } = payload;
                const data = lead || partner;
                const id = data.id || `PRT_${Math.random().toString(36).substring(7).toUpperCase()}`;
                const finalData = { ...data, id, updatedAt: FieldValue.serverTimestamp() };
                
                const batch = db.batch();
                batch.set(db.collection('leads').doc(id), finalData, { merge: true });
                batch.set(db.collection('partners').doc(id), finalData, { merge: true });
                await batch.commit();
                
                return NextResponse.json({ success: true, id });
            }

            case 'logCommunication': {
                const { partnerId, type, subject, notes } = payload;
                const ref = db.collection('partners').doc(partnerId).collection('communications').doc();
                await ref.set({
                    id: ref.id, type, subject, notes,
                    timestamp: FieldValue.serverTimestamp()
                });
                
                await db.collection('partners').doc(partnerId).update({
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    status: 'contacted'
                });
                
                return NextResponse.json({ success: true });
            }

            case 'deleteLeads': {
                const { leadIds } = payload;
                const batchSize = 100;
                let deletedCount = 0;

                for (let i = 0; i < leadIds.length; i += batchSize) {
                    const batch = db.batch();
                    const chunk = leadIds.slice(i, i + batchSize);
                    chunk.forEach((id: string) => {
                        batch.delete(db.collection('leads').doc(id));
                        batch.delete(db.collection('partners').doc(id));
                    });
                    await batch.commit();
                    deletedCount += chunk.length;
                }
                return NextResponse.json({ success: true, count: deletedCount });
            }

            case 'findDuplicateLeads': {
                // Optimized memory-efficient duplicate finder for high-volume registries
                const allLeads = await db.collection('leads').select('companyName', 'contactPerson').get();
                const nameMap = new Map<string, string[]>();
                
                allLeads.docs.forEach(doc => {
                    const data = doc.data();
                    const key = `${(data.companyName || '').toLowerCase().trim()}_${(data.contactPerson || '').toLowerCase().trim()}`;
                    if (key.length > 5) {
                        const existing = nameMap.get(key) || [];
                        nameMap.set(key, [...existing, doc.id]);
                    }
                });

                const duplicates: any[][] = [];
                for (const [key, ids] of nameMap.entries()) {
                    if (ids.length > 1) {
                        const group = await Promise.all(ids.map(async id => {
                            const d = await db.collection('leads').doc(id).get();
                            return { id, ...serializeTimestamps(d.data()), source: 'Lead' };
                        }));
                        duplicates.push(group);
                    }
                }
                return NextResponse.json({ success: true, data: duplicates.slice(0, 50) }); // Return limited sets to avoid timeout
            }

            default:
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
