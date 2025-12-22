
import { NextResponse, type NextRequest } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// This forces the route handler to run on the Node.js runtime instead of the Edge runtime.
export const runtime = 'nodejs';

// To prevent re-initialization in hot-reload environments
if (!getApps().length) {
  try {
    initializeApp();
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

// Create a session cookie
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { idToken } = body;

        if (!idToken) {
            return new Response(JSON.stringify({ error: 'ID token is required.' }), { status: 400 });
        }

        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });

        const response = new Response(JSON.stringify({ status: 'success' }), { status: 200 });
        response.headers.set('Set-Cookie', `__session=${sessionCookie}; HttpOnly; Path=/; Max-Age=${expiresIn}; SameSite=Lax; Secure=${process.env.NODE_ENV === 'production'}`);
        
        return response;
    } catch (error) {
        console.error('Error creating session cookie:', error);
        return new Response(JSON.stringify({ error: 'Failed to create session cookie.' }), { status: 500 });
    }
}


// Delete a session cookie
export async function DELETE(request: NextRequest) {
    const response = new Response(JSON.stringify({ status: 'success' }), { status: 200 });
    response.headers.set('Set-Cookie', `__session=; HttpOnly; Path=/; Max-Age=0;`);
    return response;
}
