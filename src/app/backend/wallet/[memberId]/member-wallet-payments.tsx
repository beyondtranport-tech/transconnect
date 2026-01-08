
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Wallet, Trash2, ShieldAlert } from 'lucide-react';
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
import { getClientSideAuthToken, useUser } from '@/firebase';

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
};

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const formatDate = (isoString: string | undefined) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' });
};


export default function MemberWalletPayments({ companyId, onUpdate }: { companyId: string, onUpdate: () => void }) {
    const { user, isUserLoading: isAdminLoading } = useUser();
    const [payments, setPayments] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchPayments = useCallback(async () => {
        if (isAdminLoading) return; // Don't fetch if admin user isn't loaded
        setIsLoading(true);
        setError(null);
        try {
             const token = await getClientSideAuthToken();
             if (!token) throw new Error("Authentication token not found.");
            
            const response = await fetch('/api/getUserSubcollection', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: `companies/${companyId}/walletPayments`, type: 'collection' }),
            });
            
            const result = await response.json();

            if (result.success) {
                setPayments(result.data || []);
            } else {
                setError(result.error || 'Failed to load wallet payments.');
            }
        } catch(e: any) {
            setError(e.message);
        }
        setIsLoading(false);
    }, [companyId, isAdminLoading]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const handleDelete = async (paymentId: string) => {
        setIsDeleting(paymentId);
         try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication token not found.");

            const response = await fetch('/api/deleteUserDoc', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path: `companies/${companyId}/walletPayments/${paymentId}` }),
            });

            if (!response.ok) {
                 throw new Error((await response.json()).error || 'Failed to delete record.');
            }

            toast({ title: 'Record Deleted', description: 'The wallet payment record has been permanently removed.' });
            fetchPayments();
            onUpdate();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: e.message });
        } finally {
             setIsDeleting(null);
        }
    };
    
    if (isLoading || isAdminLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Wallet /> Pending Wallet Payments</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wallet /> Pending Wallet Payments</CardTitle>
                <CardDescription>
                    A list of all pending wallet top-ups and membership payments logged by this member via EFT. Approve these by making a manual wallet adjustment above.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 {error && (
                    <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                        <h4 className="font-semibold">Error</h4>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                {!isLoading && !error && payments && (
                    payments.length > 0 ? (
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell className="text-xs">{formatDate(p.createdAt)}</TableCell>
                                        <TableCell className="font-medium capitalize">{p.description?.replace(/_/g, ' ')}</TableCell>
                                        <TableCell>{formatCurrency(p.amount)}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusColors[p.status] || 'secondary'} className="capitalize">
                                                {p.status?.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm" disabled={!!isDeleting}>
                                                        {isDeleting === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete this payment record.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(p.id)} variant="destructive">
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
                            <p>No pending wallet payments found for this member.</p>
                        </div>
                    )
                )}
            </CardContent>
        </Card>
    )
}
