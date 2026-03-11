

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Wallet, Trash2, CheckCircle } from 'lucide-react';
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
import { getClientSideAuthToken, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { format as formatDateFns } from 'date-fns';

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
};

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'R 0.00';
    const parts = amount.toFixed(2).toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `R ${integerPart}.${parts[1]}`;
};

const formatDate = (isoString: any) => {
    if (!isoString) return 'N/A';
    const date = isoString.toDate ? isoString.toDate() : new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return formatDateFns(date, "dd MMM yyyy, HH:mm");
};

async function performAdminAction(token: string, action: string, payload?: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}


export default function MemberWalletPayments({ companyId, onUpdate }: { companyId: string, onUpdate: () => void }) {
    const firestore = useFirestore();
    const [payments, setPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const { toast } = useToast();

    const paymentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, `companies/${companyId}/walletPayments`));
    }, [firestore, companyId]);

    const { data: fetchedPayments, forceRefresh } = useCollection(paymentsQuery);

    useEffect(() => {
        if (fetchedPayments) {
            setPayments(fetchedPayments.filter(p => p.status === 'pending').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
        setIsLoading(false);
    }, [fetchedPayments]);
    
    useEffect(() => {
        forceRefresh();
    }, [companyId, forceRefresh]);
    
    const handleApprove = async (payment: any) => {
        setIsProcessing(payment.id);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            await performAdminAction(token, 'approveWalletPayment', {
                companyId: payment.companyId,
                paymentId: payment.id,
                amount: payment.amount,
                description: payment.description,
            });

            toast({ title: 'Payment Approved', description: `Wallet credited successfully.` });
            forceRefresh();
            onUpdate();
        } catch (e: any) {
             toast({ variant: 'destructive', title: 'Approval Failed', description: e.message });
        } finally {
            setIsProcessing(null);
        }
    }


    const handleDelete = async (paymentId: string) => {
        setIsProcessing(paymentId);
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
            forceRefresh();
            onUpdate();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: e.message });
        } finally {
             setIsProcessing(null);
        }
    };
    
    if (isLoading) {
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
                    EFT payments logged by the member that are awaiting admin approval. Approving a payment will credit the member's wallet.
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
                                        <TableCell className="text-right space-x-1">
                                             <Button size="sm" onClick={() => handleApprove(p)} disabled={isProcessing === p.id}>
                                                {isProcessing === p.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                                                Approve
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm" disabled={!!isProcessing}>
                                                        {isProcessing === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete this payment record without crediting the user.
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
