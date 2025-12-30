
'use client';

import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const formatDate = (timestamp: any) => {
    if (timestamp && timestamp.toDate) {
        return format(timestamp.toDate(), "dd MMM yyyy");
    }
    return 'N/A';
};

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending: 'secondary',
  under_review: 'outline',
  matched: 'default',
  rejected: 'destructive',
  funded: 'default'
};

export default function EnquiriesCard() {
    const { user } = useUser();
    const firestore = useFirestore();

    const enquiriesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        // This query is now valid, using 'not-in' for funding type and a positive 'in' for status.
        return query(
            collection(firestore, 'members', user.uid, 'financeApplications'), 
            where('fundingType', 'not-in', ['wallet_top_up', 'membership_payment', 'credit-top-up']),
            where('status', 'in', ['pending', 'under_review', 'matched', 'rejected', 'funded']),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
    }, [firestore, user]);

    const { data: enquiries, isLoading, error } = useCollection(enquiriesQuery);

    if (user && user.email === 'beyondtransport@gmail.com') {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <FileText className="h-6 w-6" />
                   Enquiries
                </CardTitle>
                <CardDescription>Click the button below to begin a formal funding application. Your recent enquiries are shown here.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-2 mb-6">
                    <Button asChild className="w-full">
                        <Link href="/funding/apply">Start New Enquiry</Link>
                    </Button>
                </div>
                {isLoading && (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                
                {error && (
                    <div className="text-center py-10 text-destructive">
                        <p>Error loading enquiries: {error.message}</p>
                    </div>
                )}

                {!isLoading && enquiries && (
                    enquiries.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enquiries.map((enquiry) => (
                                    <TableRow key={enquiry.id}>
                                        <TableCell className="text-muted-foreground text-xs">{formatDate(enquiry.createdAt)}</TableCell>
                                        <TableCell>
                                            <p className="font-medium capitalize">{enquiry.fundingType?.replace(/-/g, ' ')}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusColors[enquiry.status] || 'secondary'} className="capitalize">
                                                {enquiry.status.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold">
                                            {formatCurrency(enquiry.amountRequested)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">You have no formal enquiries yet.</p>
                        </div>
                    )
                )}
            </CardContent>
        </Card>
    );
}
