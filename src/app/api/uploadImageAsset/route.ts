import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
      throw new Error(`Admin SDK not initialized: ${initError}`);
    }

    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing or invalid token.' }, { status: 401 });
    }
    const token = authorization.split('Bearer ')[1];
    
    // Verify token to get UID
    const adminAuth = getAuth(app);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const { file, folder, fileName } = await req.json();

    if (!file || !folder || !fileName) {
      return NextResponse.json({ success: false, error: 'Bad Request: "file" (base64), "folder", and "fileName" are required.' }, { status: 400 });
    }
    
    const matches = file.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json({ success: false, error: 'Invalid file format. Expected a data URI.' }, { status: 400 });
    }

    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Explicitly get the default bucket from storage.
    const bucket = getStorage(app).bucket();
    const filePath = `user-assets/${uid}/${folder}/${fileName}`;
    const fileUpload = bucket.file(filePath);

    // Save the file to the bucket.
    await fileUpload.save(buffer, {
        metadata: {
            contentType: contentType,
        },
        public: true, // Make the file publicly readable
    });
    
    // The public URL is what we need to return.
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    return NextResponse.json({ success: true, url: publicUrl });

  } catch (error: any) {
    console.error(`Error in uploadImageAsset:`, error);
    // Provide more specific error feedback if possible
    if (error.code === 403 || (error.message && (error.message.includes('permission') || error.message.includes('bucket')))) {
        return NextResponse.json({ success: false, error: 'Permission Denied on Server: This can happen if the backend service account does not have the "Storage Object Admin" role in Google Cloud IAM, or if Firebase Storage is not fully enabled. Please check the setup guide.' }, { status: 403 });
    }
    const status = error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

    