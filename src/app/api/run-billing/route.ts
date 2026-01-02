
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { verifyAdmin } from '@/app/api/admin/route';

export async function POST(req: NextRequest) {
    try {
        const { db, uid: adminUid } = await verifyAdmin(req);
        
        const now = new Date();
        
        // 1. Fetch all membership plans to get their pricing
        const membershipsSnap = await db.collection('memberships').get();
        const prices: { [key: string]: { monthly: number, annual: number } } = {};
        membershipsSnap.forEach(doc => {
            const data = doc.data();
            prices[doc.id] = data.price;
        });

        // 2. Fetch all companies with a paid membership plan
        const companiesQuery = db.collection('companies').where('membershipId', '!=', 'free');
        const companiesSnap = await companiesQuery.get();

        if (companiesSnap.empty) {
            return NextResponse.json({ success: true, message: "No companies with paid plans found.", billedCount: 0, totalBilled: 0 });
        }

        const batch = db.batch();
        let billedCount = 0;
        let totalBilled = 0;
        let errors: string[] = [];

        for (const companyDoc of companiesSnap.docs) {
            const company = companyDoc.data();
            const companyId = companyDoc.id;

            if (!company.nextBillingDate) continue;

            const nextBillingDate = (company.nextBillingDate as Timestamp).toDate();

            // 3. Check if the billing date is in the past
            if (nextBillingDate <= now) {
                const planId = company.membershipId;
                const cycle = company.billingCycle || 'monthly';
                const planPrice = cycle === 'annual' ? prices[planId]?.annual : prices[planId]?.monthly;

                if (typeof planPrice !== 'number') {
                    errors.push(`Price for plan '${planId}' on company ${companyId} not found.`);
                    continue;
                }

                if (company.walletBalance < planPrice) {
                    errors.push(`Company ${companyId} has insufficient funds for ${planId} plan.`);
                    continue;
                }

                // 4. Create batch operations for a successful billing
                const newBalance = company.walletBalance - planPrice;
                
                const newNextBillingDate = new Date(nextBillingDate);
                if (cycle === 'monthly') {
                    newNextBillingDate.setMonth(newNextBillingDate.getMonth() + 1);
                } else {
                    newNextBillingDate.setFullYear(newNextBillingDate.getFullYear() + 1);
                }
                
                // Update company's balance and next billing date
                batch.update(companyDoc.ref, { 
                    walletBalance: newBalance, 
                    nextBillingDate: newNextBillingDate 
                });

                // Create transaction record
                const transactionRef = db.collection(`companies/${companyId}/transactions`).doc();
                batch.set(transactionRef, {
                    transactionId: transactionRef.id,
                    type: 'debit',
                    amount: planPrice,
                    date: Timestamp.now(),
                    description: `Membership Fee: ${planId} (${cycle})`,
                    status: 'allocated',
                    isAdjustment: false,
                    chartOfAccountsCode: '4010',
                    postedBy: adminUid,
                });

                billedCount++;
                totalBilled += planPrice;
            }
        }
        
        // 5. Commit all batched operations
        await batch.commit();
        
        return NextResponse.json({ 
            success: true, 
            message: `Billing run completed. ${billedCount} companies billed.`,
            billedCount,
            totalBilled,
            errors,
            checkedCount: companiesSnap.size
        });

    } catch (error: any) {
        console.error(`Billing Run API Error:`, error);
        const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
        return NextResponse.json({ success: false, error: error.message }, { status });
    }
}
