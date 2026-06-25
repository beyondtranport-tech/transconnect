
'use client';

import * as React from 'react';
import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
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
import { Loader2, PlusCircle, Users, Edit, Trash2, Search, Send, Download, Upload, Save, RefreshCcw, Filter, RotateCcw, Tag, Database, ChevronDown, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { roles } from '@/lib/roles';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { downloadDataAsCSV, formatDateSafe, cn } from '@/lib/utils';
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
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2 text-left">
            <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4 text-left">
              <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-left text-foreground">
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Landline</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="mobile" render={({ field }) => (<FormItem><FormLabel>Mobile (Direct)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="email" render={({ field }) => (<FormItem className="text-left text-foreground text-foreground"><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="website" render={({ field }) => (<FormItem className="text-left text-foreground text-foreground"><FormLabel>Website</FormLabel><FormControl><Input {...field} type="url" placeholder="https://..." /></FormControl><FormMessage /></FormItem>)} />
             <div className="grid grid-cols-2 gap-4 text-left text-foreground text-foreground">
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem className="text-left text-foreground text-foreground"><FormLabel>Potential Role</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="bg-white text-left text-foreground text-foreground text-foreground"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                    <SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.title}>{r.title}</SelectItem>)}</SelectContent>
                </Select></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem className="text-left text-foreground text-foreground text-foreground"><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="bg-white text-left text-foreground text-foreground text-foreground"><SelectValue /></SelectTrigger></FormControl>
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [resultsLimit, setResultsLimit] = useState(100);
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [outreachFilter, setOutreachFilter] = useState('all');
  const [enrichmentFilter, setEnrichmentFilter] = useState('all');
  
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [editLead, setEditLead] = useState<any | null>(null);
  const [deleteLead, setDeleteLead] = useState<any | null>(null);
  const [engageDialog, setEngageDialog] = useState<{ open: boolean, data?: any[], initialIndex?: number }>({ open: false });

  const fetchData = useCallback(async (limit: number = resultsLimit) => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      const res = await performAdminAction(token, 'searchRegistry', { type: 'lead', term: searchTerm, outreachFilter, enrichmentFilter, limit });
      setAllRecords(res.data || []);
      setHasLoaded(true);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Fetch Error', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, outreachFilter, enrichmentFilter, resultsLimit, toast]);

  useEffect(() => {
    if (hasLoaded) fetchData();
  }, [fetchData, hasLoaded]);

  const handleLoadMore = () => {
    const newLimit = resultsLimit + 100;
    setResultsLimit(newLimit);
    fetchData(newLimit);
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
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        return matchesStatus;
    });
  }, [allRecords, statusFilter]);

  const handleExport = () => {
      if (filteredLeads.length === 0) return;
      downloadDataAsCSV(filteredLeads, `leads-backup-${new Date().toISOString().split('T')[0]}.csv`);
      toast({ title: "Backup Exported" });
  };

  const handleEngage = (record: any) => {
    const indexInSelected = selectedIds.indexOf(record.id);
    const engageList = selectedIds.length > 0 
        ? allRecords.filter(r => selectedIds.includes(r.id)) 
        : [record];
        
    setEngageDialog({ 
        open: true, 
        data: engageList, 
        initialIndex: Math.max(0, indexInSelected) 
    });
  };

  const handleBatchEngage = () => {
    if (selectedIds.length === 0) return;
    const engageList = allRecords.filter(r => selectedIds.includes(r.id));
    setEngageDialog({ open: true, data: engageList, initialIndex: 0 });
  };

  const handleDelete = async () => {
    if (!deleteLead) return;
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Auth failed");
      await performAdminAction(token, 'deleteLeads', { leadIds: [deleteLead.id] });
      toast({ title: 'Lead Deleted' });
      fetchData();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    } finally {
      setDeleteLead(null);
    }
  };

  const columns: ColumnDef<any>[] = useMemo(() => [
    { 
        accessorKey: 'companyName', 
        header: 'Lead Name',
        cell: ({ row }) => <span className="font-bold text-left">{row.original.companyName || <span className="text-destructive italic">Unnamed Lead</span>}</span>
    },
    { 
        accessorKey: 'contactPerson', 
        header: 'Key Decision Maker',
        cell: ({ row }) => (
            <div className="text-sm font-medium text-left">
                {row.original.contactPerson || <span className="text-muted-foreground italic">Missing Name</span>}
            </div>
        )
    },
    { accessorKey: 'mobile', header: 'Mobile' },
    {
        header: 'Outreach',
        cell: ({ row }) => {
            if (!row.original.lastOutreachSubject) return <span className="text-[10px] text-muted-foreground italic">None</span>;
            return (
                <div className="flex flex-col text-left">
                    <Badge variant="outline" className="text-[9px] h-4 uppercase font-bold truncate max-w-[100px]">{row.original.lastOutreachSubject}</Badge>
                    {row.original.lastOpenedAt && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 mt-1 w-fit">
                            <UserCheck className="h-2.5 w-2.5" />
                            Read
                        </div>
                    )}
                </div>
            );
        }
    },
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
          <EnrichPartnerButton partner={row.original} onUpdate={fetchData} />
          <Button variant="ghost" size="icon" onClick={() => handleEngage(row.original)} title="Engage"><Send className="h-4 w-4 text-primary" /></Button>
          <CommunicationLogDialog partnerId={row.original.id} partnerName={row.original.companyName} />
          <PartnerTasksDialog partner={row.original} />
          <PartnerOversightDialog partner={row.original} onUpdate={fetchData} />
          <Button variant="ghost" size="icon" onClick={() => { setEditLead(row.original); }}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => { setDeleteLead(row.original); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      )
    },
  ], [fetchData, selectedIds]);

  return (
    <>
      <EngageDialog 
        open={engageDialog.open} 
        onOpenChange={(o) => !o && setEngageDialog({ open: false })} 
        partners={engageDialog.data || []} 
        initialIndex={engageDialog.initialIndex}
        audience="suppliers" 
        onEngageSuccess={fetchData} 
      />
      <LeadDialog open={isAddLeadOpen || !!editLead} onOpenChange={(o) => { if(!o) { setEditLead(null); setIsAddLeadOpen(false); } }} lead={editLead} onSave={fetchData} defaultValues={newLeadDefaults} />
      
      <div className="space-y-6 text-left">
        {!hasLoaded ? (
            <Card className="bg-primary/5 border-primary/20 p-12 text-center text-foreground">
                <Database className="mx-auto h-16 w-16 text-primary/20 mb-4" />
                <h2 className="text-2xl font-black font-headline mb-2 text-foreground text-center">Lead Registry Scan</h2>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8 text-center">Scan your prospective member pipeline. Use filters to prioritize outreach and enrichment.</p>
                <div className="flex flex-col md:flex-row justify-center gap-4 max-w-5xl mx-auto text-left">
                    <div className="flex-1 space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Name, Email or ID</Label>
                        <Input placeholder="Type criteria..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchData(100)} className="h-12 text-lg bg-white" />
                    </div>
                     <div className="w-48 space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Outreach</Label>
                        <Select value={outreachFilter} onValueChange={setOutreachFilter}>
                            <SelectTrigger className="h-12 bg-white text-left text-foreground"><SelectValue placeholder="All Stages" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Stages</SelectItem>
                                <SelectItem value="none">No Outreach Yet</SelectItem>
                                <SelectItem value="Digital Handshake">Handshake Sent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-48 space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Enrichment</Label>
                        <Select value={enrichmentFilter} onValueChange={setEnrichmentFilter}>
                            <SelectTrigger className="h-12 bg-white text-left"><SelectValue placeholder="All" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="enriched">Enriched</SelectItem>
                                <SelectItem value="unenriched">Unenriched</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 self-end text-left text-foreground">
                        <Button size="lg" onClick={() => { setResultsLimit(100); fetchData(100); }} disabled={isLoading} className="h-12 px-8 font-bold text-left">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
                            Execute Scan
                        </Button>
                        <Button variant="outline" size="lg" onClick={() => { setResultsLimit(100); fetchData(100); }} className="h-12 text-left">
                             Show Recent
                        </Button>
                    </div>
                </div>
            </Card>
        ) : (
            <div className="space-y-6 text-left text-foreground">
                <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div className="text-left text-foreground"><CardTitle className="flex items-center gap-2 text-left text-foreground"><Users /> Lead Pipeline</CardTitle><CardDescription className="text-left text-foreground text-foreground text-foreground">Managed prospective member registry ({allRecords.length} results).</CardDescription></div>
                <div className="flex gap-2 text-left text-foreground text-foreground text-foreground">
                    {selectedIds.length > 0 && (
                        <Button variant="secondary" onClick={handleBatchEngage} className="gap-2 shadow-sm font-bold text-left">
                            <Send className="h-4 w-4" /> Batch Engage ({selectedIds.length})
                        </Button>
                    )}
                    <Button variant="outline" onClick={handleExport} disabled={isLoading} className="text-foreground text-foreground text-left"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
                    <BulkImportDialog type="lead" onComplete={fetchData}><Button variant="outline" className="text-foreground text-foreground text-foreground text-left"><Upload className="mr-2 h-4 w-4" /> Import</Button></BulkImportDialog>
                    <Button onClick={() => setIsAddLeadOpen(true)} className="text-foreground text-foreground text-foreground text-foreground text-left"><PlusCircle className="mr-2 h-4 w-4" />Add Lead</Button>
                </div>
                </CardHeader>
                <Card className="text-left text-foreground text-foreground">
                    <CardContent className="pt-6 text-left text-foreground text-foreground text-foreground">
                        <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-muted/30 rounded-lg text-left text-foreground text-foreground text-foreground text-foreground text-foreground">
                             <div className="flex-1 space-y-2 text-left text-foreground text-left">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 text-left">Enrichment Status</Label>
                                <Select value={enrichmentFilter} onValueChange={setEnrichmentFilter}>
                                    <SelectTrigger className="bg-white text-left text-foreground text-foreground text-foreground text-left"><SelectValue placeholder="All" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="enriched">Enriched</SelectItem>
                                        <SelectItem value="unenriched">Unenriched</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1 space-y-2 text-left text-foreground text-foreground text-foreground text-foreground text-left">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 text-left">Outreach Stage</Label>
                                <Select value={outreachFilter} onValueChange={setOutreachFilter}>
                                    <SelectTrigger className="bg-white text-left text-foreground text-foreground text-foreground text-left"><SelectValue placeholder="All Stages" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Stages</SelectItem>
                                        <SelectItem value="none">No Outreach Yet</SelectItem>
                                        <SelectItem value="Digital Handshake">Handshake Sent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end text-left text-foreground text-foreground text-foreground text-foreground text-left">
                                <Button variant="outline" onClick={() => setHasLoaded(false)} className="h-10 w-full text-foreground text-foreground text-foreground text-left"><RotateCcw className="mr-1 h-3 w-3" /> New Search</Button>
                            </div>
                        </div>
                        {isLoading ? <div className="flex justify-center p-10 text-foreground text-foreground text-foreground text-left"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div> : (
                            <div className="space-y-4 text-left">
                                <DataTable columns={columns} data={filteredLeads} onSelectionChange={setSelectedIds} />
                                <div className="flex justify-center pt-4 text-left">
                                    <Button variant="outline" size="lg" onClick={handleLoadMore} disabled={isLoading} className="gap-2 min-w-[200px] text-left">
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <ChevronDown className="h-4 w-4" />}
                                        Load Next 100 Records
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        )}
      </div>
      <AlertDialog open={!!deleteLead} onOpenChange={(o) => { if(!o) setDeleteLead(null); }}>
        <AlertDialogContent className="text-left text-foreground text-foreground text-foreground">
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Permanently remove lead?</AlertDialogDescription></AlertDialogHeader>
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
    <Suspense fallback={<Loader2 className="animate-spin h-10 w-10 text-primary mx-auto my-20 text-left"/>}>
      <LeadsDatabaseComponent />
    </Suspense>
  );
}
