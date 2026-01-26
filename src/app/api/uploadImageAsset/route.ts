
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
    
    // Correctly get the default bucket configured during initialization.
    const bucket = getStorage(app).bucket();

    // Extract content type and base64 data from data URI
    const match = imageDataUri.match(/^data:(.+);base64,(.*)$/);
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
    if (error.message?.includes('does not exist') || error.message?.includes('bucket was not found')) {
        const helpfulError = `Firebase Storage Error: The bucket was not found. Please ensure that Cloud Storage is enabled for your Firebase project in the Firebase Console.`;
        return NextResponse.json({ success: false, error: helpfulError }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
