
import { NextResponse } from 'next/server';
import { getApps, initializeApp, getApp, App, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue, increment } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;
if (!getApps().length) {
  try {
      // This is the standard way to initialize in many hosting environments.
      // It will automatically use service account credentials if the environment is configured correctly.
      adminApp = initializeApp();
  } catch (e: any) {
      console.error("Firebase Admin SDK initialization failed:", e.message);
      // To prevent crashes, we'll allow the app to continue,
      // but subsequent Firestore/Auth calls from the server will fail.
      // A fallback could be added here if needed, but for now we will rely on environment detection.
  }
} else {
  adminApp = getApp();
}

function getSafeFirestore() {
    if (!adminApp) {
        throw new Error("Firebase Admin SDK is not initialized. The server environment may be missing credentials.");
    }
    return getFirestore(adminApp);
}

function getSafeAuth() {
     if (!adminApp) {
        throw new Error("Firebase Admin SDK is not initialized. The server environment may be missing credentials.");
    }
    return getAuth(adminApp);
}


export async function POST(request: Request) {
  try {
    const firestore = getSafeFirestore();
    const auth = getSafeAuth();

    const body = await request.json();
    const { memberId, adminUserId, transactionData } = body;

    // Optional: Verify admin user
    const adminUser = await auth.getUser(adminUserId);
    if (adminUser.email !== 'transconnect@gmail.com') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const batch = firestore.batch();
    
    const memberRef = firestore.collection('members').doc(memberId);
    const transactionRef = firestore.collection('transactions').doc(); // Auto-generate ID
    
    // Ensure amount is a number and handle credit/debit logic
    const amount = Number(transactionData.amount) || 0;
    const transactionAmount = transactionData.type === 'credit' ? amount : -amount;
    
    batch.update(memberRef, { walletBalance: increment(transactionAmount) });
    
    const newTransaction = {
        reconciliationId: 'manual-admin-entry',
        memberId: memberId,
        type: transactionData.type,
        amount: amount,
        date: Timestamp.fromDate(new Date(transactionData.date)),
        description: transactionData.description,
        status: 'allocated',
        chartOfAccountsCode: '7000-ManualAdjustment',
        isAdjustment: true,
        postedAt: FieldValue.serverTimestamp(),
        postedBy: adminUserId,
        transactionId: transactionRef.id // Store the auto-generated ID
    };
    batch.set(transactionRef, newTransaction);
    
    await batch.commit();

    return NextResponse.json({ success: true, transactionId: transactionRef.id });

  } catch (error: any) {
    console.error('Failed to create manual transaction:', error);
    
    let errorMessage = 'An unknown server error occurred.';
    if (error.code === 'auth/user-not-found') {
        errorMessage = 'Admin user not found.';
    } else if (error.message.includes("SDK is not initialized")) {
        errorMessage = "Server configuration error: Firebase Admin SDK is not initialized. The environment may be missing credentials.";
    } else if (error.message.includes('access token')) {
       errorMessage = `Server authentication failed: ${error.message}`;
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
