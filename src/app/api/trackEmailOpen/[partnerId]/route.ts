
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';

/**
 * EMAIL TRACKING PIXEL
 * Returns a 1x1 transparent GIF while logging the open event in Firestore.
 */
export async function GET(req: NextRequest, { params }: { params: { partnerId: string } }) {
  const { partnerId } = params;
  const { app } = getAdminApp();

  if (app && partnerId) {
    try {
        const db = getFirestore(app);
        const partnerRef = db.collection('partners').doc(partnerId);
        
        // Log the open event asynchronously
        partnerRef.update({
            lastOpenedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        }).catch(err => console.error("Tracking update failed:", err));
        
    } catch (e) {
        console.error("Tracking pixel error:", e);
    }
  }

  // Return a 1x1 transparent GIF
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  
  return new NextResponse(pixel, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
