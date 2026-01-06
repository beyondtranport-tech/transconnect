
'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Loader2, MoreVertical, CheckCircle, XCircle, Trash2, Edit, Eye, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import Link from 'next/link';

async function performAdminAction(action: string, payload: any) {
    const token = await getClientSideAuthToken();
    if (!token) throw new Error("Authentication failed.");
    
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}


export default function MemberActionMenu({ member, onUpdate }: { member: any; onUpdate: () => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<'delete' | 'confirm' | 'unconfirm' | null>(null);
  const { toast } = useToast();

  const handleAction = async () => {
    if (!actionToConfirm) return;

    setIsProcessing(true);
    setIsAlertOpen(false);

    try {
        let apiAction = '';
        let payload: any = { companyId: member.id };
        let successMessage = '';

        if (actionToConfirm === 'delete') {
            apiAction = 'deleteMember';
            successMessage = 'Member has been deleted.';
        } else {
            apiAction = 'updateMemberStatus';
            payload.status = actionToConfirm === 'confirm' ? 'active' : 'suspended';
            successMessage = `Member status updated to ${payload.status}.`;
        }
        
        await performAdminAction(apiAction, payload);
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
  }

  const getAlertStrings = () => {
      switch(actionToConfirm) {
          case 'delete': return { title: "Delete Member?", description: "This will permanently delete the member and all associated data. This action cannot be undone." };
          case 'confirm': return { title: "Confirm Member?", description: "This will activate the member's account, setting their status to 'active'." };
          case 'unconfirm': return { title: "Suspend Member?", description: "This will suspend the member's account, setting their status to 'suspended'." };
          default: return { title: "Are you sure?", description: "This action cannot be undone." };
      }
  }


  return (
    <div className="flex justify-end items-center gap-1">
        <Button asChild variant="ghost" size="icon">
            <Link href={`/backend?view=wallet&memberId=${member.id}`}><Wallet className="h-4 w-4" /></Link>
        </Button>
         <Button asChild variant="ghost" size="icon">
            <Link href={`/account?view=profile`}><Edit className="h-4 w-4" /></Link>
        </Button>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
             <DropdownMenuItem onSelect={() => openConfirmation('confirm')}>
                <CheckCircle className="mr-2 h-4 w-4" /> Confirm
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openConfirmation('unconfirm')}>
                <XCircle className="mr-2 h-4 w-4" /> Suspend
              </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onSelect={() => openConfirmation('delete')}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getAlertStrings().title}</AlertDialogTitle>
            <AlertDialogDescription>
              {getAlertStrings().description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} variant={actionToConfirm === 'delete' ? 'destructive' : 'default'}>
              Yes, proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
