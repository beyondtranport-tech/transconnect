import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Sanitizes and normalizes data for Firestore.
 * 1. Handles snake_case to camelCase mapping for AI Studio imports.
 * 2. RECTIFICATION: Automatically removes properties with 'undefined' values.
 */
function normalizeAndSanitize(obj: any): any {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(normalizeAndSanitize);
    
    const sanitized: any = {};
    for (const key in obj) {
        let val = obj[key];
        
        // RECTIFICATION: Skip undefined values to prevent Firestore document write errors
        if (val === undefined) continue;

        // Map AI snake_case keys to camelCase CRM keys
        let newKey = key;
        if (key === 'company_name') newKey = 'companyName';
        if (key === 'physical_address') newKey = 'address';
        if (key === 'contact_person') newKey = 'contactPerson';
        if (key === 'email_address') newKey = 'email';
        if (key === 'telephone_number') newKey = 'phone';
        if (key === 'registry_line') newKey = 'mobile';
        if (key === 'industrial_category') newKey = 'industrial_category'; 
        
        sanitized[newKey] = normalizeAndSanitize(val);
    }
    return sanitized;
}

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
        
        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};
        const db = getFirestore(app);
        
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';
        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        switch (action) {
            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(1000).get();
                const data = snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                let q = db.collection('partners').orderBy('updatedAt', 'desc').limit(1000);
                if (type && type !== 'all') {
                    q = db.collection('partners').where('type', '==', type).orderBy('updatedAt', 'desc').limit(1000);
                }
                const snap = await q.get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'bulkSavePartners': {
                const { partners, type } = payload;
                const batch = db.batch();
                for (const p of partners) {
                    let ref;
                    const cName = p.companyName || p.company_name || p.trading_name || p.name || p.service_handle;
                    
                    if (p.record_id) {
                        ref = db.collection('partners').doc(p.record_id);
                    } else if (cName) {
                        const safeId = String(cName).replace(/[^a-z0-9]/gi, '_').toLowerCase();
                        ref = db.collection('partners').doc(`${type}_${safeId}`);
                    } else {
                        ref = db.collection('partners').doc();
                    }

                    const rawData = {
                        ...p,
                        type,
                        companyName: cName,
                        contactPerson: p.contactPerson || p.contact_person || p.leadership || (p.firstName ? `${p.firstName} ${p.lastName}` : null),
                        email: p.email || p.email_address || p.professional_contact,
                        phone: p.phone || p.telephone_number || p.landline,
                        mobile: p.mobile || p.registry_line || p.cell,
                        address: p.address || p.physical_address || p.location || p.operational_hub,
                        industrial_category: p.industrial_category || p.category || p.classification || p.service_classification,
                        minedServiceWording: p.minedServiceWording || p.technical_summary || p.notes,
                        industrialTags: p.industrialTags || p.tags || [],
                        updatedAt: FieldValue.serverTimestamp(),
                        enrichedAt: FieldValue.serverTimestamp(),
                        researchStatus: 'completed'
                    };
                    
                    delete (rawData as any).seq;
                    delete (rawData as any).sequence;
                    
                    const data = normalizeAndSanitize(rawData);
                    batch.set(ref, data, { merge: true });
                }
                await batch.commit();
                return NextResponse.json({ success: true, count: partners.length });
            }

            case 'logCommunication': {
                const { partnerId, type: commType, subject, notes } = payload;
                const logRef = db.collection('partners').doc(partnerId).collection('communications').doc();
                await logRef.set({
                    id: logRef.id,
                    type: commType,
                    subject,
                    notes: notes || '',
                    timestamp: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'savePlatformStaff': {
                const { staff } = payload;
                const ref = staff.id ? db.collection('platformStaff').doc(staff.id) : db.collection('platformStaff').doc();
                await ref.set({ ...staff, id: ref.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                return NextResponse.json({ success: true });
            }

            case 'deletePartners': {
                const { partnerIds } = payload;
                const batch = db.batch();
                partnerIds.forEach((id: string) => {
                    batch.delete(db.collection('partners').doc(id));
                });
                await batch.commit();
                return NextResponse.json({ success: true, count: partnerIds.length });
            }

            case 'deletePartner': {
                const { partnerId } = payload;
                await db.collection('partners').doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }

            case 'findDuplicatePartners': {
                const { type } = payload;
                const snap = await db.collection('partners').where('type', '==', type).get();
                const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                
                const duplicates: any[][] = [];
                const incomplete: any[] = [];
                const seen = new Map<string, string[]>();

                records.forEach((r: any) => {
                    const name = (r.companyName || '').toLowerCase().trim();
                    if (!name) {
                        incomplete.push(r);
                    } else {
                        if (seen.has(name)) seen.get(name)!.push(r.id);
                        else seen.set(name, [r.id]);
                    }
                });

                seen.forEach((ids, name) => {
                    if (ids.length > 1) {
                        duplicates.push(records.filter(r => ids.includes(r.id)));
                    }
                });

                return NextResponse.json({ success: true, duplicates, incomplete });
            }

            case 'refreshSupplierCategoryCounts': {
                const snap = await db.collection('partners').where('type', '==', 'supplier').get();
                const counts: Record<string, number> = {};
                snap.docs.forEach(doc => {
                    const cat = doc.data().industrial_category || 'Unclassified';
                    counts[cat] = (counts[cat] || 0) + 1;
                });
                await db.collection('configuration').doc('supplierDiscoveryStats').set({ counts, updatedAt: FieldValue.serverTimestamp() });
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