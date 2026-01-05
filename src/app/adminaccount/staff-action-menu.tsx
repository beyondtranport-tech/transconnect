
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { MoreVertical, Eye, CheckCircle, XCircle, Trash2, Loader2 } from 'lucide-react';

interface StaffMember {
  id: string;
  status?: 'confirmed' | 'unconfirmed';
  [key: string]: any;
}

interface StaffActionMenuProps {
  staffMember: StaffMember;
  companyId: string;
  onUpdate: () => void;
}

export default function StaffActionMenu({ staffMember, companyId, onUpdate }: StaffActionMenuProps) {
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: 'confirmed' | 'unconfirmed') => {
    setIsProcessing(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error('Authentication failed.');

      const response = await fetch('/api/updateStaffStatus', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, staffId: staffMember.id, status: newStatus }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update status.');

      toast({ title: 'Status Updated', description: `Staff member has been ${newStatus}.` });
      onUpdate();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error('Authentication failed.');

      const response = await fetch('/api/deleteStaffMember', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, staffId: staffMember.id }),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete staff member.');

      toast({ title: 'Staff Member Deleted', description: 'The staff member has been removed.' });
      onUpdate();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    } finally {
      setIsProcessing(false);
      setIsAlertDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isProcessing}>
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem disabled>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleStatusChange('confirmed')}
            disabled={staffMember.status === 'confirmed'}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Confirm
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleStatusChange('unconfirmed')}
            disabled={staffMember.status !== 'confirmed'}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Unconfirm
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setIsAlertDialogOpen(true)}
            disabled={staffMember.status === 'confirmed'}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this staff member from your company.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive" disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
