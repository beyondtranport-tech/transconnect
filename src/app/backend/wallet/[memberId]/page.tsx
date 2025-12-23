import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import MemberWallet from './member-wallet';
import { getMember } from '../actions';

// This is now a Server Component
export default async function MemberWalletPage({ params }: { params: { memberId: string } }) {
    const memberId = params.memberId as string;

    if (!memberId) {
        return notFound();
    }

    // Fetch data on the server using the server action
    const memberResult = await getMember(memberId);
    
    if (!memberResult.success || !memberResult.data) {
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
                <Card>
                    <CardHeader>
                        <CardTitle>Member Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{memberResult.error || 'The member with the specified ID could not be found.'}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    // The fetched member data is passed as a prop to the client component
    const member = { ...memberResult.data, id: memberId };

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
                <MemberWallet initialMember={member} />
            </Suspense>
        </div>
    );
}
