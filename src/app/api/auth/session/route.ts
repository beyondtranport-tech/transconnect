import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';

let adminApp: App;
if (!getApps().length) {
    try {
         const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
         adminApp = initializeApp({
             credential: cert(serviceAccount)
         });
    } catch(e) {
        console.error("Failed to initialize Firebase Admin SDK from service account. Falling back to default init.", e);
        adminApp = initializeApp();
    }
} else {
    adminApp = getApps()[0];
}

export async function POST(request: NextRequest) {
    const authorization = request.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
        const idToken = authorization.split('Bearer ')[1];
        // Session cookie expires in 5 days.
        const expiresIn = 60 * 60 * 24 * 5 * 1000;

        try {
            const sessionCookie = await getAuth(adminApp).createSessionCookie(idToken, { expiresIn });
            const options = { 
                name: '__session', 
                value: sessionCookie, 
                maxAge: expiresIn, 
                httpOnly: true, 
                secure: true,
                path: '/',
            };

            const response = NextResponse.json({ status: 'success' });
            response.cookies.set(options);
            return response;
        } catch (error) {
            console.error("Session cookie creation failed:", error);
            return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
        }
    }

    return NextResponse.json({ status: 'error', message: 'No authorization token provided.' }, { status: 400 });
}
