'use server';

import { cookies } from 'next/headers';

// This server action will securely handle API calls by using the session cookie.
export async function getAuditLogsForMember() {
    const cookieStore = cookies();
    const token = cookieStore.get('firebaseIdToken');

    if (!token?.value) {
        return { success: false, error: 'Authentication token not found. Please sign in again.' };
    }

    try {
        // The API endpoint URL needs to be absolute for server-side fetch.
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/admin`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token.value}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'getAuditLogs' }),
            // Disable caching to ensure fresh data
            cache: 'no-store',
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch audit logs.');
        }

        return { success: true, data: result.data };
    } catch (error: any) {
        console.error("Error in getAuditLogsForMember server action:", error);
        return { success: false, error: error.message };
    }
}
