
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

export function AgreementActionMenu({ agreement, onUpdate }: { agreement: any; onUpdate: () => void; }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState<'delete' | 'updateStatus' | null>(null);
    const [newStatus, setNewStatus] = useState('');
    const { toast } = useToast();

    const handleAction = async () => {
        if (!actionToConfirm) return;

        setIsProcessing(true);
        setIsAlertOpen(false);

        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            let apiAction, payload, successMessage;

            if (actionToConfirm === 'delete') {
                apiAction = 'deleteLendingAgreement';
                payload = { clientId: agreement.clientId, agreementId: agreement.id };
                successMessage = 'Agreement deleted successfully.';
            } else { // updateStatus
                apiAction = 'updateAgreementStatus';
                payload = { clientId: agreement.clientId, agreementId: agreement.id, status: newStatus };
                successMessage = `Agreement status updated to ${newStatus}.`;
            }

            await performAdminAction(token, apiAction, payload);
            toast({ title: 'Success', description: successMessage });
            onUpdate();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
        } finally {
            setIsProcessing(false);
            setActionToConfirm(null);
        }
    };

    const openConfirmation = (action: 'delete' | 'updateStatus', status?: string) => {
        setActionToConfirm(action);
        if (status) setNewStatus(status);
        setIsAlertOpen(true);
    };

    const getAlertStrings = () => {
        if (actionToConfirm === 'delete') {
            return { title: "Delete Agreement?", description: "This will permanently delete this lending agreement. This cannot be undone." };
        }
        if (actionToConfirm === 'updateStatus') {
            return { title: `Set Status to "${newStatus}"?`, description: `This will change the agreement status. This may also affect linked asset statuses.` };
        }
        return { title: "Are you sure?", description: "" };
    }

    return (
        <>
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{getAlertStrings().title}</AlertDialogTitle>
                        <AlertDialogDescription>{getAlertStrings().description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setActionToConfirm(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleAction} className={buttonVariants({ variant: actionToConfirm === 'delete' ? 'destructive' : 'default' })}>Yes, proceed</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                    </Button>
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
