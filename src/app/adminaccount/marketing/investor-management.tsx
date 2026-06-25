
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Loader2, PlusCircle, DollarSign, Edit, Trash2, Send, Globe, Search, Download, Save, Filter, Users, UserCheck, ChevronDown, Database, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  status: z.enum(['active', 'inactive', 'contacted', 'new', 'qualified', 'invited']),
  type: z.literal('investor'),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
  notes: z.string().optional(),
  address: z.string().optional(),
});
type PartnerFormValues = z.infer<typeof partnerSchema>;

function InvestorDialog({ open, onOpenChange, partner, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; partner?: any; onSave: () => void; }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<PartnerFormValues>({ 
    resolver: zodResolver(partnerSchema),
    defaultValues: { type: 'investor', status: 'new' }
  });

  useEffect(() => {
    if (open) {
      if (partner) form.reset(partner);
      else form.reset({ firstName: '', lastName: '', email: '', phone: '', mobile: '', contactPerson: '', companyName: '', status: 'new', type: 'investor', website: '', notes: '', address: '' });
    }
  }, [open, partner, form]);

  const handleFormSubmit = async (values: PartnerFormValues) => {
    setIsLoading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        await performAdminAction(token, 'savePartner', { partner: { id: partner?.id, ...values, type: 'investor' } });
        toast({ title: 'Investor Saved' });
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
                <DialogTitle>{partner ? 'Edit' : 'Add'} App Launch Investor</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2 text-left">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                    <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>Fund Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <div className="grid grid-cols-2 gap-4 text-foreground">
                        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email"/></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="mobile" render={({ field }) => ( <FormItem><FormLabel>Mobile (Direct)</FormLabel><FormControl><Input placeholder="+27 82..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                    <FormField control={form.control} name="status" render={({ field }) => ( 
                        <FormItem>
                            <FormLabel>Pipeline Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Select status..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="contacted">Researching</SelectItem>
                                    <SelectItem value="qualified">Qualified</SelectItem>
                                    <SelectItem value="active">Active Partner</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
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

export default function InvestorManagement() {
  const { toast } = useToast();
  const [partners, setPartners] = useState<any[]>([]);
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

  const [statusFilter, setStatusFilter] = useState('all');
  const [outreachFilter, setOutreachFilter] = useState('all');
  const [enrichmentFilter, setEnrichmentFilter] = useState('all');

  const fetchData = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) return;
        const res = await performAdminAction(token, 'searchRegistry', { type: 'investor', term: searchTerm, outreachFilter, enrichmentFilter, page, limit: 100 });
        const [staffRes] = await Promise.all([
            performAdminAction(token, 'getPlatformStaff', {})
        ]);
        setPartners(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalRecords(res.totalCount || 0);
        setCurrentPage(res.currentPage || 1);
        setJumpPageInput(String(res.currentPage || 1));
        setStaff(staffRes.data || []);
        setHasLoaded(true);
    } catch (e: any) {
        console.error("Fetch Error:", e);
    } finally {
        setIsLoading(false);
    }
  }, [searchTerm, outreachFilter, enrichmentFilter]);

  useEffect(() => { 
    if (hasLoaded) fetchData(currentPage); 
  }, [currentPage, hasLoaded, fetchData]);

  const handleJumpPage = (e: React.FormEvent) => {
      e.preventDefault();
      const pageNum = parseInt(jumpPageInput, 10);
      if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
          toast({ variant: 'destructive', title: 'Invalid Page', description: `Please enter a page between 1 and ${totalPages}.` });
          return;
      }
      setCurrentPage(pageNum);
  };

  const filteredRecords = useMemo(() => {
    return partners.filter(r => {
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        return matchesStatus;
    });
  }, [partners, statusFilter]);

  const handleDelete = async () => {
    if (!dialog.data) return;
    try {
        const token = await getClientSideAuthToken();
        if (!token) return;
        await performAdminAction(token, 'deletePartner', { partnerId: dialog.data.id });
        toast({ title: 'Deleted' });
        fetchData(currentPage);
        setDialog({ type: null });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const columns: ColumnDef<any>[] = [
    { 
        header: 'Investor Entity', 
        cell: ({row}) => (
            <div className="flex flex-col text-left">
                <span className="font-bold text-left text-foreground">
                    {row.original.companyName || <span className="text-destructive italic">Unnamed Fund</span>}
                </span>
                <div className="flex items-center gap-2 mt-1">
                    {row.original.website && <Globe className="h-3 w-3 text-primary" />}
                </div>
            </div>
        )
    },
    { 
        accessorKey: 'contactPerson', 
        header: 'Key Decision Maker',
        cell: ({ row }) => (
            <div className="text-sm font-medium text-left">
                {row.original.contactPerson || `${row.original.firstName || ''} ${row.original.lastName || ''}`.trim() || <span className="text-muted-foreground italic">Missing Name</span>}
            </div>
        )
    },
    { accessorKey: 'email', header: 'Email' },
    { 
        header: 'Outreach',
        cell: ({ row }) => {
            if (!row.original.lastOutreachSubject) return <span className="text-[10px] text-muted-foreground italic text-left text-foreground">None</span>;
            return (
                <div className="flex flex-col text-left text-foreground">
                    <Badge variant="outline" className="text-[9px] h-4 border-primary/20 text-primary uppercase font-bold truncate max-w-[100px]">{row.original.lastOutreachSubject}</Badge>
                    <span className="text-[8px] text-muted-foreground mt-0.5">{formatDateSafe(row.original.lastOutreachAt, "dd/MM")}</span>
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
    { accessorKey: 'status', header: 'Status', cell: ({row}) => <Badge variant="outline" className="capitalize text-[10px]">{row.original.status}</Badge>},
    { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
      <div className="flex justify-end items-center gap-1 text-left text-foreground text-foreground">
        <EnrichPartnerButton partner={row.original} onUpdate={() => fetchData(currentPage)} />
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'engage', data: [row.original] })} title="Engage"><Send className="h-4 w-4 text-primary" /></Button>
        <CommunicationLogDialog partnerId={row.original.id} partnerName={row.original.firstName} />
        <PartnerTasksDialog partner={row.original} />
        <PartnerOversightDialog partner={row.original} onUpdate={() => fetchData(currentPage)} />
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'edit', data: row.original })}><Edit className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'delete', data: row.original })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6 text-left text-foreground">
      <EngageDialog 
        open={dialog.type === 'engage'} 
        onOpenChange={(o: boolean) => !o && setDialog({ type: null })} 
        partners={Array.isArray(dialog.data) ? dialog.data : [dialog.data]} 
        audience="investors" 
        onEngageSuccess={() => fetchData(currentPage)} 
      />
      <InvestorDialog open={dialog.type === 'add' || dialog.type === 'edit'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.type === 'edit' ? dialog.data : undefined} onSave={() => fetchData(currentPage)} />
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(o) => !o && setDialog({ type: null })}>
        <AlertDialogContent className="text-left text-foreground">
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Delete record?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialog({ type: null })}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
                const token = await getClientSideAuthToken();
                if (token && dialog.data) {
                    await performAdminAction(token, 'deletePartner', { partnerId: dialog.data.id });
                    fetchData(currentPage);
                    setDialog({ type: null });
                }
            }} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="space-y-6 text-left">
        {!hasLoaded ? (
            <Card className="bg-primary/5 border-primary/20 p-12 text-center text-foreground text-foreground">
                <Database className="mx-auto h-16 w-16 text-primary/20 mb-4" />
                <h2 className="text-2xl font-black font-headline mb-2 text-foreground text-center">App Launch Registry</h2>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8 text-center text-foreground">Scan your equity partner pipeline. Use filters to prioritize outreach.</p>
                <div className="flex flex-col md:flex-row justify-center gap-4 max-w-4xl mx-auto text-left text-foreground">
                    <div className="flex-1 space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Name, Fund or ID</Label>
                        <Input placeholder="Search criteria..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchData(1)} className="h-12 text-lg bg-white" />
                    </div>
                     <div className="w-56 space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Outreach Stage</Label>
                        <Select value={outreachFilter} onValueChange={setOutreachFilter}>
                            <SelectTrigger className="h-12 bg-white text-left"><SelectValue placeholder="All Stages" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Stages</SelectItem>
                                <SelectItem value="none">No Outreach Yet</SelectItem>
                                <SelectItem value="Digital Handshake">Handshake sent</SelectItem>
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
                    <div className="flex flex-col md:flex-row gap-2 self-end">
                        <Button size="lg" onClick={() => { setCurrentPage(1); fetchData(1); }} disabled={isLoading} className="h-12 px-8 font-bold">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
                            Execute Scan
                        </Button>
                        <Button variant="outline" size="lg" onClick={() => { setCurrentPage(1); fetchData(1); }} className="h-12">
                             Show Recent
                        </Button>
                    </div>
                </div>
            </Card>
        ) : (
            <div className="space-y-6 text-left">
                <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                    <div className="text-left"><CardTitle className="flex items-center gap-2 font-black font-headline text-left"><DollarSign /> App Launch Investors</CardTitle><CardDescription className="text-left text-foreground">Registry view ({totalRecords.toLocaleString()} records).</CardDescription></div>
                    <div className="flex gap-2 text-left">
                        <div className="relative w-64 text-left">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Filter registry..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 bg-white" />
                        </div>
                        <Button variant="outline" onClick={() => downloadDataAsCSV(partners, 'investors-export.csv')} disabled={isLoading} className="text-left"><Download className="mr-2 h-4 w-4"/>Export CSV</Button>
                        <Button onClick={() => setDialog({ type: 'add' })} className="text-left"><PlusCircle className="mr-2 h-4 w-4"/>Add Record</Button>
                    </div>
                </CardHeader>
                <Card className="text-left">
                    <CardContent className="pt-6 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg text-left">
                            <div className="space-y-2 text-left">
                                <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5"><Filter className="h-3 w-3"/> Status</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="bg-white text-left"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="active">Active Participant</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2 text-left">
                                <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5 text-left text-foreground"><Send className="h-3 w-3"/> Outreach</Label>
                                <Select value={outreachFilter} onValueChange={setOutreachFilter}>
                                    <SelectTrigger className="bg-white text-left"><SelectValue placeholder="All" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="none">No Outreach Yet</SelectItem>
                                        <SelectItem value="Digital Handshake">Handshake Sent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 text-left">
                                <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5"><Sparkles className="h-3 w-3"/> Enrichment</Label>
                                <Select value={enrichmentFilter} onValueChange={setEnrichmentFilter}>
                                    <SelectTrigger className="bg-white text-left"><SelectValue placeholder="All" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="enriched">Enriched</SelectItem>
                                        <SelectItem value="unenriched">Unenriched</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end text-left text-foreground">
                                <Button variant="outline" onClick={() => setHasLoaded(false)} className="h-10 w-full text-foreground"><RotateCcw className="mr-1 h-3 w-3" /> New Search</Button>
                            </div>
                        </div>
                        {isLoading ? (
                            <div className="flex justify-center items-center py-10">
                                <Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" />
                            </div>
                        ) : (
                            <div className="space-y-6 text-left">
                                <DataTable columns={columns} data={filteredRecords} onSelectionChange={setSelectedIds} />
                                
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t">
                                    <div className="text-sm text-muted-foreground font-medium">
                                        Showing {partners.length} of {totalRecords.toLocaleString()} records
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <form onSubmit={handleJumpPage} className="flex items-center gap-2">
                                                <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Page</span>
                                                <Input 
                                                    className="w-16 h-8 text-center font-bold font-mono text-foreground" 
                                                    value={jumpPageInput} 
                                                    onChange={e => setJumpPageInput(e.target.value)}
                                                />
                                                <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">of {totalPages}</span>
                                            </form>
                                            <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <Button variant="outline" onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages} className="min-w-[180px] font-bold text-foreground">
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
    </div>
  );
}
