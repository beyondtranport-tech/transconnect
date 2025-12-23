
'use client';
import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import MemberWallet from './member-wallet';
import { Loader2 } from 'lucide-react';

export default function MemberWalletPage() {
  const params = useParams();
  const memberId = params.memberId as string;

  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
        {memberId ? <MemberWallet memberId={memberId} /> : <p>Loading member details...</p>}
    </Suspense>
  );
}
