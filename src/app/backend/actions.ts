
'use server';

import { getAdminApp } from '@/lib/firebase-admin';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';

// This is not a real API route, but a server action. 
// We need a way to get the user's token on the server.
// The most reliable way is to have the client send it in the headers.
async function getAdminAuth() {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    if (authorization?.startsWith('Bearer ')) {
        const idToken = authorization.split('Bearer ')[1];
        const { app } = getAdminApp();
        if (app) {
            const adminAuth = getAuth(app);
            try {
                const decodedToken = await adminAuth.verifyIdToken(idToken);
                // Allow only specific admin users
                 if (decodedToken.email === 'beyondtransport@gmail.com') {
                    return { adminAuth, decodedToken };
                }
            } catch (error) {
                 console.error("Token verification failed:", error);
                 return { adminAuth: null, decodedToken: null };
            }
        }
    }
    return { adminAuth: null, decodedToken: null };
}


// Helper to convert Firestore Timestamps to JSON-serializable strings
function serializeTimestamps(docData: any): any {
    if (!docData) return docData;
    const newDocData: { [key: string]: any } = {};
    for (const key in docData) {
        const value = docData[key];
        if (value instanceof Timestamp) {
            newDocData[key] = value.toDate().toISOString();
        } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof FieldValue)) {
            newDocData[key] = serializeTimestamps(value); // Recursively serialize nested objects
        } else {
            newDocData[key] = value;
        }
    }
    return newDocData;
}


export async function getMembers(): Promise<{ success: boolean, data?: any[], error?: string }> {
  const { app, error: initError } = getAdminApp();
  if (initError) return { success: false, error: initError };

  const db = getFirestore(app!);
  try {
    const membersSnap = await db.collection('members').orderBy('createdAt', 'desc').get();
    const members = membersSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
    return { success: true, data: members };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMemberById(memberId: string): Promise<{ success: boolean, data?: any, error?: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError) return { success: false, error: initError };

    const db = getFirestore(app!);
    try {
        const memberDoc = await db.collection('members').doc(memberId).get();
        if (!memberDoc.exists) {
            return { success: false, error: "Member not found" };
        }
        return { success: true, data: { id: memberDoc.id, ...serializeTimestamps(memberDoc.data()) } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


export async function getFinanceApplications(): Promise<{ success: boolean, data?: any[], error?: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError) return { success: false, error: initError };

    const db = getFirestore(app!);
    try {
        const [quotesSnap, enquiriesSnap] = await Promise.all([
            db.collectionGroup('quotes').orderBy('createdAt', 'desc').get(),
            db.collectionGroup('enquiries').orderBy('createdAt', 'desc').get(),
        ]);
        
        const quotes = quotesSnap.docs.map(doc => ({ ...serializeTimestamps(doc.data()), recordType: 'Quote' }));
        const enquiries = enquiriesSnap.docs.map(doc => ({ ...serializeTimestamps(doc.data()), recordType: 'Enquiry' }));

        const combined = [...quotes, ...enquiries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return { success: true, data: combined };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


export async function deleteFinanceApplication(memberId: string, applicationId: string, type: 'quote' | 'enquiry' | 'walletPayment'): Promise<{ success: boolean, error?: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError) return { success: false, error: initError };

    const db = getFirestore(app!);
    try {
        const subcollection = type === 'quote' ? 'quotes' : (type === 'enquiry' ? 'enquiries' : 'walletPayments');
        await db.collection('members').doc(memberId).collection(subcollection).doc(applicationId).delete();
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getContributions(): Promise<{ success: boolean, data?: any[], error?: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError) return { success: false, error: initError };

    const db = getFirestore(app!);
    try {
        const contributionsSnap = await db.collection('contributions').orderBy('createdAt', 'desc').get();
        const contributions = contributionsSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
        return { success: true, data: contributions };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getShops(): Promise<{ success: boolean, data?: any[], error?: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError) return { success: false, error: initError };

    const db = getFirestore(app!);
    try {
        const shopsSnap = await db.collectionGroup('shops').orderBy('createdAt', 'desc').get();
        const shops = shopsSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
        return { success: true, data: shops };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function approveShop(shopId: string, ownerId: string): Promise<{ success: boolean, error?: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError) return { success: false, error: initError };

    const db = getFirestore(app!);
    try {
        const memberShopRef = db.doc(`members/${ownerId}/shops/${shopId}`);
        const publicShopRef = db.doc(`shops/${shopId}`);
        
        const shopDoc = await memberShopRef.get();
        if (!shopDoc.exists) {
            throw new Error(`Shop with ID ${shopId} not found for member ${ownerId}.`);
        }
        const shopData = shopDoc.data();
        
        const batch = db.batch();
        batch.set(publicShopRef, { ...shopData, status: 'approved', updatedAt: FieldValue.serverTimestamp() });
        batch.update(memberShopRef, { status: 'approved', updatedAt: FieldValue.serverTimestamp() });
        await batch.commit();

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAllTransactions(): Promise<{ success: boolean, data?: any[], error?: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError) return { success: false, error: initError };

    const db = getFirestore(app!);
    try {
        const transactionsSnap = await db.collectionGroup('transactions').orderBy('date', 'desc').get();
        const transactions = transactionsSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
        return { success: true, data: transactions };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


export async function deleteTransaction(memberId: string, transactionId: string): Promise<{ success: boolean, error?: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError) return { success: false, error: initError };
    
    const db = getFirestore(app!);
    try {
        await db.collection('members').doc(memberId).collection('transactions').doc(transactionId).delete();
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


export async function getMemberFundingRecords(memberId: string): Promise<{ success: boolean, data?: any[], error?: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError) return { success: false, error: initError };

    const db = getFirestore(app!);
    try {
        const [quotesSnap, enquiriesSnap] = await Promise.all([
            db.collection('members').doc(memberId).collection('quotes').orderBy('createdAt', 'desc').get(),
            db.collection('members').doc(memberId).collection('enquiries').orderBy('createdAt', 'desc').get()
        ]);
        
        const quotes = quotesSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()), recordType: 'Quote' }));
        const enquiries = enquiriesSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()), recordType: 'Enquiry' }));

        const combined = [...quotes, ...enquiries].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return { success: true, data: combined };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


export async function getMemberWalletPayments(memberId: string): Promise<{ success: boolean, data?: any[], error?: string }> {
    const { app, error: initError } = getAdminApp();
    if (initError) return { success: false, error: initError };
    
    const db = getFirestore(app!);
    try {
        const paymentsSnap = await db.collection('members').doc(memberId).collection('walletPayments').orderBy('createdAt', 'desc').get();
        const payments = paymentsSnap.docs.map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }));
        return { success: true, data: payments };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
