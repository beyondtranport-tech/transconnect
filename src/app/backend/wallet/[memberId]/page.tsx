
'use client';

import { Suspense } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import MemberWallet from './member-wallet';

// This is now a Client Component again to handle client-side data fetching
export default function MemberWalletPage() {
    const params = useParams();
    const memberId = params.memberId as string;

    if (!memberId) {
        return notFound();
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
             <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
                <MemberWallet memberId={memberId} />
            </Suspense>
        </div>
    );
}
