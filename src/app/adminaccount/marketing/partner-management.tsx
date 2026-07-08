
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
  Loader2, PlusCircle, Handshake, Edit, Trash2, Send, Globe, Search, Download, Save, 
  Filter, Users, UserCheck, Database, RotateCcw, Upload, Sparkles, ChevronDown, Settings2, Check, Mail 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { EngageDialog } from './EngageDialog';
import { CommunicationLogDialog } from './CommunicationLogDialog';
import { AddCommunicationLogDialog } from './AddCommunicationLogDialog';
import { PartnerTasksDialog } from './PartnerTasksDialog';
import { PartnerOversightDialog } from './PartnerOversightDialog';
import { downloadDataAsCSV, formatDateSafe, cn } from '@/lib/utils';
import { EnrichPartnerButton } from './EnrichPartnerButton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { BulkImportDialog } from './BulkImportDialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

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
  status: z.enum(['active', 'inactive', 'contacted', 'new', 'qualified', 'invited', 'registered']),
  type: z.string(), // Dynamic type
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
  notes: z.string().optional(),
  address: z.string().optional(),
});
type PartnerFormValues = z.infer<typeof partnerSchema>;

function PartnerDialog({ open, onOpenChange, partner, onSave, targetType }: { open: boolean; onOpenChange: (open: boolean) => void; partner?: any; onSave: () => void; targetType: string; }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<PartnerFormValues>({ 
    resolver: zodResolver(partnerSchema),
    defaultValues: { type: targetType, status: 'new' }
  });

  useEffect(() => {
    if (open) {
      if (partner) form.reset(partner);
      else form.reset({ firstName: '', lastName: '', email: '', phone: '', mobile: '', contactPerson: '', companyName: '', status: 'new', type: targetType, website: '', notes: '', address: '' });
    }
  }, [open, partner, form, targetType]);

  const handleFormSubmit = async (values: PartnerFormValues) => {
    setIsLoading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        const collection = partner?.source === 'Lead' ? 'leads' : 'partners';
        await performAdminAction(token, 'savePartner', { 
            collection,
            partner: { id: partner?.id, ...values, type: targetType } 
        });
        toast({ title: 'Record Saved' });
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
                <DialogTitle>{partner ? 'Edit' : 'Add'} {targetType.charAt(0).toUpperCase() + targetType.slice(1)} Record</DialogTitle>
                <DialogDescription>Update high-fidelity contact details and forensic notes.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2 text-left text-foreground">
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                    <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem className="text-left text-foreground"><FormLabel>Company / Identity Name</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="contactPerson" render={({ field }) => ( <FormItem className="text-left text-foreground"><FormLabel>Full Contact Name (Decision Maker)</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl><FormMessage /></FormItem> )} />
                    
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" className="bg-white" /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="mobile" render={({ field }) => ( <FormItem><FormLabel>Mobile (Direct)</FormLabel><FormControl><Input placeholder="+27 82..." {...field} className="bg-white" /></FormControl><FormMessage /></FormItem> )} />
                    </div>

                    <FormField control={form.control} name="website" render={({ field }) => ( <FormItem className="text-left text-foreground"><FormLabel>Website</FormLabel><FormControl><Input placeholder="https://..." {...field} className="bg-white" /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="address" render={({ field }) => ( <FormItem className="text-left text-foreground"><FormLabel>Physical Address</FormLabel><FormControl><Textarea placeholder="Full operational address..." {...field} className="bg-white min-h-[80px]" /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem className="text-left text-foreground"><FormLabel>Forensic Notes / Technical Profile</FormLabel><FormControl><Textarea placeholder="Specific fleet details, corridors, or services..." {...field} className="bg-white min-h-[120px]" /></FormControl><FormMessage /></FormItem> )} />

                    <FormField control={form.control} name="status" render={({ field }) => ( 
                        <FormItem className="text-left">
                            <FormLabel>Pipeline Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger className="bg-white text-left text-foreground"><SelectValue placeholder="Select status..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="new">New Lead</SelectItem>
                                    <SelectItem value="contacted">Researching</SelectItem>
                                    <SelectItem value="qualified">Qualified</SelectItem>
                                    <SelectItem value="active">Active Member</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
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

export default function PartnerManagement({ type = 'partner' }: { type?: string }) {
  const { toast } = useToast();
  const { user } = useUser();
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{ type: 'add' | 'edit' | 'delete' | 'engage' | null, data?: any, initialIndex?: number }>({ type: null });

  const [statusFilter, setStatusFilter] = useState('all');
  const [outreachFilter, setOutreachFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    companyName: true,
    contactPerson: true,
    email: true,
    outreach: true,
    status: true,
    actions: true
  });

  useEffect(() => {
    setAllRecords([]);
    setHasLoaded(false);
  }, [type]);

  const fetchData = useCallback(async (limit: number = 20000) => {
    setIsLoading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) return;
        const [res, staffRes] = await Promise.all([
          performAdminAction(token, 'searchRegistry', { type, term: searchTerm, outreachFilter, limit }),
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
  }, [type, searchTerm, outreachFilter, toast]);

  useEffect(() => { if (hasLoaded) fetchData(); }, [fetchData, hasLoaded]);

  const handleExport = (format: 'Standard' | 'SendGrid') => {
      const dataToExport = filteredRecords.map(p => {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://logisticsflow.co.za';
          const handshakeUrl = `${baseUrl}/opt-in/${p.id}`;
          const directJoinUrl = `${baseUrl}/join?email=${encodeURIComponent(p.email || '')}&ref=${user?.companyId || 'SYSTEM'}`;

          if (format === 'SendGrid') {
              return {
                  email: p.email || p.email_address || '',
                  first_name: p.firstName || p.contactPerson?.split(' ')[0] || '',
                  last_name: p.lastName || p.contactPerson?.split(' ').slice(1).join(' ') || '',
                  company_name: p.companyName || p.company_name || '',
                  handshake_url: handshakeUrl,
                  direct_join_url: directJoinUrl
              };
          }
          return { ...p, handshakeUrl, directJoinUrl };
      });

      downloadDataAsCSV(dataToExport, `${type}-${format.toLowerCase()}-${Date.now()}.csv`);
      toast({ title: `${format} Export Ready` });
  };

  const handleEngage = useCallback((record: any) => {
    const engageList = selectedIds.length > 0 ? allRecords.filter(r => selectedIds.includes(r.id)) : (record ? [record] : []);
    if (engageList.length === 0) return;
    setDialog({ type: 'engage', data: engageList, initialIndex: record ? engageList.findIndex((r: any) => r.id === record.id) : 0 });
  }, [allRecords, selectedIds]);

  const filteredRecords = useMemo(() => {
    return allRecords.filter(p => {
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchesAssignee = assigneeFilter === 'all' || p.assigneeId === assigneeFilter;
        return matchesStatus && matchesAssignee;
    });
  }, [allRecords, statusFilter, assigneeFilter]);

  const columns: ColumnDef<any>[] = useMemo(() => [
    { 
        accessorKey: 'companyName',
        header: 'Entity Identity', 
        cell: ({row}) => (
            <div className="flex flex-col text-left">
                <span className="font-bold text-left text-foreground">{row.original.companyName || `${row.original.firstName} ${row.original.lastName}`}</span>
                <div className="flex items-center gap-2 mt-1">
                    <Badge variant={row.original.source === 'Member' ? 'default' : 'outline'} className="text-[9px] h-4 uppercase font-bold">{row.original.source || 'Registry'}</Badge>
                    {row.original.website && <Globe className="h-3 w-3 text-primary" />}
                    <Badge variant="outline" className="text-[10px] h-3.5 border-primary/20 text-primary uppercase font-bold">{type}</Badge>
                </div>
            </div>
        )
    },
    { 
        accessorKey: 'contactPerson',
        header: 'Account Lead',
        cell: ({ row }) => <div className="text-sm font-medium text-left">{row.original.contactPerson || `${row.original.firstName} ${row.original.lastName}`}</div>
    },
    { accessorKey: 'email', header: 'Email' },
    { 
        header: 'Outreach Stage',
        id: 'outreach',
        accessorKey: 'lastOutreachSubject',
        cell: ({ row }) => {
            if (!row.original.lastOutreachSubject) return <span className="text-[10px] text-muted-foreground italic text-left">None</span>;
            return (
                <div className="flex flex-col text-left">
                    <Badge variant="outline" className="text-[9px] h-4 border-primary/20 text-primary uppercase font-bold truncate max-w-[100px] text-left">{row.original.lastOutreachSubject}</Badge>
                    <span className="text-[8px] text-muted-foreground mt-0.5 text-left">{formatDateSafe(row.original.lastOutreachAt, "dd/MM")}</span>
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
        <div className="flex justify-end items-center gap-1 text-left">
          <EnrichPartnerButton partner={row.original} onUpdate={() => fetchData()} />
          <Button variant="ghost" size="icon" onClick={() => handleEngage(row.original)} title="Engage"><Send className="h-4 w-4 text-primary" /></Button>
          <AddCommunicationLogDialog 
              partnerId={row.original.id} 
              collection={row.original.source === 'Lead' ? 'leads' : 'partners'} 
              onLogAdded={() => fetchData()} 
          />
          <CommunicationLogDialog partnerId={row.original.id} partnerName={row.original.firstName} />
          <PartnerTasksDialog partner={row.original} />
          <PartnerOversightDialog partner={row.original} onUpdate={() => fetchData()} />
          <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'edit', data: row.original })}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'delete', data: row.original })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ) },
    ];
    return cols.filter(c => visibleColumns[c.accessorKey as string] || visibleColumns[c.id as string]);
  }, [type, fetchData, handleEngage, visibleColumns]);

  async function handleDeleteRecord() {
    if (!dialog.data) return;
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      await performAdminAction(token, 'deletePartner', { partnerId: dialog.data.id, source: dialog.data.source });
      toast({ title: 'Deleted' });
      fetchData();
      setDialog({ type: null });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  }

  const audienceLabel = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className="space-y-6 text-left">
      <EngageDialog open={dialog.type === 'engage'} onOpenChange={(o) => !o && setDialog({ type: null })} partners={dialog.data || []} initialIndex={dialog.initialIndex} audience={type as any} onEngageSuccess={() => fetchData()} />
      <PartnerDialog open={dialog.type === 'add' || dialog.type === 'edit'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.type === 'edit' ? dialog.data : undefined} onSave={() => fetchData()} targetType={type} />
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(o) => !o && setDialog({ type: null })}>
        <AlertDialogContent className="text-left text-foreground">
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Delete record?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialog({ type: null })}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecord} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!hasLoaded ? (
            <Card className="bg-primary/5 border-primary/20 p-12 text-center text-foreground">
                <Database className="mx-auto h-16 w-16 text-primary/20 mb-4" />
                <h2 className="text-2xl font-black font-headline mb-2">{audienceLabel} Pipeline Scan</h2>
                <p className="text-muted-foreground max-sm mx-auto mb-8">Scan the industrial registry. Use filters to prioritize recruitment outreach.</p>
                
                <div className="max-w-4xl mx-auto space-y-6 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Outreach Status</Label>
                            <Select value={outreachFilter} onValueChange={setOutreachFilter}>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="All Outreach" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="none">No Outreach Yet</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Pipeline Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="All Stages" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="new">New Lead</SelectItem>
                                    <SelectItem value="contacted">In Research</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Assignee</Label>
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

                    <div className="flex flex-col md:flex-row justify-center gap-4 max-w-4xl mx-auto text-left">
                        <div className="flex-1 space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Name, Agency or ID</Label>
                            <Input placeholder="Search criteria..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-12 text-lg bg-white" onKeyDown={(e) => e.key === 'Enter' && fetchData()} />
                        </div>
                        <div className="flex flex-col md:flex-row gap-2 self-end">
                            <Button size="lg" onClick={() => fetchData()} disabled={isLoading} className="h-12 px-8 font-bold">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />} Execute Scan
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
      ) : (
            <div className="space-y-6 text-left">
                <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-left"><CardTitle className="flex items-center gap-2 font-black font-headline text-left"><Database /> {audienceLabel} Registry</CardTitle><CardDescription className="text-left">Full database view ({allRecords.length} records).</CardDescription></div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setHasLoaded(false)} className="gap-2"><RotateCcw className="h-4 w-4" /> New Search</Button>
                        
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Export</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2 text-left">
                                <div className="space-y-1">
                                    <Button variant="ghost" className="w-full justify-start text-xs font-bold" onClick={() => handleExport('Standard')}><Download className="mr-2 h-3.5 w-3.5" /> Standard CSV</Button>
                                    <Button variant="ghost" className="w-full justify-start text-xs font-bold text-primary" onClick={() => handleExport('SendGrid')}><Mail className="mr-2 h-3.5 w-3.5" /> SendGrid Export</Button>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <BulkImportDialog type={type} onComplete={() => fetchData()}><Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import</Button></BulkImportDialog>
                        <Button onClick={() => setDialog({ type: 'add' })}><PlusCircle className="mr-2 h-4 w-4"/>Add Record</Button>
                    </div>
                </CardHeader>
                <Card className="text-left">
                    <CardContent className="pt-6 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg text-left">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5"><Filter className="h-3 w-3"/> Status</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-9 bg-white text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
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
                            <div className="space-y-1">
                                <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5"><Send className="h-3 w-3"/> Outreach</Label>
                                <Select value={outreachFilter} onValueChange={setOutreachFilter}>
                                    <SelectTrigger className="h-9 bg-white text-xs"><SelectValue placeholder="All Outreach" /></SelectTrigger>
                                    <SelectContent><SelectItem value="all">All Outreach</SelectItem><SelectItem value="none">No Outreach Yet</SelectItem></SelectContent>
                                </Select>
                            </div>
                        </div>
                        {isLoading ? <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div> : (
                            <div className="space-y-6">
                                <DataTable columns={columns} data={filteredRecords} onSelectionChange={setSelectedIds} />
                                {allRecords.length >= 100 && (
                                     <div className="flex justify-center pt-4">
                                        <Button variant="outline" size="lg" onClick={() => fetchData(allRecords.length + 100)} disabled={isLoading} className="gap-2 min-w-[200px]">
                                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <ChevronDown className="h-4 w-4" />}
                                            Load Next 100 Records
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
      )}
    </div>
  );
}
