
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { 
  Loader2, PlusCircle, Building, Edit, Trash2, Send, Download, Save, Search, Filter, Users, Globe, Zap, Upload, RefreshCcw, Database, Copy, Tag
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PartnerTasksDialog } from './PartnerTasksDialog';
import { CommunicationLogDialog } from './CommunicationLogDialog';
import { EngageDialog } from './EngageDialog';
import { PartnerOversightDialog } from './PartnerOversightDialog';
import { downloadDataAsCSV, formatDateSafe, cn } from '@/lib/utils';
import { EnrichPartnerButton } from './EnrichPartnerButton';
import { BulkImportDialog } from './BulkImportDialog';
import { Label } from '@/components/ui/label';
import { useConfig } from '@/hooks/use-config';
import { supplierCategories } from './discovery-engine';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  contactPerson: z.string().optional(),
  companyName: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'contacted', 'new', 'qualified', 'invited']),
  type: z.literal('supplier'),
});
type PartnerFormValues = z.infer<typeof partnerSchema>;

function SupplierDialog({ open, onOpenChange, partner, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; partner?: any; onSave: () => void; }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<PartnerFormValues>({ 
    resolver: zodResolver(partnerSchema),
    defaultValues: { type: 'supplier', status: 'new' }
  });

  useEffect(() => {
    if (open) {
      if (partner) {
        form.reset({
          ...partner,
          website: partner.website || '',
          notes: partner.notes || '',
          address: partner.address || '',
        });
      } else {
        form.reset({ firstName: '', lastName: '', email: '', phone: '', mobile: '', contactPerson: '', companyName: '', status: 'new', type: 'supplier' });
      }
    }
  }, [open, partner, form]);

  const handleFormSubmit = async (values: PartnerFormValues) => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");
      await performAdminAction(token, 'savePartner', { partner: { id: partner?.id, ...values, type: 'supplier' } });
      toast({ title: 'Supplier Saved' });
      onSave();
      onOpenChange(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl text-left text-foreground">
        <DialogHeader>
          <DialogTitle>{partner ? 'Edit' : 'Add'} Supplier</DialogTitle>
          <DialogDescription>Manage verified supplier record and technical details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2 text-left">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Entity Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="website" render={({ field }) => (<FormItem><FormLabel>Official Website</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Landline</FormLabel><FormControl><Input placeholder="+27 11..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="mobile" render={({ field }) => (<FormItem><FormLabel>Mobile (Direct Cell)</FormLabel><FormControl><Input placeholder="+27 82..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Physical Address</FormLabel><FormControl><Textarea placeholder="Enter full operational address..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Technical Focus</FormLabel><FormControl><Textarea placeholder="Details about their parts or services..." {...field} className="min-h-[120px]" /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Researching</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                        </SelectContent>
                    </Select>
                </FormItem>
            )} />
            <DialogFooter className="pt-4 border-t">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CategorizationDialog({ open, onOpenChange, unclassifiedCount, records }: { open: boolean, onOpenChange: (o: boolean) => void, unclassifiedCount: number, records: any[] }) {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);

    const listToClassify = records.slice(0, 100).map(r => `[KEY: ${r.id}] ${r.companyName}`).join('\n');
    const categoryList = supplierCategories.join(', ');

    const prompt = `ACT AS AN INDUSTRIAL DATA ARCHITECT. 
RETURN ONLY A RAW JSON ARRAY. NO MARKDOWN. NO CODE BLOCKS. NO CONVERSATION.

TASK: Classify the following South African industrial suppliers into their correct category.

VALID CATEGORIES: ${categoryList}

REQUIRED FORMAT:
[
  { "record_id": "...", "industrial_category": "Selected Category" }
]

LIST TO CLASSIFY:
${listToClassify}`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(prompt);
        setIsCopied(true);
        toast({ title: "Categorization Prompt Ready" });
        setTimeout(() => {
            setIsCopied(false);
            onOpenChange(false);
        }, 1000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl text-left text-foreground">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /> Forensic Registry Categorizer</DialogTitle>
                    <DialogDescription>Classify existing records to populate tally badges.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-left">
                    <div className="p-3 bg-primary/5 border rounded-lg flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">Unclassified: <span className="text-primary">{unclassifiedCount}</span></span>
                    </div>
                    <ScrollArea className="h-48 border rounded-md p-3 bg-muted/30 text-[10px] font-mono leading-tight">
                        <pre className="text-foreground">{prompt}</pre>
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <Button onClick={handleCopy} className="w-full h-12 font-black uppercase tracking-widest gap-2">
                        {isCopied ? <Loader2 className="animate-spin h-4 w-4"/> : <Copy className="h-4 w-4" />}
                        Copy Categorization Command
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function SupplierManagement() {
  const { toast } = useToast();
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialog, setDialog] = useState<{ type: 'add' | 'edit' | 'delete' | 'engage' | 'categorize' | null, data?: any }>({ type: null });

  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const { data: statsData, forceRefresh: refreshStats } = useConfig<any>('supplierDiscoveryStats');
  const counts = statsData?.counts || {};

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      const [res, staffRes] = await Promise.all([
        performAdminAction(token, 'getPartnersByType', { type: 'supplier' }),
        performAdminAction(token, 'getPlatformStaff', {})
      ]);
      setAllRecords(res.data || []);
      setStaff(staffRes.data || []);
    } catch (e: any) {
        console.error("Fetch Error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const unclassifiedRecords = useMemo(() => {
      return allRecords.filter(r => !r.industrial_category && !r.category && !r.entryType);
  }, [allRecords]);

  const handleRefreshTally = async () => {
    setIsRefreshing(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) return;
        await performAdminAction(token, 'refreshSupplierCategoryCounts', {});
        toast({ title: "Tally Updated" });
        refreshStats();
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Tally Failed", description: e.message });
    } finally {
        setIsRefreshing(false);
    }
  };

  const filteredRecords = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return allRecords.filter(p => {
        const matchesText = !searchTerm || 
            (p.companyName?.toLowerCase().includes(term)) ||
            (p.firstName?.toLowerCase().includes(term)) ||
            (p.lastName?.toLowerCase().includes(term)) ||
            (p.email?.toLowerCase().includes(term));

        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchesAssignee = assigneeFilter === 'all' || p.assigneeId === assigneeFilter;
        return matchesStatus && matchesAssignee && matchesText;
    });
  }, [allRecords, searchTerm, statusFilter, assigneeFilter]);

  const handleDelete = async () => {
    if (!dialog.data) return;
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      await performAdminAction(token, 'deletePartner', { partnerId: dialog.data.id });
      toast({ title: 'Deleted' });
      fetchData();
      setDialog({ type: null });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const columns: ColumnDef<any>[] = [
    { 
        accessorKey: 'companyName', 
        header: 'Supplier Name', 
        cell: ({ row }) => (
            <div className="flex flex-col text-sm text-left text-foreground">
                <span className="font-bold text-left">{row.original.companyName || row.original.contactPerson || `${row.original.firstName || ''} ${row.original.lastName || ''}`.trim()}</span>
                <div className="flex items-center gap-2 mt-1 text-left">
                    <span className="text-[10px] text-muted-foreground uppercase font-black text-left">{row.original.address || 'Operational Hub Verified'}</span>
                    {row.original.website && <Globe className="h-3 w-3 text-primary" />}
                </div>
            </div>
        )
    },
    { accessorKey: 'phone', header: 'Landline' },
    { accessorKey: 'mobile', header: 'Mobile' },
    { accessorKey: 'email', header: 'Email' },
    { 
        header: 'Status', 
        cell: ({ row }) => {
            const isEnriched = !!(row.original.notes || row.original.website);
            const isSearching = row.original.researchStatus === 'searching';
            return (
                <div className="flex flex-col gap-1 items-center">
                    <Badge variant="outline" className="capitalize text-[10px]">{row.original.status}</Badge>
                    {isEnriched && (
                        <div className="flex flex-col items-center">
                            <Badge className="bg-green-100 text-green-700 border-none text-[9px] h-4 uppercase">Enriched</Badge>
                            <span className="text-[8px] text-muted-foreground mt-0.5">{formatDateSafe(row.original.enrichedAt, "dd/MM")}</span>
                        </div>
                    )}
                    {isSearching && <Badge className="bg-amber-100 text-amber-700 border-none text-[9px] h-4 uppercase animate-pulse">Searching</Badge>}
                </div>
            );
        }
    },
    { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
      <div className="flex justify-end gap-1 text-left">
        <EnrichPartnerButton partner={row.original} onUpdate={fetchData} />
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'engage', data: row.original })} title="Engage"><Send className="h-4 w-4 text-primary" /></Button>
        <CommunicationLogDialog partnerId={row.original.id} partnerName={row.original.companyName} />
        <PartnerTasksDialog partner={row.original} />
        <PartnerOversightDialog partner={row.original} onUpdate={fetchData} />
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'edit', data: row.original })}><Edit className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'delete', data: row.original })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6 text-left text-foreground">
      <EngageDialog open={dialog.type === 'engage'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.data} audience="suppliers" onEngageSuccess={fetchData} />
      <SupplierDialog open={dialog.type === 'add' || dialog.type === 'edit'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.type === 'edit' ? dialog.data : undefined} onSave={fetchData} />
      <CategorizationDialog open={dialog.type === 'categorize'} onOpenChange={(o) => !o && setDialog({ type: null })} unclassifiedCount={unclassifiedRecords.length} records={unclassifiedRecords} />
      
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(o) => !o && setDialog({ type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Delete Supplier?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setDialog({ type: null })}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="space-y-6 text-left">
        <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left text-foreground">
            <div className="text-left text-foreground">
                <CardTitle className="text-left text-2xl font-black font-headline flex items-center gap-2 text-foreground"><Building /> Supplier Registry</CardTitle>
                <CardDescription className="text-left text-foreground">Unified industrial supply directory ({allRecords.length} records).</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-left text-foreground">
                {unclassifiedRecords.length > 0 && (
                    <Button variant="outline" onClick={() => setDialog({ type: 'categorize' })} className="border-primary text-primary hover:bg-primary/5">
                        <Tag className="mr-2 h-4 w-4" /> Categorize ({unclassifiedRecords.length})
                    </Button>
                )}
                <div className="relative w-64 text-left text-foreground">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search registry..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 bg-white text-foreground" />
                </div>
                <Button variant="outline" onClick={() => downloadDataAsCSV(allRecords, 'suppliers-export.csv')} disabled={isLoading}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
                <BulkImportDialog type="supplier" onComplete={fetchData}><Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import</Button></BulkImportDialog>
                <Button onClick={() => setDialog({ type: 'add' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Record</Button>
            </div>
        </CardHeader>

        <Card className="border-primary/10 shadow-sm overflow-hidden text-foreground">
            <CardHeader className="bg-muted/30 border-b text-left text-foreground">
                 <div className="flex items-center justify-between text-left text-foreground">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <Database className="h-3 w-3" /> Category Tally
                    </Label>
                    <Button variant="ghost" size="sm" onClick={handleRefreshTally} className="h-6 text-[9px] uppercase font-black tracking-tighter" disabled={isRefreshing}>
                        {isRefreshing ? <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin"/> : <RefreshCcw className="mr-1 h-2.5 w-2.5"/>} Refresh Counts
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3 text-left">
                    {supplierCategories.map(cat => (
                        <div key={cat} className="flex items-center bg-white border rounded-full pl-3 pr-1 py-0.5 shadow-sm">
                            <span className="text-[9px] font-bold text-slate-600 mr-2">{cat}</span>
                            <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black h-4 px-1.5 min-w-[20px] justify-center">
                                {counts[cat] || 0}
                            </Badge>
                        </div>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="pt-6 text-left text-foreground">
                <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-muted/30 rounded-lg text-left text-foreground">
                    <div className="flex-1 space-y-2 text-left text-foreground">
                        <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5"><Filter className="h-3 w-3"/> Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Researching</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 space-y-2 text-left text-foreground">
                        <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5"><Users className="h-3 w-3"/> Assignee</Label>
                        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Staff</SelectItem>
                                <SelectItem value="none">Unallocated</SelectItem>
                                {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {isLoading ? <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div> : <DataTable columns={columns} data={filteredRecords} />}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
