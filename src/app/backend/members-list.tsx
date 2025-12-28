
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { getMembers } from './actions';

export default function MembersList() {
    const [envKeys, setEnvKeys] = useState<string[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchEnvKeys() {
            setIsLoading(true);
            try {
                const result = await getMembers();
                if (result.success && result.data) {
                    setEnvKeys(result.data);
                } else {
                    setError(result.error || 'Failed to fetch server environment variables.');
                }
            } catch (e: any) {
                setError(e.message || 'An unexpected error occurred while fetching env vars.');
            } finally {
                setIsLoading(false);
            }
        }

        fetchEnvKeys();
    }, []);

    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Server Environment Diagnostic</CardTitle>
                    <CardDescription>Fetching server environment variables...</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Server Environment Diagnostic</CardTitle>
                <CardDescription>
                    The following environment variable keys are available on the server.
                    Please check if `FIREBASE_PRIVATE_KEY` and other required variables are in this list.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                     <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                        <h4 className="font-semibold">Error fetching environment variables</h4>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                {envKeys && !isLoading && (
                    <div className="bg-muted p-4 rounded-md font-mono text-xs space-y-1">
                        {envKeys.length > 0 ? envKeys.map(key => (
                            <div key={key}>{key}</div>
                        )) : <p>No environment variables found.</p>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
