'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending: 'secondary',
  under_review: 'outline',
  matched: 'default',
  rejected: 'destructive',
  funded: 'default',
};

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
};

export default function FinanceView() {
    const firestore = useFirestore();
    const { user } = useUser();

    const applicationsCollectionRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        // This query now filters by the current user's ID, which aligns with security rules.
        return query(
            collection(firestore, 'financeApplications'),
            where('applicantId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);
    
    const { data: applications, isLoading, error } = useCollection(applicationsCollectionRef);

    const formatDate = (timestamp: any) => {
        if (timestamp && timestamp.toDate) {
            return format(timestamp.toDate(), "yyyy-MM-dd HH:mm");
        }
        return 'N/A';
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>My Finance Applications</CardTitle>
                <CardDescription>A history of your funding and credit top-up requests.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                {error && (
                     <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                        <h4 className="font-semibold">Error</h4>
                        <p className="text-sm">{error.message}</p>
                    </div>
                )}
                {applications && !isLoading && (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date Submitted</TableHead>
                                    <TableHead>Funding Type</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map(app => (
                                    <TableRow key={app.id}>
                                        <TableCell>{formatDate(app.createdAt)}</TableCell>
                                        <TableCell className="capitalize">{app.fundingType.replace(/_/g, ' ')}</TableCell>
                                        <TableCell className="text-right font-mono">{formatPrice(app.amountRequested)}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={statusColors[app.status] || 'secondary'} className="capitalize">
                                                {app.status.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
                 {applications && applications.length === 0 && !isLoading && (
                    <p className="text-center text-muted-foreground py-10">You have not submitted any finance applications yet.</p>
                )}
            </CardContent>
        </Card>
    );
}
