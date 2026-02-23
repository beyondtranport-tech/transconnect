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
import { Loader2, MoreVertical, CheckCircle, XCircle, FileSignature } from 'lucide-react';
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
    const [actionToConfirm, setActionToConfirm] = useState<'activate' | 'complete' | 'default' | null>(null);
    const { toast } = useToast();

    const handleAction = async () => {
        if (!actionToConfirm) return;

        setIsProcessing(true);
        setActionToConfirm(null); // Close the dialog immediately

        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            await performAdminAction(token, 'updateAgreementStatus', {
                clientId: agreement.clientId,
                agreementId: agreement.id,
                status: actionToConfirm,
            });

            toast({ title: 'Success', description: `Agreement status set to ${actionToConfirm}.` });
            onUpdate();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const getAlertStrings = () => {
        switch (actionToConfirm) {
            case 'activate': return { title: "Activate Agreement?", description: "This will change the agreement status to 'active'. This action can be reversed." };
            case 'complete': return { title: "Complete Agreement?", description: "This will mark the agreement as 'completed'. This action cannot be undone." };
            case 'default': return { title: "Default Agreement?", description: "This will mark the agreement as 'defaulted'. This action cannot be undone." };
            default: return { title: "", description: "" };
        }
    };

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
                    <DropdownMenuItem onSelect={() => setActionToConfirm('activate')} disabled={agreement.status !== 'pending'}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Activate
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setActionToConfirm('complete')} disabled={agreement.status !== 'active'}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onSelect={() => setActionToConfirm('default')} disabled={agreement.status !== 'active'}>
                        <XCircle className="mr-2 h-4 w-4" /> Mark as Defaulted
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
                    <AlertDialogAction onClick={handleAction} variant={actionToConfirm === 'default' ? 'destructive' : 'default'}>
                        Confirm
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
