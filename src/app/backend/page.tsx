
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function BackendRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/adminaccount');
    }, [router]);

    return (
        <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle>Redirecting...</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">This section has moved. Redirecting you to the unified Admin Account...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
