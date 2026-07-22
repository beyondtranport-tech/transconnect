
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

/**
 * DUAL-ENGAGEMENT LOGGING API
 * Records the 'Select to Engage' action for both parties.
 * 1. Logs for the Engager (Audit/History).
 * 2. Logs for the Target (Lead Notification/Conversion Trigger).
 */
export async function POST(req: NextRequest) {
  const { app, error: initError } = getAdminApp();
  if (initError || !app) return NextResponse.json({ success: false, error: 'Firebase Failure' }, { status: 500 });

  try {
    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    
    const token = authorization.split('Bearer ')[1];
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const db = getFirestore(app);

    const { targetId, targetName, targetType = 'partner' } = await req.json();
    if (!targetId) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    const userSnap = await db.collection('users').doc(uid).get();
    const companyId = userSnap.data()?.companyId;
    if (!companyId) return NextResponse.json({ success: false, error: 'Profile required' }, { status: 403 });

    const companySnap = await db.collection('companies').doc(companyId).get();
    const companyName = companySnap.data()?.companyName || 'A Member';

    const batch = db.batch();

    // 1. LOG FOR THE ENGAGER: Track what they looked at
    const engagerLogRef = db.collection('companies').doc(companyId).collection('searchLogs').doc();
    batch.set(engagerLogRef, {
        id: engagerLogRef.id,
        type: 'engagement_initiated',
        targetId,
        targetName,
        timestamp: FieldValue.serverTimestamp(),
        details: `Successfully engaged with ${targetName}.`
    });

    // 2. LOG FOR THE TARGET: Create the "Blind Lead" conversion trigger
    // We log this in a global pings collection that we can query for the target company
    const pingRef = db.collection('engagementPings').doc();
    batch.set(pingRef, {
        id: pingRef.id,
        targetId: targetId, // This is the ID in the partners/leads collection
        targetType: targetType,
        engagerId: companyId,
        engagerName: companyName,
        timestamp: FieldValue.serverTimestamp(),
        status: 'unread'
    });

    // 3. UPDATE THE REGISTRY RECORD: Increment the visibility counter
    const recordRef = db.collection(targetType === 'lead' ? 'leads' : 'partners').doc(targetId);
    batch.set(recordRef, {
        engagementCount: FieldValue.increment(1),
        lastEngagedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    // 4. LOG AUDIT: System level tracking
    const auditRef = db.collection('auditLogs').doc();
    batch.set(auditRef, {
        action: 'registry_engagement',
        details: `${companyName} engaged with ${targetName}.`,
        userId: uid,
        companyId: companyId,
        targetId: targetId,
        timestamp: FieldValue.serverTimestamp()
    });

    await batch.commit();
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Engagement Recording Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
