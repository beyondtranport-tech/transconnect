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
import { EditStaffDialog } from './EditStaffDialog';

export default function StaffActionMenu({ staffMember, onUpdate }: { staffMember: any; onUpdate: () => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<'delete' | 'confirm' | 'unconfirm' | null>(null);
  const { toast } = useToast();

  const handleAction = async () => {
    if (!actionToConfirm || !staffMember) return;

    setIsProcessing(true);
    setIsAlertOpen(false);

    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error('Authentication failed.');

      let endpoint = '';
      let payload: any = { staffId: staffMember.id, companyId: staffMember.companyId };
      let successMessage = '';

      if (actionToConfirm === 'delete') {
        endpoint = '/api/deleteUserDoc';
        payload = { path: `members/${staffMember.companyId}/staff/${staffMember.id}` };
        successMessage = 'Staff member has been deleted.';
      } else {
        endpoint = '/api/updateStaffStatus';
        payload.status = actionToConfirm === 'confirm' ? 'confirmed' : 'unconfirmed';
        successMessage = `${staffMember.firstName}'s status updated to ${payload.status}.`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Action failed.');
      }

      toast({ title: 'Success', description: successMessage });
      onUpdate();

    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
    } finally {
      setIsProcessing(false);
      setActionToConfirm(null);
    }
  };

  const openConfirmation = (action: 'delete' | 'confirm' | 'unconfirm') => {
    setActionToConfirm(action);
    setIsAlertOpen(true);
  };

  const getAlertStrings = () => {
    switch (actionToConfirm) {
      case 'delete': return { title: "Delete Staff Member?", description: "This will permanently delete this staff member's record. This action cannot be undone." };
      case 'confirm': return { title: "Confirm Staff Member?", description: "This will set the staff member's status to 'confirmed'." };
      case 'unconfirm': return { title: "Un-confirm Staff Member?", description: "This will set the staff member's status to 'unconfirmed'." };
      default: return { title: "Are you sure?", description: "This action cannot be undone." };
    }
  };

  return (
    <>
      <EditStaffDialog
        isOpen={isEditOpen}
        setIsOpen={setIsEditOpen}
        staffMember={staffMember}
        onUpdate={onUpdate}
      />
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => openConfirmation('confirm')} disabled={staffMember.status === 'confirmed'}>
              <CheckCircle className="mr-2 h-4 w-4" /> Confirm
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openConfirmation('unconfirm')} disabled={staffMember.status !== 'confirmed'}>
              <XCircle className="mr-2 h-4 w-4" /> Un-confirm
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
            <AlertDialogAction onClick={handleAction} variant={actionToConfirm === 'delete' ? 'destructive' : 'default'}>
              Yes, proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
