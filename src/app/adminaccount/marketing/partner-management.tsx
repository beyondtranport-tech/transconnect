
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
  Loader2, PlusCircle, Edit, Trash2, Send, Globe, Search, Download, Save, 
  Filter, Users, UserCheck, Database, RotateCcw, Upload, Sparkles, ChevronDown, Settings2, Check, Phone, Tag, ShieldAlert, Smartphone, Mail, MapPin, Info, Building, Zap
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

const contactSchema = z.object({
  name: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  mobile: z.string().optional().or(z.literal('')),
});

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
  type: z.string(), 
  website: z.string().optional().or(z.literal('')),
  notes: z.string().optional(),
  address: z.string().optional(),
  minedServiceWording: z.string().optional(),
  marketingManager: contactSchema.optional(),
  ceo: contactSchema.optional(),
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
      else form.reset({ firstName: '', lastName: '', email: '', phone: '', mobile: '', contactPerson: '', companyName: '', status: 'new', type: targetType, website: '', notes: '', address: '', minedServiceWording: '', marketingManager: { name: '', email: '', mobile: '' }, ceo: { name: '', email: '', mobile: '' } });
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
        <DialogContent className="sm:max-w-4xl text-left text-foreground">
            <DialogHeader>
                <DialogTitle>{partner ? 'Edit' : 'Add'} {targetType.charAt(0).toUpperCase() + targetType.slice(1)} Record</DialogTitle>
                <DialogDescription>Manage high-fidelity contacts and industrial profile data.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 py-4 max-h-[85vh] overflow-y-auto pr-2 text-left">
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <Building className="h-4 w-4" /> Core Entity Identity
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Company Name</FormLabel><FormControl><Input {...field} className="bg-white border-2" /></FormControl></FormItem> )} />
                            <FormField control={form.control} name="industrial_category" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Industrial Trade</FormLabel><FormControl><Input {...field} className="bg-white border-2" placeholder="e.g. Injectors, Brakes" /></FormControl></FormItem> )} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            <FormField control={form.control} name="website" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Website URL</FormLabel><FormControl><Input {...field} className="bg-white border-2" placeholder="https://..." /></FormControl></FormItem> )} />
                            <FormField control={form.control} name="status" render={({ field }) => ( 
                                <FormItem className="text-left">
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="bg-white text-left text-foreground"><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="new">New Lead</SelectItem>
                                            <SelectItem value="contacted">Researching</SelectItem>
                                            <SelectItem value="qualified">Qualified</SelectItem>
                                            <SelectItem value="active">Active Member</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem> 
                            )} />
                        </div>
                        <FormField control={form.control} name="address" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Verified Physical Address</FormLabel><FormControl><Textarea {...field} className="bg-white h-20 border-2" /></FormControl></FormItem> )} />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                        <div className="space-y-4 p-6 rounded-2xl bg-primary/5 border border-primary/10 shadow-inner">
                            <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Users className="h-4 w-4" /> Marketing Manager
                            </h4>
                            <FormField control={form.control} name="marketingManager.name" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Full Name</FormLabel><FormControl><Input {...field} className="bg-white border-2" /></FormControl></FormItem> )} />
                            <FormField control={form.control} name="marketingManager.email" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Direct E-mail</FormLabel><FormControl><Input {...field} className="bg-white border-2" /></FormControl></FormItem> )} />
                            <FormField control={form.control} name="marketingManager.mobile" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Mobile (Direct)</FormLabel><FormControl><Input {...field} className="bg-white border-2" /></FormControl></FormItem> )} />
                        </div>

                        <div className="space-y-4 p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                                <UserCheck className="h-4 w-4" /> CEO / Principal
                            </h4>
                            <FormField control={form.control} name="ceo.name" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Full Name</FormLabel><FormControl><Input {...field} className="bg-white border-2" /></FormControl></FormItem> )} />
                            <FormField control={form.control} name="ceo.email" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Direct E-mail</FormLabel><FormControl><Input {...field} className="bg-white border-2" /></FormControl></FormItem> )} />
                            <FormField control={form.control} name="ceo.mobile" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Mobile (Direct)</FormLabel><FormControl><Input {...field} className="bg-white border-2" /></FormControl></FormItem> )} />
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4 text-left text-foreground">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <Sparkles className="h-4 w-4" /> Technical Profile (300 Words)
                        </h4>
                        <FormField control={form.control} name="minedServiceWording" render={({ field }) => ( 
                            <FormItem className="text-left">
                                <FormControl><Textarea {...field} className="bg-white min-h-[150px] font-sans text-sm leading-relaxed border-2" placeholder="Verbatim extraction from sitemap pages..." /></FormControl>
                            </FormItem> 
                        )} />
                    </div>

                    <DialogFooter className="pt-6 border-t sticky bottom-0 bg-white z-10">
                        <Button type="submit" disabled={isLoading} size="lg" className="w-full h-12 font-bold shadow-lg">
                            {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="mr-2 h-4 w-4" />} 
                            Update Forensic Record
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
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{ type: 'add' | 'edit' | 'delete' | 'engage' | null, data?: any, initialIndex?: number }>({ type: null });

  const [statusFilter, setStatusFilter] = useState('all');
  const [outreachFilter, setOutreachFilter] = useState('all');
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
          performAdminAction(token, 'searchRegistry', { type, term: searchTerm, outreachFilter, limit }),
          performAdminAction(token, 'getPlatformStaff', {})
        ]);
        setAllRecords(res.data || []);
        setStaff(staffRes.data || []);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Fetch Error', description: e.message });
    } finally {
        setIsLoading(false);
    }
  }, [type, searchTerm, outreachFilter, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEngage = useCallback((record: any) => {
    const engageList = selectedIds.length > 0 ? allRecords.filter(r => selectedIds.includes(r.id)) : (record ? [record] : []);
    if (engageList.length === 0) return;
    setDialog({ type: 'engage', data: engageList, initialIndex: record ? engageList.findIndex((r: any) => r.id === record.id) : 0 });
  }, [allRecords, selectedIds]);

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
          header: 'Entity Identity', 
          cell: ({row}) => (
              <div className="flex flex-col text-left">
                  <span className="font-bold text-left text-foreground">{row.original.companyName || `${row.original.firstName} ${row.original.lastName}`}</span>
                  <div className="flex items-center gap-2 mt-1 text-left text-foreground">
                      <Badge variant={row.original.source === 'Member' ? 'default' : 'outline'} className="text-[10px] h-4 uppercase font-bold">{row.original.source || 'Registry'}</Badge>
                      {(row.original.website || row.original.website_url) && <Globe className="h-3 w-3 text-primary" />}
                      <Badge variant="outline" className="text-[10px] h-3.5 border-primary/20 text-primary uppercase font-bold">{type}</Badge>
                  </div>
              </div>
          )
      },
      { 
          id: 'industrial_category',
          header: 'Industrial Category', 
          cell: ({row}) => {
              const cat = row.original.industrial_category || row.original.category;
              const label = (cat && cat.trim().toLowerCase() !== type.toLowerCase()) ? cat : 'General';
              return (
                  <Badge variant="secondary" className="text-[10px] uppercase font-black tracking-widest bg-slate-100 text-slate-800 border-none text-left">
                      {label}
                  </Badge>
              );
          }
      },
      { 
          accessorKey: 'contactPerson',
          header: 'Account Lead',
          cell: ({ row }) => <div className="text-sm font-medium text-foreground text-left">{row.original.contactPerson || `${row.original.firstName} ${row.original.lastName}`}</div>
      },
      { accessorKey: 'email', header: 'Email' },
      { 
          header: 'Outreach Stage',
          id: 'outreach',
          accessorKey: 'lastOutreachSubject',
          cell: ({ row }) => {
              if (!row.original.lastOutreachSubject) return <span className="text-[10px] text-muted-foreground italic text-left">None</span>;
              const cleanSubject = row.original.lastOutreachSubject.replace('Logistics Flow: ', '').split('(')[0].trim();
              return (
                  <div className="flex flex-col text-left">
                      <Badge variant="outline" className="text-[9px] h-4 border-primary/20 text-primary uppercase font-bold truncate max-w-[120px] text-left">{cleanSubject}</Badge>
                      <span className="text-[8px] text-muted-foreground mt-0.5 text-left">{formatDateSafe(row.original.lastOutreachAt, "dd/MM, HH:mm")}</span>
                  </div>
              );
          }
      },
      { 
        accessorKey: 'status', 
        header: 'Status & Intelligence', 
        cell: ({ row }) => (
            <div className="flex flex-col gap-1 text-left">
                <Badge variant={row.original.status === 'active' ? 'default' : 'outline'} className="capitalize text-[10px] font-black w-fit">{row.original.status}</Badge>
                {row.original.enhancementMethod && (
                    <Badge className="bg-primary/10 text-primary text-[8px] h-4 uppercase font-black border-none gap-1 py-0 px-1.5 w-fit">
                        <Zap className="h-2 w-2 fill-current" /> {row.original.enhancementMethod} {formatDateSafe(row.original.lastEnrichedAt, "dd/MM")}
                    </Badge>
                )}
            </div>
        )
      },
      { 
          id: 'actions', 
          header: <div className="text-right">Actions</div>, 
          cell: ({ row }) => (
            <div className="flex justify-end items-center gap-1 text-foreground">
              <EnrichPartnerButton partner={row.original} onUpdate={() => fetchData()} />
              <Button variant="ghost" size="icon" onClick={() => handleEngage(row.original)} title="Engage"><Send className="h-4 w-4 text-primary" /></Button>
              <AddCommunicationLogDialog partnerId={row.original.id} collection={row.original.source === 'Lead' ? 'leads' : 'partners'} onLogAdded={() => fetchData()} />
              <CommunicationLogDialog partnerId={row.original.id} partnerName={row.original.firstName} />
              <PartnerTasksDialog partner={row.original} />
              <PartnerOversightDialog partner={row.original} onUpdate={() => fetchData()} />
              <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'edit', data: row.original })}><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'delete', data: row.original })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ) 
      }
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
    <div className="space-y-6 text-left text-foreground">
      <EngageDialog open={dialog.type === 'engage'} onOpenChange={(o) => !o && setDialog({ type: null })} partners={dialog.data || []} initialIndex={dialog.initialIndex} audience={type as any} onEngageSuccess={() => fetchData()} />
      <PartnerDialog open={dialog.type === 'add' || dialog.type === 'edit'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.type === 'edit' ? dialog.data : undefined} onSave={() => fetchData()} targetType={type} />
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(o) => !o && setDialog({ type: null })}>
        <AlertDialogContent className="text-left text-foreground">
          <AlertDialogHeader><AlertDialogTitle className="text-left">Are you sure?</AlertDialogTitle><AlertDialogDescription>Delete record?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialog({ type: null })}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecord} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6 text-left text-foreground">
          <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left text-foreground">
              <div className="text-left"><CardTitle className="flex items-center gap-2 font-black font-headline text-left text-foreground text-foreground text-foreground"><Database /> {audienceLabel} Registry</CardTitle><CardDescription className="text-left text-muted-foreground">Full database view ({allRecords.length} records).</CardDescription></div>
              <div className="flex gap-2 text-left text-foreground text-foreground">
                  <Button variant="outline" size="sm" onClick={() => fetchData()} className="gap-2 text-foreground"><RotateCcw className="h-4 w-4" /> Sync Registry</Button>
                  <Popover>
                      <PopoverTrigger asChild>
                          <Button variant="outline" className="gap-2 text-foreground"><Settings2 className="h-4 w-4" /> Columns</Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2 text-left text-foreground">
                          <div className="space-y-1 text-left text-foreground">
                              {Object.keys(visibleColumns).map(col => (
                                  <div key={col} className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer text-[10px] font-black uppercase tracking-widest text-foreground" onClick={() => setVisibleColumns(prev => ({...prev, [col]: !prev[col]}))}>
                                      <span>{col.replace(/([A-Z])/g, ' $1')}</span>
                                      {visibleColumns[col] && <Check className="h-3 w-3 text-primary text-foreground" />}
                                  </div>
                              ))}
                          </div>
                      </PopoverContent>
                  </Popover>
                  <Popover>
                      <PopoverTrigger asChild>
                          <Button variant="outline" className="gap-2 text-foreground"><Download className="mr-2 h-4 w-4" /> Export</Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2 text-left text-foreground">
                          <div className="space-y-1 text-left text-foreground">
                              <Button variant="ghost" className="w-full justify-start text-xs font-bold text-foreground" onClick={() => handleExport('Standard')}><Download className="mr-2 h-3.5 w-3.5" /> Standard CSV</Button>
                              <Button variant="ghost" className="w-full justify-start text-xs font-bold text-primary" onClick={() => handleExport('SendGrid')}><Mail className="mr-2 h-3.5 w-3.5" /> SendGrid Export</Button>
                          </div>
                      </PopoverContent>
                  </Popover>
                  <BulkImportDialog type={type} onComplete={() => fetchData()}><Button variant="outline" className="text-foreground"><Upload className="mr-2 h-4 w-4" /> Import</Button></BulkImportDialog>
                  <Button onClick={() => setDialog({ type: 'add' })} className="text-white font-bold"><PlusCircle className="mr-2 h-4 w-4"/>Add Record</Button>
              </div>
          </CardHeader>

          <Card className="text-left text-foreground text-foreground text-foreground">
              <CardContent className="pt-6 text-left text-foreground text-foreground text-foreground">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg text-left text-foreground text-foreground text-foreground">
                      <div className="space-y-1 text-left text-foreground text-foreground text-foreground">
                          <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5 text-foreground"><Filter className="h-3 w-3"/> Status Filter</Label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                              <SelectTrigger className="h-9 bg-white text-xs text-left text-foreground"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="all">All Statuses</SelectItem>
                                  <SelectItem value="new">New</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-1 text-left text-foreground text-foreground text-foreground">
                          <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5 text-foreground"><Users className="h-3 w-3"/> Assignee</Label>
                          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                              <SelectTrigger className="bg-white text-left text-foreground"><SelectValue placeholder="All Staff" /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="all">All Staff</SelectItem>
                                  <SelectItem value="none">Unallocated</SelectItem>
                                  {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-1 text-left text-foreground text-foreground text-foreground">
                          <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5 text-foreground"><Send className="h-3 w-3"/> Outreach</Label>
                          <Select value={outreachFilter} onValueChange={setOutreachFilter}>
                              <SelectTrigger className="h-9 bg-white text-xs text-left text-foreground text-left text-foreground text-foreground"><SelectValue placeholder="All Outreach" /></SelectTrigger>
                              <SelectContent><SelectItem value="all">All Outreach</SelectItem><SelectItem value="none">No Outreach Yet</SelectItem></SelectContent>
                          </Select>
                      </div>
                  </div>
                  {isLoading ? <div className="flex justify-center items-center py-10 text-foreground text-left text-foreground text-foreground text-foreground text-foreground text-foreground text-foreground text-foreground text-foreground"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div> : (
                      <div className="space-y-6 text-left text-foreground text-foreground text-foreground">
                          <DataTable columns={columns} data={filteredRecords} onSelectionChange={setSelectedIds} />
                          {allRecords.length >= 100 && (
                               <div className="flex justify-center pt-4 text-foreground text-foreground text-foreground">
                                  <Button variant="outline" size="lg" onClick={() => fetchData(allRecords.length + 100)} disabled={isLoading} className="gap-2 min-w-[200px] text-foreground text-foreground">
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
