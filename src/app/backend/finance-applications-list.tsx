
'use client';

import { useState, useEffect } from 'react';
import { getFinanceApplications } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface FinanceApplication {
    id: string;
    applicantId: string;
    fundingType: string;
    amountRequested: number;
    status: string;
    createdAt: string;
}

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending: 'secondary',
  under_review: 'outline',
  matched: 'default',
  rejected: 'destructive',
  funded: 'default',
  membership_payment: 'default'
};

const formatPrice = (price: number) => {
    if (typeof price !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
};

const formatDate = (isoString: string | undefined) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString('en-ZA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'});
    } catch (e) {
        return 'Invalid Date';
    }
};

export default function FinanceApplicationsList() {
    const [applications, setApplications] = useState<FinanceApplication[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchApplications() {
            setIsLoading(true);
            try {
                const result = await getFinanceApplications();
                if (result.success && result.data) {
                    // The data from the server action is already serialized
                    setApplications(result.data as FinanceApplication[]);
                } else {
                    setError(result.error || 'Failed to fetch finance applications.');
                }
            } catch (e: any) {
                setError(e.message || 'An unexpected error occurred.');
            } finally {
                setIsLoading(false);
            }
        }

        fetchApplications();
    }, []);

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
                        <p className="text-sm">{error}</p>
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
                                        <TableCell className="capitalize">{app.fundingType?.replace(/_/g, ' ') || 'N/A'}</TableCell>
                                        <TableCell className="text-right font-mono">{formatPrice(app.amountRequested)}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={statusColors[app.status] || 'secondary'} className="capitalize">
                                                {app.status?.replace(/_/g, ' ') || 'N/A'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/backend/wallet/${app.applicantId}`}>View Details</Link>
                                            </Button>
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
