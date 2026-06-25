
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
  Loader2, PlusCircle, Building, Edit, Trash2, Send, Download, Save, Search, Filter, Users, Globe, Zap, Upload, RefreshCcw, Database, Tag, Sparkles, RotateCcw, UserCheck, ChevronDown, ChevronLeft, ChevronRight 
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

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
      throw new Error("Server returned non-JSON response. Check network for HTML error page.");
  }

  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || `API Error for action: ${action}`);
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
        <DialogHeader><DialogTitle>{partner ? 'Edit' : 'Add'} Supplier</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2 text-left">
            <div className="grid grid-cols-2 gap-4 text-left">
              <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Entity Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Key Decision Maker</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-left">
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Direct E-mail</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="mobile" render={({ field }) => (<FormItem className="text-left"><FormLabel>Mobile (Direct Cell)</FormLabel><FormControl><Input placeholder="+27 82..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="website" render={({ field }) => (<FormItem className="text-left"><FormLabel>Corporate Website</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <Separator />
            <div className="space-y-4 text-left">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2 text-left"><Sparkles className="h-4 w-4"/> Forensic Technical Profile</h3>
                <FormField control={form.control} name="minedServiceWording" render={({ field }) => (<FormItem><FormLabel>Scraped About/Hero Text</FormLabel><FormControl><Textarea placeholder="Deep-crawled statements..." className="min-h-[150px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="industrialTags" render={({ field }) => (<FormItem><FormLabel>ML Extracted Keywords</FormLabel><FormControl><Input placeholder="e.g. Parts, Tires..." value={Array.isArray(field.value) ? field.value.join(', ') : ''} onChange={(e) => field.onChange(e.target.value.split(',').map(t => t.trim()))}/></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem className="text-left"><FormLabel>Pipeline Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="bg-white text-left text-foreground"><SelectValue placeholder="Select status..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="new">New Lead</SelectItem><SelectItem value="contacted">Researching</SelectItem><SelectItem value="qualified">Qualified</SelectItem><SelectItem value="active">Active Provider</SelectItem></SelectContent></Select></FormItem>
            )} />
            <DialogFooter className="pt-4 border-t text-left">
              <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} Save Record</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function SupplierManagement() {
  const { toast } = useToast();
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{ type: 'add' | 'edit' | 'delete' | 'engage' | null, data?: any, initialIndex?: number }>({ type: null });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [jumpPageInput, setJumpPageInput] = useState('1');

  // Filter State
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [outreachFilter, setOutreachFilter] = useState('all');
  const [enrichmentFilter, setEnrichmentFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchData = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      const res = await performAdminAction(token, 'searchRegistry', { 
            type: 'supplier', term: searchTerm, category: categoryFilter === 'all' ? '' : categoryFilter, outreachFilter, enrichmentFilter, page, limit: 100 
      });
      const staffRes = await performAdminAction(token, 'getPlatformStaff', {});
      setAllRecords(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalRecords(res.totalCount || 0);
      setCurrentPage(res.currentPage || 1);
      setJumpPageInput(String(res.currentPage || 1));
      setStaff(staffRes.data || []);
      setHasLoaded(true);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Fetch Error', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, categoryFilter, outreachFilter, enrichmentFilter, toast]);

  useEffect(() => { if (hasLoaded) fetchData(currentPage); }, [currentPage, hasLoaded, fetchData]);

  const handleJumpPage = (e: React.FormEvent) => {
      e.preventDefault();
      const pageNum = parseInt(jumpPageInput, 10);
      if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
          toast({ variant: 'destructive', title: 'Invalid Page', description: `Page must be between 1 and ${totalPages}.` });
          return;
      }
      setCurrentPage(pageNum);
  };

  const filteredRecords = useMemo(() => {
    return allRecords.filter(p => {
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchesAssignee = assigneeFilter === 'all' || p.assigneeId === assigneeFilter;
        return matchesStatus && matchesAssignee;
    });
  }, [allRecords, statusFilter, assigneeFilter]);

  const handleExport = () => {
      if (filteredRecords.length === 0) return;
      downloadDataAsCSV(filteredRecords, `suppliers-backup-${new Date().toISOString().split('T')[0]}.csv`);
      toast({ title: "Backup Exported", description: "Filtered registry saved to CSV." });
  };

  const handleEngage = (record: any) => {
    const indexInSelected = selectedIds.indexOf(record.id);
    const engageList = selectedIds.length > 0 
        ? allRecords.filter(r => selectedIds.includes(r.id)) 
        : [record];
    setDialog({ type: 'engage', data: engageList, initialIndex: Math.max(0, indexInSelected) });
  };

  const columns: ColumnDef<any>[] = [
    { 
        accessorKey: 'companyName', 
        header: 'Supplier Name', 
        cell: ({ row }) => (
            <div className="flex flex-col text-sm text-left">
                <span className="font-bold text-foreground">{row.original.companyName || <span className="text-destructive italic font-normal">Unnamed Entity</span>}</span>
                <div className="flex items-center gap-1.5 mt-1">
                    {row.original.website && <Globe className="h-3 w-3 text-primary" />}
                    <span className="text-[10px] text-muted-foreground uppercase font-black">{row.original.entryType || 'Supplier'}</span>
                </div>
            </div>
        )
    },
    { 
        accessorKey: 'contactPerson', 
        header: 'Key Decision Maker',
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.contactPerson || 'N/A'}</span>
    },
    { accessorKey: 'mobile', header: 'Mobile' },
    { accessorKey: 'email', header: 'Email' },
    { 
        accessorKey: 'lastOutreachAt',
        header: 'Outreach & Result',
        cell: ({ row }) => {
            if (!row.original.lastOutreachSubject) return <span className="text-[10px] text-muted-foreground italic">None</span>;
            return (
                <div className="flex flex-col text-left">
                    <Badge variant="outline" className="text-[9px] h-4 border-primary/20 text-primary uppercase font-bold truncate max-w-[100px]">{row.original.lastOutreachSubject}</Badge>
                    <span className="text-[8px] text-muted-foreground mt-0.5">{formatDateSafe(row.original.lastOutreachAt, "dd/MM")}</span>
                    {row.original.lastOpenedAt && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 mt-1 w-fit">
                            <UserCheck className="h-2.5 w-2.5" /> Read
                        </div>
                    )}
                </div>
            );
        }
    },
    { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <EnrichPartnerButton partner={row.original} onUpdate={() => fetchData(currentPage)} />
        <Button variant="ghost" size="icon" onClick={() => handleEngage(row.original)} title="Engage"><Send className="h-4 w-4 text-primary" /></Button>
        <CommunicationLogDialog partnerId={row.original.id} partnerName={row.original.companyName} />
        <PartnerTasksDialog partner={row.original} />
        <PartnerOversightDialog partner={row.original} onUpdate={() => fetchData(currentPage)} />
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'edit', data: row.original })}><Edit className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => { setDialog({ type: 'delete', data: row.original }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6 text-left text-foreground">
      <EngageDialog open={dialog.type === 'engage'} onOpenChange={(o) => !o && setDialog({ type: null })} partners={dialog.data || []} initialIndex={dialog.initialIndex} audience="suppliers" onEngageSuccess={() => fetchData(currentPage)} />
      <SupplierDialog open={dialog.type === 'add' || dialog.type === 'edit'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.type === 'edit' ? dialog.data : undefined} onSave={() => fetchData(currentPage)} />
      
      {!hasLoaded ? (
            <Card className="bg-primary/5 border-primary/20 p-12 text-center text-foreground">
                <Database className="mx-auto h-16 w-16 text-primary/20 mb-4" />
                <h2 className="text-2xl font-black font-headline mb-2 text-center">Supplier Registry Deep-Scan</h2>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8 text-center">Scan the database. Use filters like "No Outreach Yet" to build targeted engagement worklists.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto text-left">
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Company Name</Label><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-12 bg-white" /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Outreach Stage</Label><Select value={outreachFilter} onValueChange={setOutreachFilter}><SelectTrigger className="h-12 bg-white"><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All Stages</SelectItem><SelectItem value="none">No Outreach Yet</SelectItem><SelectItem value="Digital Handshake">Handshake Sent</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Enrichment</Label><Select value={enrichmentFilter} onValueChange={setEnrichmentFilter}><SelectTrigger className="h-12 bg-white"><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="enriched">Enriched</SelectItem><SelectItem value="unenriched">Unenriched</SelectItem></SelectContent></Select></div>
                    <div className="flex items-end gap-2"><Button size="lg" onClick={() => { setCurrentPage(1); fetchData(1); }} disabled={isLoading} className="flex-1 h-12 font-black uppercase tracking-widest gap-2 shadow-lg">{isLoading ? <Loader2 className="animate-spin h-4 w-4"/> : <Search className="h-4 w-4"/>} Scan</Button><Button variant="outline" size="lg" onClick={() => { setResultsLimit(100); fetchData(1); }} className="h-12">Recent</Button></div>
                </div>
            </Card>
      ) : (
            <div className="space-y-6">
                <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-left"><CardTitle className="text-2xl font-black font-headline flex items-center gap-2"><Building /> Supplier Registry</CardTitle><CardDescription>Full industrial database view ({totalRecords.toLocaleString()} records).</CardDescription></div>
                    <div className="flex flex-wrap items-center gap-2">
                        {selectedIds.length > 0 && <Button variant="secondary" onClick={() => handleEngage(null)} className="gap-2 shadow-sm font-bold animate-in fade-in zoom-in"><Send className="h-4 w-4" /> Batch Engage ({selectedIds.length})</Button>}
                        <Button variant="outline" onClick={handleExport} disabled={isLoading}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
                        <BulkImportDialog type="supplier" onComplete={() => fetchData(currentPage)}><Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import</Button></BulkImportDialog>
                        <Button onClick={() => setDialog({ type: 'add' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Record</Button>
                    </div>
                </CardHeader>
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-muted/30 rounded-lg text-left">
                            <div className="space-y-1"><Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><Filter className="h-3 w-3"/> Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-9 bg-white text-xs text-foreground"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="new">New</SelectItem><SelectItem value="contacted">Researching</SelectItem></SelectContent></Select></div>
                            <div className="space-y-1"><Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><Users className="h-3 w-3"/> Assignee</Label><Select value={assigneeFilter} onValueChange={setAssigneeFilter}><SelectTrigger className="h-9 bg-white text-xs text-foreground"><SelectValue placeholder="All Staff" /></SelectTrigger><SelectContent><SelectItem value="all">All Staff</SelectItem><SelectItem value="none">Unallocated</SelectItem>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent></Select></div>
                            <div className="space-y-1"><Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><Send className="h-3 w-3"/> Outreach</Label><Select value={outreachFilter} onValueChange={setOutreachFilter}><SelectTrigger className="h-9 bg-white text-xs text-foreground"><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="none">No Outreach Yet</SelectItem><SelectItem value="Digital Handshake">Handshake Sent</SelectItem></SelectContent></Select></div>
                            <div className="space-y-1"><Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><Sparkles className="h-3 w-3"/> Enrichment</Label><Select value={enrichmentFilter} onValueChange={setEnrichmentFilter}><SelectTrigger className="h-9 bg-white text-xs text-foreground"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="enriched">Enriched</SelectItem><SelectItem value="unenriched">Unenriched</SelectItem></SelectContent></Select></div>
                            <div className="flex items-end"><Button variant="outline" onClick={() => setHasLoaded(false)} className="h-9 w-full text-xs font-bold uppercase tracking-widest text-foreground"><RotateCcw className="mr-1 h-3 w-3" /> Reset Variables</Button></div>
                        </div>
                        {isLoading ? <div className="flex justify-center items-center py-20 text-foreground"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div> : (
                            <div className="space-y-6">
                                <DataTable columns={columns} data={filteredRecords} onSelectionChange={setSelectedIds} />
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t">
                                    <div className="text-sm text-muted-foreground font-medium text-foreground">Showing {allRecords.length} of {totalRecords.toLocaleString()} records</div>
                                    <div className="flex items-center gap-4 text-foreground">
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                                            <form onSubmit={handleJumpPage} className="flex items-center gap-2"><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Page</span><Input className="w-16 h-8 text-center font-bold font-mono text-foreground" value={jumpPageInput} onChange={e => setJumpPageInput(e.target.value)}/><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">of {totalPages}</span></form>
                                            <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                    <Button variant="outline" onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages} className="min-w-[180px] font-bold text-foreground text-foreground">Load Next 100 Records</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
      )}
    </div>
  );
}
