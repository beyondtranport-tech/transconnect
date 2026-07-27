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
  Loader2, PlusCircle, Truck, Edit, Trash2, Send, Globe, Search, Download, Save, 
  Filter, Users, UserCheck, Database, RotateCcw, Upload, Sparkles, ChevronDown, Settings2, Check, Smartphone, Phone, Building, UserCircle, UserPlus, ShieldCheck
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

const contactSchema = z.object({
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
});

const partnerSchema = z.object({
  firstName: z.string().optional().or(z.literal('')),
  lastName: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  contactPerson: z.string().optional(),
  companyName: z.string().optional(),
  status: z.enum(['active', 'inactive', 'contacted', 'new', 'qualified', 'invited', 'registered']),
  type: z.literal('transporter'),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
  notes: z.string().optional(),
  address: z.string().optional(),
  marketingManager: contactSchema.nullable().optional(),
  ceo: contactSchema.nullable().optional(),
  minedServiceWording: z.string().nullable().optional(),
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
          const sanitizedPartner = {
              ...partner,
              marketingManager: partner.marketingManager || { name: '', email: '', mobile: '' },
              ceo: partner.ceo || { name: '', email: '', mobile: '' },
              status: partner.status || 'new'
          };
          form.reset(sanitizedPartner);
      } else {
        form.reset({ 
            firstName: '', 
            lastName: '', 
            email: '', 
            phone: '', 
            mobile: '', 
            contactPerson: '', 
            companyName: '', 
            status: 'new', 
            type: 'transporter', 
            website: '', 
            notes: '', 
            address: '', 
            marketingManager: { name: '', email: '', mobile: '' }, 
            ceo: { name: '', email: '', mobile: '' } 
        });
      }
    }
  }, [open, partner, form]);

  const handleFormSubmit = async (values: PartnerFormValues) => {
    setIsLoading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        const collection = partner?.source === 'Lead' ? 'leads' : 'partners';
        await performAdminAction(token, 'savePartner', { collection, partner: { id: partner?.id, ...values, type: 'transporter' } });
        toast({ title: 'Transporter Saved' });
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
      <DialogContent className="sm:max-w-4xl text-left text-foreground">
        <DialogHeader>
            <DialogTitle>{partner ? 'Edit' : 'Add'} Transporter Profile</DialogTitle>
            <DialogDescription>Manage high-fidelity contacts and industrial profile data.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 py-4 max-h-[85vh] overflow-y-auto pr-2 text-left">
            <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Building className="h-4 w-4" /> Core Entity Identity
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem className="text-left text-foreground"><FormLabel>Company Name</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem> )} />
                  <FormField control={form.control} name="website" render={({ field }) => ( <FormItem className="text-left text-foreground"><FormLabel>Website URL</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" placeholder="https://..." /></FormControl></FormItem> )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="email" render={({ field }) => ( <FormItem className="text-left text-foreground"><FormLabel>General Company Email</FormLabel><FormControl><Input {...field} value={field.value || ''} type="text" className="bg-white border-2" placeholder="info@..." /></FormControl></FormItem> )} />
                  <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem className="text-left text-foreground"><FormLabel>Company Landline</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem> )} />
                </div>
                <FormField control={form.control} name="status" render={({ field }) => ( 
                    <FormItem className="text-left">
                        <FormLabel>Pipeline Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="bg-white border-2 text-left"><SelectValue placeholder="Select status..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="new">New Lead</SelectItem>
                                <SelectItem value="contacted">Researching</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="active">Active Participant</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormItem> 
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem className="text-left">
                        <FormLabel>Physical Operational Address</FormLabel>
                        <FormControl><Textarea {...field} value={field.value || ''} className="bg-white h-20 border-2" /></FormControl>
                    </FormItem>
                )} />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="space-y-4 p-6 rounded-2xl bg-primary/5 border border-primary/10 shadow-inner text-left">
                    <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 text-left">
                        <Users className="h-4 w-4" /> Marketing Manager
                    </h4>
                    <FormField control={form.control} name="marketingManager.name" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Full Name</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem> )} />
                    <FormField control={form.control} name="marketingManager.email" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Direct E-mail</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem> )} />
                    <FormField control={form.control} name="marketingManager.mobile" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Mobile (Direct)</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem> )} />
                </div>

                <div className="space-y-4 p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner text-left">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-600 flex items-center gap-2 text-left">
                        <UserCircle className="h-4 w-4" /> CEO / Principal
                    </h4>
                    <FormField control={form.control} name="ceo.name" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Full Name</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem> )} />
                    <FormField control={form.control} name="ceo.email" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Direct E-mail</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem> )} />
                    <FormField control={form.control} name="ceo.mobile" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Mobile (Direct)</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem> )} />
                </div>
            </div>

            <Separator />

            <div className="space-y-4 text-left">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 text-left">
                    <Sparkles className="h-4 w-4" /> Technical Profile
                </h4>
                <FormField control={form.control} name="minedServiceWording" render={({ field }) => (
                    <FormItem className="text-left">
                        <FormControl><Textarea className="min-h-[150px] bg-white border-2 leading-relaxed" {...field} value={field.value || ''} /></FormControl>
                    </FormItem>
                )} />
            </div>

            <DialogFooter className="pt-4 border-t sticky bottom-0 bg-white z-10 text-left">
              <Button type="submit" disabled={isLoading} size="lg" className="w-full font-bold shadow-lg text-white">
                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} Save Forensic Record
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{ type: 'add' | 'edit' | 'delete' | 'engage' | null, data?: any, initialIndex?: number }>({ type: null });

  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const type = 'transporter';

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    companyName: true,
    accountLead: true,
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
          performAdminAction(token, 'searchRegistry', { type: 'transporter', term: searchTerm, limit }),
          performAdminAction(token, 'getPlatformStaff', {})
        ]);
        setAllRecords(res.data || []);
        setStaff(staffRes.data || []);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Fetch Error', description: e.message });
    } finally {
        setIsLoading(false);
    }
  }, [searchTerm, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const columns: ColumnDef<any>[] = useMemo(() => {
    const cols: ColumnDef<any>[] = [
      { 
          accessorKey: 'companyName',
          id: 'companyName',
          header: 'Haulier Entity', 
          cell: ({row}: { row: { original: any } }) => (
              <div className="flex flex-col text-left text-foreground">
                  <span className="font-bold text-left text-foreground">{row.original.companyName || 'Unnamed Entity'}</span>
                  <div className="flex items-center gap-2 mt-1 text-left text-foreground">
                      <Badge variant={row.original.source === 'Member' ? 'default' : 'outline'} className="text-[9px] h-4 uppercase font-bold">{row.original.source}</Badge>
                      {row.original.companyId && <span className="text-[10px] text-muted-foreground font-mono">ID: {row.original.companyId}</span>}
                  </div>
              </div>
          )
      },
      { 
          id: 'accountLead',
          accessorKey: 'contactPerson',
          header: 'Account Lead',
          cell: ({ row }: { row: { original: any } }) => (
            <div className="flex flex-col text-left">
                <span className="font-bold text-sm text-left">{row.original.marketingManager?.name || row.original.contactPerson || 'N/A'}</span>
                <span className="text-[10px] text-muted-foreground text-left">{row.original.marketingManager?.email || row.original.email || 'No email discovered'}</span>
            </div>
          )
      },
      { 
          header: 'Outreach Stage',
          id: 'outreach',
          accessorKey: 'lastOutreachSubject',
          cell: ({ row }: { row: { original: any } }) => {
              if (!row.original.lastOutreachSubject) return <span className="text-[10px] text-muted-foreground italic text-left">None</span>;
              const cleanSubject = row.original.lastOutreachSubject.replace('Logistics Flow: ', '').split('(')[0].trim();
              return (
                  <div className="flex flex-col text-left text-foreground">
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[9px] h-4 border-primary/20 text-primary uppercase font-bold truncate max-w-[100px] text-left">{cleanSubject}</Badge>
                        {row.original.lastOpenedAt && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="bg-blue-100 p-0.5 rounded-full text-left text-foreground"><UserCheck className="h-3 w-3 text-blue-600" /></div>
                              </TooltipTrigger>
                              <TooltipContent className="text-[10px] font-bold">Email Read: {formatDateSafe(row.original.lastOpenedAt, "dd/MM HH:mm")}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {row.original.lastAccessedAt && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="bg-purple-100 p-0.5 rounded-full text-left text-foreground"><Smartphone className="h-3 w-3 text-purple-600" /></div>
                              </TooltipTrigger>
                              <TooltipContent className="text-[10px] font-bold">Landed on Link: {formatDateSafe(row.original.lastAccessedAt, "dd/MM HH:mm")}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <span className="text-[8px] text-muted-foreground mt-0.5 text-left">{formatDateSafe(row.original.lastOutreachAt, "dd/MM, HH:mm")}</span>
                  </div>
              );
          }
      },
      { 
        id: 'status',
        accessorKey: 'status', 
        header: 'Status & Conversion', 
        cell: ({ row }: { row: { original: any } }) => {
            const isVerified = !!row.original.companyId;
            const isConverted = row.original.status === 'active' && (row.original.lastOpenedAt || row.original.lastAccessedAt);
            
            return (
                <div className="flex flex-col gap-1 text-left">
                    <div className="flex items-center gap-2 text-left">
                        <Badge variant={row.original.status === 'active' ? 'default' : 'outline'} className="capitalize text-[10px] font-black w-fit">{row.original.status}</Badge>
                        {isVerified && <TooltipProvider><Tooltip><TooltipTrigger><ShieldCheck className="h-4 w-4 text-green-600" /></TooltipTrigger><TooltipContent className="text-xs font-bold">Forensic Handshake Linked (Member Roster Verified)</TooltipContent></Tooltip></TooltipProvider>}
                    </div>
                    {isConverted && !isVerified && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[8px] h-4 uppercase font-black py-0 px-1.5 w-fit text-left text-foreground">
                            Handshake Pending Sign-up
                        </Badge>
                    )}
                    {isVerified && (
                        <Badge className="bg-green-100 text-green-700 text-[8px] h-4 uppercase font-black border-none gap-1 py-0 px-1.5 w-fit text-left text-foreground">
                            <UserPlus className="h-2 w-2 fill-current" /> Verified Member
                        </Badge>
                    )}
                </div>
            )
        }
      },
      { id: 'actions', header: 'Actions', cell: ({ row }: { row: { original: any } }) => (
        <div className="flex justify-end items-center gap-1 text-left text-foreground">
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
    return cols.filter(c => visibleColumns[c.id as string] || visibleColumns[c.accessorKey as string]);
  }, [fetchData, handleEngage, visibleColumns]);

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

  return (
    <div className="space-y-6 text-left text-foreground">
      <EngageDialog open={dialog.type === 'engage'} onOpenChange={(o) => !o && setDialog({ type: null })} partners={dialog.data || []} initialIndex={dialog.initialIndex} audience="transporters" onEngageSuccess={() => fetchData()} />
      <TransporterDialog open={dialog.type === 'add' || dialog.type === 'edit'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.type === 'edit' ? dialog.data : undefined} onSave={() => fetchData()} />
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(o) => !o && setDialog({ type: null })}>
        <AlertDialogContent className="text-left text-foreground">
          <AlertDialogHeader><AlertDialogTitle className="text-left text-foreground">Are you sure?</AlertDialogTitle><AlertDialogDescription className="text-left text-foreground">Delete record?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialog({ type: null })}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecord} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6 text-left text-foreground">
          <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
              <div className="text-left"><CardTitle className="flex items-center gap-2 font-black font-headline text-left text-foreground"><Truck /> Transporters</CardTitle><CardDescription className="text-left text-muted-foreground text-foreground">Registry view ({allRecords.length} records).</CardDescription></div>
              <div className="flex gap-2 text-left">
                  <Button variant="outline" size="sm" onClick={() => fetchData()} className="text-foreground"><RotateCcw className="h-4 w-4 mr-2" /> Sync Registry</Button>
                  {selectedIds.length > 0 && <Button variant="secondary" onClick={() => handleEngage(null)} className="gap-2 shadow-sm font-bold animate-in fade-in zoom-in text-left"><Send className="h-4 w-4" /> Batch Engage ({selectedIds.length})</Button>}
                  
                  <Popover>
                      <PopoverTrigger asChild>
                          <Button variant="outline" className="gap-2 text-foreground"><Settings2 className="h-4 w-4" /> Columns</Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2 text-left text-foreground">
                          <div className="space-y-1 text-left text-foreground">
                              {Object.keys(visibleColumns).map(col => (
                                  <div key={col} className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer text-[10px] font-black uppercase tracking-widest text-left" onClick={() => setVisibleColumns(prev => ({...prev, [col]: !prev[col]}))}>
                                      <span>{col.replace(/([A-Z])/g, ' $1')}</span>
                                      {visibleColumns[col] && <Check className="h-3 w-3 text-primary" />}
                                  </div>
                              ))}
                          </div>
                      </PopoverContent>
                  </Popover>

                  <Button variant="outline" onClick={() => downloadDataAsCSV(filteredRecords, 'transporters-backup.csv')} disabled={isLoading} className="text-left text-foreground"><Download className="mr-2 h-4 w-4"/>Export CSV</Button>
                  <BulkImportDialog type="transporter" onComplete={() => fetchData()}><Button variant="outline" className="text-left text-foreground"><Upload className="mr-2 h-4 w-4" /> Import</Button></BulkImportDialog>
                  <Button onClick={() => setDialog({ type: 'add' })} className="text-left"><PlusCircle className="mr-2 h-4 w-4"/>Add Record</Button>
              </div>
          </CardHeader>
          <Card className="text-left">
              <CardContent className="pt-6 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg text-left">
                      <div className="space-y-1 text-left">
                          <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5 text-left">Status Filter</Label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                              <SelectTrigger className="h-9 bg-white text-xs text-left text-foreground"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="all">All Statuses</SelectItem>
                                  <SelectItem value="new">New</SelectItem>
                                  <SelectItem value="contacted">Researching</SelectItem>
                                  <SelectItem value="qualified">Qualified</SelectItem>
                                  <SelectItem value="active">Active Participant</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-1 text-left">
                          <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5 text-left">Assignee</Label>
                          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                              <SelectTrigger className="bg-white text-left text-foreground"><SelectValue placeholder="All Staff" /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="all">All Staff</SelectItem>
                                  <SelectItem value="none">Unallocated</SelectItem>
                                  {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-1 text-left">
                          <div className="flex-1 space-y-1 text-left">
                              <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5 text-left">Search Registry</Label>
                              <Input placeholder="Filter registry by name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchData()} className="h-9 bg-white" />
                          </div>
                      </div>
                  </div>
                  {isLoading ? <div className="flex justify-center items-center py-10 text-left"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div> : (
                      <div className="space-y-6 text-left">
                          <DataTable columns={columns} data={filteredRecords} onSelectionChange={setSelectedIds} />
                          {allRecords.length >= 100 && (
                               <div className="flex justify-center pt-4 text-left">
                                  <Button variant="outline" size="lg" onClick={() => fetchData(allRecords.length + 100)} disabled={isLoading} className="gap-2 min-w-[200px] text-left">
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
    </div>
  );
}
