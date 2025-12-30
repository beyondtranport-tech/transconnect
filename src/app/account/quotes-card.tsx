'use client';

import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileText, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
        return query(
            collection(firestore, 'members', user.uid, 'quotes'), 
            orderBy('createdAt', 'desc'), 
            limit(10)
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
                   My Saved Quotes
                </CardTitle>
                <CardDescription>Explore funding products to generate a quote. Your recent saved quotes are shown here.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="mb-6">
                    <Button asChild>
                        <Link href="/funding">Explore Funding & Get a Quote</Link>
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
                                    <TableHead>Product</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Term</TableHead>
                                    <TableHead>Est. Payment</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quotes.map((quote) => (
                                    <TableRow key={quote.id}>
                                        <TableCell className="text-muted-foreground text-xs">{formatDate(quote.createdAt)}</TableCell>
                                        <TableCell>
                                            <p className="font-medium capitalize">{quote.fundingType?.replace(/-/g, ' ')}</p>
                                        </TableCell>
                                        <TableCell className="font-semibold">{formatCurrency(quote.amountRequested)}</TableCell>
                                        <TableCell>{quote.details?.term || 'N/A'} months</TableCell>
                                        <TableCell>{formatCurrency(quote.details?.monthlyPayment)}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>View</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">You have no saved quotes yet.</p>
                            <p className="text-sm text-muted-foreground mt-1">Generate a quote from our funding products page.</p>
                        </div>
                    )
                )}
            </CardContent>
        </Card>
    );
}
