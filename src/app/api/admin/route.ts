import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import { enrichPartner } from '@/ai/flows/enrich-partner-flow';

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

        if (!isAdmin) throw new Error("Forbidden: Admin access required.");

        const body = await req.json();
        const action = (body.action || '').trim();
        const payload = body.payload || {};

        switch (action) {
            case 'searchRegistry': {
                const { type, term, limit = 1000 } = payload;
                let results: any[] = [];

                if (type !== 'partner') {
                    let leadsQ: any = db.collection('leads');
                    if (term) leadsQ = leadsQ.where('companyName', '>=', term).where('companyName', '<=', term + '\uf8ff');
                    const leadsSnap = await leadsQ.limit(limit).get();
                    results = [...results, ...leadsSnap.docs.map((d: any) => ({ id: d.id, source: 'Lead', ...d.data() }))];
                }

                if (type !== 'lead') {
                    let partnersQ: any = db.collection('partners');
                    if (type && type !== 'all' && type !== 'partner') partnersQ = partnersQ.where('type', '==', type);
                    if (term) partnersQ = partnersQ.where('companyName', '>=', term).where('companyName', '<=', term + '\uf8ff');
                    const partnersSnap = await partnersQ.limit(limit).get();
                    results = [...results, ...partnersSnap.docs.map((d: any) => ({ id: d.id, source: 'Partner', ...d.data() }))];
                }

                return NextResponse.json({ success: true, data: results.map(serializeTimestamps) });
            }

            case 'getMatchesForEnquiry': {
                const { enquiryId, companyId } = payload;
                const enquirySnap = await db.doc(`companies/${companyId}/enquiries/${enquiryId}`).get();
                if (!enquirySnap.exists) throw new Error("Enquiry not found.");
                
                const enquiry = enquirySnap.data()!;
                const amount = Number(enquiry.amountRequested) || 0;
                const turnover = Number(enquiry.annualTurnover) || 0;
                const age = Number(enquiry.yearsInBusiness) || 0;

                const [lendersSnap, activeMemberLendersSnap] = await Promise.all([
                    db.collection('partners').where('type', '==', 'finance').get(),
                    db.collection('companies')
                        .where('declaredRole', '==', 'lender')
                        .where('membershipId', '!=', 'free')
                        .get()
                ]);

                const staticMatches = lendersSnap.docs
                    .map((d: any) => ({ id: d.id, source: 'Registry', ...d.data() }))
                    .filter((l: any) => {
                        const minS = Number(l.minDealSize) || 0;
                        const maxS = Number(l.maxDealSize) || 100000000;
                        return amount >= minS && amount <= maxS;
                    });
                
                const memberMatches = activeMemberLendersSnap.docs
                    .map((d: any) => ({ id: d.id, source: 'Member', ...d.data() }))
                    .filter((l: any) => {
                        const params = l.lendingParams;
                        if (!params) return false;
                        
                        const sizeMatch = amount >= (params.minDealSize || 0) && amount <= (params.maxDealSize || 100000000);
                        const turnoverMatch = turnover >= (params.minAnnualTurnover || 0);
                        const ageMatch = age >= (params.minYearsInBusiness || 0);
                        const ratingMatch = !params.minCreditScore || (Number(enquiry.creditScore || 0) >= params.minCreditScore);
                        
                        const judgementOk = !params.requiresNoJudgements || !enquiry.hasJudgements;
                        const defaultOk = !params.requiresNoDefaults || !enquiry.hasDefaults;
                        const arrearsOk = !params.requiresNoArrears || !enquiry.hasArrears;

                        return sizeMatch && turnoverMatch && ageMatch && ratingMatch && judgementOk && defaultOk && arrearsOk;
                    });

                return NextResponse.json({ success: true, data: [...staticMatches, ...memberMatches].map(serializeTimestamps) });
            }

            case 'getPlatformStaff': {
                const snap = await db.collection('platformStaff').get();
                return NextResponse.json({ success: true, data: snap.docs.map((d: any) => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            case 'logCommunication': {
                const { partnerId, subject, notes, collection: providedColl } = payload;
                const targetColl = providedColl || 'partners';
                const parentRef = db.collection(targetColl).doc(partnerId);

                const logRef = parentRef.collection('communications').doc();
                await logRef.set({ id: logRef.id, type: 'Email', subject, notes, timestamp: FieldValue.serverTimestamp(), adminId: decodedToken.uid });
                await parentRef.update({ lastOutreachAt: FieldValue.serverTimestamp(), lastOutreachSubject: subject, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true });
            }

            case 'autoEnrichRecord': {
                const { id, type } = payload;
                const coll = type === 'lead' ? 'leads' : 'partners';
                const docRef = db.collection(coll).doc(id);
                const docSnap = await docRef.get();
                if (!docSnap.exists) throw new Error("Record not found.");
                const record = docSnap.data()!;
                const enriched = await enrichPartner({ companyName: record.companyName || record.firstName });
                await docRef.update({ ...enriched, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true, data: enriched });
            }

            case 'getAuditLogs': {
                const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
                return NextResponse.json({ success: true, data: snap.docs.map((d: any) => ({ id: d.id, ...serializeTimestamps(d.data()) })) });
            }

            default: return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
