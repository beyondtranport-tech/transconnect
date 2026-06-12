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
import { Loader2, PlusCircle, Users, Edit, Trash2, Search, Send, Copy, Filter, Mail, Download, Zap, RotateCcw, Upload, Tag, Save, Database, RefreshCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { roles } from '@/lib/roles';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { formatDateSafe, cn, downloadDataAsCSV } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

import { EnrichPartnerButton } from '@/app/adminaccount/marketing/EnrichPartnerButton';
import { PartnerTasksDialog } from '@/app/adminaccount/marketing/PartnerTasksDialog';
import { CommunicationLogDialog } from '@/app/adminaccount/marketing/CommunicationLogDialog';
import { EngageDialog } from '@/app/adminaccount/marketing/EngageDialog';
import { BulkImportDialog } from './marketing/BulkImportDialog';
import { BatchResearchDialog } from './marketing/BatchResearchDialog';
import { PartnerOversightDialog } from './marketing/PartnerOversightDialog';

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

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
  });

  useEffect(() => {
    if (open) {
      if (lead) {
        form.reset({
          ...lead,
          status: lead.status || 'new',
        });
      } else {
        form.reset({
          companyName: defaultValues?.companyName || '',
          contactPerson: defaultValues?.contactPerson || '',
          email: defaultValues?.email || '',
          phone: defaultValues?.phone || '',
          mobile: defaultValues?.mobile || '',
          role: defaultValues?.role || '',
          status: 'new',
          notes: '',
          website: defaultValues?.website || '',
          address: defaultValues?.address || '',
        });
      }
    }
  }, [open, lead, form, defaultValues]);

  async function onSubmit(values: LeadFormValues) {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");

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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit' : 'Add New'} Lead</DialogTitle>
          <DialogDescription>
            Enter the details for the potential member.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2 text-left">
            <FormField control={form.control} name="companyName" render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="contactPerson" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Landline</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="mobile" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile (Direct)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input {...field} type="email" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="website" render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl><Input {...field} type="url" placeholder="https://example.com" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem>
                <FormLabel>Physical Address</FormLabel>
                <FormControl><Textarea {...field} placeholder="Enter full address..." /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Potential Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map(r => <SelectItem key={r.id} value={r.title}>{r.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Researching</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="invited">Invited</SelectItem>
                      <SelectItem value="active">Member (Active)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Internal Notes</FormLabel>
                <FormControl><Textarea {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="pt-4 border-t">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Lead
              </Button>
            </DialogFooter>
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

  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [editLead, setEditLead] = useState<any | null>(null);
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [deleteLead, setDeleteLead] = useState<any | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [engageLead, setEngageLead] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dataFilter, setDataFilter] = useState('all');

  const forceRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      const res = await performAdminAction(token, 'getLeads');
      setLeads(res.data || []);
      setHasLoaded(true);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Registry Load Failed', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleSearch = async () => {
    if (!searchTerm || searchTerm.length < 3) {
        if (searchTerm.length === 0) forceRefresh();
        else toast({ title: "Min 3 characters required" });
        return;
    }
    setIsLoading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) return;
        const res = await performAdminAction(token, 'searchRegistry', { term: searchTerm, type: 'lead' });
        setLeads(res.data || []);
        setHasLoaded(true);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Search Error', description: e.message });
    } finally {
        setIsLoading(false);
    }
  };

  const selectedLeads = useMemo(() => {
      return leads.filter(l => selectedIds.includes(l.id));
  }, [leads, selectedIds]);

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
    }
  }, [searchParams, newLeadDefaults]);

  const filteredLeads = useMemo(() => {
    return (leads || []).filter(p => {
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        
        let matchesData = true;
        if (dataFilter === 'no-email') matchesData = !p.email;
        else if (dataFilter === 'has-email') matchesData = !!p.email;

        return matchesStatus && matchesData;
    });
  }, [leads, statusFilter, dataFilter]);

  const handleExport = () => {
      if (filteredLeads.length === 0) return;
      downloadDataAsCSV(filteredLeads, `leads-backup-${new Date().toISOString().split('T')[0]}.csv`);
      toast({ title: "Backup Exported" });
  };

  async function handleDelete() {
    if (!deleteLead) return;
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Auth failed.");
      await performAdminAction(token, 'deleteLeads', { leadIds: [deleteLead.id] });
      toast({ title: 'Lead Deleted' });
      forceRefresh();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    } finally {
      setIsDeleteAlertOpen(false);
      setDeleteLead(null);
    }
  }

  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'companyName', header: 'Company Name' },
    { accessorKey: 'contactPerson', header: 'Contact Name' },
    { accessorKey: 'phone', header: 'Landline' },
    { accessorKey: 'mobile', header: 'Mobile' },
    { accessorKey: 'email', header: 'Email' },
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
          <Button variant="ghost" size="icon" onClick={() => { setEditLead(row.original); setIsEditLeadOpen(true); }}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => { setDeleteLead(row.original); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      )
    },
  ], [forceRefresh]);

  return (
    <>
      <EngageDialog open={!!engageLead} onOpenChange={(o) => !o && setEngageLead(null)} partner={engageLead} audience="suppliers" onEngageSuccess={forceRefresh} />
      <LeadDialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen} onSave={forceRefresh} defaultValues={newLeadDefaults} />
      {editLead && <LeadDialog open={isEditLeadOpen} onOpenChange={setIsEditLeadOpen} lead={editLead} onSave={forceRefresh} />}
      <BatchResearchDialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen} selectedLeads={selectedLeads} onComplete={forceRefresh} />
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Lead?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the record.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteLead(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-0 pt-0">
          <div className="text-left">
            <CardTitle className="flex items-center gap-2"><Users /> Lead Database</CardTitle>
            <CardDescription>Comprehensive registry of prospective members and discovered industrial leads.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 && (
                <Button variant="secondary" onClick={() => setIsBatchDialogOpen(true)} className="animate-in fade-in zoom-in slide-in-from-right-4">
                    <Zap className="mr-2 h-4 w-4" /> Batch Research ({selectedIds.length})
                </Button>
            )}
            <Button variant="outline" onClick={handleExport} disabled={isLoading || !hasLoaded}>
                <Download className="mr-2 h-4 w-4" /> Backup
            </Button>
            <BulkImportDialog type="lead" onComplete={forceRefresh}><Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import</Button></BulkImportDialog>
            <Button onClick={() => setIsAddLeadOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Lead</Button>
          </div>
        </CardHeader>

        {!hasLoaded ? (
            <Card className="bg-primary/5 border-primary/20 p-12 text-center">
                <Database className="mx-auto h-16 w-16 text-primary/20 mb-4" />
                <h2 className="text-2xl font-black font-headline mb-2 text-foreground">Registry Search Variables</h2>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8">Enter your search criteria to load the master registry. This targets your session to preserve your daily data quota.</p>
                <div className="flex flex-col md:flex-row justify-center gap-4 max-w-2xl mx-auto">
                    <Input placeholder="Type company name, ID or email to search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="h-12 text-lg bg-white" />
                    <Button size="lg" onClick={handleSearch} disabled={isLoading} className="h-12 px-8">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
                        Load Master Registry
                    </Button>
                </div>
            </Card>
        ) : (
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg text-left">
                        <div className="md:col-span-2 space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><Search className="h-3 w-3"/> Registry Search</Label>
                             <div className="flex gap-2">
                                <Input placeholder="Refine your search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                                <Button onClick={handleSearch} disabled={isLoading}><Search className="h-4 w-4"/></Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><Tag className="h-3 w-3"/> Data Filter</Label>
                            <Select value={dataFilter} onValueChange={setDataFilter}>
                                <SelectTrigger className="h-10 text-xs bg-white"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Records</SelectItem>
                                    <SelectItem value="has-email">Has Email</SelectItem>
                                    <SelectItem value="no-email">Missing Email</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button variant="outline" onClick={() => setHasLoaded(false)} className="h-10 w-full"><RotateCcw className="mr-1 h-3 w-3" /> Reset Variables</Button>
                        </div>
                    </div>
                    {isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : <DataTable columns={columns} data={filteredLeads} onSelectionChange={setSelectedIds} />}
                </CardContent>
            </Card>
        )}
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