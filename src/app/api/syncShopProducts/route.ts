
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

        // Authorization: Verify the user is the owner of the company.
        const companyDoc = await db.doc(`companies/${companyId}`).get();
        const isAdmin = decodedToken.email === 'beyondtransport@gmail.com' || decodedToken.email === 'mkoton100@gmail.com';
        
        if (!companyDoc.exists || (companyDoc.data()?.ownerId !== uid && !isAdmin)) {
            return NextResponse.json({ success: false, error: 'Forbidden: You are not the owner of this shop.' }, { status: 403 });
        }

        const memberShopRef = db.doc(`companies/${companyId}/shops/${shopId}`);
        const publicShopRef = db.doc(`shops/${shopId}`);
        const shopSnap = await memberShopRef.get();
        const shopData = shopSnap.data();

        if (!shopSnap.exists || !shopData) {
             return NextResponse.json({ success: false, error: 'Shop not found in your company records.' }, { status: 404 });
        }

        // Only allow syncing for approved shops.
        if (shopData.status !== 'approved') {
             return NextResponse.json({ success: false, error: 'Shop must be approved to sync products.' }, { status: 400 });
        }

        const memberProductsCollectionRef = memberShopRef.collection('products');
        const memberProductsSnap = await memberProductsCollectionRef.get();
        const memberProducts = memberProductsSnap.docs.map(doc => ({ id: doc.id, data: doc.data() }));

        const publicProductsCollectionRef = publicShopRef.collection('products');
        const publicProductsSnap = await publicProductsCollectionRef.get();

        const batch = db.batch();

        // Delete old public products
        publicProductsSnap.docs.forEach(doc => batch.delete(doc.ref));

        // Add current products to public collection
        memberProducts.forEach(product => {
            const publicProductRef = publicProductsCollectionRef.doc(product.id);
            batch.set(publicProductRef, product.data);
        });
        
        // Also re-sync the main shop data to ensure it's up to date
        const publicShopData = { ...shopData, companyId, status: 'approved', updatedAt: FieldValue.serverTimestamp() };
        batch.set(publicShopRef, publicShopData, { merge: true });

        await batch.commit();

        return NextResponse.json({ success: true, message: 'Products synced successfully.' });

    } catch (error: any) {
        console.error('Error in syncShopProducts:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
