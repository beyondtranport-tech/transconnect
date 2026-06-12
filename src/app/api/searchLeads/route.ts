
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * INTELLIGENCE SEARCH ENGINE
 * Enforces:
 * 1. 1-search-per-day limit for Free members.
 * 2. Data masking (name, email, phone, web) for Free members.
 * 3. 100-record hard cap for all tiers.
 */
export async function POST(req: NextRequest) {
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) throw new Error(`Admin SDK failed: ${initError}`);

        const { type, query: searchTerm, category, service, province, city, suburb } = await req.json();
        const authorization = req.headers.get('authorization');
        
        if (!authorization?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Access restricted to members.' }, { status: 401 });
        }

        const token = authorization.split('Bearer ')[1];
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;
        const db = getFirestore(app);

        // 1. Get Member Status
        const userDoc = await db.collection('users').doc(uid).get();
        const companyId = userDoc.data()?.companyId;
        if (!companyId) throw new Error("Member company profile not found.");

        const companyRef = db.collection('companies').doc(companyId);
        const companyDoc = await companyRef.get();
        const companyData = companyDoc.data()!;
        
        const membershipId = companyData.membershipId || 'free';
        const isPaid = membershipId !== 'free';

        // 2. Enforce Daily Limit for Free Members
        if (!isPaid) {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentSearches = await companyRef.collection('searchLogs')
                .where('timestamp', '>', Timestamp.fromDate(yesterday))
                .limit(1)
                .get();

            if (!recentSearches.empty) {
                return NextResponse.json({ 
                    success: false, 
                    error: 'Daily Limit Reached: Free members are restricted to 1 intelligence search per 24 hours.',
                    limitReached: true
                }, { status: 429 });
            }
        }

        // 3. Execute Registry Scan
        let collectionName = 'leads';
        if (type === 'driver') collectionName = 'partners';
        
        let firestoreQuery: any = db.collection(collectionName);
        
        if (type === 'supplier') {
            firestoreQuery = firestoreQuery.where('role', 'in', ['Vendors', 'Vendor', 'Supplier', 'Suppliers']);
        } else if (type === 'transporter') {
            firestoreQuery = firestoreQuery.where('role', 'in', ['Transporters', 'Transporter', 'Logistics', 'Transport']);
        } else if (type === 'finance') {
            firestoreQuery = firestoreQuery.where('role', 'in', ['Investors', 'Investor', 'Finance', 'Funder', 'Lender']);
        }

        const snapshot = await firestoreQuery.limit(500).get();

        let results = snapshot.docs.map((doc: any) => {
            const lead = doc.data();
            const normalized = {
                id: doc.id,
                companyName: lead.companyName || lead.trading_name || 'Industrial Entity',
                address: lead.address || lead.physical_address || lead.location || 'South Africa',
                entryType: lead.entryType || lead.industrial_category || 'General',
                fleet: lead.fleet || {}, 
                region: lead.region || lead.operational_hub || '',
            };

            if (isPaid) {
                return {
                    ...normalized,
                    contactPerson: lead.contactPerson || (lead.firstName ? `${lead.firstName} ${lead.lastName}` : 'N/A'),
                    email: lead.email || lead.email_address || 'N/A',
                    phone: lead.phone || lead.telephone_number || 'N/A',
                    mobile: lead.mobile || lead.registry_line || 'N/A',
                    website: lead.website || lead.url || 'N/A',
                };
            } else {
                return {
                    ...normalized,
                    contactPerson: 'Locked',
                    email: 'Locked',
                    phone: 'Locked',
                    mobile: 'Locked',
                    website: 'Locked',
                    isMasked: true
                };
            }
        });

        // 4. Memory Filter
        if (searchTerm || service || city || suburb || province || category) {
            const lowSearch = searchTerm?.toLowerCase() || '';
            const lowProv = province?.toLowerCase() || '';
            const lowCity = city?.toLowerCase() || '';
            const lowCat = category?.toLowerCase() || '';
            
            results = results.filter((item: any) => {
                const addr = (item.address || '').toLowerCase();
                const typeStr = (item.entryType || '').toLowerCase();
                const name = (item.companyName || '').toLowerCase();

                const matchesLoc = (!lowProv || addr.includes(lowProv)) && (!lowCity || addr.includes(lowCity));
                const matchesCat = !lowCat || typeStr.includes(lowCat);
                const matchesText = !lowSearch || name.includes(lowSearch) || typeStr.includes(lowSearch);

                return matchesLoc && matchesCat && matchesText;
            });
        }

        const finalResults = results.slice(0, 100);

        // 5. Log Search (Safely handle undefined values)
        await companyRef.collection('searchLogs').add({
            userId: uid,
            type,
            searchTerm: searchTerm || '',
            variables: { 
                province: province || null, 
                city: city || null, 
                suburb: suburb || null, 
                category: category || null, 
                service: service || null 
            },
            resultCount: finalResults.length,
            timestamp: FieldValue.serverTimestamp(),
            tier: membershipId
        });

        return NextResponse.json({ 
            success: true, 
            data: finalResults, 
            isMasked: !isPaid 
        });

    } catch (error: any) {
        console.error(`Search API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
