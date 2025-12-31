
'use server';

import { getClientSideAuthToken } from '@/firebase';

// Generic fetcher for protected API routes
async function fetchFromApi(path: string, type: 'collection' | 'document' | 'collection-group') {
    try {
        const token = await getClientSideAuthToken();
        if (!token) {
            // This is a server-side action, so we can't rely on client-side auth state directly.
            // A more robust solution would involve a server-side session, but for now we rely on the token.
            throw new Error("Authentication token not found. The user might not be logged in on the client.");
        }

        // The URL needs to be absolute when fetching from the server side.
        // This should be configured with an environment variable for production.
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/getUserSubcollection`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path, type }),
            // Add caching to prevent re-fetching the same data constantly
            next: { revalidate: 10 }, 
        });

        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || `Failed to fetch from API route for path: ${path}`);
        }
        
        return { success: true, data: result.data };

    } catch (error: any) {
        console.error(`Error in fetchFromApi for path "${path}":`, error.message);
        return { success: false, error: error.message };
    }
}


export async function getMembers() {
    return fetchFromApi('members', 'collection');
}

export async function getContributions() {
    return fetchFromApi('contributions', 'collection');
}

export async function getAllTransactions() {
    return fetchFromApi('transactions', 'collection-group');
}

export async function getShops() {
    // This fetches all shops from all members
    return fetchFromApi('shops', 'collection-group');
}

export async function getFinanceApplications() {
     try {
        const [quotesResult, enquiriesResult] = await Promise.all([
            fetchFromApi('quotes', 'collection-group'),
            fetchFromApi('enquiries', 'collection-group')
        ]);
        
        if (!quotesResult.success || !enquiriesResult.success) {
            throw new Error(quotesResult.error || enquiriesResult.error || 'Failed to fetch one or more finance records.');
        }

        const combinedRecords = [
            ...(quotesResult.data || []).map((q: any) => ({ ...q, recordType: 'Quote' })),
            ...(enquiriesResult.data || []).map((e: any) => ({ ...e, recordType: 'Enquiry' })),
        ];

        combinedRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return { success: true, data: combinedRecords };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


export async function deleteTransaction(memberId: string, transactionId: string) {
    // Deletion requires a different endpoint
    try {
         const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication required.");

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/deleteUserDoc`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path: `members/${memberId}/transactions/${transactionId}` }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to delete transaction.');
        }
        return { success: true };
    } catch(error: any) {
        return { success: false, error: error.message };
    }
}
