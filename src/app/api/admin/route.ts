
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue, FieldPath } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Serializes Firestore objects for JSON response.
 */
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
            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(100).get();
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

            case 'getShops': {
                const snap = await db.collectionGroup('shops').orderBy('updatedAt', 'desc').limit(100).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getContributions': {
                const snap = await db.collection('contributions').orderBy('createdAt', 'desc').limit(100).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getStaff': {
                const snap = await db.collectionGroup('staff').limit(100).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                let q = db.collection('partners').orderBy('updatedAt', 'desc').limit(100);
                if (type !== 'all') {
                    q = db.collection('partners').where('type', '==', type).orderBy('updatedAt', 'desc').limit(100);
                }
                const snap = await q.get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(100).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'searchRegistry': {
                const { term, type } = payload;
                const collectionName = type === 'driver' || type === 'supplier' || type === 'transporter' || type === 'finance' ? 'partners' : 'leads';
                let q = db.collection(collectionName)
                    .where('companyName', '>=', term)
                    .where('companyName', '<=', term + '\uf8ff')
                    .limit(100);
                
                if (type && type !== 'all' && type !== 'lead') {
                    q = q.where('type', '==', type);
                }

                const snap = await q.get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
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

            case 'logCommunication': {
                const { partnerId, type, subject, notes } = payload;
                const ref = db.collection('partners').doc(partnerId).collection('communications').doc();
                await ref.set({
                    id: ref.id, type, subject, notes,
                    timestamp: FieldValue.serverTimestamp()
                });
                await db.collection('partners').doc(partnerId).set({
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
                return NextResponse.json({ success: true });
            }

            case 'deletePartner': {
                const { partnerId } = payload;
                await db.collection('partners').doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }

            case 'deleteLeads': {
                const { leadIds } = payload;
                const batchSize = 500;
                for (let i = 0; i < leadIds.length; i += batchSize) {
                    const chunk = leadIds.slice(i, i + batchSize);
                    const batch = db.batch();
                    chunk.forEach((id: string) => batch.delete(db.collection('leads').doc(id)));
                    await batch.commit();
                }
                return NextResponse.json({ success: true, count: leadIds.length });
            }

            case 'findDuplicateLeads': {
                const snap = await db.collection('leads').limit(500).get();
                const nameMap = new Map<string, any[]>();
                snap.docs.forEach(d => {
                    const data = d.data();
                    const name = (data.companyName || '').toLowerCase().trim();
                    if (!name) return;
                    if (!nameMap.has(name)) nameMap.set(name, []);
                    nameMap.get(name)?.push({ id: d.id, ...data, source: 'Lead' });
                });
                const duplicates = Array.from(nameMap.values()).filter(group => group.length > 1);
                return NextResponse.json({ success: true, data: duplicates });
            }

            case 'approvePayout': {
                const { companyId, payoutId, amount } = payload;
                const batch = db.batch();
                const companyRef = db.collection('companies').doc(companyId);
                const payoutRef = db.collection(`companies/${companyId}/payoutRequests`).doc(payoutId);
                const txRef = db.collection(`companies/${companyId}/transactions`).doc();

                batch.update(companyRef, { 
                    walletBalance: FieldValue.increment(-amount),
                    availableBalance: FieldValue.increment(-amount),
                    updatedAt: FieldValue.serverTimestamp()
                });
                batch.update(payoutRef, { status: 'approved', updatedAt: FieldValue.serverTimestamp() });
                batch.set(txRef, {
                    transactionId: txRef.id,
                    type: 'debit',
                    amount,
                    description: 'Wallet Payout (Approved)',
                    date: FieldValue.serverTimestamp(),
                    status: 'allocated'
                });

                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'rejectPayout': {
                const { companyId, payoutId } = payload;
                await db.collection(`companies/${companyId}/payoutRequests`).doc(payoutId).update({
                    status: 'rejected',
                    updatedAt: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'refreshSupplierCategoryCounts':
            case 'refreshTransporterCategoryCounts':
            case 'refreshDriverCategoryCounts':
            case 'refreshFinanceCategoryCounts': {
                const type = action.includes('Supplier') ? 'supplier' : action.includes('Transporter') ? 'transporter' : action.includes('Driver') ? 'driver' : 'finance';
                const statsKey = `${type}DiscoveryStats`;
                const snap = await db.collection('partners').where('type', '==', type).get();
                const counts: Record<string, number> = {};
                snap.docs.forEach(doc => {
                    const cat = doc.data().entryType || 'General';
                    counts[cat] = (counts[cat] || 0) + 1;
                });
                await db.collection('configuration').doc(statsKey).set({
                    counts,
                    lastUpdated: FieldValue.serverTimestamp()
                });
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
