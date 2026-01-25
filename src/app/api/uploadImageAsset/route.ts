
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

export async function POST(req: NextRequest) {
  const { app, error: initError } = getAdminApp();
  if (initError || !app) {
    return NextResponse.json({ success: false, error: 'Internal Server Error: Could not connect to Firebase.' }, { status: 500 });
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

    const { imageDataUri, folder, fileName } = await req.json();

    if (!imageDataUri || !folder || !fileName) {
      return NextResponse.json({ success: false, error: 'Missing imageDataUri, folder, or fileName.' }, { status: 400 });
    }

    // --- Definitive Fix ---
    // Explicitly determine and use the bucket name to resolve the "Bucket not specified" error.
    const encodedServiceAccount = process.env.FIREBASE_ADMIN_SDK_CONFIG_B64;
    if (!encodedServiceAccount) {
      throw new Error('Server configuration error: Firebase service account not found.');
    }
    const serviceAccountJson = Buffer.from(encodedServiceAccount, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);
    const bucketName = `${serviceAccount.project_id}.appspot.com`;

    if (!bucketName) {
        throw new Error('Could not determine storage bucket name from service account.');
    }

    // Get the storage service and explicitly specify the bucket.
    const bucket = getStorage(app).bucket(bucketName);
    // --- End of Fix ---

    // Extract content type and base64 data from data URI
    const match = imageDataUri.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
        throw new Error('Invalid data URI format');
    }
    const contentType = match[1];
    const base64Data = match[2];

    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = `user-assets/${uid}/${folder}/${fileName}`;
    const file = bucket.file(filePath);

    await file.save(buffer, {
      metadata: {
        contentType: contentType,
      },
    });
    
    // Make the file public to get a permanent URL
    await file.makePublic();

    // The public URL is in a standard format
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error('Error in uploadImageAsset:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
