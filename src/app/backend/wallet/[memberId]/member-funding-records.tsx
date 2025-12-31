
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileText, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getClientSideAuthToken } from '@/firebase';

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending: 'secondary',
  under_review: 'outline',
  matched: 'default',
  rejected: 'destructive',
  funded: 'default',
  quote: 'outline',
};

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const formatDate = (isoString: string | undefined) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' });
};


export default function MemberFundingRecords({ memberId }: { memberId: string }) {
    const [records, setRecords] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchRecords = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication token not found.");
            
            const [quotesRes, enquiriesRes] = await Promise.all([
                 fetch('/api/getUserSubcollection', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: `members/${memberId}/quotes`, type: 'collection' }),
                }),
                 fetch('/api/getUserSubcollection', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: `members/${memberId}/enquiries`, type: 'collection' }),
                })
            ]);
            
            const quotesResult = await quotesRes.json();
            const enquiriesResult = await enquiriesRes.json();
            
            if (!quotesResult.success || !enquiriesResult.success) {
                throw new Error(quotesResult.error || enquiriesResult.error || 'Failed to fetch funding records.');
            }

            const combinedRecords = [
                ...(quotesResult.data || []).map((q: any) => ({ ...q, recordType: 'Quote' })),
                ...(enquiriesResult.data || []).map((e: any) => ({ ...e, recordType: 'Enquiry' })),
            ];

            combinedRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setRecords(combinedRecords);
        } catch (e: any) {
            setError(e.message);
        }
        setIsLoading(false);
    }, [memberId]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const handleDelete = async (recordId: string, recordType: string) => {
        setIsDeleting(recordId);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication token not found.");

            const subcollection = recordType.toLowerCase() === 'quote' ? 'quotes' : 'enquiries';

            const response = await fetch('/api/deleteUserDoc', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path: `members/${memberId}/${subcollection}/${recordId}` }),
            });

            if (!response.ok) {
                 throw new Error((await response.json()).error || 'Failed to delete record.');
            }

            toast({ title: 'Record Deleted', description: 'The record has been permanently removed.' });
            fetchRecords();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: e.message });
        } finally {
             setIsDeleting(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText /> Funding Records (Quotes & Enquiries)</CardTitle>
                <CardDescription>
                    A list of all quotes and formal enquiries generated by this member.
                </CardDescription>
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
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                {!isLoading && records && (
                    records.length > 0 ? (
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Record Type</TableHead>
                                    <TableHead>Funding Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.map(rec => (
                                    <TableRow key={rec.id}>
                                        <TableCell className="text-xs">{formatDate(rec.createdAt)}</TableCell>
                                        <TableCell>
                                             <Badge variant={rec.recordType === 'Quote' ? 'outline' : 'default'} className="capitalize">
                                                {rec.recordType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium capitalize">{rec.fundingType?.replace(/_/g, ' ')}</TableCell>
                                        <TableCell>{formatCurrency(rec.amountRequested)}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusColors[rec.status] || 'secondary'} className="capitalize">
                                                {rec.status?.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm" disabled={!!isDeleting}>
                                                        {isDeleting === rec.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete this record.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(rec.id, rec.recordType)} variant="destructive">
                                                            Yes, delete it
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    ) : (
                         <div className="text-center py-10 text-muted-foreground">
                            <p>No funding quotes or enquiries found for this member.</p>
                        </div>
                    )
                )}
            </CardContent>
        </Card>
    )
}
