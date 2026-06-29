
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
        
        // Authorization: Allow Admins OR users with 'associate' role
        const isAssociate = userData?.role === 'associate' || userData?.declaredPosition === 'associate';

        if (!isAdmin && !isAssociate) throw new Error("Forbidden: Elevated access required.");

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};

        switch (action) {
            case 'getMyNetwork': {
                const companyId = userData?.companyId;
                if (!companyId) throw new Error("Missing company profile.");
                
                // 1. Get Leads (Attributed but not registered)
                const leadsSnap = await db.collection('leads')
                    .where('referrerId', '==', companyId)
                    .get();
                const leads = leadsSnap.docs.map(d => ({ 
                    id: d.id, 
                    source: 'Lead', 
                    ...serializeTimestamps(d.data()) 
                }));
                
                // 2. Get Registered Members (Companies converted from leads or direct signups)
                const membersSnap = await db.collection('companies')
                    .where('referrerId', '==', companyId)
                    .get();
                const members = membersSnap.docs.map(d => ({ 
                    id: d.id, 
                    source: 'Member', 
                    ...serializeTimestamps(d.data()) 
                }));
                
                return NextResponse.json({ success: true, data: [...leads, ...members] });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(1000).get();
                const leads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                
                // Enrich with Referrer names
                const partnerSnap = await db.collection('companies').get();
                const partnerMap = new Map(partnerSnap.docs.map(d => [d.id, d.data().companyName]));
                
                const data = leads.map(l => ({
                    ...l,
                    referrerName: partnerMap.get(l.referrerId) || 'Direct Entry'
                }));

                return NextResponse.json({ success: true, data: data.map(serializeTimestamps) });
            }

            case 'getMembers': {
                const companiesSnap = await db.collection('companies').orderBy('updatedAt', 'desc').limit(1000).get();
                const companies = companiesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                const ownerIds = companies.map(c => c.ownerId).filter(id => !!id);
                
                const userDetailsMap = new Map();
                if (ownerIds.length > 0) {
                    const chunks = [];
                    for (let i = 0; i < ownerIds.length; i += 30) chunks.push(ownerIds.slice(i, i + 30));
                    const userSnaps = await Promise.all(chunks.map(chunk => db.collection('users').where(FieldValue.documentId(), 'in', chunk).get()));
                    userSnaps.forEach(snap => snap.forEach(d => userDetailsMap.set(d.id, d.data())));
                }

                // Internal Map for Referrer Names
                const nameMap = new Map(companies.map(c => [c.id, c.companyName]));

                const data = companies.map(c => ({ 
                    ...c, 
                    ...userDetailsMap.get(c.ownerId),
                    referrerName: nameMap.get(c.referrerId) || 'Direct / Marketing'
                }));

                return NextResponse.json({ success: true, data: data.map(serializeTimestamps) });
            }

            case 'logAudit': {
                const { action: auditAction, details, metadata } = payload;
                const logRef = db.collection('auditLogs').doc();
                await logRef.set({
                    id: logRef.id,
                    action: auditAction,
                    details,
                    metadata,
                    userId: decodedToken.uid,
                    userName: decodedToken.name || userData?.firstName || 'User',
                    companyId: userData?.companyId || null,
                    timestamp: FieldValue.serverTimestamp()
                });
                return NextResponse.json({ success: true });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'saveCompanyLead': {
                const { lead, companyId } = payload;
                if (!lead || !lead.companyName) throw new Error("Invalid lead data.");
                
                const finalReferrerId = companyId || userData?.companyId;
                if (!finalReferrerId) throw new Error("Could not attribute lead: No company ID found.");

                const id = lead.id || db.collection('leads').doc().id;
                const leadData = {
                    ...lead,
                    id,
                    referrerId: finalReferrerId,
                    updatedAt: FieldValue.serverTimestamp(),
                };
                
                if (!lead.id) leadData.createdAt = FieldValue.serverTimestamp();
                
                await db.collection('leads').doc(id).set(leadData, { merge: true });
                
                return NextResponse.json({ success: true, id, message: "Lead recorded successfully." });
            }

            case 'logCommunication': {
                const { partnerId, type, subject, notes, collection: collName = 'leads' } = payload;
                if (!partnerId || !type || !subject) throw new Error("Missing log data.");
                
                const parentRef = db.collection(collName).doc(partnerId);
                const logRef = parentRef.collection('communications').doc();
                
                const batch = db.batch();
                batch.set(logRef, {
                    id: logRef.id,
                    type,
                    subject,
                    notes,
                    timestamp: FieldValue.serverTimestamp(),
                    adminId: decodedToken.uid
                });
                
                batch.update(parentRef, {
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    lastOutreachSubject: subject,
                    status: 'contacted',
                    updatedAt: FieldValue.serverTimestamp()
                });
                
                await batch.commit();
                return NextResponse.json({ success: true });
            }

            default: return NextResponse.json({ success: false, error: "Action invalid." }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Admin API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
