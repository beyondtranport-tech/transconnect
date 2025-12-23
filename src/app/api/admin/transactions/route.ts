
import { NextResponse } from 'next/server';
import { getApps, initializeApp, getApp, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;
if (!getApps().length) {
    try {
        // This will attempt to use Application Default Credentials
        // which is the standard for many cloud environments.
        adminApp = initializeApp();
    } catch (e) {
        console.error("Firebase Admin SDK initialization failed:", e);
        // If it fails, we check for the env var as a fallback for local dev.
        // This avoids crashing if neither is present.
        const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
        if (serviceAccountString) {
             const serviceAccount = JSON.parse(Buffer.from(serviceAccountString, 'base64').toString('utf-8'));
             adminApp = initializeApp({
                credential: cert(serviceAccount)
            });
        }
    }
} else {
  adminApp = getApp();
}

async function getSafeFirestore() {
    if (!adminApp) {
        // Attempt one last time to init
         try {
            adminApp = initializeApp();
        } catch (e) {
            console.error("Final attempt to initialize Firebase Admin SDK failed.", e);
            return null;
        }
    }
    return getFirestore(adminApp);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('memberId');

  if (!memberId) {
    return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
  }

  const db = await getSafeFirestore();
  if (!db) {
       return NextResponse.json({ error: 'Server authentication failed. Cannot connect to the database.' }, { status: 500 });
  }

  try {
    const transactionsRef = db.collection('transactions');
    const snapshot = await transactionsRef.where('memberId', '==', memberId).get();
    
    if (snapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }

    const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Firestore Timestamps need to be converted for JSON serialization
        date: doc.data().date?.toDate ? doc.data().date.toDate().toISOString() : null,
        postedAt: doc.data().postedAt?.toDate ? doc.data().postedAt.toDate().toISOString() : null,
    }));

    return NextResponse.json(transactions, { status: 200 });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions.' }, { status: 500 });
  }
}
