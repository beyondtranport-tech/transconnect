
'use server';

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

/**
 * PAY WITH WALLET ENDPOINT
 * Handles both core Membership Tier upgrades and specialized Connect Plan activations.
 */
async function processPlanPurchase(db: FirebaseFirestore.Firestore, adminUid: string, payload: any, isAdmin: boolean) {
    const { companyId, amount, description, planType, planId, cycle } = payload;
    
    if (!companyId || typeof amount !== 'number' || !planType || !planId) {
        throw new Error('Missing required activation metadata.');
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
        
        const userDoc = await transaction.get(db.collection('users').doc(companyData.ownerId));
        const memberName = `${userDoc.data()?.firstName || ''} ${userDoc.data()?.lastName || ''}`.trim();

        // 1. Execute Wallet Debit
        transaction.update(companyRef, {
            walletBalance: FieldValue.increment(-amount),
            availableBalance: FieldValue.increment(-amount),
            updatedAt: FieldValue.serverTimestamp(),
        });

        // 2. Resolve Accounting Logic
        let chartOfAccountsCode = '4010'; // Default membership
        if (planType === 'connect') {
            chartOfAccountsCode = '4100'; // Connect Plan Series
        } else if (description.toLowerCase().includes('top-up')) {
            chartOfAccountsCode = '4410';
        }

        // 3. Record Member Transaction
        const companyTransactionRef = companyRef.collection('transactions').doc();
        transaction.set(companyTransactionRef, {
            transactionId: companyTransactionRef.id,
            type: 'debit',
            amount: amount,
            date: FieldValue.serverTimestamp(),
            description: description,
            status: 'allocated',
            isAdjustment: false,
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
            description: `Revenue: ${description} from ${companyData.companyName} (${companyId})`,
            status: 'allocated',
            chartOfAccountsCode,
            isAdjustment: false,
            companyId: companyId,
        });

        // 5. Apply Plan Specific Logic
        const nextBilling = new Date();
        if (cycle === 'annual') nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        else nextBilling.setMonth(nextBilling.getMonth() + 1);

        if (planType === 'membership') {
            const isFirstPaid = companyData.membershipId === 'free';
            
            transaction.update(companyRef, {
                membershipId: planId,
                billingCycle: cycle || 'monthly',
                nextBillingDate: nextBilling,
                status: 'active', 
            });

            // Handle ISA Commission for first-time paid membership
            if (isFirstPaid && companyData.referrerId) {
                const referrerRef = db.collection('companies').doc(companyData.referrerId);
                const referrerSnap = await transaction.get(referrerRef);
                const isaConfigSnap = await db.collection('configuration').doc('isaPitch').get();
                
                if (referrerSnap.exists && isaConfigSnap.exists) {
                    const commissionRate = (isaConfigSnap.data()?.membershipCommission || 30) / 100;
                    const commissionAmt = amount * commissionRate;

                    if (commissionAmt > 0) {
                        transaction.update(referrerRef, { 
                            walletBalance: FieldValue.increment(commissionAmt),
                            availableBalance: FieldValue.increment(commissionAmt)
                        });

                        const refTxRef = referrerRef.collection('transactions').doc();
                        transaction.set(refTxRef, {
                            transactionId: refTxRef.id,
                            type: 'credit',
                            amount: commissionAmt,
                            date: FieldValue.serverTimestamp(),
                            description: `ISA Referral Commission: ${companyData.companyName}`,
                            status: 'allocated',
                            chartOfAccountsCode: '5010'
                        });
                    }
                }
            }
        } else if (planType === 'connect') {
            // Activate specific connect plan flag
            const planKey = `has${planId.charAt(0).toUpperCase() + planId.slice(1)}Plan`;
            transaction.update(companyRef, {
                [planKey]: true,
                [`${planId}NextBillingDate`]: nextBilling,
                [`${planId}BillingCycle`]: cycle || 'monthly'
            });
        }
        
        return { success: true };
    });
}

export async function POST(req: NextRequest) {
  const { app, error: initError } = getAdminApp();
  if (initError || !app) {
    return NextResponse.json({ success: false, error: 'Firebase Connection Failure' }, { status: 500 });
  }

  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Missing Auth Token' }, { status: 401 });
  }
  
  try {
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(authorization.split('Bearer ')[1]);
    const db = getFirestore(app);
    const payload = await req.json();

    const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (userDoc.data()?.companyId !== payload.companyId && !isAdmin) {
        return NextResponse.json({ success: false, error: 'Forbidden: Cross-company payment denied.' }, { status: 403 });
    }
    
    const result = await processPlanPurchase(db, decodedToken.uid, payload, isAdmin);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error(`PayWithWallet API Error:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
