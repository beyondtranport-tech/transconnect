
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * FORENSIC SEARCH ENGINE - REVENUE PROTECTED
 * Implements granular "Intelligence Depth" based on Modular Nodes:
 * 1. Foundational Intelligence (R100): Sees Company Names, Addresses, Tally Badges.
 * 2. Specialized Nodes (R75-R150): See Direct Emails, Mobiles, MD Names, and Mined Service Wording.
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

        // 1. Resolve Member Permission Context
        const userDoc = await db.collection('users').doc(uid).get();
        const companyId = userDoc.data()?.companyId;
        if (!companyId) throw new Error("Member node not synchronized.");

        const companyDoc = await db.collection('companies').doc(companyId).get();
        const companyData = companyDoc.data()!;
        
        const membershipId = companyData.membershipId || 'free';
        const isFoundationPaid = membershipId === 'intelligence' || membershipId === 'premium';

        // 2. Identify Active Earning Nodes
        const hasLoadsNode = companyData.hasLoadsPlan || membershipId === 'premium' || membershipId === 'loads_intelligence';
        const hasWarehouseNode = companyData.hasWarehousePlan || membershipId === 'premium' || membershipId === 'warehouse_intelligence';
        const hasMarketplaceNode = companyData.hasBuySellPlan || membershipId === 'premium' || membershipId === 'buy_sell_intelligence';

        // 3. Define Access Depth for this search type
        let authorizedForDirectContacts = false;
        if (type === 'transporter' || type === 'driver') authorizedForDirectContacts = hasLoadsNode;
        else if (type === 'warehouse') authorizedForDirectContacts = hasWarehouseNode;
        else if (type === 'supplier' || type === 'finance') authorizedForDirectContacts = isFoundationPaid; // Foundational value

        // 4. Execute Scan
        let collectionName = 'leads';
        if (['driver', 'transporter', 'supplier', 'finance', 'warehouse', 'distributor'].includes(type)) collectionName = 'partners';
        
        const snapshot = await db.collection(collectionName)
            .orderBy('updatedAt', 'desc')
            .limit(100) 
            .get();

        const finalResults = snapshot.docs.map(doc => {
            const item = doc.data();
            const normalized = {
                id: doc.id,
                companyName: item.companyName || item.company_name || item.service_handle || 'Industrial Entity',
                address: item.address || item.physicalAddress || 'South Africa',
                entryType: item.industrial_category || item.category || 'General',
                researchStatus: item.minedServiceWording ? 'completed' : 'pending'
            };

            if (authorizedForDirectContacts) {
                return {
                    ...normalized,
                    contactPerson: item.contactPerson || item.contact_person || 'Identity Verified',
                    email: item.email || item.email_address || 'N/A',
                    phone: item.phone || item.telephone_number || 'N/A',
                    mobile: item.mobile || item.registry_line || 'N/A',
                    website: item.website || item.url || 'N/A',
                    minedServiceWording: item.minedServiceWording || item.notes || '',
                };
            } else if (isFoundationPaid) {
                // Foundation (R100): Masking high-value contacts
                return {
                    ...normalized,
                    contactPerson: 'Locked (Earning Node Required)',
                    email: 'upgrade@tc.co.za',
                    phone: '0XX XXX XXXX',
                    mobile: '0XX XXX XXXX',
                    website: 'www.locked.co.za',
                    isMasked: true,
                    nodeRequired: type === 'transporter' ? 'loads_intelligence' : type === 'warehouse' ? 'warehouse_intelligence' : 'buy_sell_intelligence'
                };
            } else {
                // Free: Deep Masking
                return {
                    ...normalized,
                    contactPerson: 'Locked',
                    isMasked: true,
                    isFreeMask: true
                };
            }
        });

        // 5. Log Search for Member Audit
        await db.collection('companies').doc(companyId).collection('searchLogs').add({
            userId: uid,
            type,
            searchTerm: searchTerm || '',
            resultCount: finalResults.length,
            timestamp: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true, data: finalResults });

    } catch (error: any) {
        console.error(`Forensic Search API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
