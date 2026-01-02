
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { verifyAdmin } from '@/app/api/admin/route';

export async function POST(req: NextRequest) {
    try {
        const { db, adminUid } = await verifyAdmin(req);
        
        const now = new Date();
        
        const membershipsSnap = await db.collection('memberships').get();
        const prices: { [key: string]: { monthly: number, annual: number, name: string } } = {};
        membershipsSnap.forEach(doc => {
            const data = doc.data();
            prices[doc.id] = { price: data.price, name: data.name };
        });

        const membersQuery = db.collection('members').where('membershipId', '!=', 'free');
        const membersSnap = await membersQuery.get();

        if (membersSnap.empty) {
            return NextResponse.json({ success: true, message: "No members with paid plans found.", createdCount: 0 });
        }

        const batch = db.batch();
        let createdCount = 0;
        let errors: string[] = [];

        for (const memberDoc of membersSnap.docs) {
            const member = memberDoc.data();
            const memberId = memberDoc.id;

            if (!member.nextBillingDate) continue;

            const nextBillingDate = (member.nextBillingDate as Timestamp).toDate();

            if (nextBillingDate <= now) {
                const planId = member.membershipId;
                const cycle = member.billingCycle || 'monthly';
                const planPrice = cycle === 'annual' ? prices[planId]?.price.annual : prices[planId]?.price.monthly;
                const planName = prices[planId]?.name || planId;

                if (typeof planPrice !== 'number') {
                    errors.push(`Price for plan '${planId}' on member ${memberId} not found.`);
                    continue;
                }
                
                // Create a receivable record in walletPayments
                const paymentRef = db.collection(`members/${memberId}/walletPayments`).doc();
                batch.set(paymentRef, {
                    memberId: memberId,
                    status: 'pending',
                    description: `Membership Fee: ${planName} (${cycle})`,
                    amount: planPrice,
                    createdAt: FieldValue.serverTimestamp(),
                });

                // Update the member's next billing date so they aren't billed again immediately
                const newNextBillingDate = new Date(nextBillingDate);
                if (cycle === 'monthly') {
                    newNextBillingDate.setMonth(newNextBillingDate.getMonth() + 1);
                } else {
                    newNextBillingDate.setFullYear(newNextBillingDate.getFullYear() + 1);
                }
                batch.update(memberDoc.ref, { nextBillingDate: newNextBillingDate });
                
                createdCount++;
            }
        }
        
        await batch.commit();
        
        return NextResponse.json({ 
            success: true, 
            message: `Billing run completed. ${createdCount} receivable records created.`,
            createdCount,
            errors,
            checkedCount: membersSnap.size
        });

    } catch (error: any) {
        console.error(`Billing Run API Error:`, error);
        const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
        return NextResponse.json({ success: false, error: error.message }, { status });
    }
}
