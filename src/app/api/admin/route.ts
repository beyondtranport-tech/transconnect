import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Resilient Timestamp and FieldValue Serializer
 * Ensures all Firestore objects are converted to strings before JSON transmission.
 */
function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    
    // Handle Firestore Timestamps
    if (docData instanceof Timestamp) {
        return docData.toDate().toISOString();
    }
    
    // Handle FieldValue (serverTimestamp)
    if (docData && typeof docData === 'object' && 'constructor' in docData && docData.constructor.name === 'FieldValue') {
        return new Date().toISOString(); // Fallback to current time for preview
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
        if (initError || !app) throw new Error(`Admin SDK failed to initialize: ${initError}`);

        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized: Missing or invalid token.');
        const token = authHeader.split('Bearer ')[1];
        
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        const db = getFirestore(app);

        // AUTHORIZATION: Strict Admin/Specialized Email Check
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || 
                        decodedToken.email === 'mkoton100@gmail.com' || 
                        decodedToken.email === 'michael@logisticsflow.co.za' ||
                        decodedToken.admin === true;

        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        const body = await req.json();
        const { action, payload } = body;

        switch (action) {
            case 'savePartner': {
                const { partner, collection: colName = 'partners' } = payload;
                if (!partner) throw new Error("Payload error: Partner data is required.");

                const id = partner.id || db.collection(colName).doc().id;
                const partnerData = {
                    ...partner,
                    id,
                    updatedAt: FieldValue.serverTimestamp()
                };

                await db.collection(colName).doc(id).set(partnerData, { merge: true });
                return NextResponse.json({ success: true, id });
            }

            case 'autoEnrichRecord': {
                const { id, type: targetType } = payload;
                const colName = (targetType === 'lead' || !targetType) ? 'leads' : 'partners';
                const docRef = db.collection(colName).doc(id);
                const docSnap = await docRef.get();
                if (!docSnap.exists) throw new Error("Record not found in the registry.");
                
                const current = docSnap.data()!;
                const companyName = current.companyName || current.company_name || '';

                // Dynamic Import for AI Flow to prevent top-level import crashes
                const { enrichPartner } = await import('@/ai/flows/enrich-partner-flow');
                
                try {
                    const enrichment = await enrichPartner({ companyName });
                    
                    await docRef.set({ 
                        ...enrichment, 
                        status: 'contacted',
                        lastOutreachSubject: 'Forensic Bridge',
                        lastOutreachAt: FieldValue.serverTimestamp(),
                        enhancementMethod: 'Forensic Bridge',
                        lastEnrichedAt: FieldValue.serverTimestamp(),
                        updatedAt: FieldValue.serverTimestamp() 
                    }, { merge: true });

                    const logRef = docRef.collection('communications').doc();
                    await logRef.set({
                        id: logRef.id,
                        subject: 'Forensic Research (Auto-Bridge)',
                        type: 'System',
                        notes: 'Automated gap-analysis completed via Forensic Bridge.',
                        timestamp: FieldValue.serverTimestamp()
                    });
                    
                    return NextResponse.json({ success: true, data: enrichment });
                } catch (flowError: any) {
                    const msg = flowError.message || "";
                    if (msg.includes('SEARCH_QUOTA_EXHAUSTED')) {
                        return NextResponse.json({ success: false, error: 'SEARCH_QUOTA_EXHAUSTED' }, { status: 429 });
                    }
                    if (msg.includes('429') || msg.includes('Quota') || msg.includes('exhausted')) {
                        return NextResponse.json({ success: false, error: 'AI_RATE_LIMIT_EXHAUSTED' }, { status: 429 });
                    }
                    throw flowError;
                }
            }

            case 'searchRegistry': {
                const { type, term, outreachFilter, limit = 100 } = payload;
                let collectionName = (type === 'all' || type === 'lead') ? 'leads' : 'partners';
                let q: any = db.collection(collectionName);
                
                if (collectionName === 'partners' && type !== 'all') {
                    q = q.where('type', '==', type);
                }

                const snap = await q.orderBy('updatedAt', 'desc').limit(Math.min(limit, 20000)).get();
                let results = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

                if (term) {
                    const lowTerm = term.toLowerCase();
                    results = results.filter((r: any) => 
                        (r.companyName || r.company_name || '').toLowerCase().includes(lowTerm) || 
                        (r.email || '').toLowerCase().includes(lowTerm)
                    );
                }

                if (outreachFilter === 'none') {
                    results = results.filter((r: any) => !r.lastOutreachAt);
                }

                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getLeads': {
                const snap = await db.collection('leads').orderBy('updatedAt', 'desc').limit(1000).get();
                const leads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                return NextResponse.json({ success: true, data: leads.map(serializeTimestamps) });
            }

            case 'getMembers': {
                const snap = await db.collection('companies').orderBy('createdAt', 'desc').limit(1000).get();
                const members = await Promise.all(snap.docs.map(async (docSnap: any) => {
                    const data = docSnap.data();
                    const userSnap = await db.collection('users').doc(data.ownerId || 'system').get();
                    const uData = userSnap.exists ? userSnap.data() : {};
                    return { 
                        id: docSnap.id, 
                        ...data, 
                        firstName: uData?.firstName || 'Member', 
                        lastName: uData?.lastName || '', 
                        email: uData?.email || 'N/A' 
                    };
                }));
                return NextResponse.json({ success: true, data: members.map(serializeTimestamps) });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
            }

            case 'logCommunication': {
                const { partnerId, collection: colOverride, type, subject, notes } = payload;
                const colName = colOverride || 'partners';
                const partnerRef = db.collection(colName).doc(partnerId);

                const logRef = partnerRef.collection('communications').doc();
                await logRef.set({
                    id: logRef.id,
                    type: type || 'Note',
                    subject: subject || 'General Interaction',
                    notes: notes || '',
                    timestamp: FieldValue.serverTimestamp()
                });

                await partnerRef.update({
                    status: 'contacted',
                    lastOutreachSubject: subject,
                    lastOutreachAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                });

                return NextResponse.json({ success: true });
            }

            case 'deletePartner': {
                const { partnerId, source } = payload;
                const colName = source === 'Lead' ? 'leads' : 'partners';
                await db.collection(colName).doc(partnerId).delete();
                return NextResponse.json({ success: true });
            }

            default: 
                return NextResponse.json({ success: false, error: `Action "${action}" not implemented.` }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`CRITICAL Admin API Failure:`, error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Internal Server Error during processing.' 
        }, { status: 500 });
    }
}