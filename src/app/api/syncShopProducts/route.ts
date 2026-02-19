
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        return NextResponse.json({ success: false, error: `Server error: ${initError}` }, { status: 500 });
    }

    const authorization = req.headers.get('authorization');
    const token = authorization?.split('Bearer ')[1];
    if (!token) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;
        const db = getFirestore(app);

        const { shopId, companyId } = await req.json();
        if (!shopId || !companyId) {
            return NextResponse.json({ success: false, error: 'Missing shopId or companyId.' }, { status: 400 });
        }

        const memberShopRef = db.doc(`companies/${companyId}/shops/${shopId}`);
        const publicShopRef = db.doc(`shops/${shopId}`);

        await db.runTransaction(async (transaction) => {
            // --- ALL READS MUST HAPPEN FIRST ---
            const companyDoc = await transaction.get(db.doc(`companies/${companyId}`));
            const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';

            if (!companyDoc.exists || (companyDoc.data()?.ownerId !== uid && !isAdmin)) {
                throw new Error('Forbidden: You are not the owner of this shop.');
            }

            const shopDoc = await transaction.get(memberShopRef);
            if (!shopDoc.exists || shopDoc.data()?.status !== 'approved') {
                throw new Error('Shop is not approved or does not exist.');
            }
            
            const memberProductsSnap = await transaction.get(memberShopRef.collection('products'));
            const publicProductsCollection = publicShopRef.collection('products');
            const existingPublicProductsSnap = await transaction.get(publicProductsCollection);
            // --- END OF READS ---
            
            const shopData = shopDoc.data()!;
            const { createdAt, updatedAt, ...restOfShopData } = shopData;

            // --- ALL WRITES HAPPEN AFTER ---
            
            // 1. Update public shop document with latest data and a new timestamp.
            transaction.set(publicShopRef, { 
                ...restOfShopData, 
                companyId, 
                status: 'approved', 
                updatedAt: FieldValue.serverTimestamp() 
            }, { merge: true });

            // 2. Delete all existing public products to ensure a clean sync.
            existingPublicProductsSnap.docs.forEach(doc => transaction.delete(doc.ref));

            // 3. Copy all current products to the public collection.
            memberProductsSnap.docs.forEach(productDoc => {
                const publicProductRef = publicProductsCollection.doc(productDoc.id);
                transaction.set(publicProductRef, productDoc.data());
            });
        });

        return NextResponse.json({ success: true, message: 'Products synced successfully.' });

    } catch (error: any) {
        console.error('Error in syncShopProducts:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
