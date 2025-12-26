'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending: 'secondary',
  under_review: 'outline',
  matched: 'default',
  rejected: 'destructive',
  funded: 'default',
  membership_payment: 'default'
};

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
};

export default function FinanceApplicationsList() {
    const firestore = useFirestore();

    // Query the top-level collection for the admin backend
    const applicationsCollectionRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'financeApplications'), orderBy('createdAt', 'desc'));
    }, [firestore]);
    
    const { data: applications, isLoading, error } = useCollection(applicationsCollectionRef);

    const formatDate = (timestamp: any) => {
        if (timestamp && timestamp.toDate) {
            return format(timestamp.toDate(), "yyyy-MM-dd HH:mm");
        }
        return 'N/A';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Finance Applications (Admin View)</CardTitle>
                <CardDescription>A list of all finance applications submitted by members across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                {error && (
                     <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                        <h4 className="font-semibold">Error loading applications</h4>
                        <p className="text-sm">{error.message}</p>
                    </div>
                )}
                {applications && !isLoading && (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Applicant ID</TableHead>
                                    <TableHead>Funding Type</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map(app => (
                                    <TableRow key={app.id}>
                                        <TableCell>{formatDate(app.createdAt)}</TableCell>
                                        <TableCell className="font-mono text-xs max-w-[150px] truncate">{app.applicantId}</TableCell>
                                        <TableCell className="capitalize">{app.fundingType.replace(/_/g, ' ')}</TableCell>
                                        <TableCell className="text-right font-mono">{formatPrice(app.amountRequested)}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={statusColors[app.status] || 'secondary'} className="capitalize">
                                                {app.status.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm">View Details</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
                 {applications && applications.length === 0 && !isLoading && (
                    <p className="text-center text-muted-foreground py-10">No finance applications have been submitted yet.</p>
                )}
            </CardContent>
        </Card>
    );
}
