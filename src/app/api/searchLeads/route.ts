import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * INTELLIGENCE SEARCH ENGINE
 * Enforces:
 * 1. 10-search-per-day testing limit for Free members.
 * 2. Visual data masking for Free tier.
 * 3. 100-record hard cap for all tiers.
 */
export async function POST(req: NextRequest) {
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) throw new Error(`Admin SDK failed: ${initError}`);

        const body = await req.json();
        const { type, query: searchTerm, category, service, province, city, suburb } = body;
        
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

        // 2. Enforce Daily Limit (10 per day for testing)
        if (!isPaid) {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentSearches = await companyRef.collection('searchLogs')
                .where('timestamp', '>', Timestamp.fromDate(yesterday))
                .get();

            if (recentSearches.size >= 10) {
                return NextResponse.json({ 
                    success: false, 
                    error: 'Testing Limit Reached: Free members are restricted to 10 searches per 24 hours.',
                    limitReached: true
                }, { status: 429 });
            }
        }

        // 3. Execute Registry Scan
        // Strategy: Fetch a larger batch and filter in-memory for maximum resilience in prototype
        let collectionName = 'leads';
        if (type === 'driver') collectionName = 'partners';
        
        const snapshot = await db.collection(collectionName).limit(500).get();

        let results = snapshot.docs.map((doc: any) => {
            const item = doc.data();
            // Resilient field mapping
            const normalized = {
                id: doc.id,
                companyName: item.companyName || item.trading_name || item.name || 'Industrial Entity',
                address: item.address || item.physicalAddress || item.physical_address || item.location || 'South Africa',
                entryType: item.entryType || item.industrial_category || item.category || item.role || 'General',
                region: item.region || item.operational_hub || item.city || '',
            };

            if (isPaid) {
                return {
                    ...normalized,
                    contactPerson: item.contactPerson || (item.firstName ? `${item.firstName} ${item.lastName}` : 'N/A'),
                    email: item.email || item.email_address || 'N/A',
                    phone: item.phone || item.telephone_number || 'N/A',
                    mobile: item.mobile || item.registry_line || 'N/A',
                    website: item.website || item.url || 'N/A',
                };
            } else {
                return {
                    ...normalized,
                    contactPerson: 'Locked',
                    email: 'locked@tc.co.za',
                    phone: '011 XXX XXXX',
                    mobile: '082 XXX XXXX',
                    website: 'www.locked.co.za',
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
            const lowServ = service?.toLowerCase() || '';
            
            results = results.filter((item: any) => {
                const addr = (item.address || '').toLowerCase();
                const typeStr = (item.entryType || '').toLowerCase();
                const name = (item.companyName || '').toLowerCase();

                const matchesLoc = (!lowProv || addr.includes(lowProv)) && (!lowCity || addr.includes(lowCity));
                const matchesCat = !lowCat || typeStr.includes(lowCat);
                const matchesServ = !lowServ || typeStr.includes(lowServ);
                const matchesText = !lowSearch || name.includes(lowSearch) || typeStr.includes(lowSearch) || addr.includes(lowSearch);

                return matchesLoc && (matchesCat || matchesServ) && matchesText;
            });
        }

        const finalResults = results.slice(0, 100);

        // 5. Log Search (Sanitize undefined values)
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
