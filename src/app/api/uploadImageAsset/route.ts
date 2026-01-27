
import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

export async function POST(req: NextRequest) {
    const { app, error: initError } = getAdminApp();
    if (initError || !app) {
        return NextResponse.json({ success: false, error: `Server error: ${initError}` }, { status: 500 });
    }
    
    const authorization = req.headers.get('authorization');
    const token = authorization?.split('Bearer ')[1];
    if (!token) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const adminAuth = getAuth(app);
        await adminAuth.verifyIdToken(token);
        
        const { fileDataUri, folder, fileName, contentType: providedContentType } = await req.json();
        
        if (!fileDataUri || !folder || !fileName) {
            return NextResponse.json({ success: false, error: 'Missing file data or path info.' }, { status: 400 });
        }

        const matches = fileDataUri.match(/^data:(.+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return NextResponse.json({ success: false, error: 'Invalid data URI format.' }, { status: 400 });
        }
        
        const contentType = providedContentType || matches[1];
        const fileBuffer = Buffer.from(matches[2], 'base64');
        
        // --- DEFINITIVE FIX ---
        // Explicitly define and use the correct bucket name, bypassing any faulty auto-discovery.
        const bucketName = "transconnect-v1-39578841-2a857.firebasestorage.app";
        const bucket = getStorage(app).bucket(bucketName);
        const filePath = `${folder}/${fileName}`;
        const file = bucket.file(filePath);
        
        await file.save(fileBuffer, {
            metadata: { contentType },
            public: true 
        });

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        
        return NextResponse.json({ success: true, url: publicUrl });

    } catch (error: any) {
        console.error("Error in /api/uploadImageAsset:", error);
        
        if (error.code === 403 || error.message?.includes('does not have storage.objects.create access')) {
            return NextResponse.json({
                success: false,
                error: 'Permission Denied on Server: This can happen if the backend service account does not have the "Storage Object Admin" role in Google Cloud IAM, or if Firebase Storage is not fully enabled. Please check the setup guide.'
            }, { status: 403 });
        }
        
        if (error.message?.includes('The specified bucket does not exist')) {
             // Hardcode the error message to avoid reflecting the SDK's incorrect discovery
             return NextResponse.json({
                success: false,
                error: `Bucket Not Found on Server: The backend tried to access the Storage bucket but it could not be found. Please ensure Firebase Storage is enabled and the bucket name in the code is correct.`
            }, { status: 404 });
        }
        
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
