
'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
    DialogTitle 
} from '@/components/ui/dialog';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Loader2, PlusCircle, Landmark, Edit, Trash2, Send, Download, Save, Search, Globe, RefreshCcw, Database, Filter, Users, Upload, Copy, Tag, AlertTriangle, CheckCircle } from 'lucide-react';
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
import { BulkImportDialog } from './BulkImportDialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  type: z.literal('finance'),
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
            const res = await performAdminAction(token, 'findDuplicatePartners', { type: 'finance' });
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
                    <DialogTitle>Finance Registry Health Tool</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-8 text-left">
                        {incomplete.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Broken Records ({incomplete.length})</h3>
                                <Button variant="destructive" size="sm" onClick={() => handleClean('incomplete')} disabled={isLoading}>Delete Broken Records</Button>
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
                                <p className="text-lg font-bold text-foreground">Registry is Clean!</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

function FinanceDialog({ open, onOpenChange, partner, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; partner?: any; onSave: () => void; }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<PartnerFormValues>({ 
    resolver: zodResolver(partnerSchema),
    defaultValues: { type: 'finance', status: 'new' }
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
        form.reset({ firstName: '', lastName: '', email: '', phone: '', mobile: '', contactPerson: '', companyName: '', website: '', notes: '', address: '', status: 'new', type: 'finance' });
      }
    }
  }, [open, partner, form]);

  const handleFormSubmit = async (values: PartnerFormValues) => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");
      await performAdminAction(token, 'savePartner', { partner: { id: partner?.id, ...values, type: 'finance' } });
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
      <DialogContent className="sm:max-w-2xl text-left text-foreground">
        <DialogHeader>
          <DialogTitle>{partner ? 'Edit' : 'Add'} Finance Entity</DialogTitle>
          <DialogDescription>Enter verified record for the capital partner.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2 text-left">
            <div className="grid grid-cols-2 gap-4 text-left text-foreground">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-left text-foreground">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Work Phone</FormLabel><FormControl><Input placeholder="+27 11..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-left text-foreground">
              <FormField control={form.control} name="mobile" render={({ field }) => (
                <FormItem className="text-left text-foreground"><FormLabel>Mobile (Direct)</FormLabel><FormControl><Input placeholder="+27 82..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="companyName" render={({ field }) => (
                <FormItem className="text-left text-foreground"><FormLabel>Entity Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="website" render={({ field }) => (
              <FormItem className="text-left text-foreground"><FormLabel>Official Website</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem className="text-left text-foreground"><FormLabel>Physical Address</FormLabel><FormControl><Textarea placeholder="Enter physical address..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem className="text-left text-foreground"><FormLabel>Focus / Notes</FormLabel><FormControl><Textarea placeholder="Details about their portfolio and sector focus..." {...field} className="min-h-[120px]" /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem className="text-left text-foreground">
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Select status..." /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Researching</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
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

export default function FinanceManagement() {
  const { toast } = useToast();
  const [partners, setPartners] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{ type: 'add' | 'edit' | 'delete' | 'engage' | null, data?: any }>({ type: null });

  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      const [res, staffRes] = await Promise.all([
        performAdminAction(token, 'getPartnersByType', { type: 'finance' }),
        performAdminAction(token, 'getPlatformStaff', {})
      ]);
      setPartners(res.data || []);
      setStaff(staffRes.data || []);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Fetch Error', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredRecords = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return partners.filter(p => {
        const matchesText = !searchTerm || 
            (p.companyName?.toLowerCase().includes(term)) ||
            (p.firstName?.toLowerCase().includes(term)) ||
            (p.lastName?.toLowerCase().includes(term)) ||
            (p.email?.toLowerCase().includes(term));

        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchesAssignee = assigneeFilter === 'all' || p.assigneeId === assigneeFilter;
        return matchesStatus && matchesAssignee && matchesText;
    });
  }, [partners, statusFilter, assigneeFilter, searchTerm]);

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
        header: 'Entity Name', 
        cell: ({ row }) => (
            <div className="flex flex-col text-left text-foreground">
                <span className="font-bold text-left">{row.original.companyName || `${row.original.firstName} ${row.original.lastName}`}</span>
                {row.original.website && (
                    <div className="flex items-center gap-1.5 mt-1 text-left">
                        <Globe className="h-3 w-3 text-primary" />
                        <span className="text-[10px] text-muted-foreground truncate max-w-[150px] text-left">{row.original.website}</span>
                    </div>
                )}
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
                <div className="flex flex-col gap-1 items-center text-foreground">
                    <Badge variant="outline" className="capitalize text-[10px]">{row.original.status}</Badge>
                    {isEnriched && (
                         <div className="flex flex-col items-center text-left">
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
      <div className="flex justify-end gap-1 text-left text-foreground">
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
      <EngageDialog open={dialog.type === 'engage'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.data} audience="finance" onEngageSuccess={fetchData} />
      <FinanceDialog open={dialog.type === 'add' || dialog.type === 'edit'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.type === 'edit' ? dialog.data : undefined} onSave={fetchData} />
      
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(o) => !o && setDialog({ type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Record(s)?</AlertDialogTitle><AlertDialogDescription>Delete {selectedIds.length > 0 ? `${selectedIds.length} records` : 'record'}?</AlertDialogDescription></AlertDialogHeader>
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
        <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left text-foreground">
            <div className="text-left text-foreground">
                <CardTitle className="flex items-center gap-2 text-left text-2xl font-black font-headline text-foreground"><Landmark /> Capital Intelligence Registry</CardTitle>
                <CardDescription className="text-left text-foreground">Full registry view of lending and finance entities ({partners.length} records).</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-left text-foreground">
                <DuplicateCleaner onComplete={fetchData} />
                {selectedIds.length > 0 && (
                    <Button variant="destructive" onClick={() => setDialog({ type: 'delete' })} className="gap-2">
                        <Trash2 className="h-4 w-4" /> Delete Selected ({selectedIds.length})
                    </Button>
                )}
                <div className="relative w-64 text-left text-foreground">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search registry..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 bg-white text-foreground" />
                </div>
                <Button variant="outline" onClick={() => downloadDataAsCSV(partners, 'finance-export.csv')} disabled={isLoading}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
                <BulkImportDialog type="finance" onComplete={fetchData}><Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import</Button></BulkImportDialog>
                <Button onClick={() => setDialog({ type: 'add' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Record</Button>
            </div>
        </CardHeader>

        <Card className="border-primary/10 shadow-sm overflow-hidden text-foreground">
            <CardContent className="pt-6 text-left text-foreground">
                <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-muted/30 rounded-lg text-left text-foreground">
                    <div className="flex-1 space-y-2 text-left text-foreground">
                        <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5"><Filter className="h-3 w-3"/> Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="bg-white text-foreground"><SelectValue /></SelectTrigger>
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
                            <SelectTrigger className="bg-white text-foreground"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Staff</SelectItem>
                                <SelectItem value="none">Unallocated</SelectItem>
                                {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {isLoading ? <div className="flex justify-center items-center py-10 text-foreground"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div> : <DataTable columns={columns} data={filteredRecords} onSelectionChange={setSelectedIds} />}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
