import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        return NextResponse.json({ success: false, error: `Admin SDK not initialized: ${initError}` }, { status: 500 });
    }

    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }
    const token = authorization.split('Bearer ')[1];
    
    try {
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;

        const db = getFirestore(app);
        
        // Find the user's companyId
        const userDocRef = db.collection('users').doc(uid);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            throw new Error("User profile not found.");
        }
        const companyId = userDoc.data()?.companyId;
        if (!companyId) {
            throw new Error("User is not associated with a company.");
        }

        const companyRef = db.collection('companies').doc(companyId);
        const shopCollectionRef = companyRef.collection('shops');
        
        const newShopRef = shopCollectionRef.doc();

        const newShopData = {
          ownerId: uid,
          companyId: companyId,
          status: 'draft',
          shopName: `${decodedToken.name || 'My'}'s New Shop`,
          category: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          id: newShopRef.id,
        };
        
        const batch = db.batch();
        batch.set(newShopRef, newShopData);
        batch.update(companyRef, { shopId: newShopRef.id });
        await batch.commit();

        return NextResponse.json({ success: true, shopId: newShopRef.id });
    } catch (error: any) {
        console.error('Error creating shop:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
