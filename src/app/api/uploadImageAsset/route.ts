
import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
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
    
    const { getAuth } = await import('firebase-admin/auth');
    await getAuth(app).verifyIdToken(token);
    
    const { file, path } = await req.json();

    if (!file || !path) {
      return NextResponse.json({ success: false, error: 'Bad Request: "file" (base64) and "path" are required.' }, { status: 400 });
    }
    
    const matches = file.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json({ success: false, error: 'Invalid file format. Expected a data URI.' }, { status: 400 });
    }

    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Explicitly specify the bucket name to resolve the "bucket not found" issue.
    const bucket = getStorage(app).bucket('transconnect-v1-39578841-2a857.appspot.com');
    const fileUpload = bucket.file(path);

    await fileUpload.save(buffer, {
        metadata: {
            contentType: contentType,
        },
    });
    
    await fileUpload.makePublic();
    const publicUrl = fileUpload.publicUrl();

    return NextResponse.json({ success: true, url: publicUrl });

  } catch (error: any) {
    console.error(`Error in uploadImageAsset:`, error);
    if (error.code === 403 || (error.message && (error.message.includes('permission') || error.message.includes('bucket')))) {
        return NextResponse.json({ success: false, error: 'Permission Denied: This can happen if the backend service account does not have the "Storage Object Admin" role in Google Cloud IAM, or if Firebase Storage is not fully enabled. Please check your project setup.' }, { status: 403 });
    }
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
