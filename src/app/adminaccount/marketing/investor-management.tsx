'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Loader2, PlusCircle, DollarSign, Edit, Trash2, Send, Filter, Save, Search, RefreshCcw } from 'lucide-react';
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
import { CommunicationLogDialog } from './CommunicationLogDialog';
import { PartnerTasksDialog } from './PartnerTasksDialog';
import { formatDateSafe, cn, downloadDataAsCSV } from '@/lib/utils';
import { EnrichPartnerButton } from './EnrichPartnerButton';

async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, payload }),
        cache: 'no-store'
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `API Error: ${action}`);
    }

    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}

const partnerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  companyName: z.string().optional(),
  status: z.enum(['active', 'inactive', 'contacted', 'new', 'qualified', 'invited']),
  type: z.literal('investor'),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

function InvestorDialog({ open, onOpenChange, partner, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; partner?: any; onSave: () => void; }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: { type: 'investor', status: 'new' }
  });

  useEffect(() => {
    if (open) {
      if (partner) form.reset(partner);
      else form.reset({ firstName: '', lastName: '', email: '', phone: '', mobile: '', companyName: '', status: 'new', type: 'investor' });
    }
  }, [open, partner, form]);

  async function onSubmit(values: PartnerFormValues) {
    setIsLoading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        await performAdminAction(token, 'savePartner', { partner: { id: partner?.id, ...values, type: 'investor' } });
        toast({ title: partner ? 'Investor Updated' : 'Investor Added' });
        onSave();
        onOpenChange(false);
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
    } finally {
        setIsLoading(false);
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg text-left">
            <DialogHeader>
                <DialogTitle>{partner ? 'Edit' : 'Add'} App Launch Investor</DialogTitle>
                <DialogDescription>Enter details for VCs, Angels, or Seed Funds.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                     <div className="grid grid-cols-2 gap-4 text-left">
                        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email"/></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Work Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <FormField control={form.control} name="mobile" render={({ field }) => ( <FormItem><FormLabel>Mobile (Direct)</FormLabel><FormControl><Input placeholder="+27 82..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>Fund/Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                    <FormField control={form.control} name="status" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Pipeline Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="invited">Invited</SelectItem>
                        <SelectItem value="active">Active Partner</SelectItem>
                    </SelectContent></Select><FormMessage /></FormItem> )} />
                     <DialogFooter className="pt-4 border-t">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />} Save Investor
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}

export default function InvestorManagement() {
  const { toast } = useToast();
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialog, setDialog] = useState<{ type: 'add' | 'edit' | 'delete' | 'engage' | null, data?: any }>({ type: null });

  const forceRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) return;
        const result = await performAdminAction(token, 'getPartnersByType', { type: 'investor' });
        setPartners(result.data || []);
    } catch (e: any) {
        console.error("Failed to load investors", e);
    } finally {
        setIsLoading(false);
    }
  }, []);
  
  useEffect(() => { forceRefresh(); }, [forceRefresh]);

  async function handleDelete() {
    if (!dialog.data) return;
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        await performAdminAction(token, 'deletePartner', { partnerId: dialog.data.id });
        toast({ title: 'Investor Deleted' });
        forceRefresh();
        setDialog({ type: null });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    }
  }

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'firstName', header: 'Name', cell: ({row}) => <div>{row.original.firstName} {row.original.lastName}</div> },
    { accessorKey: 'companyName', header: 'Fund' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'mobile', header: 'Mobile' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'status', header: 'Status', cell: ({row}) => <Badge className="capitalize">{row.original.status}</Badge>},
    { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
      <div className="flex justify-end items-center gap-1">
        <EnrichPartnerButton partner={row.original} onUpdate={forceRefresh} />
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'engage', data: row.original })} title="Engage"><Send className="h-4 w-4 text-primary" /></Button>
        <CommunicationLogDialog partnerId={row.original.id} partnerName={row.original.firstName} />
        <PartnerTasksDialog partner={row.original} />
        <PartnerOversightDialog partner={row.original} onUpdate={forceRefresh} />
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'edit', data: row.original })}><Edit className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'delete', data: row.original })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    ) },
  ];

  return (
    <>
      <EngageDialog open={dialog.type === 'engage'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.data} audience="investors" onEngageSuccess={forceRefresh} />
      <InvestorDialog open={dialog.type === 'add' || dialog.type === 'edit'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.type === 'edit' ? dialog.data : undefined} onSave={forceRefresh} />
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(o) => !o && setDialog({ type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Delete investor "{dialog.data?.firstName}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialog({ type: null })}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="space-y-6 text-left">
        <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div><CardTitle><DollarSign /> App Launch Investors</CardTitle></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => downloadDataAsCSV(partners, 'investors.csv')} disabled={isLoading}><RefreshCcw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")}/>Refresh</Button>
            <Button onClick={() => setDialog({ type: 'add' })}><PlusCircle className="mr-2 h-4 w-4"/>Add Investor</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <DataTable columns={columns} data={partners} />
          )}
        </CardContent>
      </div>
    </>
  );
}
