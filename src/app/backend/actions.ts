
'use server';

import { getClientSideAuthToken } from '@/firebase';

// Generic fetcher for protected API routes that require an admin token
async function fetchAsAdmin(path: string, type: 'collection' | 'document' | 'collection-group') {
    try {
        const token = await getClientSideAuthToken();
        if (!token) {
            // This error will be shown to the admin user on the dashboard.
            throw new Error("Authentication token not found. You must be logged in as an admin.");
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/getUserSubcollection`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path, type }),
            // Revalidate cache every 10 seconds.
            next: { revalidate: 10 }, 
        });

        const result = await response.json();
        
        if (!response.ok || !result.success) {
            // Surface the API error to the dashboard component
            throw new Error(result.error || `Failed to fetch from API route for path: ${path}`);
        }
        
        return { success: true, data: result.data };

    } catch (error: any) {
        console.error(`Error in fetchAsAdmin for path "${path}":`, error.message);
        return { success: false, error: error.message };
    }
}


export async function getMembers() {
    return fetchAsAdmin('members', 'collection');
}

export async function getContributions() {
    return fetchAsAdmin('contributions', 'collection');
}

export async function getAllTransactions() {
    return fetchAsAdmin('transactions', 'collection-group');
}

export async function getShops() {
    // This fetches all shops from all members using a collection group query
    return fetchAsAdmin('shops', 'collection-group');
}

export async function getFinanceApplications() {
     try {
        // These can run in parallel
        const [quotesResult, enquiriesResult] = await Promise.all([
            fetchAsAdmin('quotes', 'collection-group'),
            fetchAsAdmin('enquiries', 'collection-group')
        ]);
        
        if (!quotesResult.success || !enquiriesResult.success) {
            throw new Error(quotesResult.error || enquiriesResult.error || 'Failed to fetch one or more finance records.');
        }

        const combinedRecords = [
            ...(quotesResult.data || []).map((q: any) => ({ ...q, recordType: 'Quote' })),
            ...(enquiriesResult.data || []).map((e: any) => ({ ...e, recordType: 'Enquiry' })),
        ];

        // Sort by creation date, descending
        combinedRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return { success: true, data: combinedRecords };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


export async function deleteTransaction(memberId: string, transactionId: string) {
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
