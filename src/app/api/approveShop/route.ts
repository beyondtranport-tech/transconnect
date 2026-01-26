

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { verifyAdmin } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const { db } = await verifyAdmin(req);
        
        const { shopId, companyId } = await req.json();
        if (!shopId || !companyId) {
            return NextResponse.json({ success: false, error: 'Bad Request: shopId and companyId are required.' }, { status: 400 });
        }
        
        const memberShopRef = db.doc(`companies/${companyId}/shops/${shopId}`);
        const publicShopRef = db.doc(`shops/${shopId}`);
        
        const shopDoc = await memberShopRef.get();
        if (!shopDoc.exists) {
            throw new Error(`Shop with ID ${shopId} not found for company ${companyId}.`);
        }
        
        const shopData = shopDoc.data();
        if (!shopData) {
            throw new Error(`Shop data is empty for shop ${shopId}.`);
        }
        
        const batch = db.batch();

        const publicShopData = { ...shopData, status: 'approved', updatedAt: FieldValue.serverTimestamp() };
        
        batch.set(publicShopRef, publicShopData);
        batch.update(memberShopRef, { status: 'approved', updatedAt: FieldValue.serverTimestamp() });
        await batch.commit();

        return NextResponse.json({ success: true, message: 'Shop approved and published.' });
    } catch (error: any) {
        console.error('Error approving shop:', error);
        const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
        return NextResponse.json({ success: false, error: error.message }, { status });
    }
}
