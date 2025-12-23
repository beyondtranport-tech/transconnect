import { NextResponse } from 'next/server';
import { getApps, initializeApp, getApp, App, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue, increment } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;
if (!getApps().length) {
  try {
      const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
      if (!serviceAccountString) {
          throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set. This is required for server-side admin operations.");
      }
      const serviceAccount = JSON.parse(Buffer.from(serviceAccountString, 'base64').toString('utf-8'));
      adminApp = initializeApp({
          credential: cert(serviceAccount)
      });
  } catch (e: any) {
      console.error("Firebase Admin SDK initialization failed:", e.message);
      // Fallback for local dev if the env var isn't set, though it will likely fail on the server.
      // This helps prevent crashes during local development if the env var is missing.
      if (!getApps().length) {
        adminApp = initializeApp();
      } else {
        adminApp = getApp();
      }
  }
} else {
  adminApp = getApp();
}

const firestore = getFirestore(adminApp);
const auth = getAuth(adminApp);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { memberId, adminUserId, transactionData } = body;

    // Optional: Verify admin user
    const adminUser = await auth.getUser(adminUserId);
    if (adminUser.email !== 'transconnect@gmail.com') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const batch = firestore.batch();
    
    const memberRef = firestore.collection('members').doc(memberId);
    const transactionRef = firestore.collection('transactions').doc();
    
    const transactionAmount = transactionData.type === 'credit' ? transactionData.amount : -transactionData.amount;
    
    batch.update(memberRef, { walletBalance: increment(transactionAmount) });
    
    const newTransaction = {
        reconciliationId: 'manual-admin-entry',
        memberId: memberId,
        type: transactionData.type,
        amount: transactionData.amount,
        date: Timestamp.fromDate(new Date(transactionData.date)),
        description: transactionData.description,
        status: 'allocated',
        chartOfAccountsCode: '7000-ManualAdjustment',
        isAdjustment: true,
        postedAt: FieldValue.serverTimestamp(),
        postedBy: adminUserId,
        transactionId: transactionRef.id
    };
    batch.set(transactionRef, newTransaction);
    
    await batch.commit();

    return NextResponse.json({ success: true, transactionId: transactionRef.id });

  } catch (error: any) {
    console.error('Failed to create manual transaction:', error);
    
    let errorMessage = 'An unknown server error occurred.';
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Authentication token has expired. Please sign in again.';
    } else if (error.message.includes('FIREBASE_SERVICE_ACCOUNT_BASE64')) {
      errorMessage = 'Server configuration error: Service account is not configured correctly.';
    } else if (error.message.includes('access token')) {
      errorMessage = `Server authentication failed: ${error.message}`;
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
