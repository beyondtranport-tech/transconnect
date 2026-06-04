import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * PUBLIC/LIMITED SEARCH API
 * Enforces the "1 search / 10 results" rule for free/unauthenticated users.
 * Supports: supplier, transporter, finance
 */
export async function POST(req: NextRequest) {
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) throw new Error(`Admin SDK failed: ${initError}`);

        const { type, query: searchTerm, category } = await req.json();
        const authorization = req.headers.get('authorization');
        const db = getFirestore(app);
        
        let isPaid = false;
        let uid = null;

        // 1. Check Auth Status
        if (authorization?.startsWith('Bearer ')) {
            const token = authorization.split('Bearer ')[1];
            const adminAuth = getAuth(app);
            const decodedToken = await adminAuth.verifyIdToken(token);
            uid = decodedToken.uid;

            // Check if user has a paid membership
            const companySnap = await db.collection('companies').where('ownerId', '==', uid).limit(1).get();
            if (!companySnap.empty) {
                const companyData = companySnap.docs[0].data();
                if (companyData.membershipId && companyData.membershipId !== 'free') {
                    isPaid = true;
                }
            }
        }

        // 2. Build Query
        let leadsRef = db.collection('leads');
        let firestoreQuery: any = leadsRef;

        if (type === 'supplier') {
            const supplierRoles = ['Vendors', 'Vendor', 'Supplier', 'Suppliers'];
            firestoreQuery = firestoreQuery.where('role', 'in', supplierRoles);
        } else if (type === 'transporter') {
            const transporterRoles = ['Transporters', 'Transporter', 'Logistics', 'Transport'];
            firestoreQuery = firestoreQuery.where('role', 'in', transporterRoles);
        } else if (type === 'finance') {
            const financeRoles = ['Investors', 'Investor', 'Finance', 'Funder', 'Lender'];
            firestoreQuery = firestoreQuery.where('role', 'in', financeRoles);
        }

        if (category) {
            firestoreQuery = firestoreQuery.where('entryType', '==', category);
        }

        // Limit results based on membership
        const limitCount = isPaid ? 100 : 10;
        const snapshot = await firestoreQuery.limit(limitCount).get();

        let data = snapshot.docs.map((doc: any) => {
            const lead = doc.data();
            // Basic data normalization
            const normalized = {
                id: doc.id,
                companyName: lead.companyName || 'Unknown Entity',
                address: lead.address || lead.physicalAddress || 'South Africa',
                entryType: lead.entryType || 'General',
                researchStatus: lead.researchStatus,
            };

            // 3. ENFORCE PRIVACY: Strip human contact details for non-paid users
            if (isPaid) {
                return {
                    ...normalized,
                    contactPerson: lead.contactPerson || lead.firstName + ' ' + lead.lastName,
                    email: lead.email || lead.email_address,
                    phone: lead.phone || lead.telephone_number,
                    website: lead.website || lead.url,
                };
            }

            return normalized;
        });

        // Simple client-side text filtering
        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            data = data.filter((item: any) => 
                item.companyName.toLowerCase().includes(lowSearch) || 
                item.entryType.toLowerCase().includes(lowSearch)
            );
        }

        return NextResponse.json({ 
            success: true, 
            data, 
            isLimited: !isPaid 
        });

    } catch (error: any) {
        console.error(`Search API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
