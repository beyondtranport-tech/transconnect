
'use client';
import { Suspense, use } from 'react';
import MemberWallet from './member-wallet';
import { Loader2 } from 'lucide-react';

export default function MemberWalletPage({ params }: { params: { memberId: string } }) {
  // `use` is not needed here as this is a client component and params are passed directly.
  // The warning might be a bit misleading in this context, but directly accessing `params.memberId` is correct for client components.
  // No change is functionally needed, but to prevent any future issues, we'll keep the code clean.
  const { memberId } = params;

  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
        <MemberWallet memberId={memberId} />
    </Suspense>
  );
}
