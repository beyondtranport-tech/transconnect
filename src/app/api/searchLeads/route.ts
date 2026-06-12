import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) throw new Error(`Admin SDK failed: ${initError}`);

        const { type, query: searchTerm, category, service, province, city, suburb } = await req.json();
        const authorization = req.headers.get('authorization');
        const db = getFirestore(app);
        
        let isPaid = false;
        let uid = null;

        if (authorization?.startsWith('Bearer ')) {
            const token = authorization.split('Bearer ')[1];
            const adminAuth = getAuth(app);
            const decodedToken = await adminAuth.verifyIdToken(token);
            uid = decodedToken.uid;

            const companySnap = await db.collection('companies').where('ownerId', '==', uid).limit(1).get();
            if (!companySnap.empty) {
                const companyData = companySnap.docs[0].data();
                if (companyData.membershipId && companyData.membershipId !== 'free') {
                    isPaid = true;
                }
            }
        }

        // Logic: First, fetch ALL matching leads (max 1000) then filter specifically for intelligence logic
        let leadsRef = db.collection('leads');
        let firestoreQuery: any = leadsRef;

        if (type === 'supplier') {
            firestoreQuery = firestoreQuery.where('role', 'in', ['Vendors', 'Vendor', 'Supplier', 'Suppliers']);
        } else if (type === 'transporter') {
            firestoreQuery = firestoreQuery.where('role', 'in', ['Transporters', 'Transporter', 'Logistics', 'Transport']);
        } else if (type === 'finance') {
            firestoreQuery = firestoreQuery.where('role', 'in', ['Investors', 'Investor', 'Finance', 'Funder', 'Lender']);
        }

        // Apply high-level category if provided (e.g. from discovery tags)
        if (category) {
            firestoreQuery = firestoreQuery.where('entryType', '==', category);
        }

        const snapshot = await firestoreQuery.limit(500).get();

        let data = snapshot.docs.map((doc: any) => {
            const lead = doc.data();
            const normalized = {
                id: doc.id,
                companyName: lead.companyName || lead.trading_name || 'Unknown Entity',
                address: lead.address || lead.physical_address || lead.location || 'South Africa',
                entryType: lead.entryType || lead.industrial_category || 'General',
                researchStatus: lead.researchStatus,
                fleet: lead.fleet || {}, 
                region: lead.region || lead.operational_hub || '',
            };

            // Intelligence Data masking
            if (isPaid) {
                return {
                    ...normalized,
                    contactPerson: lead.contactPerson || lead.firstName + ' ' + lead.lastName,
                    email: lead.email || lead.email_address,
                    phone: lead.phone || lead.telephone_number,
                    mobile: lead.mobile || lead.registry_line,
                    website: lead.website || lead.url,
                };
            }
            return normalized;
        });

        // Advanced Logic Filtering (In-Memory to bypass complex indexes)
        if (searchTerm || service || city || suburb || province) {
            const lowSearch = searchTerm?.toLowerCase() || '';
            const lowProvince = province?.toLowerCase() || '';
            const lowCity = city?.toLowerCase() || '';
            const lowSuburb = suburb?.toLowerCase() || '';
            
            data = data.filter((item: any) => {
                // Location Matching
                const addressStr = (item.address || '').toLowerCase();
                const regionStr = (item.region || '').toLowerCase();
                
                const matchesProvince = !lowProvince || addressStr.includes(lowProvince) || regionStr.includes(lowProvince);
                const matchesCity = !lowCity || addressStr.includes(lowCity) || regionStr.includes(lowCity);
                const matchesSuburb = !lowSuburb || addressStr.includes(lowSuburb) || regionStr.includes(lowSuburb);
                
                // Text Search
                const matchesText = !lowSearch || 
                                    item.companyName.toLowerCase().includes(lowSearch) || 
                                    item.entryType.toLowerCase().includes(lowSearch);
                
                // Fleet-Service Intelligence Logic
                let matchesService = true;
                if (service) {
                    const fleetTrailers = item.fleet?.trailers || [];
                    if (service === 'reefer-container') {
                        // Requires Skeletal AND Genset
                        if (!fleetTrailers.includes('Skeletal') || !fleetTrailers.includes('Skeletal + Genset')) matchesService = false;
                    } else if (service === 'container') {
                        // Requires Skeletal
                        if (!fleetTrailers.some((t: string) => t.includes('Skeletal'))) matchesService = false;
                    } else if (service === 'general-freight') {
                        // Requires Tautliner or Flatbed
                        if (!fleetTrailers.includes('Tautliner') && !fleetTrailers.includes('Flatbed')) matchesService = false;
                    } else if (service === 'bulk-aggregates') {
                        if (!fleetTrailers.includes('Tipper')) matchesService = false;
                    }
                }

                return matchesProvince && matchesCity && matchesSuburb && matchesText && matchesService;
            });
        }

        // Cap final output based on tier
        const limitCount = isPaid ? 100 : 10;
        const finalResults = data.slice(0, limitCount);

        return NextResponse.json({ 
            success: true, 
            data: finalResults, 
            isLimited: !isPaid 
        });

    } catch (error: any) {
        console.error(`Search API Error:`, error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
