
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
                const { term, type, dataFilter } = payload;
                const collectionName = (type === 'lead') ? 'leads' : 'partners';
                
                let query: any = db.collection(collectionName);
                if (type && type !== 'all' && type !== 'lead') {
                    query = query.where('type', '==', type);
                }

                const snap = await query.orderBy('updatedAt', 'desc').limit(1000).get();
                
                let data = snap.docs.map((d: QueryDocumentSnapshot) => ({ 
                    id: d.id, 
                    ...serializeTimestamps(d.data()) 
                }));

                if (term && term.length > 0) {
                    const lowTerm = term.toLowerCase();
                    data = data.filter((item: any) => {
                        const name = (item.companyName || item.company_name || '').toLowerCase();
                        const email = (item.email || '').toLowerCase();
                        const contact = (item.contactPerson || '').toLowerCase();
                        const tags = (item.industrialTags || []).join(' ').toLowerCase();
                        const notes = (item.minedServiceWording || item.notes || '').toLowerCase();
                        return name.includes(lowTerm) || email.includes(lowTerm) || contact.includes(lowTerm) || tags.includes(lowTerm) || notes.includes(lowTerm);
                    });
                }

                if (dataFilter && dataFilter !== 'all') {
                    if (dataFilter === 'has-email') data = data.filter((p: any) => !!p.email);
                    else if (dataFilter === 'no-email') data = data.filter((p: any) => !p.email);
                    else if (dataFilter === 'has-phone') data = data.filter((p: any) => !!(p.phone || p.mobile));
                    else if (dataFilter === 'no-phone') data = data.filter((p: any) => !(p.phone || p.mobile));
                    else if (dataFilter === 'has-website') data = data.filter((p: any) => !!p.website);
                    else if (dataFilter === 'no-website') data = data.filter((p: any) => !p.website);
                }

                return NextResponse.json({ success: true, data: data.slice(0, 100) });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(200).get();
                const data = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getStaff': {
                const snap = await db.collectionGroup('staff').get();
                const data = snap.docs.map((d: QueryDocumentSnapshot) => ({ 
                    id: d.id, 
                    companyId: d.ref.parent.parent?.id,
                    ...serializeTimestamps(d.data()) 
                }));
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

            case 'getPendingAgreements': {
                const snap = await db.collectionGroup('agreements').where('status', '==', 'proposed').get();
                const data = snap.docs.map((d: QueryDocumentSnapshot) => ({ 
                    id: d.id, 
                    shopId: d.ref.parent.parent?.id,
                    companyId: d.ref.parent.parent?.parent.parent?.id,
                    ...serializeTimestamps(d.data()) 
                }));
                return NextResponse.json({ success: true, data });
            }

            case 'approveWalletPayment': {
                const { companyId, paymentId, amount, description, reconciliationId } = payload;
                const paymentRef = db.doc(`companies/${companyId}/walletPayments/${paymentId}`);
                const companyRef = db.doc(`companies/${companyId}`);
                
                await db.runTransaction(async (transaction) => {
                    transaction.update(paymentRef, { status: 'approved', reconciliationId, updatedAt: FieldValue.serverTimestamp() });
                    transaction.update(companyRef, { 
                        walletBalance: FieldValue.increment(amount),
                        availableBalance: FieldValue.increment(amount),
                        updatedAt: FieldValue.serverTimestamp()
                    });
                    const txRef = companyRef.collection('transactions').doc();
                    transaction.set(txRef, {
                        transactionId: txRef.id,
                        type: 'credit',
                        amount,
                        description,
                        reconciliationId,
                        date: FieldValue.serverTimestamp(),
                        status: 'allocated'
                    });
                });
                return NextResponse.json({ success: true });
            }

            case 'getWalletPayments': {
                const snap = await db.collectionGroup('walletPayments').where('status', '==', 'pending').get();
                const data = snap.docs.map((d: QueryDocumentSnapshot) => ({ 
                    id: d.id, 
                    companyId: d.ref.parent.parent?.id,
                    ...serializeTimestamps(d.data()) 
                }));
                return NextResponse.json({ success: true, data });
            }

            case 'getWalletTransactions': {
                const snap = await db.collectionGroup('transactions').orderBy('date', 'desc').limit(100).get();
                const data = snap.docs.map((d: QueryDocumentSnapshot) => ({ 
                    id: d.id, 
                    companyId: d.ref.parent.parent?.id,
                    ...serializeTimestamps(d.data()) 
                }));
                return NextResponse.json({ success: true, data });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                const data = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'logCommunication': {
                const { partnerId, type, subject, notes } = payload;
                const logRef = db.collection('partners').doc(partnerId).collection('communications').doc();
                await logRef.set({
                    type, subject, notes,
                    timestamp: FieldValue.serverTimestamp(),
                    adminId: decodedToken.uid
                });
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

            default:
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
