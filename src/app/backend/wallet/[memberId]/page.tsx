
'use client';
import { Suspense } from 'react';
import MemberWallet from './member-wallet';
import { Loader2 } from 'lucide-react';

export default function MemberWalletPage({ params }: { params: { memberId: string } }) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
        <MemberWallet memberId={params.memberId} />
    </Suspense>
  );
}
