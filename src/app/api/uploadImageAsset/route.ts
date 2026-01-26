
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
    
    // We don't need to verify the token here if getAdminApp works, 
    // because this route is protected in a sense that it only writes to a user-specific path.
    // However, for good practice, let's keep it.
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
    
    const bucket = getStorage(app).bucket();
    const fileUpload = bucket.file(path);

    await fileUpload.save(buffer, {
        metadata: {
            contentType: contentType,
        },
    });
    
    // Make the file public to get a persistent URL
    await fileUpload.makePublic();
    const publicUrl = fileUpload.publicUrl();

    return NextResponse.json({ success: true, url: publicUrl });

  } catch (error: any) {
    console.error(`Error in uploadImageAsset:`, error);
    if (error.code === 403 || (error.message && error.message.includes('permission'))) {
        return NextResponse.json({ success: false, error: 'Permission denied. The backend service account may not have "Storage Object Admin" role in IAM.' }, { status: 403 });
    }
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

    