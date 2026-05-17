
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Loader2, PlusCircle, Truck, Edit, Trash2, Send, CheckCircle, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PartnerOversightDialog } from './PartnerOversightDialog';
import { EngageDialog } from './EngageDialog';
import { formatDateSafe } from '@/lib/utils';

async function performAdminAction(token: string, action: string, payload: any) {
  const response = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || `API Error: ${action}`);
  return result;
}

const partnerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  type: z.enum(['partner', 'isa', 'investor', 'developer', 'supplier', 'transporter']),
});
type PartnerFormValues = z.infer<typeof partnerSchema>;

function TransporterFormDialog({ open, onOpenChange, partner, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; partner?: any; onSave: () => void; }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<PartnerFormValues>({ resolver: zodResolver(partnerSchema) });

  useEffect(() => {
    if (open) {
      if (partner) form.reset(partner);
      else form.reset({ firstName: '', lastName: '', email: '', phone: '', companyName: '', status: 'active', type: 'transporter' });
    }
  }, [open, partner, form]);

  async function onSubmit(values: PartnerFormValues) {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");
      await performAdminAction(token, 'savePartner', { partner: { id: partner?.id, ...values } });
      toast({ title: 'Transporter Saved' });
      onSave();
      onOpenChange(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{partner ? 'Edit' : 'Add'} Transporter</DialogTitle>
          <DialogDescription>Enter the transporter details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Partner Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="partner">Strategic Partner</SelectItem><SelectItem value="isa">ISA Agent</SelectItem><SelectItem value="investor">Investor</SelectItem><SelectItem value="developer">Developer</SelectItem><SelectItem value="supplier">Supplier</SelectItem><SelectItem value="transporter">Transporter</SelectItem></SelectContent></Select></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></FormItem>
              )} />
            </div>
            <DialogFooter className="pt-4 border-t">
              <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : null} Save Transporter</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function TransporterManagement() {
  const { toast } = useToast();
  const [partners, setPartners] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialog, setDialog] = useState<{ type: 'add' | 'edit' | 'delete' | 'engage' | 'oversight' | null, data?: any }>({ type: null });

  const forceRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      const [res, staffRes] = await Promise.all([
        performAdminAction(token, 'getPartnersByType', { type: 'transporter' }),
        performAdminAction(token, 'getPlatformStaff', {})
      ]);
      setPartners(res.data || []);
      setStaff(staffRes.data || []);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { forceRefresh(); }, [forceRefresh]);

  const staffMap = useMemo(() => new Map(staff.map(s => [s.id, `${s.firstName} ${s.lastName}`])), [staff]);

  async function handleDelete() {
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      await performAdminAction(token, 'deletePartner', { partnerId: dialog.data.id });
      toast({ title: 'Deleted' });
      forceRefresh();
      setDialog({ type: null });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  }

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'firstName', header: 'Name', cell: ({ row }) => <div>{row.original.firstName} {row.original.lastName}</div> },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'companyName', header: 'Company' },
    { 
        header: 'Assignee', 
        cell: ({row}) => (
            <div className="flex items-center gap-2">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium">{staffMap.get(row.original.assigneeId) || <span className="text-muted-foreground italic">Unallocated</span>}</span>
            </div>
        )
    },
    { 
      accessorKey: 'lastOpenedAt', 
      header: 'Last Opened', 
      cell: ({row}) => (
        <div className="flex items-center gap-1.5">
          {row.original.lastOpenedAt ? (
            <>
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs">{formatDateSafe(row.original.lastOpenedAt, "dd MMM, HH:mm")}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground italic">Not opened yet</span>
          )}
        </div>
      ) 
    },
    { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'engage', data: row.original })} title="Initiate Engagement">
          <Send className="h-4 w-4 text-primary" />
        </Button>
        <PartnerOversightDialog partner={row.original} onUpdate={forceRefresh} />
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'edit', data: row.original })}><Edit className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'delete', data: row.original })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <>
      <EngageDialog 
        open={dialog.type === 'engage'} 
        onOpenChange={(o) => !o && setDialog({ type: null })} 
        partner={dialog.data} 
        audience="transporters" 
      />
      <TransporterFormDialog open={dialog.type === 'add' || dialog.type === 'edit'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.type === 'edit' ? dialog.data : undefined} onSave={forceRefresh} />
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(o) => !o && setDialog({ type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Transporter?</AlertDialogTitle><AlertDialogDescription>Delete "{dialog.data?.firstName}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setDialog({ type: null })}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle><Truck /> Transporters</CardTitle></div>
          <Button onClick={() => setDialog({ type: 'add' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Transporter</Button>
        </CardHeader>
        <CardContent>{isLoading ? <Loader2 className="animate-spin mx-auto" /> : <DataTable columns={columns} data={partners} />}</CardContent>
      </Card>
    </>
  );
}
