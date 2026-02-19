
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

        const batch = db.batch();
        const memberShopRef = db.doc(`companies/${companyId}/shops/${shopId}`);
        const publicShopRef = db.doc(`shops/${shopId}`);

        // --- READS ---
        const companyDoc = await db.doc(`companies/${companyId}`).get();
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';

        if (!companyDoc.exists || (companyDoc.data()?.ownerId !== uid && !isAdmin)) {
            throw new Error('Forbidden: You are not the owner of this shop.');
        }

        const shopDoc = await memberShopRef.get();
        if (!shopDoc.exists || shopDoc.data()?.status !== 'approved') {
            throw new Error('Shop is not approved or does not exist.');
        }
        
        const memberProductsSnap = await memberShopRef.collection('products').get();
        const publicProductsCollection = publicShopRef.collection('products');
        const existingPublicProductsSnap = await publicProductsCollection.get();
        
        const shopData = shopDoc.data()!;
        const { createdAt, updatedAt, ...restOfShopData } = shopData;
        // --- END READS ---
        
        // --- PREPARE BATCH WRITES ---
        
        // 1. Update public shop document with latest data and a new timestamp.
        batch.set(publicShopRef, { 
            ...restOfShopData, 
            companyId, 
            status: 'approved', 
            updatedAt: FieldValue.serverTimestamp() 
        }, { merge: true });

        // 2. Delete all existing public products to ensure a clean sync.
        existingPublicProductsSnap.docs.forEach(doc => batch.delete(doc.ref));

        // 3. Copy all current products to the public collection.
        memberProductsSnap.docs.forEach(productDoc => {
            const publicProductRef = publicProductsCollection.doc(productDoc.id);
            batch.set(publicProductRef, productDoc.data());
        });

        // --- COMMIT BATCH ---
        await batch.commit();

        return NextResponse.json({ success: true, message: 'Products synced successfully.' });

    } catch (error: any) {
        console.error('Error in syncShopProducts:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
