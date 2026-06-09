
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue, FieldPath } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import { runDiscovery } from '@/ai/flows/discovery-flow';

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

/**
 * Universal Data Normalization
 */
function normalizePartnerData(data: any) {
    const result: any = {};

    const isPlaceholder = (val: any) => {
        if (!val) return true;
        const low = val.toString().toLowerCase().trim();
        return [
            'member', 'candidate', 'null', 'n/a', 'none', 'undefined', 'unknown', 
            'null@null.com', 'the director', 'the manager', 'director', 'manager', 
            'managing director', 'ceo of company', 'owner of company'
        ].includes(low) || low.length < 2;
    }

    const maps = {
        companyName: ['company_name', 'companyName', 'company', 'name', 'business_name'],
        email: ['email_address', 'emailAddress', 'mail', 'email', 'e_mail'],
        phone: ['telephone_number', 'phone_number', 'cell', 'mobile', 'registry_line'],
        address: ['physical_address', 'location', 'address', 'operational_hub'],
        website: ['url', 'site', 'website'],
        entryType: ['industrial_category', 'category', 'service_classification'],
        notes: ['notes', 'bio', 'capability_profile']
    };

    Object.entries(maps).forEach(([standardKey, aiKeys]) => {
        for (const key of aiKeys) {
            const val = data[key]?.toString().trim();
            if (val && !isPlaceholder(val)) {
                result[standardKey] = val;
                break;
            }
        }
    });

    const contactVal = data.contact_person || data.service_handle || data.firstName || '';
    if (contactVal) {
        result.contactPerson = contactVal;
        const parts = contactVal.toString().split(' ');
        result.firstName = parts[0];
        result.lastName = parts.slice(1).join(' ') || '';
    }

    return result;
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

        switch (action) {
            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'savePlatformStaff': {
                const { staff } = payload;
                const ref = staff.id ? db.collection('platformStaff').doc(staff.id) : db.collection('platformStaff').doc();
                const data = { ...staff, id: ref.id, updatedAt: FieldValue.serverTimestamp() };
                await ref.set(data, { merge: true });
                return NextResponse.json({ success: true, id: ref.id });
            }

            case 'deletePlatformStaff': {
                const { staffId } = payload;
                await db.collection('platformStaff').doc(staffId).delete();
                return NextResponse.json({ success: true });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').get();
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
                const snap = await db.collectionGroup('shops').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getContributions': {
                const snap = await db.collection('contributions').orderBy('createdAt', 'desc').get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                const data = await Promise.all(snap.docs.map(async (d) => {
                    const lData = d.data();
                    const userSnap = await db.collection('users').doc(lData.userId).get();
                    const companySnap = await db.collection('companies').doc(lData.companyId || '').get();
                    return {
                        ...serializeTimestamps(lData),
                        id: d.id,
                        userName: userSnap.exists ? `${userSnap.data()?.firstName} ${userSnap.data()?.lastName}` : 'System',
                        companyName: companySnap.exists ? companySnap.data()?.companyName : 'N/A'
                    };
                }));
                return NextResponse.json({ success: true, data });
            }

            case 'logCommunication': {
                const { partnerId, type, subject, notes } = payload;
                const ref = db.collection('partners').doc(partnerId).collection('communications').doc();
                await ref.set({
                    id: ref.id, type, subject, notes,
                    timestamp: FieldValue.serverTimestamp()
                });
                
                // Update last outreach on primary record
                await db.collection('partners').doc(partnerId).update({
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    status: 'contacted'
                });
                await db.collection('leads').doc(partnerId).set({
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    status: 'contacted'
                }, { merge: true });

                return NextResponse.json({ success: true });
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

            case 'deleteLead':
            case 'deletePartner': {
                const { leadId, partnerId } = payload;
                const id = leadId || partnerId;
                const batch = db.batch();
                batch.delete(db.collection('leads').doc(id));
                batch.delete(db.collection('partners').doc(id));
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'getPartnersByType': {
                const { type } = payload;
                const inclusiveRoleMapping: Record<string, string[]> = {
                    'transporter': ['Transporters', 'Transporter', 'Logistics', 'Transport'],
                    'supplier': ['Vendors', 'Vendor', 'Supplier', 'Suppliers'],
                    'partner': ['Strategic Partners', 'Partner'],
                    'isa': ['ISA Agents (Elite)', 'ISA'],
                    'finance': ['Banks', 'Government', 'AEO', 'Niche Lenders', 'Finance', 'Funder', 'Lender', 'Finance Companies'],
                    'investor': ['Investors', 'Investor', 'VC', 'Seed Fund', 'Angel'],
                    'developer': ['Developers', 'Developer'],
                    'driver': ['Drivers', 'Driver', 'Truck Driver']
                };

                let snap;
                if (type === 'all') {
                    snap = await db.collection('partners').get();
                } else {
                    snap = await db.collection('partners').where('type', '==', type).get();
                }
                
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'markLeadsAsResearching': {
                const { leadIds } = payload;
                const batch = db.batch();
                leadIds.forEach((id: string) => {
                    batch.update(db.collection('leads').doc(id), { researchStatus: 'researching', updatedAt: FieldValue.serverTimestamp() });
                    batch.update(db.collection('partners').doc(id), { researchStatus: 'researching', updatedAt: FieldValue.serverTimestamp() });
                });
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            case 'getLendingData': {
                const { collectionName } = payload;
                const snap = await db.collection(collectionName).get();
                const data = snap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
                return NextResponse.json({ success: true, data });
            }

            case 'approveWalletPayment': {
                const { companyId, paymentId, amount, description, reconciliationId } = payload;
                const companyRef = db.collection('companies').doc(companyId);
                const paymentRef = companyRef.collection('walletPayments').doc(paymentId);
                const transactionRef = companyRef.collection('transactions').doc();

                await db.runTransaction(async (t) => {
                    t.update(companyRef, {
                        walletBalance: FieldValue.increment(amount),
                        availableBalance: FieldValue.increment(amount),
                        updatedAt: FieldValue.serverTimestamp()
                    });
                    t.set(transactionRef, {
                        id: transactionRef.id, type: 'credit', amount, description,
                        reconciliationId, date: FieldValue.serverTimestamp(), status: 'allocated'
                    });
                    t.delete(paymentRef);
                });
                return NextResponse.json({ success: true });
            }

            case 'approvePayout': {
                const { companyId, payoutId, amount } = payload;
                const companyRef = db.collection('companies').doc(companyId);
                const payoutRef = companyRef.collection('payoutRequests').doc(payoutId);
                const transactionRef = companyRef.collection('transactions').doc();

                await db.runTransaction(async (t) => {
                    t.update(companyRef, {
                        walletBalance: FieldValue.increment(-amount),
                        availableBalance: FieldValue.increment(-amount),
                        updatedAt: FieldValue.serverTimestamp()
                    });
                    t.set(transactionRef, {
                        id: transactionRef.id, type: 'debit', amount, description: 'Payout Approved',
                        date: FieldValue.serverTimestamp(), status: 'allocated'
                    });
                    t.update(payoutRef, { status: 'approved', processedAt: FieldValue.serverTimestamp() });
                });
                return NextResponse.json({ success: true });
            }

            case 'rejectPayout': {
                const { companyId, payoutId } = payload;
                await db.doc(`companies/${companyId}/payoutRequests/${payoutId}`).update({
                    status: 'rejected', updatedAt: FieldValue.serverTimestamp()
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
