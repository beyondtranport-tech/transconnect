
'use server';

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

async function handleServicePayment(db: FirebaseFirestore.Firestore, adminUid: string, payload: any) {
    const { companyId, paymentId, amount, description } = payload;
    if (!companyId || paymentId === undefined || typeof amount !== 'number' || !description) {
        throw new Error('Missing required fields for service payment.');
    }

    const companyRef = db.doc(`companies/${companyId}`);
    
    // Use a transaction to ensure all reads and writes are atomic
    await db.runTransaction(async (transaction) => {
        const companySnap = await transaction.get(companyRef);
        const companyData = companySnap.data();

        // Check against AVAILABLE balance, not total balance
        const currentBalance = Number(companyData?.availableBalance || 0);

        if (!companySnap.exists || isNaN(currentBalance) || currentBalance < amount) {
            throw new Error(`Insufficient available funds. Available balance is less than the required amount.`);
        }
        
        const userDoc = await transaction.get(db.collection('users').doc(companyData.ownerId));
        const memberName = `${userDoc.data()?.firstName || ''} ${userDoc.data()?.lastName || ''}`.trim();

        // 1. Debit company's wallet and available balance
        transaction.update(companyRef, {
            walletBalance: FieldValue.increment(-amount),
            availableBalance: FieldValue.increment(-amount),
            updatedAt: FieldValue.serverTimestamp(),
        });

        // 2. Create a DEBIT transaction record in the company's wallet ledger
        const companyTransactionRef = db.collection(`companies/${companyId}/transactions`).doc();
        const chartOfAccountsCode = description.toLowerCase().includes('membership') ? '4010' : '4410';
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
            companyId: companyId,
        });

        // 3. Create a corresponding CREDIT transaction in the PLATFORM's ledger (as revenue)
        const platformTransactionRef = db.collection('platformTransactions').doc();
        transaction.set(platformTransactionRef, {
            transactionId: platformTransactionRef.id,
            type: 'credit',
            amount: amount,
            date: FieldValue.serverTimestamp(),
            description: `Revenue: ${description} from ${memberName} (${companyId})`,
            status: 'allocated',
            chartOfAccountsCode,
            isAdjustment: false,
            postedBy: 'system',
            companyId: companyId,
        });

        // 4. Handle membership purchase logic
        if (payload.membershipDetails) {
            const { planId, cycle } = payload.membershipDetails;
            const newNextBillingDate = new Date();
            if (cycle === 'monthly') {
                newNextBillingDate.setMonth(newNextBillingDate.getMonth() + 1);
            } else {
                newNextBillingDate.setFullYear(newNextBillingDate.getFullYear() + 1);
            }
            
            const isFirstPaidMembership = companyData.membershipId === 'free';
            
            transaction.update(companyRef, {
                membershipId: planId,
                billingCycle: cycle,
                nextBillingDate: newNextBillingDate,
                status: 'active', // Set status to active on membership purchase
            });

            // 5. Handle Referrer Commission on FIRST paid membership purchase
            if (isFirstPaidMembership && companyData.referrerId) {
                const referrerCompanyRef = db.collection('companies').doc(companyData.referrerId);
                const referrerCompanySnap = await transaction.get(referrerCompanyRef);

                if (referrerCompanySnap.exists) {
                    const isaConfigSnap = await transaction.get(db.collection('configuration').doc('isaPitch'));
                    const commissionRate = (isaConfigSnap.data()?.membershipCommission || 30) / 100;
                    const commissionAmount = amount * commissionRate;

                    if (commissionAmount > 0) {
                        // Credit referrer's wallet
                        transaction.update(referrerCompanyRef, {
                            walletBalance: FieldValue.increment(commissionAmount)
                        });

                        // Create transaction log for referrer
                        const referrerTxRef = db.collection(`companies/${companyData.referrerId}/transactions`).doc();
                        transaction.set(referrerTxRef, {
                            transactionId: referrerTxRef.id,
                            type: 'credit',
                            amount: commissionAmount,
                            date: FieldValue.serverTimestamp(),
                            description: `Referral Commission: ${memberName}`,
                            status: 'allocated',
                            isAdjustment: false,
                            chartOfAccountsCode: '5010', // Commission Payout
                            postedBy: 'system',
                        });
                    }
                }
            }
        } else if (paymentId) { // Only delete if it's a standard service payment
            const paymentRef = doc(firestore, `companies/${companyId}/walletPayments/${paymentId}`);
            transaction.delete(paymentRef);
        }
    });

    return { success: true, message: 'Payment processed successfully.' };
}


export async function POST(req: NextRequest) {
  const { app, error: initError } = getAdminApp();
  if (initError || !app) {
    return NextResponse.json({ success: false, error: 'Internal Server Error: Could not connect to Firebase.' }, { status: 500 });
  }

  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized: No token provided.' }, { status: 401 });
  }
  const idToken = authorization.split('Bearer ')[1];

  try {
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const db = getFirestore(app);

    const payload = await req.json();

    // Verify user owns the company they are trying to pay from
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.data()?.companyId !== payload.companyId) {
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com';
        if (!isAdmin) {
          return NextResponse.json({ success: false, error: 'Forbidden: You can only make payments for your own company.' }, { status: 403 });
        }
    }
    
    const result = await handleServicePayment(db, uid, payload);
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error(`Error in payWithWallet:`, error);
    if (error.code?.startsWith('auth/')) {
       return NextResponse.json({ success: false, error: `Authentication error: ${error.message}` }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
