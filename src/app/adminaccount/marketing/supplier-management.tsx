
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { 
  Loader2, PlusCircle, Building, Edit, Trash2, Send, Download, Save, Search, Filter, Users, Globe, Zap, Upload, RefreshCcw, Database, Tag, Sparkles, RotateCcw, Clock, UserCheck 
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
import { Separator } from '@/components/ui/separator';
import { supplierCategories } from './discovery-engine';

async function performAdminAction(token: string, action: string, payload: any) {
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

const partnerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional().or(z.literal('')),
  lastName: z.string().min(1, 'Last name is required').optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  mobile: z.string().optional().or(z.literal('')),
  contactPerson: z.string().optional().or(z.literal('')),
  companyName: z.string().optional().or(z.literal('')),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  minedServiceWording: z.string().optional().or(z.literal('')),
  industrialTags: z.array(z.string()).optional().default([]),
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
      if (partner) form.reset(partner);
      else form.reset({ firstName: '', lastName: '', email: '', phone: '', mobile: '', contactPerson: '', companyName: '', status: 'new', type: 'supplier' });
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
      <DialogContent className="sm:max-w-3xl text-left text-foreground">
        <DialogHeader>
          <DialogTitle>{partner ? 'Edit' : 'Add'} Supplier</DialogTitle>
          <DialogDescription>Update verified record details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2 text-left">
            <div className="grid grid-cols-2 gap-4 text-left">
              <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Entity Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Key Decision Maker</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-left">
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Direct E-mail</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="mobile" render={({ field }) => (<FormItem><FormLabel>Mobile (Direct Cell)</FormLabel><FormControl><Input placeholder="+27 82..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="website" render={({ field }) => (<FormItem className="text-left"><FormLabel>Corporate Website</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            
            <Separator />
            <div className="space-y-4 text-left">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Sparkles className="h-4 w-4"/> Forensic Technical Profile
                </h3>
                <FormField control={form.control} name="minedServiceWording" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Scraped About/Hero Text</FormLabel>
                        <FormControl><Textarea placeholder="Deep-crawled mission and product statements..." className="min-h-[150px]" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="industrialTags" render={({ field }) => (
                    <FormItem>
                        <FormLabel>ML Extracted Keywords (comma separated)</FormLabel>
                        <FormControl>
                            <Input 
                                placeholder="e.g. LFP Storage, Deep Cycle, Marine Batteries..." 
                                value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                                onChange={(e) => field.onChange(e.target.value.split(',').map(t => t.trim()).slice(0, 7))}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem className="text-left">
                    <FormLabel>Pipeline Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-white text-left"><SelectValue placeholder="Select status..." /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="new">New Lead</SelectItem>
                            <SelectItem value="contacted">Researching</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="active">Active Provider</SelectItem>
                        </SelectContent>
                    </Select>
                </FormItem>
            )} />
            <DialogFooter className="pt-4 border-t">
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

export default function SupplierManagement() {
  const { toast } = useToast();
  const [partners, setPartners] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{ type: 'add' | 'edit' | 'delete' | 'engage' | null, data?: any, initialIndex?: number }>({ type: null });

  // Independent Search States
  const [searchCompany, setSearchCompany] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchTag, setSearchTag] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [integrityFilter, setIntegrityFilter] = useState('all');
  const [outreachFilter, setOutreachFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      const [res, staffRes] = await Promise.all([
        performAdminAction(token, 'searchRegistry', { 
            type: 'supplier', 
            searchCompany, 
            searchKeyword, 
            searchTag,
            category: categoryFilter,
            integrityFilter, 
            outreachFilter 
        }),
        performAdminAction(token, 'getPlatformStaff', {})
      ]);
      setPartners(res.data || []);
      setStaff(staffRes.data || []);
      setHasLoaded(true);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Fetch Error', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [searchCompany, searchKeyword, searchTag, categoryFilter, integrityFilter, outreachFilter, toast]);

  useEffect(() => { 
    if (hasLoaded) fetchData(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integrityFilter, outreachFilter, statusFilter, assigneeFilter]);

  const filteredRecords = useMemo(() => {
    return partners.filter(p => {
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchesAssignee = assigneeFilter === 'all' || p.assigneeId === assigneeFilter;
        return matchesStatus && matchesAssignee;
    });
  }, [partners, statusFilter, assigneeFilter]);

  const handleExport = () => {
      if (filteredRecords.length === 0) {
          toast({ variant: 'destructive', title: "No data to export" });
          return;
      }
      downloadDataAsCSV(filteredRecords, `suppliers-export-${new Date().toISOString().split('T')[0]}.csv`);
      toast({ title: "Export Complete" });
  };

  const handleEngage = (record: any) => {
    const indexInSelected = selectedIds.indexOf(record.id);
    const engageList = selectedIds.length > 0 
        ? partners.filter(p => selectedIds.includes(p.id)) 
        : [record];
        
    setDialog({ 
        type: 'engage', 
        data: engageList, 
        initialIndex: Math.max(0, indexInSelected) 
    });
  };

  const handleBatchEngage = () => {
    if (selectedIds.length === 0) return;
    const engageList = partners.filter(p => selectedIds.includes(p.id));
    setDialog({ type: 'engage', data: engageList, initialIndex: 0 });
  };

  async function handleDeleteBatch() {
    if (selectedIds.length === 0) return;
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      await performAdminAction(token, 'deletePartners', { partnerIds: selectedIds });
      toast({ title: 'Batch Deleted', description: `${selectedIds.length} records removed.` });
      fetchData();
      setSelectedIds([]);
      setDialog({ type: null });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  }

  const columns: ColumnDef<any>[] = [
    { 
        accessorKey: 'companyName', 
        header: 'Supplier Name', 
        cell: ({ row }) => (
            <div className="flex flex-col text-sm text-left text-foreground">
                <span className="font-bold text-left">{row.original.companyName || row.original.contactPerson || 'Incomplete Record'}</span>
                <div className="flex flex-wrap gap-1 mt-1 text-left">
                    {row.original.industrialTags?.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-[8px] h-3.5 bg-slate-100 text-slate-600 border-none px-1.5 uppercase font-black">{tag}</Badge>
                    ))}
                    {row.original.website && <Globe className="h-3 w-3 text-primary ml-1" />}
                </div>
            </div>
        )
    },
    { accessorKey: 'mobile', header: 'Mobile' },
    { accessorKey: 'email', header: 'Email' },
    { 
        header: 'Outreach & Result',
        cell: ({ row }) => {
            if (!row.original.lastOutreachSubject) return <span className="text-[10px] text-muted-foreground italic">None</span>;
            return (
                <div className="flex flex-col text-left">
                    <Badge variant="outline" className="text-[9px] h-4 border-primary/20 text-primary uppercase font-bold truncate max-w-[100px]">{row.original.lastOutreachSubject}</Badge>
                    <span className="text-[8px] text-muted-foreground mt-0.5">{formatDateSafe(row.original.lastOutreachAt, "dd/MM")}</span>
                    {row.original.lastOpenedAt && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 mt-1 w-fit">
                            <UserCheck className="h-2.5 w-2.5" />
                            Read {formatDateSafe(row.original.lastOpenedAt, "dd/MM")}
                        </div>
                    )}
                </div>
            );
        }
    },
    { 
        header: 'Status', 
        cell: ({ row }) => {
            const isEnriched = !!(row.original.minedServiceWording || row.original.website);
            return (
                <div className="flex flex-col gap-1 items-center">
                    <Badge variant="outline" className="capitalize text-[10px]">{row.original.status}</Badge>
                    {isEnriched && <Badge className="bg-green-100 text-green-700 border-none text-[9px] h-4 uppercase">Enriched</Badge>}
                </div>
            );
        }
    },
    { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <EnrichPartnerButton partner={row.original} onUpdate={fetchData} />
        <Button variant="ghost" size="icon" onClick={() => handleEngage(row.original)} title="Engage"><Send className="h-4 w-4 text-primary" /></Button>
        <CommunicationLogDialog partnerId={row.original.id} partnerName={row.original.companyName} />
        <PartnerTasksDialog partner={row.original} />
        <PartnerOversightDialog partner={row.original} onUpdate={fetchData} />
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'edit', data: row.original })}><Edit className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'delete', data: row.original })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6 text-left">
      <EngageDialog 
        open={dialog.type === 'engage'} 
        onOpenChange={(o) => !o && setDialog({ type: null })} 
        partners={Array.isArray(dialog.data) ? dialog.data : [dialog.data]} 
        initialIndex={dialog.initialIndex}
        audience="suppliers" 
        onEngageSuccess={fetchData} 
      />
      <SupplierDialog open={dialog.type === 'add' || dialog.type === 'edit'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.type === 'edit' ? dialog.data : undefined} onSave={fetchData} />
      
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(o) => !o && setDialog({ type: null })}>
        <AlertDialogContent className="text-left">
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Delete Record(s)?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialog({ type: null })}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={selectedIds.length > 0 ? handleDeleteBatch : async () => {
                const token = await getClientSideAuthToken();
                if (token && dialog.data) {
                    await performAdminAction(token, 'deletePartner', { partnerId: dialog.data.id });
                    fetchData();
                    setDialog({ type: null });
                }
            }} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6 text-left">
        {!hasLoaded ? (
             <Card className="bg-primary/5 border-primary/20 p-12 text-center text-foreground">
                <Database className="mx-auto h-16 w-16 text-primary/20 mb-4" />
                <h2 className="text-2xl font-black font-headline mb-2 text-foreground text-center">Registry Forensic Search</h2>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8 text-center">Scan the master database of 20,000+ suppliers. Independent variables ensure high-precision filtering.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto text-left">
                    <div className="space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Company Name</Label>
                        <Input placeholder="Search entity names..." value={searchCompany} onChange={(e) => setSearchCompany(e.target.value)} className="h-12 bg-white" />
                    </div>
                    <div className="space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Keywords (About Text)</Label>
                        <Input placeholder="Search services/bios..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} className="h-12 bg-white" />
                    </div>
                    <div className="space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Industrial Tags</Label>
                        <Input placeholder="Search ML tags..." value={searchTag} onChange={(e) => setSearchTag(e.target.value)} className="h-12 bg-white" />
                    </div>
                    <div className="space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Industrial Category</Label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="h-12 bg-white"><SelectValue placeholder="All Categories" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {supplierCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Data Integrity</Label>
                        <Select value={integrityFilter} onValueChange={setIntegrityFilter}>
                            <SelectTrigger className="h-12 bg-white text-left"><SelectValue placeholder="All" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Records</SelectItem>
                                <SelectItem value="has-email">Has Email</SelectItem>
                                <SelectItem value="no-email">No Email</SelectItem>
                                <SelectItem value="has-website">Has WWW</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Outreach Stage</Label>
                        <Select value={outreachFilter} onValueChange={setOutreachFilter}>
                            <SelectTrigger className="h-12 bg-white text-left"><SelectValue placeholder="All Stages" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Stages</SelectItem>
                                <SelectItem value="Digital Handshake">Step 0: Handshake</SelectItem>
                                <SelectItem value="Company Profile">Step 1: Profile</SelectItem>
                                <SelectItem value="Tech Architecture">Step 2: Tech</SelectItem>
                                <SelectItem value="Revenue Model">Step 3: Revenue</SelectItem>
                                <SelectItem value="The Offer">Step 4: Offer</SelectItem>
                                <SelectItem value="The Pitch">Step 5: Pitch</SelectItem>
                                <SelectItem value="The Framework">Step 6: Framework</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="lg:col-span-2 flex items-end">
                        <Button size="lg" onClick={fetchData} disabled={isLoading} className="h-12 w-full font-black uppercase tracking-widest gap-2 shadow-lg">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
                            Execute Deep Scan
                        </Button>
                    </div>
                </div>
            </Card>
        ) : (
            <>
                <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                    <div className="text-left text-foreground">
                        <CardTitle className="flex items-center gap-2 text-2xl font-black font-headline text-left text-foreground"><Building /> Supplier Registry</CardTitle>
                        <CardDescription className="text-left text-foreground">Unified industrial supply directory ({partners.length} results).</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-left">
                        {selectedIds.length > 0 && (
                            <>
                                <Button variant="secondary" onClick={handleBatchEngage} className="gap-2 shadow-sm font-bold">
                                    <Send className="h-4 w-4" /> Batch Engage ({selectedIds.length})
                                </Button>
                                <Button variant="destructive" onClick={() => setDialog({ type: 'delete' })} className="gap-2">
                                    <Trash2 className="h-4 w-4" /> Delete ({selectedIds.length})
                                </Button>
                            </>
                        )}
                        <Button variant="outline" onClick={handleExport} disabled={isLoading} className="text-foreground">
                            <Download className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                        <BulkImportDialog type="supplier" onComplete={fetchData}><Button variant="outline" className="text-foreground"><Upload className="mr-2 h-4 w-4" /> Import</Button></BulkImportDialog>
                        <Button onClick={() => setDialog({ type: 'add' })} className="text-foreground"><PlusCircle className="mr-2 h-4 w-4" /> Add Record</Button>
                    </div>
                </CardHeader>

                <Card className="border-primary/10 shadow-sm overflow-hidden text-left">
                    <CardContent className="pt-6 text-left text-foreground">
                        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6 p-4 bg-muted/30 rounded-lg text-left text-foreground">
                            <div className="space-y-2 text-left">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Company</Label>
                                <Input placeholder="Filter..." value={searchCompany} onChange={(e) => setSearchCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchData()} />
                            </div>
                            <div className="space-y-2 text-left">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Keywords</Label>
                                <Input placeholder="Filter..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchData()} />
                            </div>
                            <div className="space-y-2 text-left">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Tags</Label>
                                <Input placeholder="Filter..." value={searchTag} onChange={(e) => setSearchTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchData()} />
                            </div>
                            <div className="space-y-2 text-left">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Category</Label>
                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="All" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {supplierCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 text-left">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Integrity</Label>
                                <Select value={integrityFilter} onValueChange={setIntegrityFilter}>
                                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="has-email">Has Email</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end text-left gap-2">
                                <Button onClick={fetchData} disabled={isLoading} className="flex-1"><RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} /></Button>
                                <Button variant="outline" onClick={() => setHasLoaded(false)} className="flex-1"><RotateCcw className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        {isLoading ? <div className="flex justify-center items-center py-10 text-foreground"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div> : <DataTable columns={columns} data={filteredRecords} onSelectionChange={setSelectedIds} />}
                    </CardContent>
                </Card>
            </>
        )}
      </div>
    </div>
  );
}
