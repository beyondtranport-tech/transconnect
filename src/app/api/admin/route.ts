
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

/**
 * Split array into chunks for parallel batch processing.
 */
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
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
            // --- PLATFORM OVERSIGHT ---
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

            // --- CRM & PARTNERS ---
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
                let q = db.collection('leads')
                    .where('companyName', '>=', term)
                    .where('companyName', '<=', term + '\uf8ff')
                    .limit(100);
                
                if (type && type !== 'all') {
                    q = q.where('type', '==', type);
                }

                const snap = await q.get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'savePartner': {
                const { partner } = payload;
                const id = partner.id || db.collection('partners').doc().id;
                
                if (partner.service_handle && !partner.firstName) {
                    const parts = partner.service_handle.trim().split(' ');
                    partner.firstName = parts[0];
                    partner.lastName = parts.slice(1).join(' ');
                }

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
                
                await db.collection('leads').doc(partnerId).set({
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true }).catch(() => {});

                return NextResponse.json({ success: true });
            }

            case 'markLeadsAsResearching': {
                const { leadIds } = payload;
                const chunks = chunkArray(leadIds, 50);
                for (const chunk of chunks) {
                    const batch = db.batch();
                    chunk.forEach(id => {
                        batch.update(db.collection('leads').doc(id), { 
                            researchStatus: 'researching', 
                            updatedAt: FieldValue.serverTimestamp() 
                        });
                        batch.set(db.collection('partners').doc(id), {
                            researchStatus: 'researching',
                            updatedAt: FieldValue.serverTimestamp()
                        }, { merge: true });
                    });
                    await batch.commit();
                }
                return NextResponse.json({ success: true });
            }

            case 'deleteLeads': {
                const { leadIds } = payload;
                const chunks = chunkArray(leadIds, 50);
                for (const chunk of chunks) {
                    const batch = db.batch();
                    chunk.forEach(id => {
                        batch.delete(db.collection('leads').doc(id));
                        batch.delete(db.collection('partners').doc(id));
                    });
                    await batch.commit();
                }
                return NextResponse.json({ success: true });
            }

            case 'refreshTransporterCategoryCounts':
            case 'refreshSupplierCategoryCounts':
            case 'refreshFinanceCategoryCounts': {
                const configId = action.includes('Transporter') ? 'transporterDiscoveryStats' : 
                                 action.includes('Supplier') ? 'supplierDiscoveryStats' : 
                                 'financeDiscoveryStats';
                
                const typeKey = action.includes('Transporter') ? 'transporter' : 
                               action.includes('Supplier') ? 'supplier' : 
                               'finance';

                const categories = action.includes('Transporter') ? ["Long Haul", "Refrigerated", "Flatbed", "Tipper", "Hazmat", "LTL", "Cross-Border", "Local Distribution", "Container Transport", "Abnormal Loads"] :
                                 action.includes('Supplier') ? ["Accessories", "Air", "Anti-Theft Devices", "Auto Electrical", "Batteries", "Brakes", "Cleaning Products", "Diesel", "Differential", "Engine Refurbish", "Filters", "Injectors", "Lights", "Mechanical repairs", "Oils & Lubricants", "Parts", "Prop Shafts", "Second Hand Trailers", "Second Hand Trucks", "Transport", "Tarpaulins", "Tow in", "Trailer repairs", "Truck Accessories", "Truck Parts", "Truck repairs", "Turbo", "Tyres"] :
                                 ["Banks", "Government", "AEO", "Niche Lenders"];

                const counts: any = {};
                for (const cat of categories) {
                    const q = db.collection('partners').where('type', '==', typeKey).where('entryType', '==', cat);
                    const countRes = await q.count().get();
                    counts[cat] = countRes.data().count;
                }

                await db.collection('configuration').doc(configId).set({
                    counts,
                    lastUpdated: FieldValue.serverTimestamp()
                }, { merge: true });

                return NextResponse.json({ success: true });
            }

            // --- STAFF MANAGEMENT ---
            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'savePlatformStaff': {
                const { staff } = payload;
                const id = staff.id || db.collection('platformStaff').doc().id;
                await db.collection('platformStaff').doc(id).set({ 
                    ...staff, 
                    id, 
                    updatedAt: FieldValue.serverTimestamp() 
                }, { merge: true });
                return NextResponse.json({ success: true });
            }

            case 'deletePlatformStaff': {
                const { staffId } = payload;
                await db.collection('platformStaff').doc(staffId).delete();
                return NextResponse.json({ success: true });
            }

            // --- SYSTEM LOGS ---
            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            default:
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`Admin API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
