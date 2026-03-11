
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Send, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { format as formatDateFns } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}

const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    let date;
    if (typeof dateValue === 'string') {
        date = new Date(dateValue);
    } else if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
    } else {
        return 'N/A';
    }

    if (isNaN(date.getTime())) return 'Invalid Date';
    return formatDateFns(date, "dd MMM yyyy, HH:mm");
};


export default function MemberPayoutRequests({ companyId, onUpdate }: { companyId: string, onUpdate: () => void }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const pendingPayoutsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, `companies/${companyId}/payoutRequests`), where('status', '==', 'pending'));
    }, [firestore, companyId]);

    const { data: payouts, isLoading, forceRefresh } = useCollection(pendingPayoutsQuery);
    
    useEffect(() => {
        forceRefresh();
    }, [companyId, forceRefresh]);

    const handleReject = async (payoutId: string) => {
        setIsProcessing(payoutId);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            await performAdminAction(token, 'rejectPayout', { companyId, payoutId });
            
            toast({ title: "Payout Rejected", description: "The request has been cancelled." });
            forceRefresh();
            onUpdate(); // To trigger re-fetch of wallet balance in parent
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
        } finally {
            setIsProcessing(null);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Send /> Pending Payout Requests</CardTitle>
                <CardDescription>
                    These are requested withdrawals that have not been processed yet. They are subtracted from the available balance. You can reject a stuck or incorrect request here.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : payouts && payouts.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payouts.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>{formatDate(p.createdAt)}</TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(p.amount)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="destructive" size="sm" onClick={() => handleReject(p.id)} disabled={!!isProcessing}>
                                            {isProcessing === p.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4" />}
                                            Reject
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground py-10">No pending payout requests found for this member.</p>
                )}
            </CardContent>
        </Card>
    );
}
