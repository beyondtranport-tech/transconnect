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
import { Loader2, MoreVertical, CheckCircle, XCircle, Trash2, Edit, Eye, Wallet, Send, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';


async function performAdminAction(token: string, action: string, payload: any) {
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

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  
  const { toast } = useToast();

  const handleAction = async () => {
    if (!actionToConfirm) return;

    setIsProcessing(true);
    setIsAlertOpen(false);

    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        
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

  const handleInvite = async () => {
    if (!member.email) {
        toast({ variant: 'destructive', title: 'Action Failed', description: 'Member does not have an email address.' });
        return;
    }
    setIsInviting(true);
    setInviteLink('');
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");

        const result = await performAdminAction(token, 'sendMemberPasswordReset', { email: member.email });
        
        setInviteLink(result.inviteLink);
        toast({ title: 'Password Reset Link Generated' });
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Invite Failed', description: e.message });
        setIsInviteOpen(false); // Close dialog on failure
    } finally {
        setIsInviting(false);
    }
  };

  const copyInviteLink = () => {
      if (!inviteLink) return;
      navigator.clipboard.writeText(inviteLink);
      toast({ title: 'Link Copied!' });
  };
  
  const onInviteOpenChange = (open: boolean) => {
    if (!open) {
        setInviteLink(''); // Reset when closing
    }
    setIsInviteOpen(open);
  };

  const triggerInviteFlow = () => {
    setIsInviteOpen(true);
    handleInvite();
  }


  return (
    <>
      <Dialog open={isInviteOpen} onOpenChange={onInviteOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Send Password Reset Link</DialogTitle>
                <DialogDescription>
                    {isInviting 
                        ? "Generating a secure password reset link..." 
                        : "Share this one-time use link with the member to allow them to reset their password and access their account."
                    }
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                {isInviting ? (
                    <div className="flex justify-center items-center h-10">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : inviteLink ? (
                    <div className="flex items-center space-x-2">
                        <Input value={inviteLink} readOnly />
                        <Button onClick={copyInviteLink}>
                            <Copy className="mr-2 h-4 w-4" /> Copy
                        </Button>
                    </div>
                ) : (
                     <p className="text-destructive text-sm">Failed to generate link. Please try again.</p>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onInviteOpenChange(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end items-center gap-1">
          <Button asChild variant="ghost" size="icon">
              <Link href={`/backend?view=wallet&memberId=${member.id}`} title="View & Manage Member">
                  <Eye className="h-4 w-4" />
              </Link>
          </Button>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={triggerInviteFlow}>
                <Send className="mr-2 h-4 w-4" /> Invite / Reset Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
    </>
  );
}
