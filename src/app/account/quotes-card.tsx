
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

export default function QuotesCard() {
    const { user } = useUser();
    const firestore = useFirestore();

    const quotesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        // This is a valid query: a '==' filter combined with a 'not-in' filter.
        return query(
            collection(firestore, 'members', user.uid, 'financeApplications'), 
            where('status', '==', 'quote'),
            where('fundingType', 'not-in', ['wallet_top_up', 'membership_payment', 'credit-top-up']),
            orderBy('createdAt', 'desc'), 
            limit(5)
        );
    }, [firestore, user]);

    const { data: quotes, isLoading, error } = useCollection(quotesQuery);

    if (user && user.email === 'beyondtransport@gmail.com') {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <FileText className="h-6 w-6" />
                   Quotes
                </CardTitle>
                <CardDescription>Click the button to explore funding products and generate a quote. Your saved quotes are shown here.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-2 mb-6">
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/funding">Get a Quote</Link>
                    </Button>
                </div>
                {isLoading && (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                
                {error && (
                    <div className="text-center py-10 text-destructive">
                        <p>Error loading quotes: {error.message}</p>
                    </div>
                )}

                {!isLoading && quotes && (
                    quotes.length > 0 ? (
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
                                {quotes.map((quote) => (
                                    <TableRow key={quote.id}>
                                        <TableCell className="text-muted-foreground text-xs">{formatDate(quote.createdAt)}</TableCell>
                                        <TableCell>
                                            <p className="font-medium capitalize">{quote.fundingType?.replace(/-/g, ' ')}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {quote.status.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold">
                                            {formatCurrency(quote.amountRequested)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">You have no saved quotes yet.</p>
                        </div>
                    )
                )}
            </CardContent>
        </Card>
    );
}
