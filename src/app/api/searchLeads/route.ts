import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * FORENSIC SEARCH ENGINE - REVENUE PROTECTED
 * Enforces "Transactional Masking":
 * 1. Base Intelligence members see Names/Addresses.
 * 2. ONLY specific Earning Node members see Direct Emails, Mobiles, and mined Service wording.
 */
export async function POST(req: NextRequest) {
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) throw new Error(`Admin SDK failed: ${initError}`);

        const body = await req.json();
        const { type, query: searchTerm, category, service, province, city, suburb } = body;
        
        const authorization = req.headers.get('authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
        }

        const token = authorization.split('Bearer ')[1];
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;
        const db = getFirestore(app);

        // 1. Get Member Status & Tier
        const userDoc = await db.collection('users').doc(uid).get();
        const companyId = userDoc.data()?.companyId;
        if (!companyId) throw new Error("Member profile not found.");

        const companyRef = db.collection('companies').doc(companyId);
        const companyDoc = await companyRef.get();
        const companyData = companyDoc.data()!;
        
        const membershipId = companyData.membershipId || 'free';
        const isBasePaid = membershipId !== 'free';

        // REVENUE GUARD: Check for specific Earning Node
        const hasLoadsNode = membershipId === 'loads_intelligence' || membershipId === 'premium';
        const hasMarketplaceNode = membershipId === 'buy_sell_intelligence' || membershipId === 'premium';
        const hasWarehouseNode = membershipId === 'warehouse_intelligence' || membershipId === 'premium';

        // 2. Execute Registry Scan
        let collectionName = 'leads';
        if (['driver', 'transporter', 'supplier', 'finance', 'warehouse'].includes(type)) collectionName = 'partners';
        
        const snapshot = await db.collection(collectionName)
            .orderBy('updatedAt', 'desc')
            .limit(500) 
            .get();

        let results = snapshot.docs.map((doc: any) => {
            const item = doc.data();
            const normalized = {
                id: doc.id,
                companyName: item.companyName || item.company_name || item.trading_name || item.service_handle || 'Industrial Entity',
                address: item.address || item.physicalAddress || 'South Africa',
                entryType: item.industrial_category || item.category || 'General',
            };

            // RESOLVE DATA DEPTH based on the specific Mall Node
            let canSeeDirectDetails = false;
            if (type === 'transporter') canSeeDirectDetails = hasLoadsNode;
            else if (type === 'supplier') canSeeDirectDetails = isBasePaid; // Suppliers are open to all paid
            else if (type === 'finance') canSeeDirectDetails = isBasePaid; // Capital access is core value
            else if (type === 'warehouse') canSeeDirectDetails = hasWarehouseNode;
            else if (type === 'driver') canSeeDirectDetails = hasLoadsNode;

            if (canSeeDirectDetails) {
                return {
                    ...normalized,
                    contactPerson: item.contactPerson || item.contact_person || 'Identity Verified',
                    email: item.email || item.email_address || 'N/A',
                    phone: item.phone || item.telephone_number || 'N/A',
                    mobile: item.mobile || item.registry_line || 'N/A',
                    website: item.website || item.url || 'N/A',
                    minedServiceWording: item.minedServiceWording || item.notes || '',
                };
            } else if (isBasePaid) {
                // R100 Foundation: See metadata but mask the high-value "Transactional" contacts
                return {
                    ...normalized,
                    contactPerson: 'Locked (Earning Node Required)',
                    email: 'upgrade@tc.co.za',
                    phone: '0XX XXX XXXX',
                    mobile: '0XX XXX XXXX',
                    website: 'www.locked.co.za',
                    minedServiceWording: 'Transactional intelligence is restricted to specific Mall subscribers.',
                    isMasked: true,
                    nodeRequired: type === 'transporter' ? 'loads_intelligence' : type === 'warehouse' ? 'warehouse_intelligence' : 'buy_sell_intelligence'
                };
            } else {
                // Free: Standard deep masking
                return {
                    ...normalized,
                    contactPerson: 'Locked',
                    isMasked: true,
                    isFreeMask: true
                };
            }
        });

        // 3. Filter results
        if (searchTerm || category) {
            const lowSearch = searchTerm?.toLowerCase() || '';
            results = results.filter((item: any) => 
                item.companyName.toLowerCase().includes(lowSearch) || 
                item.entryType.toLowerCase().includes(lowSearch)
            );
        }

        const finalResults = results.slice(0, 100);

        // 4. Log Search for Audit
        await companyRef.collection('searchLogs').add({
            userId: uid,
            type,
            searchTerm: searchTerm || '',
            resultCount: finalResults.length,
            timestamp: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true, data: finalResults });

    } catch (error: any) {
        console.error(`Search API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
