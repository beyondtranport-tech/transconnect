
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

async function handleMembershipPayment(db: FirebaseFirestore.Firestore, adminUid: string, payload: any) {
    const { memberId, planId, cycle, amount } = payload;
    if (!memberId || !planId || !cycle || typeof amount !== 'number') {
        throw new Error('Missing required fields for membership payment.');
    }

    const memberRef = db.doc(`members/${memberId}`);
    const memberSnap = await memberRef.get();
    const memberData = memberSnap.data();

    if (!memberData || memberData.walletBalance < amount) {
        throw new Error('Insufficient wallet balance.');
    }

    const nextBillingDate = new Date();
    if (cycle === 'monthly') {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    } else {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }

    const batch = db.batch();

    // 1. Update member document
    batch.update(memberRef, {
        walletBalance: FieldValue.increment(-amount),
        nextBillingDate: Timestamp.fromDate(nextBillingDate),
        updatedAt: FieldValue.serverTimestamp(),
    });

    // 2. Create transaction record
    const transactionRef = db.collection(`members/${memberId}/transactions`).doc();
    batch.set(transactionRef, {
        transactionId: transactionRef.id,
        type: 'debit',
        amount: amount,
        date: FieldValue.serverTimestamp(),
        description: `Membership Fee: ${planId} (${cycle})`,
        status: 'allocated',
        isAdjustment: false,
        chartOfAccountsCode: '4010', // Standard membership revenue
        postedBy: adminUid,
        memberId: memberId,
    });

    await batch.commit();
    return { success: true, message: 'Membership renewed successfully.' };
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

    let result;
    switch(payload.service) {
        case 'membership':
            result = await handleMembershipPayment(db, uid, payload);
            break;
        default:
            throw new Error('Invalid service specified for payment.');
    }
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error(`Error in payWithWallet:`, error);
    if (error.code?.startsWith('auth/')) {
       return NextResponse.json({ success: false, error: `Authentication error: ${error.message}` }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
