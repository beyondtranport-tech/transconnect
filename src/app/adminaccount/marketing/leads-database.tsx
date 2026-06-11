
'use client';

import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getClientSideAuthToken } from '@/firebase';
import { Loader2, PlusCircle, Users, Edit, Trash2, Search, Send, Download, Upload, Save, RefreshCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { roles } from '@/lib/roles';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { downloadDataAsCSV, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

import { EnrichPartnerButton } from '@/app/adminaccount/marketing/EnrichPartnerButton';
import { PartnerTasksDialog } from '@/app/adminaccount/marketing/PartnerTasksDialog';
import { CommunicationLogDialog } from '@/app/adminaccount/marketing/CommunicationLogDialog';
import { EngageDialog } from '@/app/adminaccount/marketing/EngageDialog';
import { BulkImportDialog } from './BulkImportDialog';
import { PartnerOversightDialog } from './PartnerOversightDialog';

async function performAdminAction(token: string, action: string, payload?: any) {
  const response = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
    cache: 'no-store'
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || `API Error: ${action}`);
  return result;
}

const leadSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  role: z.string().min(1, 'Role is required'),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'invited', 'active']).default('new'),
  notes: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

function LeadDialog({ open, onOpenChange, lead, onSave, defaultValues }: { open: boolean; onOpenChange: (open: boolean) => void; lead?: any; onSave: () => void; defaultValues?: Partial<LeadFormValues> }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<LeadFormValues>({ resolver: zodResolver(leadSchema) });

  useEffect(() => {
    if (open) {
      if (lead) form.reset(lead);
      else form.reset({ ...defaultValues, companyName: defaultValues?.companyName || '', status: 'new', role: defaultValues?.role || '' });
    }
  }, [open, lead, form, defaultValues]);

  async function onSubmit(values: LeadFormValues) {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Auth failed");
      await performAdminAction(token, 'savePartner', { partner: { ...values, id: lead?.id, type: 'lead' } });
      toast({ title: 'Record Updated!' });
      onSave();
      onOpenChange(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl text-left">
        <DialogHeader><DialogTitle>{lead ? 'Edit' : 'Add New'} Lead</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Landline</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
             <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="mobile" render={({ field }) => (<FormItem><FormLabel>Mobile (Direct)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>)} />
            </div>
             <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem><FormLabel>Potential Role</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl><SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.title}>{r.title}</SelectItem>)}</SelectContent></Select></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="contacted">Researching</SelectItem><SelectItem value="qualified">Qualified</SelectItem></SelectContent></Select></FormItem>
              )} />
            </div>
            <DialogFooter className="pt-4 border-t"><Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} Save</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function LeadsDatabaseComponent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [editLead, setEditLead] = useState<any | null>(null);
  const [deleteLead, setDeleteLead] = useState<any | null>(null);
  const [engageLead, setEngageLead] = useState<any | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      const res = await performAdminAction(token, 'getLeads', {});
      setLeads(res.data || []);
    } catch (e: any) {
        // handled silently
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = async () => {
    if (!searchTerm || searchTerm.length < 3) {
        if (searchTerm.length === 0) fetchData();
        return;
    }
    setIsLoading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) return;
        const res = await performAdminAction(token, 'searchRegistry', { term: searchTerm, type: 'lead' });
        setLeads(res.data || []);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Search Error', description: e.message });
    } finally {
        setIsLoading(false);
    }
  };

  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'companyName', header: 'Company Name' },
    { accessorKey: 'contactPerson', header: 'Contact' },
    { accessorKey: 'phone', header: 'Landline' },
    { accessorKey: 'mobile', header: 'Mobile' },
    { accessorKey: 'email', header: 'Email' },
    {
      id: 'actions',
      header: <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right flex items-center justify-end gap-1">
          <EnrichPartnerButton partner={row.original} onUpdate={fetchData} />
          <Button variant="ghost" size="icon" onClick={() => setEngageLead(row.original)}><Send className="h-4 w-4 text-primary" /></Button>
          <CommunicationLogDialog partnerId={row.original.id} partnerName={row.original.companyName} />
          <PartnerTasksDialog partner={row.original} />
          <PartnerOversightDialog partner={row.original} onUpdate={fetchData} />
          <Button variant="ghost" size="icon" onClick={() => { setEditLead(row.original); }}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => { setDeleteLead(row.original); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      )
    },
  ], [fetchData]);

  return (
    <>
      <EngageDialog open={!!engageLead} onOpenChange={(o) => !o && setEngageLead(null)} partner={engageLead} audience="suppliers" onEngageSuccess={fetchData} />
      <LeadDialog open={isAddLeadOpen || !!editLead} onOpenChange={(o) => { if(!o) { setEditLead(null); setIsAddLeadOpen(false); } }} lead={editLead} onSave={fetchData} />
      
      <div className="space-y-6">
        <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
          <div><CardTitle><Users /> Lead Database</CardTitle><CardDescription>Consolidated registry of prospective members.</CardDescription></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => downloadDataAsCSV(leads, 'leads-backup.csv')}><Download className="mr-2 h-4 w-4" /> Backup</Button>
            <BulkImportDialog type="lead" onComplete={fetchData}><Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import</Button></BulkImportDialog>
            <Button onClick={() => setIsAddLeadOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Lead</Button>
          </div>
        </CardHeader>
        <Card>
            <CardContent className="pt-6">
                 <div className="flex gap-2 mb-6 max-w-sm">
                    <Input placeholder="Search within leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                    <Button onClick={handleSearch} disabled={isLoading}><Search className="h-4 w-4"/></Button>
                </div>
                {isLoading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div> : <DataTable columns={columns} data={leads} />}
            </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function LeadsDatabase() {
  return (
    <Suspense fallback={<Loader2 className="animate-spin h-10 w-10 text-primary mx-auto my-20"/>}>
      <LeadsDatabaseComponent />
    </Suspense>
  );
}
