
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
            const companyDoc = await transaction.get(db.doc(`companies/${companyId}`));
            const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';

            if (!companyDoc.exists || (companyDoc.data()?.ownerId !== uid && !isAdmin)) {
                throw new Error('Forbidden: You are not the owner of this shop.');
            }

            const shopDoc = await transaction.get(memberShopRef);
            if (!shopDoc.exists || shopDoc.data()?.status !== 'approved') {
                throw new Error('Shop is not approved or does not exist.');
            }
            const shopData = shopDoc.data()!;

            const memberProductsSnap = await transaction.get(memberShopRef.collection('products'));
            const memberProducts = memberProductsSnap.docs.map(doc => ({ id: doc.id, data: doc.data() }));

            const publicProductsSnap = await transaction.get(publicShopRef.collection('products'));
            publicProductsSnap.docs.forEach(doc => transaction.delete(doc.ref));

            // Explicitly remove existing timestamps before spreading to avoid conflicts
            const { createdAt, updatedAt, ...restOfShopData } = shopData;

            transaction.set(publicShopRef, { 
                ...restOfShopData, 
                companyId, 
                status: 'approved', 
                updatedAt: FieldValue.serverTimestamp() 
            }, { merge: true });

            memberProducts.forEach(product => {
                const publicProductRef = publicShopRef.collection('products').doc(product.id);
                transaction.set(publicProductRef, product.data);
            });
        });

        return NextResponse.json({ success: true, message: 'Products synced successfully.' });

    } catch (error: any) {
        console.error('Error in syncShopProducts:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
