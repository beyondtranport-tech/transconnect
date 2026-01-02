import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

async function handleServicePayment(db: FirebaseFirestore.Firestore, adminUid: string, payload: any) {
    const { memberId, paymentId, amount, description } = payload;
    if (!memberId || !paymentId || typeof amount !== 'number' || !description) {
        throw new Error('Missing required fields for service payment.');
    }

    const memberRef = db.doc(`members/${memberId}`);
    const memberSnap = await memberRef.get();
    const memberData = memberSnap.data();

    if (!memberData || memberData.walletBalance < amount) {
        throw new Error('Insufficient wallet balance.');
    }

    const batch = db.batch();

    // 1. Update member's wallet balance
    batch.update(memberRef, {
        walletBalance: FieldValue.increment(-amount),
        updatedAt: FieldValue.serverTimestamp(),
    });

    // 2. Create a transaction record for this payment
    const transactionRef = db.collection(`members/${memberId}/transactions`).doc();
    batch.set(transactionRef, {
        transactionId: transactionRef.id,
        type: 'debit',
        amount: amount,
        date: FieldValue.serverTimestamp(),
        description: description,
        status: 'allocated',
        isAdjustment: false,
        chartOfAccountsCode: description.toLowerCase().includes('membership') ? '4010' : '4410', // Simple logic for CoA
        postedBy: adminUid,
        memberId: memberId,
    });

    // 3. If it's a pending payment from the dialog, delete the record. Otherwise, if it's a membership purchase, update membership details.
    if (payload.membershipDetails) {
        const { planId, cycle } = payload.membershipDetails;
        const newNextBillingDate = new Date();
        if (cycle === 'monthly') {
            newNextBillingDate.setMonth(newNextBillingDate.getMonth() + 1);
        } else {
            newNextBillingDate.setFullYear(newNextBillingDate.getFullYear() + 1);
        }
        batch.update(memberRef, {
            membershipId: planId,
            billingCycle: cycle,
            nextBillingDate: newNextBillingDate,
        });
    } else {
        const paymentRef = db.doc(`members/${memberId}/walletPayments/${paymentId}`);
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

    if (uid !== payload.memberId) {
        return NextResponse.json({ success: false, error: 'Forbidden: You can only make payments for your own account.' }, { status: 403 });
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
