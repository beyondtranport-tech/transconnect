
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase, getClientSideAuthToken } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Gem, Wallet } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

export default function PayServicesDialog({ member, onPaymentSuccess }: { member: any, onPaymentSuccess: () => void }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const membershipRef = useMemoFirebase(() => {
        if (!firestore || !member.membershipId) return null;
        return doc(firestore, 'memberships', member.membershipId);
    }, [firestore, member.membershipId]);
    
    const { data: membership, isLoading: isMembershipLoading } = useDoc(membershipRef);

    const price = useMemo(() => {
        if (!membership) return 0;
        return member.billingCycle === 'annual' ? membership.price.annual : membership.price.monthly;
    }, [membership, member.billingCycle]);

    const nextBillingDate = member.nextBillingDate?.toDate ? member.nextBillingDate.toDate() : null;
    const isDue = nextBillingDate ? new Date() > nextBillingDate : false;
    
    const handlePayMembership = async () => {
        if (!member || !membership || !price || member.walletBalance < price) {
            toast({ variant: 'destructive', title: 'Payment Failed', description: 'Insufficient funds or membership details not found.' });
            return;
        }

        setIsProcessing(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const payload = {
                memberId: member.id,
                service: 'membership',
                planId: membership.id,
                cycle: member.billingCycle,
                amount: price,
            };

            const response = await fetch('/api/payWithWallet', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Payment processing failed.');

            toast({ title: 'Payment Successful!', description: `Your ${membership.name} membership has been renewed.`});
            onPaymentSuccess();
            setIsOpen(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Payment Failed', description: e.message });
        } finally {
            setIsProcessing(false);
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
                <div className="py-4">
                    {isMembershipLoading ? (
                        <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : membership ? (
                        <div className="p-4 border rounded-lg space-y-2">
                           <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <Gem className="h-5 w-5 text-primary" />
                                <div>
                                    <h4 className="font-semibold">{membership.name} Membership</h4>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {member.billingCycle} billing cycle
                                    </p>
                                </div>
                             </div>
                             <p className="font-bold text-lg">{formatCurrency(price)}</p>
                           </div>
                           {nextBillingDate && (
                                <p className={`text-xs ${isDue ? 'text-destructive' : 'text-muted-foreground'}`}>
                                    {isDue ? 'Due ' : 'Next payment due '} {format(nextBillingDate, 'dd MMM yyyy')} ({formatDistanceToNow(nextBillingDate, { addSuffix: true })})
                                </p>
                           )}
                           <Button 
                                className="w-full mt-2" 
                                onClick={handlePayMembership}
                                disabled={isProcessing || !isDue || member.walletBalance < price}
                            >
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wallet className="mr-2 h-4 w-4"/>}
                                {member.walletBalance < price ? 'Insufficient Balance' : 'Pay Now'}
                           </Button>
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground">No active membership found.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
