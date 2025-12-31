
'use server';

async function fetchFromApi(token: string, path: string, type: 'collection' | 'document' | 'collection-group') {
    if (!token) {
        throw new Error("User not authenticated.");
    }
    
    // Construct the absolute URL for the API endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = new URL('/api/getUserSubcollection', baseUrl);

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, type }),
        // Add cache: 'no-store' to ensure fresh data is fetched on every request
        cache: 'no-store',
    });
    
    if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || `API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
}

export async function getMembers(token: string) {
    return fetchFromApi(token, 'members', 'collection');
}

export async function getContributions(token: string) {
    return fetchFromApi(token, 'contributions', 'collection');
}

export async function getAllTransactions(token: string) {
    return fetchFromApi(token, 'transactions', 'collection-group');
}

export async function getShops(token: string) {
    return fetchFromApi(token, 'shops', 'collection-group');
}

export async function getFinanceApplications(token: string) {
     try {
        // These can run in parallel
        const [quotesResult, enquiriesResult] = await Promise.all([
            fetchFromApi(token, 'quotes', 'collection-group'),
            fetchFromApi(token, 'enquiries', 'collection-group')
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


export async function deleteTransaction(token: string, memberId: string, transactionId: string) {
    try {
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
