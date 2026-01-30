
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { verifyAdmin } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const { db, adminUid } = await verifyAdmin(req);
        
        const { startDate, endDate } = await req.json();

        if (!startDate || !endDate) {
            return NextResponse.json({ success: false, error: 'A "From" and "To" date range is required to run billing.' }, { status: 400 });
        }

        const fromDate = new Date(startDate);
        const toDate = new Date(endDate);
        
        const membershipsSnap = await db.collection('memberships').get();
        const prices: { [key: string]: { price: number, name: string } } = {};
        membershipsSnap.forEach(doc => {
            const data = doc.data();
            // Handle both legacy price objects and new direct price numbers
            const monthlyPrice = (typeof data.price === 'object' && data.price !== null)
                ? data.price.monthly
                : data.price;
            prices[doc.id] = { price: monthlyPrice, name: data.name };
        });

        const companiesQuery = db.collection('companies')
            .where('membershipId', '!=', 'free')
            .where('nextBillingDate', '>=', fromDate)
            .where('nextBillingDate', '<=', toDate);
            
        const companiesSnap = await companiesQuery.get();

        if (companiesSnap.empty) {
            return NextResponse.json({ success: true, message: "No members found with billing dates in the selected range.", createdCount: 0 });
        }

        const batch = db.batch();
        let createdCount = 0;
        let errors: string[] = [];

        for (const companyDoc of companiesSnap.docs) {
            const company = companyDoc.data();
            const companyId = companyDoc.id;

            const planId = company.membershipId;
            const cycle = company.billingCycle || 'monthly';
            const planDetails = prices[planId];

            if (!planDetails) {
                errors.push(`Price for plan '${planId}' on company ${companyId} not found.`);
                continue;
            }
            
            // Note: This simplified version assumes monthly billing for all cycles found.
            // A more complex version would calculate annual price based on discount.
            const planPrice = planDetails.price;
            const planName = planDetails.name || planId;

            if (typeof planPrice !== 'number') {
                errors.push(`Price for plan '${planId}' on company ${companyId} is invalid.`);
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

            // Calculate the *next* next billing date
            const currentNextBillingDate = (company.nextBillingDate as Timestamp).toDate();
            const newNextBillingDate = new Date(currentNextBillingDate);
             if (cycle === 'monthly') {
                newNextBillingDate.setMonth(newNextBillingDate.getMonth() + 1);
            } else {
                newNextBillingDate.setFullYear(newNextBillingDate.getFullYear() + 1);
            }
            batch.update(companyDoc.ref, { nextBillingDate: newNextBillingDate });
            
            createdCount++;
        }
        
        if (createdCount > 0) {
            await batch.commit();
        }
        
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
