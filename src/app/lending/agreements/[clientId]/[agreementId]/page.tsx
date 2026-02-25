
'use client';

import { Suspense, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, ArrowLeft, FileText, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const formatCurrency = (value?: number) => {
    if (typeof value !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value);
};

const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return new Intl.DateTimeFormat('en-ZA').format(date);
};

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    pending: 'secondary',
    credit: 'outline',
    payout: 'default',
    active: 'default',
    completed: 'secondary',
    defaulted: 'destructive',
};


function AgreementDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { clientId, agreementId } = params as { clientId: string, agreementId: string };
    const firestore = useFirestore();

    const agreementRef = useMemoFirebase(() => {
        if (!firestore || !clientId || !agreementId) return null;
        return doc(firestore, `lendingClients/${clientId}/agreements/${agreementId}`);
    }, [firestore, clientId, agreementId]);
    const { data: agreement, isLoading: isAgreementLoading, error: agreementError } = useDoc(agreementRef);
    
    const clientRef = useMemoFirebase(() => {
        if (!firestore || !clientId) return null;
        return doc(firestore, `lendingClients/${clientId}`);
    }, [firestore, clientId]);
    const { data: client, isLoading: isClientLoading, error: clientError } = useDoc(clientRef);

    const isLoading = isAgreementLoading || isClientLoading;
    const error = agreementError || clientError;

    if (isLoading) {
        return <div className="flex justify-center items-center h-full py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    
    if (error) {
        return <div className="text-center py-20 text-destructive">Error: {error.message}</div>
    }
    
    if (!agreement || !client) {
        return notFound();
    }

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="flex-row justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                       <FileText /> Agreement Details
                    </CardTitle>
                    <CardDescription className="font-mono text-xs mt-1">
                        ID: {agreement.id}
                    </CardDescription>
                </div>
                 <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/lending?view=agreements"><ArrowLeft className="mr-2 h-4 w-4"/> Back to List</Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User /> Client Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">{client.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">{client.id}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Agreement Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge variant={statusColors[agreement.status] || 'secondary'} className="capitalize text-base">{agreement.status}</Badge>
                        </div>
                         <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Agreement Type</p>
                            <p className="font-semibold capitalize">{agreement.type}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Amount</p>
                            <p className="font-semibold text-lg text-primary">{formatCurrency(agreement.amount)}</p>
                        </div>
                         <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Term</p>
                            <p className="font-semibold">{agreement.term} months</p>
                        </div>
                         <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Rate</p>
                            <p className="font-semibold">{agreement.rate}%</p>
                        </div>
                         <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Created</p>
                            <p className="font-semibold">{formatDate(agreement.createdAt)}</p>
                        </div>
                    </CardContent>
                     <CardFooter>
                         <Button asChild>
                           <Link href={`/lending/repayment-schedule?agreementId=${agreementId}&clientId=${clientId}`}>View Full Repayment Schedule</Link>
                         </Button>
                     </CardFooter>
                </Card>

            </CardContent>
        </Card>
    )
}

export default function AgreementDetailPageWrapper() {
    return (
        <div className="container mx-auto px-4 py-16">
            <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
                <AgreementDetailPage />
            </Suspense>
        </div>
    )
}
