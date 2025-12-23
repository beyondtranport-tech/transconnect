
'use client';

import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Wallet, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import MemberWallet from './member-wallet';

export default function MemberWalletPage() {
    const params = useParams();
    const memberId = params.memberId as string;
    const firestore = useFirestore();

    const memberRef = useMemoFirebase(() => {
        if (!firestore || !memberId) return null;
        return doc(firestore, 'members', memberId);
    }, [firestore, memberId]);

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !memberId) return null;
        return query(
            collection(firestore, 'transactions'),
            where('memberId', '==', memberId),
            orderBy('date', 'desc')
        );
    }, [firestore, memberId]);

    const { data: member, isLoading: isMemberLoading } = useDoc(memberRef);
    const { data: transactions, isLoading: areTransactionsLoading } = useCollection(transactionsQuery);

    const isLoading = isMemberLoading || areTransactionsLoading;

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
            
            {isLoading && (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            )}
            
            {!isLoading && member && (
                <MemberWallet member={member} initialTransactions={transactions || []} />
            )}

            {!isLoading && !member && (
                <Card>
                    <CardHeader>
                        <CardTitle>Member Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">The member with ID "{memberId}" could not be found.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
