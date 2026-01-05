
'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Loader2, MoreVertical, CheckCircle, XCircle, Trash2, Edit, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

const staffFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  title: z.string().min(1, 'Title is required'),
  role: z.string().min(1, 'Role is required'),
  function: z.string().min(1, 'Function is required'),
  jobDescription: z.string().optional(),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

function EditStaffDialog({ staffMember: initialStaffMember, onUpdate }: { staffMember: any, onUpdate: (updatedData: Partial<StaffFormValues>) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: initialStaffMember,
  });
  
  React.useEffect(() => {
    if (isOpen) {
      form.reset(initialStaffMember);
    }
  }, [isOpen, initialStaffMember, form]);

  const onSubmit = async (values: StaffFormValues) => {
    setIsSaving(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error('Authentication failed.');

      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStaffMember',
          payload: {
            companyId: initialStaffMember.companyId,
            staffId: initialStaffMember.id,
            data: values
          }
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update staff member.');

      toast({ title: 'Staff Member Updated' });
      onUpdate(values);
      setIsOpen(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Edit className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription>
            Update the details for {initialStaffMember.firstName} {initialStaffMember.lastName}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Executive Director">Executive Director</SelectItem><SelectItem value="Non-Executive Director">Non-Executive Director</SelectItem><SelectItem value="Manager">Manager</SelectItem><SelectItem value="Admin">Admin</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
               <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="operations">Operations</SelectItem><SelectItem value="marketing">Marketing</SelectItem><SelectItem value="IT">IT</SelectItem><SelectItem value="logistics">Logistics</SelectItem><SelectItem value="store">Store</SelectItem><SelectItem value="sales">Sales</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
               <FormField control={form.control} name="function" render={({ field }) => (<FormItem><FormLabel>Function</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Set Policy">Set Policy</SelectItem><SelectItem value="Manage Staff">Manage Staff</SelectItem><SelectItem value="Set Budgets">Set Budgets</SelectItem><SelectItem value="Ensure Implementation">Ensure Implementation</SelectItem><SelectItem value="Monitor Deliverables">Monitor Deliverables</SelectItem><SelectItem value="Ensure Compliance">Ensure Compliance</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="jobDescription" render={({ field }) => (<FormItem><FormLabel>Job Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffActionMenu({ staffMember: initialStaffMember }: { staffMember: any; }) {
  const [staffMember, setStaffMember] = useState(initialStaffMember);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { toast } = useToast();

  const handleDialogUpdate = (updatedData: Partial<StaffFormValues>) => {
      setStaffMember((prev: any) => ({ ...prev, ...updatedData }));
  };

  const updateStaffMember = async (payload: object, successMessage: string) => {
    setIsUpdating(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error('Authentication failed.');

      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStaffMember',
          payload: { companyId: staffMember.companyId, staffId: staffMember.id, data: payload }
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update staff member.');
      
      toast({ title: 'Success', description: `${staffMember.firstName}'s ${successMessage}.` });
      setStaffMember((prev: any) => ({ ...prev, ...payload }));
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
    } finally {
      setIsUpdating(false);
    }
  };


  const handleDelete = async () => {
    setIsDeleting(true);
    setIsAlertOpen(false);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error('Authentication failed.');

      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            action: 'deleteStaffMember', 
            payload: { companyId: staffMember.companyId, staffId: staffMember.id }
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete staff member.');

      toast({ title: 'Staff Member Deleted' });
      // To visually remove it, we can't easily re-fetch, so we can hide it.
      setStaffMember(null); 
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: e.message });
      setIsDeleting(false);
    }
  };

  const isLoading = isDeleting || isUpdating;

  if (!staffMember) {
      return null;
  }

  return (
    <div className="text-right">
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
             <DropdownMenuItem asChild>
                <Link href={`/backend?view=wallet&memberId=${staffMember.companyId}`}>
                    <Eye className="mr-2 h-4 w-4" /> View Company
                </Link>
             </DropdownMenuItem>
             <EditStaffDialog staffMember={staffMember} onUpdate={handleDialogUpdate} />
            {staffMember.status !== 'confirmed' ? (
              <DropdownMenuItem onClick={() => updateStaffMember({ status: 'confirmed' }, 'status is now confirmed')}>
                <CheckCircle className="mr-2 h-4 w-4" /> Confirm
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => updateStaffMember({ status: 'unconfirmed' }, 'status is now unconfirmed')}>
                <XCircle className="mr-2 h-4 w-4" /> Un-confirm
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onSelect={(e) => { e.preventDefault(); setIsAlertOpen(true); }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this staff member's record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive">
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
