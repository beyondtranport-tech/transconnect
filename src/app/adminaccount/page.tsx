
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This component now acts as a client-side redirector.
// It ensures that any attempt to access /adminaccount is immediately
// forwarded to the correct /backend route.
export default function AdminAccountPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/backend');
  }, [router]);
  
  // Display a loading spinner while the redirect is happening.
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
