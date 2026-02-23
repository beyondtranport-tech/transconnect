
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
import { Loader2, MoreVertical, FileSignature, XCircle, CheckCircle } from 'lucide-react';
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

export function AssetActionMenu({ asset, onEdit, onUpdate }: { asset: any; onEdit: () => void; onUpdate: () => void; }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState<'financed' | 'sold' | 'decommissioned' | null>(null);
    const { toast } = useToast();

    const handleAction = async () => {
        if (!actionToConfirm) return;

        setIsProcessing(true);
        setActionToConfirm(null);

        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            await performAdminAction(token, 'updateAssetStatus', {
                clientId: asset.clientId,
                assetId: asset.id,
                status: actionToConfirm,
            });

            toast({ title: 'Success', description: `Asset status set to ${actionToConfirm}.` });
            onUpdate();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const getAlertStrings = () => {
        switch (actionToConfirm) {
            case 'financed': return { title: "Mark as Financed?", description: "This will change the asset status to 'financed'." };
            case 'sold': return { title: "Mark as Sold?", description: "This will change the asset status to 'sold'." };
            case 'decommissioned': return { title: "Decommission Asset?", description: "This will change the asset status to 'decommissioned'." };
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
                    <DropdownMenuItem onSelect={() => setActionToConfirm('financed')} disabled={asset.status === 'financed'}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Mark as Financed
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setActionToConfirm('sold')}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Mark as Sold
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onSelect={() => setActionToConfirm('decommissioned')}>
                        <XCircle className="mr-2 h-4 w-4" /> Decommission
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
                    <AlertDialogAction onClick={handleAction}>Confirm</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

