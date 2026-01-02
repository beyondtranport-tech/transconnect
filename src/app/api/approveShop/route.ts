
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { verifyAdmin } from '@/app/api/admin/route';

export async function POST(req: NextRequest) {
    try {
        const { db } = await verifyAdmin(req);
        
        const { shopId, ownerId, companyId } = await req.json();
        if (!shopId || !ownerId || !companyId) {
            return NextResponse.json({ success: false, error: 'Bad Request: shopId, ownerId and companyId are required.' }, { status: 400 });
        }
        
        const memberShopRef = db.doc(`companies/${companyId}/shops/${shopId}`);
        const publicShopRef = db.doc(`shops/${shopId}`);
        
        const shopDoc = await memberShopRef.get();
        if (!shopDoc.exists) {
            throw new Error(`Shop with ID ${shopId} not found for company ${companyId}.`);
        }
        
        const shopData = shopDoc.data();
        
        const batch = db.batch();
        batch.set(publicShopRef, { ...shopData, status: 'approved', updatedAt: new Date() });
        batch.update(memberShopRef, { status: 'approved', updatedAt: new Date() });
        await batch.commit();

        return NextResponse.json({ success: true, message: 'Shop approved and published.' });
    } catch (error: any) {
        console.error('Error approving shop:', error);
        const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
        return NextResponse.json({ success: false, error: error.message }, { status });
    }
}
