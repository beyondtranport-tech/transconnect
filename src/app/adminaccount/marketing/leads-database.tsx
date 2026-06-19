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
import { Loader2, PlusCircle, Users, Edit, Trash2, Search, Send, Download, Upload, Save, RefreshCcw, Filter, RotateCcw, Tag, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { roles } from '@/lib/roles';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { downloadDataAsCSV } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { EnrichPartnerButton } from '@/app/adminaccount/marketing/EnrichPartnerButton';
import { PartnerTasksDialog } from '@/app/adminaccount/marketing/PartnerTasksDialog';
import { CommunicationLogDialog } from '@/app/adminaccount/marketing/CommunicationLogDialog';
import { EngageDialog } from './EngageDialog';
import { BulkImportDialog } from './BulkImportDialog';
import { PartnerOversightDialog } from './PartnerOversightDialog';
import { Label } from '@/components/ui/label';

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
  firstName: z.string().optional(),
  lastName: z.string().optional(),
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

  async function handleFormSubmit(values: LeadFormValues) {
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
      <DialogContent className="sm:max-w-xl text-left text-foreground">
        <DialogHeader><DialogTitle>{lead ? 'Edit' : 'Add New'} Lead</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2 text-left text-foreground">
            <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4 text-left">
              <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="contactPerson" render={({ field }) => (<FormItem className="text-left"><FormLabel>Alternative Contact Name</FormLabel><FormControl><Input placeholder="Full Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4 text-left text-foreground">
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Landline</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="mobile" render={({ field }) => (<FormItem><FormLabel>Mobile (Direct)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="email" render={({ field }) => (<FormItem className="text-left text-foreground"><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="website" render={({ field }) => (<FormItem className="text-left text-foreground"><FormLabel>Website</FormLabel><FormControl><Input {...field} type="url" placeholder="https://..." /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="text-left text-foreground"><FormLabel>Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="notes" render={({ field }) => (<FormItem className="text-left text-foreground"><FormLabel>Mined Service wording</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
             <div className="grid grid-cols-2 gap-4 text-left text-foreground">
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem className="text-left"><FormLabel>Potential Role</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                    <SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.title}>{r.title}</SelectItem>)}</SelectContent>
                </Select></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem className="text-left"><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="contacted">Researching</SelectItem><SelectItem value="qualified">Qualified</SelectItem></SelectContent>
                </Select></FormItem>
              )} />
            </div>
            <DialogFooter className="pt-4 border-t text-left text-foreground"><Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} Save Record
            </Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function LeadsDatabaseComponent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [dataFilter, setDataFilter] = useState('all');
  
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [editLead, setEditLead] = useState<any | null>(null);
  const [deleteLead, setDeleteLead] = useState<any | null>(null);
  const [engageLead, setEngageLead] = useState<any | null>(null);

  const forceRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      const res = await performAdminAction(token, 'getLeads', { limit: 10000 });
      setAllRecords(res.data || []);
      setHasLoaded(true);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Fetch Error', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleInitialSearch = async () => {
    if (!searchTerm || searchTerm.length < 3) {
        if (searchTerm.length === 0) forceRefresh();
        else toast({ title: "Min 3 characters required" });
        return;
    }
    forceRefresh();
  };

  const newLeadDefaults = useMemo(() => {
    const companyName = searchParams.get('newCompanyName');
    if (companyName) {
      return { 
        companyName, 
        role: searchParams.get('newRole') || '', 
        address: searchParams.get('newAddress') || '', 
        website: searchParams.get('newWebsite') || '',
        phone: searchParams.get('newPhone') || '',
        email: searchParams.get('newEmail') || '',
        contactPerson: searchParams.get('newContactPerson') || '',
      };
    }
    return undefined;
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('action') === 'add-member' || newLeadDefaults) {
      setIsAddLeadOpen(true);
      const newPath = `${window.location.pathname}?view=leads-database`;
      router.replace(newPath, { scroll: false });
    }
  }, [searchParams, newLeadDefaults, router]);

  const filteredLeads = useMemo(() => {
    return allRecords.filter(r => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || 
            (r.companyName?.toLowerCase().includes(term)) ||
            (r.contactPerson?.toLowerCase().includes(term)) ||
            (r.firstName?.toLowerCase().includes(term)) ||
            (r.lastName?.toLowerCase().includes(term)) ||
            (r.email?.toLowerCase().includes(term)) ||
            (r.phone?.toLowerCase().includes(term));
            
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        
        let matchesData = true;
        if (dataFilter === 'no-email') matchesData = !p.email;
        else if (dataFilter === 'has-email') matchesData = !!p.email;

        return matchesSearch && matchesStatus && matchesData;
    });
  }, [allRecords, searchTerm, statusFilter, dataFilter]);

  const handleDelete = async () => {
    if (!deleteLead) return;
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Auth failed");
      await performAdminAction(token, 'deleteLeads', { leadIds: [deleteLead.id] });
      toast({ title: 'Lead Deleted' });
      forceRefresh();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    } finally {
      setDeleteLead(null);
    }
  };

  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'companyName', header: 'Company Name' },
    { 
        header: 'Human Contact', 
        cell: ({ row }) => (
            <div className="flex flex-col text-sm text-left text-foreground">
                <span className="font-bold text-left">{row.original.contactPerson || `${row.original.firstName || ''} ${row.original.lastName || ''}`.trim() || 'N/A'}</span>
                <span className="text-xs text-muted-foreground text-left">{row.original.email}</span>
            </div>
        )
    },
    { accessorKey: 'phone', header: 'Landline' },
    { accessorKey: 'mobile', header: 'Mobile' },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <Badge variant="outline" className="capitalize text-[10px]">{row.original.status}</Badge>
    },
    {
      id: 'actions',
      header: <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right flex items-center justify-end gap-1">
          <EnrichPartnerButton partner={row.original} onUpdate={forceRefresh} />
          <Button variant="ghost" size="icon" onClick={() => setEngageLead(row.original)} title="Engage"><Send className="h-4 w-4 text-primary" /></Button>
          <CommunicationLogDialog partnerId={row.original.id} partnerName={row.original.companyName} />
          <PartnerTasksDialog partner={row.original} />
          <PartnerOversightDialog partner={row.original} onUpdate={forceRefresh} />
          <Button variant="ghost" size="icon" onClick={() => { setEditLead(row.original); }}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => { setDeleteLead(row.original); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      )
    },
  ], [forceRefresh]);

  return (
    <>
      <EngageDialog open={!!engageLead} onOpenChange={(o) => !o && setEngageLead(null)} partner={engageLead} audience="suppliers" onEngageSuccess={forceRefresh} />
      <LeadDialog open={isAddLeadOpen || !!editLead} onOpenChange={(o) => { if(!o) { setEditLead(null); setIsAddLeadOpen(false); } }} lead={editLead} onSave={forceRefresh} defaultValues={newLeadDefaults} />
      
      <div className="space-y-6 text-left text-foreground">
        {!hasLoaded ? (
            <Card className="bg-primary/5 border-primary/20 p-12 text-center text-foreground">
                <Database className="mx-auto h-16 w-16 text-primary/20 mb-4" />
                <h2 className="text-2xl font-black font-headline mb-2 text-foreground text-center">Registry Search Variables</h2>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8 text-center">Enter your search criteria to load the master registry. This targets your session to preserve your daily data quota.</p>
                <div className="flex flex-col md:flex-row justify-center gap-4 max-w-2xl mx-auto text-left">
                    <Input placeholder="Type company name, ID or email to search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleInitialSearch()} className="h-12 text-lg bg-white" />
                    <Button size="lg" onClick={handleInitialSearch} disabled={isLoading} className="h-12 px-8">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
                        Load Master Registry
                    </Button>
                </div>
            </Card>
        ) : (
            <div className="space-y-6 text-left text-foreground">
                <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div className="text-left text-foreground text-foreground"><CardTitle className="flex items-center gap-2 text-left"><Users /> Lead Database</CardTitle><CardDescription className="text-left text-foreground">Unified registry view of prospective members ({allRecords.length} records).</CardDescription></div>
                <div className="flex gap-2 text-left text-foreground text-foreground">
                    <Button variant="outline" onClick={() => downloadDataAsCSV(allRecords, 'leads-backup.csv')} disabled={isLoading} className="text-foreground"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
                    <BulkImportDialog type="lead" onComplete={forceRefresh}><Button variant="outline" className="text-foreground"><Upload className="mr-2 h-4 w-4" /> Import</Button></BulkImportDialog>
                    <Button onClick={() => setIsAddLeadOpen(true)} className="text-foreground"><PlusCircle className="mr-2 h-4 w-4" />Add Lead</Button>
                </div>
                </CardHeader>
                <Card className="text-left">
                    <CardContent className="pt-6 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg text-left text-foreground">
                            <div className="md:col-span-2 space-y-2 text-left text-foreground">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5 text-left"><Search className="h-3 w-3"/> Registry Search</Label>
                                <div className="flex gap-2 text-left text-foreground">
                                    <Input placeholder="Refine your search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                    <Button onClick={forceRefresh} disabled={isLoading} className="text-foreground"><Search className="h-4 w-4"/></Button>
                                </div>
                            </div>
                            <div className="space-y-2 text-left text-foreground text-foreground">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5 text-left"><Tag className="h-3 w-3"/> Data Filter</Label>
                                <Select value={dataFilter} onValueChange={setDataFilter}>
                                    <SelectTrigger className="h-10 text-xs bg-white text-foreground text-left"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Records</SelectItem>
                                        <SelectItem value="has-email">Has Email</SelectItem>
                                        <SelectItem value="no-email">Missing Email</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end text-left text-foreground text-foreground">
                                <Button variant="outline" onClick={() => setHasLoaded(false)} className="h-10 w-full text-foreground"><RotateCcw className="mr-1 h-3 w-3" /> Reset Variables</Button>
                            </div>
                        </div>
                        {isLoading ? <div className="flex justify-center p-10 text-foreground"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div> : <DataTable columns={columns} data={filteredLeads} />}
                    </CardContent>
                </Card>
            </div>
        )}
      </div>
      <AlertDialog open={!!deleteLead} onOpenChange={(o) => !o && setDeleteLead(null)}>
        <AlertDialogContent className="text-left text-foreground text-foreground">
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Permanently remove record?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
