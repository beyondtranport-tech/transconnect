
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

async function handleServicePayment(db: FirebaseFirestore.Firestore, adminUid: string, payload: any) {
    const { companyId, paymentId, amount, description } = payload;
    if (!companyId || !paymentId || typeof amount !== 'number' || !description) {
        throw new Error('Missing required fields for service payment.');
    }

    const companyRef = db.doc(`companies/${companyId}`);
    const companySnap = await companyRef.get();
    const companyData = companySnap.data();

    if (!companyData || companyData.walletBalance < amount) {
        throw new Error('Insufficient wallet balance.');
    }
    
    const userDoc = await db.collection('users').doc(companyData.ownerId).get();
    const memberName = `${userDoc.data()?.firstName || ''} ${userDoc.data()?.lastName || ''}`.trim();

    const batch = db.batch();
    const now = FieldValue.serverTimestamp();

    // 1. Debit company's wallet balance
    batch.update(companyRef, {
        walletBalance: FieldValue.increment(-amount),
        updatedAt: now,
    });

    // 2. Create a DEBIT transaction record in the company's wallet ledger
    const companyTransactionRef = db.collection(`companies/${companyId}/transactions`).doc();
    const chartOfAccountsCode = description.toLowerCase().includes('membership') ? '4010' : '4410';
    batch.set(companyTransactionRef, {
        transactionId: companyTransactionRef.id,
        type: 'debit',
        amount: amount,
        date: now,
        description: description,
        status: 'allocated',
        isAdjustment: false,
        chartOfAccountsCode, 
        postedBy: adminUid,
        companyId: companyId,
    });

    // 3. Create a corresponding CREDIT transaction in the PLATFORM's ledger (as revenue)
    const platformTransactionRef = db.collection('platformTransactions').doc();
    batch.set(platformTransactionRef, {
        transactionId: platformTransactionRef.id,
        type: 'credit',
        amount: amount,
        date: now,
        description: `Revenue: ${description} from ${memberName} (${companyId})`,
        status: 'allocated',
        chartOfAccountsCode,
        isAdjustment: false,
        postedBy: 'system',
        companyId: companyId,
    });


    // 4. If it's a pending payment from the dialog, delete the record. If it's a new membership purchase, update membership details.
    if (payload.membershipDetails) {
        const { planId, cycle } = payload.membershipDetails;
        const newNextBillingDate = new Date();
        if (cycle === 'monthly') {
            newNextBillingDate.setMonth(newNextBillingDate.getMonth() + 1);
        } else {
            newNextBillingDate.setFullYear(newNextBillingDate.getFullYear() + 1);
        }
        batch.update(companyRef, {
            membershipId: planId,
            billingCycle: cycle,
            nextBillingDate: newNextBillingDate,
        });
    } else {
        const paymentRef = db.doc(`companies/${companyId}/walletPayments/${paymentId}`);
        batch.delete(paymentRef);
    }


    await batch.commit();
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
        return NextResponse.json({ success: false, error: 'Forbidden: You can only make payments for your own company.' }, { status: 403 });
    }
    
    // For now, all payments from the dialog are generic service payments
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
