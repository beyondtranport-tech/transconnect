
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';

/**
 * INTERACTION TRACKING ENDPOINT
 * Handles Pixels (Email Opens), Pings (App Access), and Ad Metrics (Impressions/Clicks).
 */
export async function GET(req: NextRequest, { params }: { params: { partnerId: string } }) {
  const { partnerId: viewerId } = params;
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source') || 'email';
  const campaignId = searchParams.get('campaignId');
  const advertiserId = searchParams.get('advertiserId');
  
  const { app } = getAdminApp();

  if (app && viewerId) {
    try {
        const db = getFirestore(app);
        const batch = db.batch();

        let entityName = 'Unknown Entity';
        const userDoc = await db.collection('users').doc(viewerId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const companySnap = await db.collection('companies').doc(userData?.companyId || 'N/A').get();
            entityName = companySnap.data()?.companyName || userData?.firstName || entityName;
        }

        // 1. AD CAMPAIGN TRACKING
        if (campaignId && advertiserId) {
            const adRef = db.doc(`companies/${advertiserId}/adCampaigns/${campaignId}`);
            const actionLabel = source === 'ad_click' ? 'ad_click' : 'ad_impression';
            const metricField = source === 'ad_click' ? 'metrics.clicks' : 'metrics.impressions';

            // Increment Metrics
            batch.update(adRef, {
                [metricField]: FieldValue.increment(1),
                remainingInstances: FieldValue.increment(-1),
                updatedAt: FieldValue.serverTimestamp()
            });

            // Log Interaction for Member Audit
            const auditRef = db.collection('auditLogs').doc();
            batch.set(auditRef, {
                action: actionLabel,
                details: `${entityName} ${source === 'ad_click' ? 'clicked' : 'viewed'} promotion.`,
                companyId: viewerId,
                companyName: entityName,
                timestamp: FieldValue.serverTimestamp(),
                metadata: { source, campaignId, advertiserId }
            });
        } 
        // 2. STANDARD EMAIL/APP TRACKING
        else {
            const fieldToUpdate = source === 'app' ? 'lastAccessedAt' : 'lastOpenedAt';
            const actionLabel = source === 'app' ? 'landing_page_accessed' : 'email_opened';
            
            const update = { [fieldToUpdate]: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };

            const partnerRef = db.collection('partners').doc(viewerId);
            const leadRef = db.collection('leads').doc(viewerId);

            const [pSnap, lSnap] = await Promise.all([partnerRef.get(), leadRef.get()]);
            
            if (pSnap.exists) batch.set(partnerRef, update, { merge: true });
            if (lSnap.exists) batch.set(leadRef, update, { merge: true });

            const auditRef = db.collection('auditLogs').doc();
            batch.set(auditRef, {
                action: actionLabel,
                details: `${entityName}: ${source === 'app' ? 'Landed on handshake link.' : 'Opened engagement email.'}`,
                companyId: viewerId,
                companyName: entityName,
                timestamp: FieldValue.serverTimestamp(),
                metadata: { source, partnerId: viewerId }
            });
        }

        await batch.commit();
        
    } catch (e) {
        console.error("Tracking failure:", e);
    }
  }

  // AD REDIRECT LOGIC
  if (source === 'ad_click' && advertiserId) {
      const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/shops/${advertiserId}`;
      return NextResponse.redirect(redirectUrl);
  }

  // Return a 1x1 transparent GIF for pixels
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
