
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, getClientSideAuthToken } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2, Gem, Wallet, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

export default function PayServicesDialog({ member, onPaymentSuccess }: { member: any, onPaymentSuccess: () => void }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    
    const pendingPaymentsQuery = useMemoFirebase(() => {
        if (!firestore || !member) return null;
        return query(collection(firestore, `members/${member.id}/walletPayments`), where('status', '==', 'pending'));
    }, [firestore, member]);

    const { data: payments, isLoading: arePaymentsLoading, forceRefresh } = useCollection(pendingPaymentsQuery);

    useEffect(() => {
        if (isOpen) {
            forceRefresh();
        }
    }, [isOpen, forceRefresh]);
    
    const handlePay = async (payment: any) => {
        if (!member || member.walletBalance < payment.amount) {
            toast({ variant: 'destructive', title: 'Payment Failed', description: 'Insufficient funds.' });
            return;
        }

        setIsProcessing(payment.id);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const payload = {
                memberId: member.id,
                paymentId: payment.id,
                amount: payment.amount,
                description: payment.description,
            };

            const response = await fetch('/api/payWithWallet', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Payment processing failed.');

            toast({ title: 'Payment Successful!', description: `${payment.description} has been paid.`});
            onPaymentSuccess(); // Refresh member balance
            forceRefresh(); // Refresh payments list
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Payment Failed', description: e.message });
        } finally {
            setIsProcessing(null);
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>Pay for Services</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Pay for Services</DialogTitle>
                    <DialogDescription>
                        Use your wallet balance to pay for outstanding services.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    {arePaymentsLoading ? (
                        <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : payments && payments.length > 0 ? (
                        payments.map(payment => (
                             <div key={payment.id} className="p-4 border rounded-lg space-y-2">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold">{payment.description}</h4>
                                    <p className="font-bold text-lg">{formatCurrency(payment.amount)}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">Due: {format(payment.createdAt, "dd MMM yyyy")}</p>
                                <Button 
                                    className="w-full mt-2" 
                                    onClick={() => handlePay(payment)}
                                    disabled={!!isProcessing || member.walletBalance < payment.amount}
                                >
                                    {isProcessing === payment.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wallet className="mr-2 h-4 w-4"/>}
                                    {member.walletBalance < payment.amount ? 'Insufficient Balance' : 'Pay Now'}
                                </Button>
                            </div>
                        ))
                    ) : (
                         <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No Pending Payments</h3>
                            <p className="text-muted-foreground mt-1">There are no outstanding items due for payment.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
