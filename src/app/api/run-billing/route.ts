
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { verifyAdmin } from '@/app/api/admin/route';

export async function POST(req: NextRequest) {
    try {
        const { db, adminUid } = await verifyAdmin(req);
        
        const now = new Date();
        
        const membershipsSnap = await db.collection('memberships').get();
        const prices: { [key: string]: { price: { monthly: number, annual: number }, name: string } } = {};
        membershipsSnap.forEach(doc => {
            const data = doc.data();
            prices[doc.id] = { price: data.price, name: data.name };
        });

        const companiesQuery = db.collection('companies').where('membershipId', '!=', 'free');
        const companiesSnap = await companiesQuery.get();

        if (companiesSnap.empty) {
            return NextResponse.json({ success: true, message: "No members with paid plans found.", createdCount: 0 });
        }

        const batch = db.batch();
        let createdCount = 0;
        let errors: string[] = [];

        for (const companyDoc of companiesSnap.docs) {
            const company = companyDoc.data();
            const companyId = companyDoc.id;

            if (!company.nextBillingDate) continue;

            const nextBillingDate = (company.nextBillingDate as Timestamp).toDate();

            if (nextBillingDate <= now) {
                const planId = company.membershipId;
                const cycle = company.billingCycle || 'monthly';
                const planDetails = prices[planId];

                if (!planDetails) {
                    errors.push(`Price for plan '${planId}' on company ${companyId} not found.`);
                    continue;
                }
                
                const planPrice = cycle === 'annual' ? planDetails.price.annual : planDetails.price.monthly;
                const planName = planDetails.name || planId;


                if (typeof planPrice !== 'number') {
                    errors.push(`Price for plan '${planId}' on company ${companyId} not found.`);
                    continue;
                }
                
                const paymentRef = db.collection(`companies/${companyId}/walletPayments`).doc();
                batch.set(paymentRef, {
                    companyId: companyId,
                    userId: company.ownerId,
                    status: 'pending',
                    description: `Membership Fee: ${planName} (${cycle})`,
                    amount: planPrice,
                    createdAt: FieldValue.serverTimestamp(),
                });

                const newNextBillingDate = new Date(nextBillingDate);
                if (cycle === 'monthly') {
                    newNextBillingDate.setMonth(newNextBillingDate.getMonth() + 1);
                } else {
                    newNextBillingDate.setFullYear(newNextBillingDate.getFullYear() + 1);
                }
                batch.update(companyDoc.ref, { nextBillingDate: newNextBillingDate });
                
                createdCount++;
            }
        }
        
        await batch.commit();
        
        return NextResponse.json({ 
            success: true, 
            message: `Billing run completed. ${createdCount} receivable records created.`,
            createdCount,
            errors,
            checkedCount: companiesSnap.size
        });

    } catch (error: any) {
        console.error(`Billing Run API Error:`, error);
        const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
        return NextResponse.json({ success: false, error: error.message }, { status });
    }
}
