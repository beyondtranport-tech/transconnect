'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { 
  Loader2, PlusCircle, Landmark, Edit, Trash2, Send, Globe, Search, Download, Save, 
  Filter, Users, Database, RotateCcw, Upload, Sparkles, ChevronDown, Settings2, Check, Clock, UserCheck, RefreshCcw, Phone,
  Zap,
  Tag,
  CheckCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { EngageDialog } from './EngageDialog';
import { CommunicationLogDialog } from './CommunicationLogDialog';
import { PartnerTasksDialog } from './PartnerTasksDialog';
import { PartnerOversightDialog } from './PartnerOversightDialog';
import { downloadDataAsCSV, formatDateSafe, cn } from '@/lib/utils';
import { EnrichPartnerButton } from './EnrichPartnerButton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { BulkImportDialog } from './BulkImportDialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

// Internal components
import FinanceDiscoveryEngine, { financeCategories } from './finance-discovery';
import AudienceCommunicationsTable from './AudienceCommunicationsTable';
import { BatchResearchDialog } from './BatchResearchDialog';
import { AddCommunicationLogDialog } from './AddCommunicationLogDialog';

async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
        cache: 'no-store'
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || `API Error for action: ${action}`);
    return result;
}

const partnerSchema = z.object({
  firstName: z.string().optional().or(z.literal('')),
  lastName: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  contactPerson: z.string().optional(),
  companyName: z.string().optional(),
  industrial_category: z.string().optional(),
  status: z.enum(['active', 'inactive', 'contacted', 'new', 'qualified', 'invited', 'registered']),
  type: z.literal('finance'),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
  notes: z.string().optional(),
  address: z.string().optional(),
});
type PartnerFormValues = z.infer<typeof partnerSchema>;

function FinanceDialog({ open, onOpenChange, partner, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; partner?: any; onSave: () => void; }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<PartnerFormValues>({ 
    resolver: zodResolver(partnerSchema),
    defaultValues: { type: 'finance', status: 'new' }
  });

  useEffect(() => {
    if (open) {
      if (partner) form.reset(partner);
      else form.reset({ firstName: '', lastName: '', email: '', phone: '', mobile: '', contactPerson: '', companyName: '', industrial_category: '', status: 'new', type: 'finance', website: '', notes: '', address: '' });
    }
  }, [open, partner, form]);

  const handleFormSubmit = async (values: PartnerFormValues) => {
    setIsLoading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        const coll = partner?.source === 'Lead' ? 'leads' : 'partners';
        await performAdminAction(token, 'savePartner', { collection: coll, partner: { id: partner?.id, ...values, type: 'finance' } });
        toast({ title: 'Finance Record Saved' });
        onSave();
        onOpenChange(false);
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
    } finally {
        setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] text-left text-foreground">
            <DialogHeader>
                <DialogTitle>Edit Finance Partner</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2 text-left">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                    <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem className="text-left text-foreground"><FormLabel>Institution Name</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="industrial_category" render={({ field }) => (
                         <FormItem className="text-left text-foreground">
                            <FormLabel>Funder Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger className="bg-white text-left"><SelectValue placeholder="Select classification..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {financeCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                         </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" className="bg-white" /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="mobile" render={({ field }) => ( <FormItem><FormLabel>Mobile (Direct)</FormLabel><FormControl><Input placeholder="+27 82..." {...field} className="bg-white" /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                    <FormField control={form.control} name="status" render={({ field }) => ( 
                        <FormItem className="text-left">
                            <FormLabel>Pipeline Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger className="bg-white text-left text-foreground"><SelectValue placeholder="Select status..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="new">New Lead</SelectItem>
                                    <SelectItem value="contacted">Researching</SelectItem>
                                    <SelectItem value="qualified">Qualified</SelectItem>
                                    <SelectItem value="active">Active Participant</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem> 
                    )} />
                     <DialogFooter className="pt-4 border-t text-left text-foreground">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} Save Record
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}

function DuplicateCleaner({ onComplete }: { onComplete: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleAutoClean = async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");
            
            const result = await performAdminAction(token, 'bulkDeduplicate', { type: 'finance' });
            
            if (result.count === 0) {
                toast({ title: "Registry Clean", description: "No duplicates found based on Company Name + Email." });
            } else {
                toast({ title: "Deduplication Complete", description: `Successfully consolidated ${result.count} redundant records.` });
            }
            onComplete();
            setIsOpen(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Cleanup Error", description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Trash2 className="mr-2 h-4 w-4"/>
                    Clean Duplicates
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md text-left">
                 <DialogHeader>
                    <DialogTitle>Auto-Clean Duplicates</DialogTitle>
                    <DialogDescription>
                        This tool will automatically identify and delete duplicates where the **Institution Name** and **Email Address** are identical. 
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4 text-left">
                    <div className="p-4 bg-muted/30 border rounded-xl space-y-3">
                        <p className="text-xs font-bold flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600"/> Prioritizes Registered Members</p>
                        <p className="text-xs font-bold flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600"/> Preserves Earliest Records</p>
                        <p className="text-xs font-bold flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600"/> Cleans Leads Database & Partner Registry</p>
                    </div>
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleAutoClean} disabled={isLoading} className="bg-primary hover:bg-primary/90">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4"/>}
                        Execute One-Click Clean
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function FinanceManagement() {
  const { toast } = useToast();
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{ type: 'add' | 'edit' | 'delete' | 'engage' | 'research' | null, data?: any, initialIndex?: number }>({ type: null });

  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    companyName: true,
    industrial_category: true,
    contactPerson: true,
    email: true,
    outreach: true,
    status: true,
    actions: true
  });

  const fetchData = useCallback(async (limit: number = 20000) => {
    setIsLoading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) return;
        const [res, staffRes] = await Promise.all([
            performAdminAction(token, 'searchRegistry', { type: 'finance', term: searchTerm, limit }),
            performAdminAction(token, 'getPlatformStaff', {})
        ]);
        setAllRecords(res.data || []);
        setStaff(staffRes.data || []);
        setHasLoaded(true);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Fetch Error', description: e.message });
    } finally {
        setIsLoading(false);
    }
  }, [searchTerm, toast]);

  useEffect(() => { if (!hasLoaded) fetchData(); }, [fetchData, hasLoaded]);

  const handleEngage = useCallback((record: any) => {
    const engageList = selectedIds.length > 0 ? allRecords.filter(r => selectedIds.includes(r.id)) : (record ? [record] : []);
    if (engageList.length === 0) return;
    setDialog({ type: 'engage', data: engageList, initialIndex: record ? engageList.findIndex((r: any) => r.id === record.id) : 0 });
  }, [allRecords, selectedIds]);

  const handleResearch = useCallback(() => {
      const researchList = allRecords.filter(r => selectedIds.includes(r.id));
      if (researchList.length === 0) return;
      setDialog({ type: 'research', data: researchList });
  }, [allRecords, selectedIds]);

  const filteredRecords = useMemo(() => {
    return allRecords.filter(p => {
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const pCat = (p.industrial_category || p.category || '').trim();
        const matchesCategory = categoryFilter === 'all' || pCat === categoryFilter;
        const matchesAssignee = assigneeFilter === 'all' || p.assigneeId === assigneeFilter;
        return matchesStatus && matchesCategory && matchesAssignee;
    });
  }, [allRecords, statusFilter, categoryFilter, assigneeFilter]);

  const columns: ColumnDef<any>[] = useMemo(() => [
    { 
        accessorKey: 'companyName',
        header: 'Finance Institution', 
        cell: ({row}) => (
            <div className="flex flex-col text-left">
                <span className="font-bold text-left text-foreground">{row.original.companyName || row.original.company_name || 'Unnamed Entity'}</span>
                <div className="flex items-center gap-2 mt-1 text-left">
                    {row.original.website && <Globe className="h-3 w-3 text-primary" />}
                    <Badge variant="outline" className="text-[10px] h-3.5 border-primary/20 text-primary uppercase font-bold text-left">Lender</Badge>
                </div>
            </div>
        )
    },
    { 
        accessorKey: 'industrial_category', 
        header: 'Industrial Category',
        cell: ({row}) => <Badge variant="secondary" className="text-[10px] uppercase font-black tracking-widest">{row.original.industrial_category || row.original.category || 'General'}</Badge>
    },
    { 
        accessorKey: 'contactPerson',
        header: 'Key Contact',
        cell: ({ row }) => <div className="text-sm font-medium text-left">{row.original.contactPerson || row.original.contact_person || (row.original.firstName ? `${row.original.firstName} ${row.original.lastName}` : 'N/A')}</div>
    },
    { accessorKey: 'email', header: 'Email', cell: ({row}) => <div>{row.original.email || row.original.email_address || 'N/A'}</div> },
    { 
        header: 'Outreach & Result',
        id: 'outreach',
        accessorKey: 'lastOutreachSubject',
        cell: ({ row }) => {
            if (!row.original.lastOutreachSubject) return <span className="text-[10px] text-muted-foreground italic text-left">None</span>;
            return (
                <div className="flex flex-col text-left text-foreground">
                    <Badge variant="outline" className="text-[9px] h-4 uppercase font-bold truncate max-w-[100px] text-left border-primary/20 text-primary">{row.original.lastOutreachSubject}</Badge>
                    {row.original.lastOpenedAt && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 mt-1 w-fit text-left">
                            <UserCheck className="h-2.5 w-2.5" /> Read
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
    { id: 'actions', header: 'Actions', cell: ({ row }) => (
      <div className="flex justify-end items-center gap-1 text-left text-foreground">
        <EnrichPartnerButton partner={row.original} onUpdate={() => fetchData()} />
        <Button variant="ghost" size="icon" onClick={() => handleEngage(row.original)} title="Engage"><Send className="h-4 w-4 text-primary" /></Button>
        <AddCommunicationLogDialog 
            partnerId={row.original.id} 
            collection={row.original.source === 'Lead' ? 'leads' : 'partners'} 
            onLogAdded={() => fetchData()} 
        />
        <CommunicationLogDialog partnerId={row.original.id} partnerName={row.original.companyName} />
        <PartnerTasksDialog partner={row.original} />
        <PartnerOversightDialog partner={row.original} onUpdate={() => fetchData()} />
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'edit', data: row.original })}><Edit className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'delete', data: row.original })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    ) },
  ], [fetchData, handleEngage, visibleColumns]);

  async function handleDeleteRecord() {
    if (!dialog.data) return;
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      await performAdminAction(token, 'deletePartner', { partnerId: dialog.data.id, source: dialog.data.source });
      toast({ title: 'Record Deleted' });
      fetchData();
      setDialog({ type: null });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  }

  return (
    <div className="space-y-6 text-left text-foreground">
      <EngageDialog open={dialog.type === 'engage'} onOpenChange={(o) => !o && setDialog({ type: null })} partners={dialog.data || []} initialIndex={dialog.initialIndex} audience="finance" onEngageSuccess={() => fetchData()} />
      <BatchResearchDialog open={dialog.type === 'research'} onOpenChange={(o) => !o && setDialog({ type: null })} selectedLeads={dialog.data || []} onComplete={() => fetchData()} />
      <FinanceDialog open={dialog.type === 'add' || dialog.type === 'edit'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.type === 'edit' ? dialog.data : undefined} onSave={() => fetchData()} />
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(o) => !o && setDialog({ type: null })}>
        <AlertDialogContent className="text-left text-foreground">
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Delete record?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialog({ type: null })}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecord} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs defaultValue="crm" className="w-full text-left text-foreground">
          <TabsList className="h-auto flex-wrap justify-start bg-muted/50 p-1 text-left text-foreground">
              <TabsTrigger value="crm" className="gap-2"><Users className="h-4 w-4" /> Forensic Registry (CRM)</TabsTrigger>
              <TabsTrigger value="discovery" className="gap-2"><Database className="h-4 w-4" /> Automated Discovery (AI)</TabsTrigger>
              <TabsTrigger value="oversight" className="gap-2"><Clock className="h-4 w-4" /> Oversight Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="crm" className="mt-6 space-y-6 text-left text-foreground">
              {!hasLoaded ? (
                  <Card className="bg-primary/5 border-primary/20 p-12 text-center text-foreground">
                      <Landmark className="mx-auto h-16 w-16 text-primary/20 mb-4" />
                      <h2 className="text-2xl font-black font-headline mb-2 text-center text-foreground">Finance Registry Scan</h2>
                      <p className="text-muted-foreground max-sm mx-auto mb-8 text-center text-foreground">Scan the capital database. Identify niche lenders and institutional partners.</p>
                      <Button size="lg" onClick={() => fetchData()} disabled={isLoading} className="h-12 px-8 font-bold text-left">
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCcw className="mr-2 h-4 w-4" />} Execute Scan
                      </Button>
                  </Card>
              ) : (
                  <Card className="text-left text-foreground">
                      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b text-left p-6">
                          <div className="text-left text-foreground">
                              <CardTitle className="text-xl font-bold flex items-center gap-2 text-left"><Landmark className="h-5 w-5 text-primary" /> Forensic Finance Registry</CardTitle>
                              <CardDescription className="text-left">Managing {filteredRecords.length} verified funding nodes.</CardDescription>
                          </div>
                          <div className="flex gap-2 text-left text-foreground">
                              <Button variant="outline" size="sm" onClick={() => fetchData()} disabled={isLoading} className="text-foreground"><RefreshCcw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} /> Refresh</Button>
                              <Button variant="outline" size="sm" onClick={() => downloadDataAsCSV(allRecords, 'finance-registry-backup.csv')} className="text-foreground"><Download className="h-4 w-4 mr-2" /> Backup</Button>
                              
                              <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2 text-foreground"><Settings2 className="h-4 w-4" /> Columns</Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-2 text-left">
                                    <div className="space-y-1 text-left text-foreground">
                                        {Object.keys(visibleColumns).map(col => (
                                            <div key={col} className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer text-[10px] font-black uppercase tracking-widest text-foreground" onClick={() => setVisibleColumns(prev => ({...prev, [col]: !prev[col]}))}>
                                                <span>{col.replace(/([A-Z]|_)/g, ' $1').trim()}</span>
                                                {visibleColumns[col] && <Check className="h-3 w-3 text-primary" />}
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                              </Popover>

                              <DuplicateCleaner onComplete={() => fetchData()} />
                              <BulkImportDialog type="finance" onComplete={() => fetchData()}><Button variant="outline" size="sm" className="text-foreground"><Upload className="mr-2 h-4 w-4" /> Import</Button></BulkImportDialog>
                              <Button onClick={() => setDialog({ type: 'add' })} size="sm" className="text-foreground"><PlusCircle className="mr-2 h-4 w-4"/>Add Record</Button>
                          </div>
                      </CardHeader>
                      <CardContent className="pt-6 text-left text-foreground">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-muted/30 rounded-lg text-left">
                            <div className="space-y-1 text-left">
                                <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5"><Filter className="h-3 w-3"/> Status</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-9 bg-white text-xs text-left"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                                    <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="new">New</SelectItem><SelectItem value="active">Active</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1 text-left">
                                <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5"><Tag className="h-3 w-3"/> Classification</Label>
                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger className="h-9 bg-white text-xs text-left"><SelectValue placeholder="All Categories" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {financeCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1 text-left">
                                <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5"><Users className="h-3 w-3"/> Assignee</Label>
                                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                                    <SelectTrigger className="bg-white text-left"><SelectValue placeholder="All Staff" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Staff</SelectItem>
                                        <SelectItem value="none">Unallocated</SelectItem>
                                        {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2 flex items-end gap-2 text-left">
                                {selectedIds.length > 0 ? (
                                    <div className="flex gap-2 w-full animate-in fade-in slide-in-from-right-2">
                                        <Button variant="secondary" onClick={() => handleEngage(null)} className="flex-1 h-9 font-bold text-xs gap-2"><Send className="h-3.5 w-3.5" /> Engage ({selectedIds.length})</Button>
                                        <Button variant="outline" onClick={handleResearch} className="flex-1 h-9 font-bold text-xs gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" /> AI Research</Button>
                                    </div>
                                ) : (
                                    <Button variant="outline" onClick={() => setHasLoaded(false)} className="w-full h-9 text-xs font-bold uppercase tracking-widest"><RotateCcw className="mr-1 h-3 w-3" /> New Search</Button>
                                )}
                            </div>
                        </div>

                        {isLoading ? (
                             <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                        ) : (
                            <DataTable columns={columns} data={filteredRecords} onSelectionChange={setSelectedIds} />
                        )}
                      </CardContent>
                  </Card>
              )}
          </TabsContent>

          <TabsContent value="discovery" className="mt-6 text-left">
              <FinanceDiscoveryEngine />
          </TabsContent>

          <TabsContent value="oversight" className="mt-6 text-left">
              <AudienceCommunicationsTable audience="finance" />
          </TabsContent>
      </Tabs>
    </div>
  );
}
