
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        return NextResponse.json({ success: false, error: 'Admin SDK not initialized.' }, { status: 500 });
    }

    const headersList = req.headers;
    const authorization = headersList.get('authorization');

    if (!authorization?.startsWith('Bearer ')) {
        return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }
    const token = authorization.split('Bearer ')[1];
    
    try {
        const adminAuth = getAuth(app);
        const decodedToken = await adminAuth.verifyIdToken(token);
        // This is an admin action, so we must check for the admin email.
        if (decodedToken.email !== 'beyondtransport@gmail.com') {
            return NextResponse.json({ success: false, error: 'Forbidden: Admin access required.' }, { status: 403 });
        }
        
        const { shopId, ownerId } = await req.json();
        if (!shopId || !ownerId) {
            return NextResponse.json({ success: false, error: 'shopId and ownerId are required.' }, { status: 400 });
        }
        
        const db = getFirestore(app);
        const memberShopRef = db.doc(`members/${ownerId}/shops/${shopId}`);
        const publicShopRef = db.doc(`shops/${shopId}`);
        
        const shopDoc = await memberShopRef.get();
        if (!shopDoc.exists) {
            throw new Error(`Shop with ID ${shopId} not found for member ${ownerId}.`);
        }
        
        const shopData = shopDoc.data();
        
        const batch = db.batch();
        // Copy the shop data to the public collection and set status to 'approved'
        batch.set(publicShopRef, { ...shopData, status: 'approved', updatedAt: new Date() });
        // Update the status on the original shop document
        batch.update(memberShopRef, { status: 'approved', updatedAt: new Date() });
        await batch.commit();

        return NextResponse.json({ success: true, message: 'Shop approved and published.' });
    } catch (error: any) {
        console.error('Error approving shop:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
