
import { getStorage } from 'firebase-admin/storage';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

export async function POST(req: NextRequest) {
    try {
        const { app, error: initError } = getAdminApp();
        if (initError || !app) {
            throw new Error(`Admin SDK not initialized: ${initError}`);
        }

        // Authorization check
        const authorization = req.headers.get('authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Missing or invalid token.' }, { status: 401 });
        }
        const token = authorization.split('Bearer ')[1];
        
        const adminAuth = getAuth(app);
        // This verifies the token is valid, which is enough to prove the user is authenticated.
        await adminAuth.verifyIdToken(token);

        const { imageDataUri, folder, fileName } = await req.json();

        if (!imageDataUri || !folder || !fileName) {
            return NextResponse.json({ success: false, error: 'Missing required fields: imageDataUri, folder, or fileName.' }, { status: 400 });
        }

        const matches = imageDataUri.match(/^data:(.+);base64,(.*)$/);
        if (!matches || matches.length !== 3) {
            return NextResponse.json({ success: false, error: 'Invalid data URI format.' }, { status: 400 });
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        const storage = getStorage(app);
        const bucket = storage.bucket();
        const file = bucket.file(`${folder}/${fileName}`);

        await file.save(buffer, {
            metadata: {
                contentType: mimeType,
                cacheControl: 'public, max-age=31536000',
            },
        });
        
        // Make the file publicly readable
        await file.makePublic();

        const publicUrl = file.publicUrl();

        return NextResponse.json({ success: true, url: publicUrl });

    } catch (error: any) {
        console.error('Error in /api/uploadImageAsset:', error);
        let errorMessage = 'An internal server error occurred.';
        // This is a more specific check for the permission issue on the backend.
        if (error.code === 403 || (error.message && error.message.includes('does not have storage.objects.create access'))) {
             errorMessage = 'Permission Denied on Server: This can happen if the backend service account does not have the "Storage Object Admin" role in Google Cloud IAM, or if Firebase Storage is not fully enabled. Please check the setup guide.';
        } else if (error.code?.startsWith('auth/')) {
             errorMessage = 'Authentication error. Please sign in again.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        const status = error.code === 'auth/id-token-expired' ? 401 : 500;
        return NextResponse.json({ success: false, error: errorMessage }, { status });
    }
}
