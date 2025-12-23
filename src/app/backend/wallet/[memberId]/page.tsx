
'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import MemberWallet from './member-wallet';
import { Suspense, useMemo, useEffect, useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

function MemberWalletPageComponent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const firestore = useFirestore();
    const memberId = params.memberId as string;

    const [memberData, setMemberData] = useState(() => {
        if (!memberId) return null;
        
        const createdAtParam = searchParams.get('createdAt');

        return {
            id: memberId,
            firstName: searchParams.get('firstName') || '',
            lastName: searchParams.get('lastName') || '',
            email: searchParams.get('email') || '',
            walletBalance: parseFloat(searchParams.get('walletBalance') || '0'),
            createdAt: createdAtParam ? new Date(createdAtParam) : new Date(),
        };
    });

    // Real-time listener for the member's document to get live balance updates
    const memberRef = useMemoFirebase(() => {
        if (!firestore || !memberId) return null;
        return doc(firestore, 'members', memberId);
    }, [firestore, memberId]);

    const { data: liveMemberData, isLoading } = useDoc(memberRef);

    useEffect(() => {
        if (liveMemberData) {
            setMemberData(liveMemberData);
        }
    }, [liveMemberData]);
    
    // Listen for manual updates to refresh data
    useEffect(() => {
        const refreshData = () => {
            if (memberRef) {
                // This is a bit of a hack to force useDoc to re-fetch,
                // but since it's a listener, just updating the local state is enough.
                if (liveMemberData) setMemberData(liveMemberData);
            }
        };

        window.addEventListener('walletUpdated', refreshData);
        return () => window.removeEventListener('walletUpdated', refreshData);
    }, [memberRef, liveMemberData]);

    if (isLoading && !memberData) {
         return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
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
                <MemberWallet member={memberData} />
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
