import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';

/**
 * INTERACTION TRACKING ENDPOINT
 * Handles both 1x1 hidden pixels (Email Opens) and Client-side Pings (App Access).
 * Distinguish via ?source=app or ?source=email
 */
export async function GET(req: NextRequest, { params }: { params: { partnerId: string } }) {
  const { partnerId } = params;
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source') || 'email';
  const { app } = getAdminApp();

  if (app && partnerId) {
    try {
        const db = getFirestore(app);
        
        const fieldToUpdate = source === 'app' ? 'lastAccessedAt' : 'lastOpenedAt';
        const actionLabel = source === 'app' ? 'landing_page_accessed' : 'email_opened';
        const detailLabel = source === 'app' ? 'Recipient landed on digital handshake link.' : 'Recipient opened engagement email.';
        
        const update = {
            [fieldToUpdate]: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        };

        // 1. Update the record in both potential registries
        const partnerRef = db.collection('partners').doc(partnerId);
        const leadRef = db.collection('leads').doc(partnerId);

        const [pSnap, lSnap] = await Promise.all([partnerRef.get(), leadRef.get()]);
        
        const batch = db.batch();
        let entityName = 'Unknown Entity';

        if (pSnap.exists) {
            batch.set(partnerRef, update, { merge: true });
            entityName = pSnap.data()?.companyName || pSnap.data()?.firstName || entityName;
        }
        if (lSnap.exists) {
            batch.set(leadRef, update, { merge: true });
            entityName = lSnap.data()?.companyName || lSnap.data()?.firstName || entityName;
        }

        // 2. Log a forensic audit event for the Backend Activity Feed
        const auditRef = db.collection('auditLogs').doc();
        batch.set(auditRef, {
            action: actionLabel,
            details: `${entityName}: ${detailLabel}`,
            companyId: partnerId,
            companyName: entityName,
            timestamp: FieldValue.serverTimestamp(),
            metadata: { source, partnerId }
        });

        await batch.commit();
        
    } catch (e) {
        console.error("Tracking pixel/ping error:", e);
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
