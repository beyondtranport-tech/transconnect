import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App } from 'firebase-admin/app';

let adminApp: App;
if (!getApps().length) {
    adminApp = initializeApp();
} else {
    adminApp = getApps()[0];
}

export async function POST(request: NextRequest) {
    const authorization = request.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
        const idToken = authorization.split('Bearer ')[1];
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

        try {
            const sessionCookie = await getAuth(adminApp).createSessionCookie(idToken, { expiresIn });
            const options = { name: '__session', value: sessionCookie, maxAge: expiresIn, httpOnly: true, secure: true };

            const response = NextResponse.json({ status: 'success' });
            response.cookies.set(options as any);
            return response;
        } catch (error) {
            return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
        }
    }

    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
}
