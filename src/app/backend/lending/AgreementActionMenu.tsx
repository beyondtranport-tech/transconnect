
'use client';

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, MoreVertical, CheckCircle, XCircle, FileSignature, RotateCcw, Trash2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';

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

export function AgreementActionMenu({ agreement, onEdit, onUpdate }: { agreement: any; onEdit: () => void; onUpdate: () => void; }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState<'sendToPayout' | 'logPayment' | 'complete' | 'default' | 'revertToCredit' | 'delete' | null>(null);
    const { toast } = useToast();

    const handleAction = async () => {
        if (!actionToConfirm) return;

        setIsProcessing(true);
        setActionToConfirm(null); // Close the dialog immediately

        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            let apiAction = '';
            let payload: any;
            let successMessage = '';

            if (actionToConfirm === 'delete') {
                apiAction = 'deleteLendingAgreement';
                payload = { clientId: agreement.clientId, agreementId: agreement.id };
                successMessage = 'Agreement has been deleted.';
            } else {
                apiAction = 'updateAgreementStatus';
                const statusMap = {
                    sendToPayout: 'payout',
                    logPayment: 'active',
                    complete: 'completed',
                    default: 'defaulted',
                    revertToCredit: 'credit',
                };
                const newStatus = statusMap[actionToConfirm as keyof typeof statusMap];
                 if (!newStatus) {
                    throw new Error('Invalid action specified.');
                 }
                payload = { clientId: agreement.clientId, agreementId: agreement.id, status: newStatus };
                successMessage = `Agreement status set to ${newStatus}.`;
            }

            await performAdminAction(token, apiAction, payload);

            toast({ title: 'Success', description: successMessage });
            onUpdate();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const getAlertStrings = () => {
        switch (actionToConfirm) {
            case 'sendToPayout': return { title: "Send to Payouts?", description: "This will move the agreement to the 'payout' stage, ready for payment processing." };
            case 'logPayment': return { title: "Log Payment & Activate?", description: "This will mark the agreement as paid and change its status to 'active'." };
            case 'complete': return { title: "Complete Agreement?", description: "This will mark the agreement as 'completed'." };
            case 'default': return { title: "Default Agreement?", description: "This will mark the agreement as 'defaulted'." };
            case 'revertToCredit': return { title: "Revert to Credit Review?", description: "This will move the agreement back to the 'credit' stage." };
            case 'delete': return { title: "Delete Agreement?", description: "This will permanently delete this agreement. This action cannot be undone." };
            default: return { title: "", description: "" };
        }
    };
    
    // Robust checks for enabling/disabling actions
    const status = agreement.status?.toLowerCase() || '';
    const canBeDeleted = status === 'pending' || status === 'credit';
    const canBeSentToPayout = status === 'credit';
    const canBeActivated = status === 'payout';
    const canBeReverted = status === 'payout';
    const canBeCompleted = status === 'active';
    const canBeDefaulted = status === 'active';

    return (
        <AlertDialog open={!!actionToConfirm} onOpenChange={(open) => !open && setActionToConfirm(null)}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={onEdit}>
                        <FileSignature className="mr-2 h-4 w-4" /> Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setActionToConfirm('sendToPayout')} disabled={!canBeSentToPayout}>
                        <Send className="mr-2 h-4 w-4" /> Send to Payouts
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setActionToConfirm('logPayment')} disabled={!canBeActivated}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Log Payment & Activate
                    </DropdownMenuItem>
                     <DropdownMenuItem onSelect={() => setActionToConfirm('revertToCredit')} disabled={!canBeReverted}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Revert to Credit Review
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setActionToConfirm('complete')} disabled={!canBeCompleted}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onSelect={() => setActionToConfirm('default')} disabled={!canBeDefaulted}>
                        <XCircle className="mr-2 h-4 w-4" /> Mark as Defaulted
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem className="text-destructive" onSelect={() => setActionToConfirm('delete')} disabled={!canBeDeleted}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Agreement
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{getAlertStrings().title}</AlertDialogTitle>
                    <AlertDialogDescription>{getAlertStrings().description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAction} variant={actionToConfirm === 'delete' || actionToConfirm === 'default' ? 'destructive' : 'default'}>
                        Confirm
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
