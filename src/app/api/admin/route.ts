import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    if (docData instanceof Timestamp) return docData.toDate().toISOString();
    if (Array.isArray(docData)) return docData.map(serializeTimestamps);
    if (typeof docData === 'object' && docData !== null) {
        const serialized: { [key: string]: any } = {};
        for (const key in docData) serialized[key] = serializeTimestamps(docData[key]);
        return serialized;
    }
    return docData;
}

export async function POST(req: NextRequest) {
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) throw new Error(`Admin SDK failed: ${initError}`);

        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized.');
        const token = authHeader.split('Bearer ')[1];
        
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        const db = getFirestore(app);

        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || 
                        decodedToken.email === 'mkoton100@gmail.com' || 
                        decodedToken.email === 'michael@logisticsflow.co.za' ||
                        decodedToken.admin === true;

        if (!isAdmin) {
            throw new Error("Access Denied: Administrative authority required.");
        }

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};

        switch (action) {
            case 'getBrokerAgreements': {
                const snap = await db.collectionGroup('brokerAgreements')
                    .orderBy('status', 'asc')
                    .orderBy('createdAt', 'desc')
                    .limit(100)
                    .get();

                const results = await Promise.all(snap.docs.map(async (d) => {
                    const data = d.data();
                    const brokerSnap = await db.collection('companies').doc(data.brokerId).get();
                    return {
                        id: d.id,
                        path: d.ref.path,
                        brokerName: brokerSnap.data()?.companyName || 'Unknown Broker',
                        ...data
                    };
                }));
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'updateBrokerAgreementStatus': {
                const { path, status } = payload;
                if (!path || !status) throw new Error("Path and status required.");
                await db.doc(path).update({ status, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }

            case 'getGlobalLoads': {
                const snap = await db.collectionGroup('loads')
                    .orderBy('status', 'asc')
                    .orderBy('createdAt', 'desc')
                    .limit(200)
                    .get();

                const results = await Promise.all(snap.docs.map(async (d) => {
                    const data = d.data();
                    const brokerSnap = await db.collection('companies').doc(data.brokerId).get();
                    return {
                        id: d.id,
                        path: d.ref.path,
                        brokerName: brokerSnap.data()?.companyName || 'Unknown Broker',
                        ...data
                    };
                }));
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'searchRegistry': {
                const { type, term, limit = 100 } = payload;
                const safeLimit = Math.min(limit, 1000);
                
                let queryRef: any;
                if (type === 'all') {
                    queryRef = db.collection('partners').orderBy('updatedAt', 'desc');
                } else {
                    queryRef = db.collection('partners').where('type', '==', type).orderBy('updatedAt', 'desc');
                }

                const snap = await queryRef.limit(safeLimit).get();
                let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                if (term) {
                    const lowTerm = term.toLowerCase();
                    results = results.filter(r => 
                        (r.companyName || '').toLowerCase().includes(lowTerm) ||
                        (r.contactPerson || '').toLowerCase().includes(lowTerm) ||
                        (r.email || '').toLowerCase().includes(lowTerm)
                    );
                }

                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(500).get();
                const members = await Promise.all(snap.docs.map(async (doc) => {
                    const data = doc.data();
                    const ownerSnap = await db.collection('users').doc(data.ownerId).get();
                    return { 
                        id: doc.id, 
                        ...data, 
                        firstName: ownerSnap.data()?.firstName || 'User', 
                        lastName: ownerSnap.data()?.lastName || '', 
                        email: ownerSnap.data()?.email || 'N/A' 
                    };
                }));
                return NextResponse.json({ success: true, data: members.map(serializeTimestamps) });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            default: return NextResponse.json({ success: false, error: "Action not supported." }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}