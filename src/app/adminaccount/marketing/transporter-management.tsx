'use client';

import * as React from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Loader2, PlusCircle, Truck, Edit, Trash2, Send, Download, Save, Search, Filter, Users, Zap, Globe, RefreshCcw, Database, Upload, Copy, Tag, AlertTriangle, CheckCircle, Sparkles, RotateCcw } from 'lucide-react';
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
import { transporterCategories } from './transporter-discovery';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

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
      <DialogContent className="sm:max-w-3xl text-left text-foreground">
        <DialogHeader><DialogTitle>{partner ? 'Edit' : 'Add'} Transporter</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2 text-left text-foreground">
            <div className="grid grid-cols-2 gap-4 text-left">
              <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Entity Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Key Contact</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-left">
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="industrial_category" render={({ field }) => (
                    <FormItem className="text-left text-foreground">
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-white text-left text-foreground"><SelectValue placeholder="Classify..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                {transporterCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )} />
            </div>
            
            <Separator />
            <div className="space-y-4 text-left text-foreground">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2 text-left">
                    <Sparkles className="h-4 w-4"/> Forensic Technical Profile
                </h3>
                <FormField control={form.control} name="minedServiceWording" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Scraped About/Hero Text</FormLabel>
                        <FormControl><Textarea placeholder="Deep-crawled operational and fleet capability statements..." className="min-h-[120px]" {...field} /></FormControl>
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
                <FormItem className="text-left text-foreground">
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-white text-left text-foreground"><SelectValue placeholder="Select status..." /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Searching</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="active">Active Haulier</SelectItem>
                        </SelectContent>
                    </Select>
                </FormItem>
            )} />
            <DialogFooter className="pt-4 border-t text-left">
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

export default function TransporterManagement() {
  const { toast } = useToast();
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{ type: 'add' | 'edit' | 'delete' | 'engage' | 'batch' | null, data?: any, initialIndex?: number }>({ type: null });

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
        performAdminAction(token, 'searchRegistry', { type: 'transporter', term: searchTerm, integrityFilter, outreachFilter }),
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
  }, [searchTerm, integrityFilter, outreachFilter, toast]);

  useEffect(() => { 
    if (hasLoaded) fetchData(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integrityFilter, outreachFilter, statusFilter, assigneeFilter]);

  const filteredRecords = useMemo(() => {
    return allRecords.filter(r => {
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        const matchesAssignee = assigneeFilter === 'all' || r.assigneeId === assigneeFilter;
        return matchesStatus && matchesAssignee;
    });
  }, [allRecords, statusFilter, assigneeFilter]);

  const handleExport = () => {
      if (filteredRecords.length === 0) {
          toast({ variant: 'destructive', title: "No data to export" });
          return;
      }
      downloadDataAsCSV(filteredRecords, `transporters-export-${new Date().toISOString().split('T')[0]}.csv`);
      toast({ title: "Export Complete" });
  };

  const handleEngage = (record: any) => {
    const indexInSelected = selectedIds.indexOf(record.id);
    const engageList = selectedIds.length > 0 
        ? allRecords.filter(r => selectedIds.includes(r.id)) 
        : [record];
        
    setDialog({ 
        type: 'engage', 
        data: engageList, 
        initialIndex: Math.max(0, indexInSelected) 
    });
  };

  const handleBatchEngage = () => {
    if (selectedIds.length === 0) return;
    const engageList = allRecords.filter(r => selectedIds.includes(r.id));
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
        header: 'Transporter Name', 
        cell: ({ row }) => (
            <div className="flex flex-col text-sm text-left text-foreground">
                <span className="font-bold text-left">{row.original.companyName || row.original.contactPerson || 'N/A'}</span>
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
        header: 'Outreach',
        cell: ({ row }) => {
            if (!row.original.lastOutreachSubject) return <span className="text-[10px] text-muted-foreground italic text-left">None</span>;
            return (
                <div className="flex flex-col text-left">
                    <Badge variant="outline" className="text-[9px] h-4 border-primary/20 text-primary uppercase font-bold truncate max-w-[100px]">{row.original.lastOutreachSubject}</Badge>
                    <span className="text-[8px] text-muted-foreground mt-0.5">{formatDateSafe(row.original.lastOutreachAt, "dd/MM")}</span>
                </div>
            );
        }
    },
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
    <div className="space-y-6 text-left text-foreground">
      <BatchResearchDialog open={dialog.type === 'batch'} onOpenChange={(o) => !o && setDialog({ type: null })} selectedLeads={allRecords.filter(r => selectedIds.includes(r.id))} onComplete={fetchData} />
      <EngageDialog 
        open={dialog.type === 'engage'} 
        onOpenChange={(o) => !o && setDialog({ type: null })} 
        partners={Array.isArray(dialog.data) ? dialog.data : [dialog.data]} 
        initialIndex={dialog.initialIndex}
        audience="transporters" 
        onEngageSuccess={fetchData} 
      />
      <TransporterDialog open={dialog.type === 'add' || dialog.type === 'edit'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.type === 'edit' ? dialog.data : undefined} onSave={fetchData} />
      
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(o) => !o && setDialog({ type: null })}>
        <AlertDialogContent className="text-left text-foreground">
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
      
      <div className="space-y-6 text-left text-foreground">
        {!hasLoaded ? (
             <Card className="bg-primary/5 border-primary/20 p-12 text-center text-foreground">
                <Database className="mx-auto h-16 w-16 text-primary/20 mb-4" />
                <h2 className="text-2xl font-black font-headline mb-2 text-foreground text-center">Transporter Forensic Scan</h2>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8 text-center">Execute a targeted scan of the master haulier registry. Filter by outreach step to follow up on your sequence.</p>
                <div className="flex flex-col md:flex-row justify-center gap-4 max-w-4xl mx-auto text-left">
                    <div className="flex-1 space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Company, Category or ID</Label>
                        <Input placeholder="Search criteria..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchData()} className="h-12 text-lg bg-white" />
                    </div>
                    <div className="w-40 space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Integrity</Label>
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
                    <div className="w-56 space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Outreach Stage</Label>
                        <Select value={outreachFilter} onValueChange={setOutreachFilter}>
                            <SelectTrigger className="h-12 bg-white text-left"><SelectValue placeholder="All Stages" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Stages</SelectItem>
                                <SelectItem value="Digital Handshake">Step 0: Handshake</SelectItem>
                                <SelectItem value="Company Profile">Step 1: Profile</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button size="lg" onClick={fetchData} disabled={isLoading} className="h-12 px-8 self-end font-bold">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
                        Execute Scan
                    </Button>
                </div>
            </Card>
        ) : (
            <>
                <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                    <div className="text-left text-foreground">
                        <CardTitle className="flex items-center gap-2 text-2xl font-black font-headline text-left text-foreground"><Truck /> Transporter Registry</CardTitle>
                        <CardDescription className="text-left text-foreground">Unified database view ({allRecords.length} results).</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-left text-foreground">
                        {selectedIds.length > 0 && (
                            <>
                                <Button variant="secondary" onClick={handleBatchEngage} className="gap-2 shadow-sm font-bold">
                                    <Send className="h-4 w-4" /> Batch Engage ({selectedIds.length})
                                </Button>
                                <Button variant="destructive" onClick={() => setDialog({ type: 'delete' })} className="gap-2 text-left">
                                    <Trash2 className="h-4 w-4" /> Delete Selected ({selectedIds.length})
                                </Button>
                            </>
                        )}
                        <Button variant="outline" onClick={handleExport} disabled={isLoading} className="text-foreground">
                            <Download className="mr-2 h-4 w-4" /> Export Filtered
                        </Button>
                        <BulkImportDialog type="transporter" onComplete={fetchData}><Button variant="outline" className="text-foreground"><Upload className="mr-2 h-4 w-4" /> Import</Button></BulkImportDialog>
                        <Button onClick={() => setDialog({ type: 'add' })} className="text-foreground"><PlusCircle className="mr-2 h-4 w-4" /> Add Record</Button>
                    </div>
                </CardHeader>

                <Card className="border-primary/10 shadow-sm overflow-hidden text-left text-foreground">
                    <CardContent className="pt-6 text-left text-foreground">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-muted/30 rounded-lg text-left text-foreground">
                            <div className="md:col-span-2 space-y-2 text-left">
                                <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5 text-left text-foreground"><Search className="h-3 w-3"/> Forensic Search</Label>
                                <div className="flex gap-2 text-left text-foreground">
                                    <Input placeholder="Refine current scan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchData()} />
                                    <Button onClick={fetchData} disabled={isLoading} className="text-foreground"><Search className="h-4 w-4"/></Button>
                                </div>
                            </div>
                            <div className="flex-1 space-y-2 text-left">
                                <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5 text-left text-foreground"><Filter className="h-3 w-3"/> Integrity</Label>
                                <Select value={integrityFilter} onValueChange={setIntegrityFilter}>
                                    <SelectTrigger className="bg-white text-left text-foreground"><SelectValue placeholder="All" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Records</SelectItem>
                                        <SelectItem value="has-email">Has Email</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="flex-1 space-y-2 text-left">
                                <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5 text-left text-foreground"><Send className="h-3 w-3"/> Outreach</Label>
                                <Select value={outreachFilter} onValueChange={setOutreachFilter}>
                                    <SelectTrigger className="bg-white text-left text-foreground"><SelectValue placeholder="All Stages" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Stages</SelectItem>
                                        <SelectItem value="Digital Handshake">Handshake</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button variant="outline" onClick={() => setHasLoaded(false)} className="h-10 w-full text-foreground"><RotateCcw className="mr-1 h-3 w-3" /> New Search</Button>
                            </div>
                        </div>
                        {isLoading ? <div className="flex justify-center items-center py-10 text-foreground text-foreground"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div> : <DataTable columns={columns} data={filteredRecords} onSelectionChange={setSelectedIds} />}
                    </CardContent>
                </Card>
            </>
        )}
      </div>
    </div>
  );
}
