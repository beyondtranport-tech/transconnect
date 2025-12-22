
import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';

// Create a session cookie for the admin
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { password } = body;

        const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

        if (!password || password !== adminPassword) {
            return new Response(JSON.stringify({ error: 'Invalid password.' }), { status: 401 });
        }

        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionValue = adminPassword; // Use the password as the session value for simplicity

        const response = new Response(JSON.stringify({ status: 'success' }), { status: 200 });
        response.headers.set('Set-Cookie', `admin-session=${sessionValue}; HttpOnly; Path=/; Max-Age=${expiresIn}; SameSite=Lax; Secure=${process.env.NODE_ENV === 'production'}`);
        
        return response;
    } catch (error) {
        console.error('Error creating admin session:', error);
        return new Response(JSON.stringify({ error: 'Failed to create admin session.' }), { status: 500 });
    }
}
