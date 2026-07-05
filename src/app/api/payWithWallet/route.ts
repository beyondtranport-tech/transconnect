
'use client';

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

/**
 * PAY WITH WALLET ENDPOINT
 * Handles Membership Tiers and Modular Intelligence Node activations.
 */
async function processPlanPurchase(db: FirebaseFirestore.Firestore, adminUid: string, payload: any, isAdmin: boolean) {
    const { companyId, amount, description, planType, planId, cycle } = payload;
    
    if (!companyId || typeof amount !== 'number' || !planType || !planId) {
        throw new Error('Missing activation metadata.');
    }

    const companyRef = db.doc(`companies/${companyId}`);
    
    return await db.runTransaction(async (transaction) => {
        const companySnap = await transaction.get(companyRef);
        if (!companySnap.exists) throw new Error("Member profile not found.");
        
        const companyData = companySnap.data()!;
        const currentBalance = Number(companyData?.availableBalance || 0);

        if (!isAdmin && (isNaN(currentBalance) || currentBalance < amount)) {
            throw new Error(`Insufficient funds: Required ${amount}, Available ${currentBalance}`);
        }
        
        // 1. Execute Wallet Debit
        transaction.update(companyRef, {
            walletBalance: FieldValue.increment(-amount),
            availableBalance: FieldValue.increment(-amount),
            updatedAt: FieldValue.serverTimestamp(),
        });

        // 2. Resolve Accounting (4000 series for subscription revenue)
        const chartOfAccountsCode = (planType === 'membership' || planId === 'intelligence') ? '4010' : '4100';

        // 3. Record Member Transaction
        const companyTransactionRef = companyRef.collection('transactions').doc();
        transaction.set(companyTransactionRef, {
            transactionId: companyTransactionRef.id,
            type: 'debit',
            amount: amount,
            date: FieldValue.serverTimestamp(),
            description: description,
            status: 'allocated',
            chartOfAccountsCode, 
            postedBy: adminUid,
        });

        // 4. Record Platform Revenue
        const platformTransactionRef = db.collection('platformTransactions').doc();
        transaction.set(platformTransactionRef, {
            transactionId: platformTransactionRef.id,
            type: 'credit',
            amount: amount,
            date: FieldValue.serverTimestamp(),
            description: `Revenue: ${description} from ${companyData.companyName}`,
            status: 'allocated',
            chartOfAccountsCode,
            companyId: companyId,
        });

        // 5. Apply Activation Logic
        const nextBilling = new Date();
        if (cycle === 'annual') nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        else nextBilling.setMonth(nextBilling.getMonth() + 1);

        if (planType === 'membership' || planId === 'intelligence') {
            transaction.update(companyRef, {
                membershipId: planId,
                billingCycle: cycle || 'monthly',
                nextBillingDate: nextBilling,
                status: 'active', 
            });
        } else if (planType === 'node' || planType === 'connect') {
            // Map planId to feature flag (e.g. loads_intelligence -> hasLoadsPlan)
            let flag = '';
            if (planId === 'loads_intelligence') flag = 'hasLoadsPlan';
            else if (planId === 'warehouse_intelligence') flag = 'hasWarehousePlan';
            else if (planId === 'buy_sell_intelligence') flag = 'hasBuySellPlan';
            else if (planId === 'loyalty') flag = 'hasLoyaltyPlan';
            else if (planId === 'rewards') flag = 'hasRewardsPlan';
            else if (planId === 'actions') flag = 'hasActionsPlan';

            if (flag) {
                transaction.update(companyRef, {
                    [flag]: true,
                    [`${planId}NextBillingDate`]: nextBilling,
                    [`${planId}BillingCycle`]: cycle || 'monthly'
                });
            }
        }
        
        return { success: true };
    });
}

export async function POST(req: NextRequest) {
  const { app, error: initError } = getAdminApp();
  if (initError || !app) {
    return NextResponse.json({ success: false, error: 'Firebase Failure' }, { status: 500 });
  }

  const authorization = req.headers.get('authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Missing Auth' }, { status: 401 });
  }
  
  try {
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(authorization.split('Bearer ')[1]);
    const db = getFirestore(app);
    const payload = await req.json();

    const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || 
                    decodedToken.email === 'mkoton100@gmail.com' ||
                    decodedToken.email === 'michael@logisticsflow.co.za';

    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (userDoc.data()?.companyId !== payload.companyId && !isAdmin) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    const result = await processPlanPurchase(db, decodedToken.uid, payload, isAdmin);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Payment API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
