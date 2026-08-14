import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, FieldValue, Timestamp, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * FORENSIC SEARCH ENGINE - REVENUE PROTECTED
 * Implements server-side data masking based on membership tiers.
 */
export async function POST(req: NextRequest) {
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) throw new Error(`Admin SDK failed: ${initError}`);

        const body = await req.json();
        const { type, query: searchTerm, category, service, province, city, suburb } = body;
        
        const authorization = req.headers.get('authorization');
        const token = authorization?.split('Bearer ')[1];
        
        const db = getFirestore(app);
        let authorizedForDirectContacts = false;
        let isFreeMember = true;
        let uid = null;

        // 1. Resolve User Context if Token provided
        if (token) {
            try {
                const adminAuth = getAuth(app);
                const decodedToken = await adminAuth.verifyIdToken(token);
                uid = decodedToken.uid;

                const userDoc = await db.collection('users').doc(uid).get();
                const companyId = userDoc.data()?.companyId;

                if (companyId) {
                    const companyDoc = await db.collection('companies').doc(companyId).get();
                    const companyData = companyDoc.data()!;
                    const membershipId = companyData.membershipId || 'free';
                    
                    // Logic: Intelligence or Premium plans unlock full registry
                    if (['intelligence', 'premium', 'loads_intelligence', 'warehouse_intelligence', 'buy_sell_intelligence'].includes(membershipId)) {
                        authorizedForDirectContacts = true;
                    }
                    isFreeMember = membershipId === 'free';
                }
            } catch (authError) {
                console.warn("Auth verification failed in search, proceeding as guest.");
            }
        }

        // 2. Execute Registry Scan
        let collectionName = 'leads';
        if (['driver', 'transporter', 'supplier', 'finance', 'warehouse', 'distributor'].includes(type)) {
            collectionName = 'partners';
        }
        
        // Simple filter logic for prototype
        let q: any = db.collection(collectionName);
        if (type !== 'all' && collectionName === 'partners') {
            q = q.where('type', '==', type);
        }
        
        const snapshot = await q.orderBy('updatedAt', 'desc').limit(100).get();

        const finalResults = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
            const item = doc.data();
            const normalized = {
                id: doc.id,
                companyName: item.companyName || item.company_name || item.service_handle || 'Industrial Entity',
                address: item.address || item.physicalAddress || 'South Africa',
                entryType: item.industrial_category || item.category || 'Industrial Record',
                vouchCount: item.vouchCount || 0,
                isClaimed: item.isClaimed || false,
                researchStatus: item.minedServiceWording ? 'completed' : 'pending'
            };

            // SEVERE MASKING FOR NON-PAID USERS
            if (authorizedForDirectContacts) {
                return {
                    ...normalized,
                    contactPerson: item.contactPerson || item.marketingManager?.name || item.ceo?.name || 'Verified Identity',
                    email: item.email || item.marketingManager?.email || 'N/A',
                    phone: item.phone || item.mobile || 'N/A',
                    website: item.website || 'N/A',
                    minedServiceWording: item.minedServiceWording || item.notes || '',
                };
            } else {
                return {
                    ...normalized,
                    contactPerson: 'Locked',
                    email: 'upgrade@logisticsflow.co.za',
                    phone: '0XX XXX XXXX',
                    website: 'www.locked.co.za',
                    isMasked: true
                };
            }
        });

        // 3. Log Search for Audit if User exists
        if (uid) {
            const userDoc = await db.collection('users').doc(uid).get();
            const companyId = userDoc.data()?.companyId;
            if (companyId) {
                await db.collection('companies').doc(companyId).collection('searchLogs').add({
                    userId: uid,
                    type,
                    searchTerm: searchTerm || '',
                    category: category || service || '',
                    variables: {
                        province: province || '',
                        city: city || '',
                        suburb: suburb || '',
                        category: category || service || ''
                    },
                    resultCount: finalResults.length,
                    timestamp: FieldValue.serverTimestamp(),
                });
            }
        }

        return NextResponse.json({ success: true, data: finalResults });

    } catch (error: any) {
        console.error(`Forensic Search API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
