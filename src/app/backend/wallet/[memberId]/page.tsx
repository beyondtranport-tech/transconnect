
'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import MemberWallet from './member-wallet';
import { Suspense, useMemo, useEffect } from 'react';

function MemberWalletPageComponent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const memberId = params.memberId as string;

    // The component needs to be mounted on the client to safely access window.location
    useEffect(() => {
        // This effect can be used for client-side only logic if needed
    }, []);

    const memberData = useMemo(() => {
        if (!memberId) return null;
        return {
            id: memberId,
            firstName: searchParams.get('firstName') || '',
            lastName: searchParams.get('lastName') || '',
            email: searchParams.get('email') || '',
            walletBalance: parseFloat(searchParams.get('walletBalance') || '0'),
        };
    }, [memberId, searchParams]);

    const transactions = useMemo(() => {
        const transactionsParam = searchParams.get('transactions');
        if (!transactionsParam) return [];
        try {
            // Firestore timestamps need to be revived after JSON serialization
            const parsed = JSON.parse(transactionsParam);
            return parsed.map((tx: any) => ({
                ...tx,
                date: tx.date ? {
                    seconds: tx.date.seconds,
                    nanoseconds: tx.date.nanoseconds,
                    toDate: () => new Date(tx.date.seconds * 1000)
                } : null
            }));
        } catch (e) {
            console.error("Failed to parse transactions from URL", e);
            return [];
        }
    }, [searchParams]);
    

    return (
        <div>
            <div className="mb-6">
                <Button variant="outline" asChild>
                    <Link href="/backend?view=members">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Members List
                    </Link>
                </Button>
            </div>
            
            {memberData ? (
                <MemberWallet member={memberData} initialTransactions={transactions || []} />
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Member Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">The member could not be found, or data was not passed correctly.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default function MemberWalletPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <MemberWalletPageComponent />
        </Suspense>
    )
}
