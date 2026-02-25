
'use client';

import { useState } from 'react';
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
import { Loader2, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import Link from 'next/link';

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

export function ClientActionMenu({ client, onEdit, onUpdate }: { client: any; onEdit: () => void; onUpdate: () => void; }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        await performAdminAction(token, 'deleteLendingPartner', { partnerId: client.id, collection: 'lendingClients' });
        toast({ title: 'Client Deleted' });
        onUpdate();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    } finally {
        setIsDeleting(false);
        setIsAlertOpen(false);
    }
  };

  return (
    <div className="flex justify-end items-center gap-1">
        <Button asChild variant="ghost" size="icon" title="View Details">
            <Link href={`/lending/client/${client.id}`}><Eye className="h-4 w-4" /></Link>
        </Button>
        <Button variant="ghost" size="icon" onClick={onEdit} title="Edit Client">
            <Edit className="h-4 w-4" />
        </Button>
         <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <Button variant="ghost" size="icon" onClick={() => setIsAlertOpen(true)} disabled={isDeleting} title="Delete Client">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 text-destructive" />}
            </Button>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This action will permanently delete the client "{client.name}" and all associated data (agreements, assets, etc.). This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} variant="destructive">Yes, delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

