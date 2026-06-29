
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * UTILITY: Serialize Timestamps for JSON transport
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
        
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || 
                        decodedToken.email === 'mkoton100@gmail.com' ||
                        decodedToken.email === 'michael@logisticsflow.co.za' ||
                        decodedToken.admin === true;

        const db = getFirestore(app);
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.data();
        
        const isAssociate = userData?.role === 'associate' || userData?.declaredPosition === 'associate';

        if (!isAdmin && !isAssociate) throw new Error("Forbidden: Elevated access required.");

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};

        switch (action) {
            case 'searchRegistry': {
                const { type, term, status, outreachFilter, assigneeId, limit = 200 } = payload;
                let results: any[] = [];

                // 1. Search Leads Collection
                if (type !== 'partner') {
                    let leadsQ: any = db.collection('leads');
                    if (type && type !== 'all' && type !== 'lead') {
                        const typeMap: Record<string, string[]> = {
                            'associate': ['associate', 'Digital Partners', 'Digital Partner'],
                            'isa': ['isa', 'ISA Agents', 'ISA Agent'],
                            'supplier': ['supplier', 'vendor', 'Suppliers', 'Supplier', 'Vendors'],
                            'transporter': ['transporter', 'Transporters', 'Transporter'],
                            'finance': ['finance', 'financier', 'Finance Companies', 'Finance Partner'],
                            'driver': ['driver', 'Drivers', 'Driver']
                        };
                        const possibleRoles = typeMap[type] || [type];
                        leadsQ = leadsQ.where('role', 'in', possibleRoles);
                    }
                    if (status && status !== 'all') leadsQ = leadsQ.where('status', '==', status);
                    if (assigneeId && assigneeId !== 'all') leadsQ = leadsQ.where('assigneeId', '==', assigneeId === 'none' ? null : assigneeId);
                    if (term) leadsQ = leadsQ.where('companyName', '>=', term).where('companyName', '<=', term + '\uf8ff');
                    
                    const leadsSnap = await leadsQ.limit(limit).get();
                    results = [...results, ...leadsSnap.docs.map(d => ({ id: d.id, source: 'Lead', ...d.data(), type: type === 'all' || type === 'lead' ? (d.data().role?.toLowerCase() || 'lead') : type }))];
                }

                // 2. Search Partners Collection
                if (type !== 'lead') {
                    let partnersQ: any = db.collection('partners');
                    if (type && type !== 'all' && type !== 'partner') partnersQ = partnersQ.where('type', '==', type);
                    if (status && status !== 'all') partnersQ = partnersQ.where('status', '==', status);
                    if (assigneeId && assigneeId !== 'all') partnersQ = partnersQ.where('assigneeId', '==', assigneeId === 'none' ? null : assigneeId);
                    if (term) partnersQ = partnersQ.where('companyName', '>=', term).where('companyName', '<=', term + '\uf8ff');

                    const partnersSnap = await partnersQ.limit(limit).get();
                    results = [...results, ...partnersSnap.docs.map(d => ({ id: d.id, source: 'Partner', ...d.data() }))];
                }

                // 3. Search Companies Collection
                if (type !== 'lead' && type !== 'partner') {
                    let companiesQ: any = db.collection('companies');
                    if (type && type !== 'all') companiesQ = companiesQ.where('declaredRole', '==', type);
                    if (status && status !== 'all') companiesQ = companiesQ.where('status', '==', status);
                    if (assigneeId && assigneeId !== 'all') companiesQ = companiesQ.where('assigneeId', '==', assigneeId === 'none' ? null : assigneeId);
                    if (term) companiesQ = companiesQ.where('companyName', '>=', term).where('companyName', '<=', term + '\uf8ff');

                    const companiesSnap = await companiesQ.limit(limit).get();
                    results = [...results, ...companiesSnap.docs.map(d => ({ id: d.id, source: 'Member', ...d.data(), type: type === 'all' ? (d.data().declaredRole || d.data().shopType || 'member') : type }))];
                }

                if (outreachFilter === 'none') {
                    results = results.filter(r => !r.lastOutreachSubject);
                } else if (outreachFilter && outreachFilter !== 'all') {
                    results = results.filter(r => r.lastOutreachSubject === outreachFilter);
                }

                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                const typeMap: Record<string, string[]> = {
                    'associate': ['associate', 'Digital Partners', 'Digital Partner'],
                    'isa': ['isa', 'ISA Agents', 'ISA Agent'],
                    'supplier': ['supplier', 'vendor', 'Suppliers', 'Supplier', 'Vendors'],
                    'transporter': ['transporter', 'Transporters', 'Transporter'],
                    'finance': ['finance', 'financier', 'Finance Companies', 'Finance Partner'],
                    'driver': ['driver', 'Drivers', 'Driver']
                };
                const possibleRoles = typeMap[type] || [type];
                const [leadsSnap, partnersSnap, companiesSnap] = await Promise.all([
                    db.collection('leads').where('role', 'in', possibleRoles).get(),
                    db.collection('partners').where('type', '==', type).get(),
                    db.collection('companies').where('declaredRole', '==', type).get()
                ]);
                const results = [
                    ...leadsSnap.docs.map(d => ({ id: d.id, source: 'Lead', ...d.data() })),
                    ...partnersSnap.docs.map(d => ({ id: d.id, source: 'Partner', ...d.data() })),
                    ...companiesSnap.docs.map(d => ({ id: d.id, source: 'Member', ...d.data() }))
                ];
                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('updatedAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getStaff': {
                const snap = await db.collectionGroup('staff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, companyId: d.ref.parent.parent?.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getShops': {
                const snap = await db.collectionGroup('shops').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, companyId: d.ref.parent.parent?.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getContributions': {
                const snap = await db.collection('contributions').orderBy('createdAt', 'desc').limit(1000).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getWalletPayments': {
                const snap = await db.collectionGroup('walletPayments').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, companyId: d.ref.parent.parent?.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getWalletTransactions': {
                const snap = await db.collectionGroup('transactions').orderBy('date', 'desc').limit(500).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, companyId: d.ref.parent.parent?.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'getAudienceCommunications': {
                const { type } = payload;
                const snap = await db.collectionGroup('communications').orderBy('timestamp', 'desc').limit(200).get();
                const filtered = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data: filtered });
            }

            case 'getAudienceTasks': {
                const { type } = payload;
                const snap = await db.collectionGroup('tasks').orderBy('createdAt', 'desc').limit(200).get();
                const filtered = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data: filtered });
            }

            case 'listAllUsers': {
                const snap = await adminAuth.listUsers(1000);
                return NextResponse.json({ success: true, data: snap.users });
            }

            default: return NextResponse.json({ success: false, error: "Action invalid." }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Admin API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
