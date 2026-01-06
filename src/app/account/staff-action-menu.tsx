'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { Loader2, MoreVertical, CheckCircle, XCircle, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';

export default function StaffActionMenu({ staffMember, onUpdate, onEdit }: { staffMember: any; onUpdate: () => void, onEdit: () => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<'delete' | null>(null);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!staffMember) return;

    setIsProcessing(true);
    setIsAlertOpen(false);

    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error('Authentication failed.');

      const response = await fetch('/api/deleteUserDoc', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `members/${staffMember.companyId}/staff/${staffMember.id}` }),
      });

      const result = await response.json();
      if (!response.ok || (result.success !== undefined && !result.success)) {
        throw new Error(result.error || 'Action failed.');
      }

      toast({ title: 'Success', description: 'Staff member has been deleted.' });
      onUpdate();

    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
    } finally {
      setIsProcessing(false);
      setActionToConfirm(null);
    }
  };

  const openConfirmation = (action: 'delete') => {
    setActionToConfirm(action);
    setIsAlertOpen(true);
  };

  const getAlertStrings = () => {
    switch (actionToConfirm) {
      case 'delete': return { title: "Delete Staff Member?", description: "This will permanently delete this staff member's record. This action cannot be undone." };
      default: return { title: "Are you sure?", description: "This action cannot be undone." };
    }
  };

  return (
    <>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onSelect={() => openConfirmation('delete')}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
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
            <AlertDialogAction onClick={handleDelete} variant={actionToConfirm === 'delete' ? 'destructive' : 'default'}>
              Yes, proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
