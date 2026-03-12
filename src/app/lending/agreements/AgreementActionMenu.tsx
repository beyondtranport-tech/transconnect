
'use client';

import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, MoreVertical, Edit, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateSafe } from '@/lib/utils';


async function performAdminAction(token: string, action: string, payload: any) {
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

export function AgreementActionMenu({ agreement, onUpdate }: { agreement: any; onUpdate: () => void; }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [dialog, setDialog] = useState<'accept' | 'counter' | 'view' | 'delete' | 'updateStatus' | null>(null);
    const [counterOffer, setCounterOffer] = useState<number | string>(agreement.percentage);
    const [newStatus, setNewStatus] = useState<string>('');
    const { user } = useUser();
    const { toast } = useToast();
    
    const canAccept = agreement.status === 'proposed';

    const handleAction = async (actionType: 'accept' | 'counter' | 'delete' | 'updateStatus', status?: string) => {
        setIsProcessing(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token || !user) throw new Error("Authentication failed.");

            let payload: any;
            let apiAction: string;
            let successMessage: string;

            if (actionType === 'accept') {
                apiAction = 'acceptCommercialAgreement';
                payload = { 
                    companyId: agreement.companyId, 
                    shopId: agreement.shopId, 
                    agreementId: agreement.id,
                    userId: user.uid 
                };
                successMessage = `Agreement for ${agreement.shopName} accepted at ${agreement.percentage}%.`;
            } else if (actionType === 'counter') {
                apiAction = 'proposeCounterOffer';
                payload = { 
                    companyId: agreement.companyId,
                    shopId: agreement.shopId,
                    agreementId: agreement.id,
                    newPercentage: Number(counterOffer),
                    adminId: user.uid
                };
                successMessage = `Counter-offer of ${counterOffer}% sent for ${agreement.shopName}.`;
            } else if (actionType === 'delete') {
                apiAction = 'deleteLendingAgreement';
                payload = { clientId: agreement.clientId, agreementId: agreement.id };
                successMessage = 'Agreement deleted successfully.';
            } else { // updateStatus
                 apiAction = 'updateAgreementStatus';
                payload = { clientId: agreement.clientId, agreementId: agreement.id, status };
                successMessage = `Agreement status updated to ${status}.`;
            }
            await performAdminAction(token, apiAction, payload);
            toast({ title: 'Success', description: successMessage });
            onUpdate();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
        } finally {
            setIsProcessing(false);
            setDialog(null);
        }
    };

    const openConfirmation = (action: 'delete' | 'updateStatus', status?: string) => {
        if (action === 'updateStatus') {
            setNewStatus(status || '');
        }
        setDialog(action);
    };
    
    const getAlertStrings = (action: 'delete' | 'updateStatus' | null) => {
        if (action === 'delete') {
            return { title: "Delete Agreement?", description: "This will permanently delete this lending agreement. This cannot be undone." };
        }
        if (action === 'updateStatus') {
            return { title: `Set Status to "${newStatus}"?`, description: `This will change the agreement status. This may also affect linked asset statuses.` };
        }
        return { title: "Are you sure?", description: "" };
    }

    return (
        <>
            <AlertDialog open={dialog === 'delete' || dialog === 'accept' || dialog === 'updateStatus'} onOpenChange={(open) => !open && setDialog(null)}>
                 <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{getAlertStrings(dialog as 'delete' | 'updateStatus' | null).title}</AlertDialogTitle>
                        <AlertDialogDescription>{getAlertStrings(dialog as 'delete' | 'updateStatus' | null).description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDialog(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleAction(dialog as any, newStatus)} className={dialog === 'delete' ? buttonVariants({ variant: "destructive" }) : ''}>Yes, proceed</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <Dialog open={dialog === 'counter'} onOpenChange={(open) => !open && setDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Make a Counter-Offer</DialogTitle>
                        <DialogDescription>The member proposed {agreement.percentage}%. Propose a new rate below.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="counter-offer-input">Your New Proposed Commission (%)</Label>
                        <Input id="counter-offer-input" type="number" value={counterOffer} onChange={(e) => setCounterOffer(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDialog(null)}>Cancel</Button>
                        <Button onClick={() => handleAction('counter')} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="animate-spin" /> : 'Send Counter-Offer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             <Dialog open={dialog === 'view'} onOpenChange={(open) => !open && setDialog(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Negotiation: {agreement.shopName}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="p-4 border rounded-lg bg-amber-500/10">
                            <h4 className="font-semibold">Member's Proposal</h4>
                            <p className="text-2xl font-bold text-amber-700">{agreement.percentage}%</p>
                            <p className="text-xs text-muted-foreground">Proposed by member on {formatDateSafe(agreement.createdAt, "dd MMM yyyy, HH:mm")}</p>
                        </div>
                         <div className="text-center py-8">
                            <Bot className="mx-auto h-10 w-10 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mt-2">AI negotiation history will be displayed here.</p>
                         </div>
                    </div>
                </DialogContent>
            </Dialog>
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                     <DropdownMenuItem asChild>
                        <Link href={`/lending/agreements/${agreement.clientId}/${agreement.id}`}><Edit className="mr-2 h-4 w-4"/>Edit Agreement</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                         <Link href={`/lending/repayment-schedule?agreementId=${agreement.id}&clientId=${agreement.clientId}`}><Eye className="mr-2 h-4 w-4"/>View Repayment</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => openConfirmation('updateStatus', 'active')} disabled={agreement.status === 'active'}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Activate
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => openConfirmation('updateStatus', 'pending')} disabled={agreement.status === 'pending'}>
                        <XCircle className="mr-2 h-4 w-4" /> Set to Pending
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onSelect={() => openConfirmation('delete')}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
