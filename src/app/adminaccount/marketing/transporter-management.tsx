'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Loader2, PlusCircle, Truck, Edit, Trash2, Send, Download, Save, Search, Filter, Users, Zap, Globe, RefreshCcw, Database, Upload, Copy, Tag, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PartnerOversightDialog } from './PartnerOversightDialog';
import { EngageDialog } from './EngageDialog';
import { CommunicationLogDialog } from './CommunicationLogDialog';
import { PartnerTasksDialog } from './PartnerTasksDialog';
import { downloadDataAsCSV, formatDateSafe, cn } from '@/lib/utils';
import { EnrichPartnerButton } from './EnrichPartnerButton';
import { BatchResearchDialog } from './BatchResearchDialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BulkImportDialog } from './BulkImportDialog';
import { useConfig } from '@/hooks/use-config';
import { transporterCategories } from './transporter-discovery';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
  firstName: z.string().min(1, 'First name is required').optional().or(z.literal('')),
  lastName: z.string().min(1, 'Last name is required').optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  contactPerson: z.string().optional(),
  companyName: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
  minedServiceWording: z.string().optional().or(z.literal('')),
  industrialTags: z.array(z.string()).optional().default([]),
  industrial_category: z.string().optional(),
  status: z.enum(['active', 'inactive', 'contacted', 'new', 'qualified', 'invited', 'registered']),
  type: z.literal('transporter'),
});
type PartnerFormValues = z.infer<typeof partnerSchema>;

function DuplicateCleaner({ onComplete }: { onComplete: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [duplicates, setDuplicates] = useState<any[][]>([]);
    const [incomplete, setIncomplete] = useState<any[]>([]);
    const [selections, setSelections] = useState<Record<number, string>>({});
    const { toast } = useToast();

    const findDuplicates = async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            const res = await performAdminAction(token, 'findDuplicatePartners', { type: 'transporter' });
            setDuplicates(res.duplicates || []);
            setIncomplete(res.incomplete || []);
            setIsOpen(true);
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Search Error", description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClean = async (target: 'duplicates' | 'incomplete') => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            
            let idsToDelete: string[] = [];
            if (target === 'duplicates') {
                idsToDelete = duplicates.flatMap((group, idx) => {
                    const keepId = selections[idx];
                    if (!keepId) return [];
                    return group.filter(p => p.id !== keepId).map(p => p.id);
                });
            } else {
                idsToDelete = incomplete.map(p => p.id);
            }

            if (idsToDelete.length === 0) {
                toast({ title: "No records selected for deletion." });
                setIsLoading(false);
                return;
            }

            await performAdminAction(token, 'deletePartners', { partnerIds: idsToDelete });
            toast({ title: "Cleaned!", description: `${idsToDelete.length} records removed.` });
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
            <Button variant="outline" onClick={findDuplicates} disabled={isLoading} className="gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                Registry Cleaner
            </Button>
            <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Registry Health Tool</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-8">
                        {incomplete.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Incomplete Records ({incomplete.length})</h3>
                                <Button variant="destructive" size="sm" onClick={() => handleClean('incomplete')} disabled={isLoading}>Delete All Incomplete</Button>
                            </div>
                        )}
                        {duplicates.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-amber-600 flex items-center gap-2"><Tag className="h-5 w-5" /> Duplicates</h3>
                                {duplicates.map((group, idx) => (
                                    <div key={idx} className="p-4 border rounded-lg bg-muted/20 space-y-2 text-left">
                                        <p className="font-bold text-sm">{group[0].companyName}</p>
                                        <div className="space-y-1">
                                            {group.map(p => (
                                                <div key={p.id} className="flex items-center gap-2 text-xs">
                                                    <Checkbox checked={selections[idx] === p.id} onCheckedChange={() => setSelections({...selections, [idx]: p.id})}/>
                                                    <span className="text-muted-foreground font-mono">{p.id}</span>
                                                    <span>{p.email || 'No Email'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <Button variant="secondary" className="w-full" onClick={() => handleClean('duplicates')} disabled={isLoading}>Clean Selected</Button>
                            </div>
                        )}
                        {incomplete.length === 0 && duplicates.length === 0 && (
                            <div className="text-center py-20">
                                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                <p className="text-lg font-bold">Registry is Clean!</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

function TransporterDialog({ open, onOpenChange, partner, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; partner?: any; onSave: () => void; }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<PartnerFormValues>({ 
    resolver: zodResolver(partnerSchema),
    defaultValues: { type: 'transporter', status: 'new' }
  });

  useEffect(() => {
    if (open) {
      if (partner) {
        form.reset({
            ...partner,
            website: partner.website || '',
            notes: partner.notes || '',
            address: partner.address || '',
            industrial_category: partner.industrial_category || partner.category || '',
        });
      }
      else form.reset({ firstName: '', lastName: '', email: '', phone: '', mobile: '', contactPerson: '', companyName: '', status: 'new', type: 'transporter' });
    }
  }, [open, partner, form]);

  const handleFormSubmit = async (values: PartnerFormValues) => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");
      await performAdminAction(token, 'savePartner', { partner: { id: partner?.id, ...values, type: 'transporter' } });
      toast({ title: 'Record Saved' });
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
      <DialogContent className="sm:max-w-3xl text-left">
        <DialogHeader><DialogTitle>{partner ? 'Edit' : 'Add'} Transporter</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2 text-left">
            <div className="grid grid-cols-2 gap-4 text-left">
              <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem className="text-left"><FormLabel>Entity Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4 text-left">
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="industrial_category" render={({ field }) => (
                    <FormItem className="text-left">
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Classify..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                {transporterCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )} />
            </div>
            
            <Separator />
            <div className="space-y-4 text-left">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Sparkles className="h-4 w-4"/> Forensic Technical Profile
                </h3>
                <FormField control={form.control} name="minedServiceWording" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Scraped About/Hero Text</FormLabel>
                        <FormControl><Textarea placeholder="Deep-crawled operational and fleet capability statements..." className="min-h-[150px]" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="industrialTags" render={({ field }) => (
                    <FormItem>
                        <FormLabel>ML Extracted Keywords (comma separated)</FormLabel>
                        <FormControl>
                            <Input 
                                placeholder="e.g. SADC Corridor, 34t Side-Tipper, Tri-Axle Reefer..." 
                                value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                                onChange={(e) => field.onChange(e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0))}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem className="text-left">
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Select status..." /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Searching</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                        </SelectContent>
                    </Select>
                </FormItem>
            )} />
            <DialogFooter className="pt-4 border-t text-left">
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

export default function TransporterManagement() {
  const { toast } = useToast();
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{ type: 'add' | 'edit' | 'delete' | 'engage' | 'batch' | null, data?: any }>({ type: null });

  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const { data: statsData, forceRefresh: refreshStats } = useConfig<any>('transporterDiscoveryStats');
  const counts = statsData?.counts || {};

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      const [res, staffRes] = await Promise.all([
        performAdminAction(token, 'getPartnersByType', { type: 'transporter' }),
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

  const handleRefreshTally = async () => {
    setIsRefreshing(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) return;
        await performAdminAction(token, 'refreshTransporterCategoryCounts', {});
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
    return allRecords.filter(r => {
        const matchesText = !searchTerm || 
            (r.companyName?.toLowerCase().includes(term)) ||
            (r.firstName?.toLowerCase().includes(term)) ||
            (r.lastName?.toLowerCase().includes(term)) ||
            (r.email?.toLowerCase().includes(term));
            
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        const matchesAssignee = assigneeFilter === 'all' || r.assigneeId === assigneeFilter;

        return matchesText && matchesStatus && matchesAssignee;
    });
  }, [allRecords, searchTerm, statusFilter, assigneeFilter]);

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
        header: 'Transporter Name', 
        cell: ({ row }) => (
            <div className="flex flex-col text-sm text-left">
                <span className="font-bold text-left">{row.original.companyName}</span>
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
        header: 'Status', 
        cell: ({ row }) => {
            const isEnriched = !!(row.original.minedServiceWording || row.original.website);
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
    <div className="space-y-6 text-left">
      <EngageDialog open={dialog.type === 'engage'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.data} audience="transporters" onEngageSuccess={fetchData} />
      <TransporterDialog open={dialog.type === 'add' || dialog.type === 'edit'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.type === 'edit' ? dialog.data : undefined} onSave={fetchData} />
      
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(o) => !o && setDialog({ type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Record(s)?</AlertDialogTitle><AlertDialogDescription>Delete Selected?</AlertDialogDescription></AlertDialogHeader>
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
        <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
            <div className="text-left">
                <CardTitle className="flex items-center gap-2 text-2xl font-black font-headline text-left"><Truck /> Transporter Registry</CardTitle>
                <CardDescription className="text-left">Unified database view ({allRecords.length} records).</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-left">
                <DuplicateCleaner onComplete={fetchData} />
                {selectedIds.length > 0 && (
                    <Button variant="destructive" onClick={() => setDialog({ type: 'delete' })} className="gap-2">
                        <Trash2 className="h-4 w-4" /> Delete Selected ({selectedIds.length})
                    </Button>
                )}
                <div className="relative w-64 text-left">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search registry..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 bg-white" />
                </div>
                <Button variant="outline" onClick={() => downloadDataAsCSV(allRecords, 'transporters-export.csv')} disabled={isLoading}>
                    <Download className="mr-2 h-4 w-4" /> Export
                </Button>
                <BulkImportDialog type="transporter" onComplete={fetchData}><Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import</Button></BulkImportDialog>
                <Button onClick={() => setDialog({ type: 'add' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Record</Button>
            </div>
        </CardHeader>

        <Card className="border-primary/10 shadow-sm overflow-hidden text-left">
            <CardHeader className="bg-muted/30 border-b text-left">
                 <div className="flex items-center justify-between text-left">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <Database className="h-3 w-3" /> Category Tally
                    </Label>
                    <Button variant="ghost" size="sm" onClick={handleRefreshTally} className="h-6 text-[9px] uppercase font-black tracking-tighter" disabled={isRefreshing}>
                        {isRefreshing ? <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin"/> : <RefreshCcw className="mr-1 h-2.5 w-2.5"/>} Refresh Counts
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3 text-left">
                    {transporterCategories.map(cat => (
                        <div key={cat} className="flex items-center bg-white border rounded-full pl-3 pr-1 py-0.5 shadow-sm">
                            <span className="text-[9px] font-bold text-slate-600 mr-2">{cat}</span>
                            <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black h-4 px-1.5 min-w-[20px] justify-center">
                                {counts[cat] || 0}
                            </Badge>
                        </div>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="pt-6 text-left">
                <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-muted/30 rounded-lg text-left">
                    <div className="flex-1 space-y-2 text-left">
                        <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5"><Filter className="h-3 w-3"/> Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Searching</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 space-y-2 text-left">
                        <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5"><Users className="h-3 w-3"/> Assignee</Label>
                        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="All Staff" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Staff</SelectItem>
                                <SelectItem value="none">Unallocated</SelectItem>
                                {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {isLoading ? <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div> : <DataTable columns={columns} data={filteredRecords} onSelectionChange={setSelectedIds} />}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
