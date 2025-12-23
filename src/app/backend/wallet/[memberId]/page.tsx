
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import MemberWallet from './member-wallet';
import { Suspense, useMemo } from 'react';

function MemberWalletPageComponent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const memberId = params.memberId as string;
    const firestore = useFirestore();

    // Read member data from URL search params instead of fetching from Firestore
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

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !memberId) return null;
        return query(
            collection(firestore, 'transactions'),
            where('memberId', '==', memberId),
            orderBy('date', 'desc')
        );
    }, [firestore, memberId]);

    const { data: transactions, isLoading: areTransactionsLoading } = useCollection(transactionsQuery);

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
            
            {areTransactionsLoading && (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            )}
            
            {!areTransactionsLoading && memberData && (
                <MemberWallet member={memberData} initialTransactions={transactions || []} />
            )}

            {!areTransactionsLoading && !memberData?.id && (
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
