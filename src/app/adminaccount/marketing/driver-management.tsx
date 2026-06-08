
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { 
  Loader2, PlusCircle, Users, Edit, Trash2, Send, CheckCircle, Mail, Filter, Save, 
  Search, Zap, RotateCcw, XCircle, Info, Tag, Database, ShieldCheck, Upload,
  AlertTriangle, Phone, Globe
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PartnerOversightDialog } from './PartnerOversightDialog';
import { EngageDialog } from './EngageDialog';
import { CommunicationLogDialog } from './CommunicationLogDialog';
import { PartnerTasksDialog } from './PartnerTasksDialog';
import { formatDateSafe, cn } from '@/lib/utils';
import { EnrichPartnerButton } from './EnrichPartnerButton';
import { Label } from '@/components/ui/label';
import { BatchResearchDialog } from './BatchResearchDialog';
import { BulkImportDialog } from './BulkImportDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { driverCategories } from './driver-discovery';

// Schema at the top level
const partnerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  contactPerson: z.string().optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
  entryType: z.string().optional(),
  status: z.enum(['active', 'inactive', 'contacted', 'new', 'qualified', 'invited', 'registered']),
  type: z.literal('driver'),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

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

function DuplicateCleaner({ onComplete }: { onComplete: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<any[][]>([]);
  const [selections, setSelections] = useState<Record<number, string>>({});
  const { toast } = useToast();

  async function findDuplicates() {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Auth failed.");
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'findDuplicateLeads' }),
        cache: 'no-store'
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      setDuplicates(result.data);
      if (result.data.length === 0) {
        toast({ title: "No duplicates found." });
      } else {
        const initialSelections: Record<number, string> = {};
        result.data.forEach((group: any[], index: number) => {
            const memberRecord = group.find(r => r.source === 'Member');
            if (memberRecord) initialSelections[index] = memberRecord.id;
            else initialSelections[index] = group[0].id;
        });
        setSelections(initialSelections);
        setIsOpen(true);
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Error finding duplicates", description: e.message });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleClean() {
    setIsLoading(true);
    const idsToDelete = duplicates.flatMap((group, index) => {
      const idToKeep = selections[index];
      if (!idToKeep) return [];
      return group.filter(lead => lead.id !== idToKeep).map(lead => lead.id);
    });

    if (idsToDelete.length === 0) {
      toast({ title: "No duplicates selected for deletion." });
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Auth failed.");
      await performAdminAction(token, 'deleteLeads', { leadIds: idsToDelete });

      toast({ title: "Duplicates Cleaned!", description: `${idsToDelete.length} duplicate records deleted.` });
      onComplete();
      setIsOpen(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Error cleaning duplicates", description: e.message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={findDuplicates} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Find & Clean Duplicates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Duplicate Driver Cleaner</DialogTitle>
          <DialogDescription>
            Select the records you want to keep. Duplicate identification matches Name and Phone/Email.
          </DialogDescription>
        </DialogHeader>
        
        <Alert className="bg-amber-50 border-amber-200">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertTitle>Identity Protection</AlertTitle>
            <AlertDescription className="text-xs">
                Always keep <strong>Members</strong> (Active accounts) and delete <strong>Leads</strong> (Projections).
            </AlertDescription>
        </Alert>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {duplicates.map((group, groupIndex) => {
             const contactPerson = group.find(r => r.contactPerson || (r.firstName && r.lastName))?.contactPerson || 'N/A';
             return (
                <Card key={groupIndex} className="shadow-none border">
                <CardHeader className="py-3 bg-muted/30 flex flex-row justify-between items-center">
                    <div>
                        <CardTitle className="text-sm font-bold">Matched Pair: {contactPerson}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {group.map(lead => (
                        <div key={lead.id} className={cn("flex items-start gap-4 p-4 border-b last:border-b-0", selections[groupIndex] === lead.id ? "bg-primary/5" : "")}>
                            <Checkbox
                                id={`driver-${groupIndex}-${lead.id}`}
                                checked={selections[groupIndex] === lead.id}
                                onCheckedChange={() => setSelections(prev => ({ ...prev, [groupIndex]: lead.id }))}
                            />
                            <label htmlFor={`driver-${groupIndex}-${lead.id}`} className="text-sm cursor-pointer w-full">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold">{lead.firstName} {lead.lastName}</p>
                                        {lead.source === 'Member' && <Badge className="bg-green-100 text-green-700 text-[10px]">Active Member</Badge>}
                                    </div>
                                    <Badge variant="outline" className="text-[10px] uppercase">{lead.source}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">{lead.email || 'No Email'} • {lead.phone || 'No Phone'}</p>
                            </label>
                        </div>
                    ))}
                </CardContent>
                </Card>
             )
          })}
        </div>
        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleClean} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
             Delete Unselected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DriverDialog({ open, onOpenChange, partner, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; partner?: any; onSave: () => void; }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<PartnerFormValues>({ resolver: zodResolver(partnerSchema) });

  useEffect(() => {
    if (open) {
      if (partner) form.reset(partner);
      else form.reset({ firstName: '', lastName: '', email: '', phone: '', contactPerson: '', companyName: '', address: '', status: 'new', type: 'driver', entryType: 'Code 14 Heavy' });
    }
  }, [open, partner, form]);

  async function onSubmit(values: PartnerFormValues) {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");
      await performAdminAction(token, 'savePartner', { partner: { id: partner?.id, ...values } });
      toast({ title: 'Record Saved' });
      onSave();
      onOpenChange(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{partner ? 'Edit' : 'Add'} Driver Record</DialogTitle>
          <DialogDescription>Enter verified professional details for the driver.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="entryType" render={({ field }) => (
                <FormItem>
                    <FormLabel>License Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger></FormControl>
                        <SelectContent>
                            {driverCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                    <FormLabel>Pipeline Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="new">New Candidate</SelectItem>
                            <SelectItem value="contacted">In Outreach</SelectItem>
                            <SelectItem value="qualified">Qualified / Vetted</SelectItem>
                            <SelectItem value="active">Active Member</SelectItem>
                        </SelectContent>
                    </Select>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Location / Region</FormLabel><FormControl><Input placeholder="e.g. Cape Town, Western Cape" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Certifications & Skills</FormLabel><FormControl><Textarea placeholder="e.g. 5 Years Scania experience, Dangerous Goods certified..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <DialogFooter className="pt-4 border-t">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} Save Driver
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function DriverManagement() {
  const { toast } = useToast();
  const [partners, setPartners] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [dialog, setDialog] = useState<{ type: 'add' | 'edit' | 'delete' | 'engage' | 'batch-ai' | null, data?: any }>({ type: null });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dataFilter, setDataFilter] = useState('all');

  const forceRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      const [res, staffRes] = await Promise.all([
        performAdminAction(token, 'getPartnersByType', { type: 'driver' }),
        performAdminAction(token, 'getPlatformStaff', {}),
        performAdminAction(token, 'refreshDriverCategoryCounts', {})
      ]);
      setPartners(res.data || []);
      setStaff(staffRes.data || []);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { forceRefresh(); }, [forceRefresh]);

  const auditStats = useMemo(() => {
      const stats = { missingEmail: 0, missingPhone: 0, missingLocation: 0 };
      partners.forEach(p => {
          if (!p.email || p.email === 'null' || p.email === 'n/a') stats.missingEmail++;
          if (!p.phone || p.phone === 'null' || p.phone === 'n/a') stats.missingPhone++;
          if (!p.address || p.address === 'null') stats.missingLocation++;
      });
      return stats;
  }, [partners]);

  const filteredDrivers = useMemo(() => {
    return partners.filter(p => {
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchesAssignee = assigneeFilter === 'all' || p.assigneeId === assigneeFilter;
        const matchesCategory = categoryFilter === 'all' || p.entryType === categoryFilter;
        
        let matchesData = true;
        if (dataFilter === 'no-email') matchesData = !p.email;
        else if (dataFilter === 'no-phone') matchesData = !p.phone;
        else if (dataFilter === 'has-email') matchesData = !!p.email;
        else if (dataFilter === 'has-phone') matchesData = !!p.phone;

        return matchesStatus && matchesAssignee && matchesCategory && matchesData;
    });
  }, [partners, statusFilter, assigneeFilter, categoryFilter, dataFilter]);

  const selectedLeadsForBatch = useMemo(() => {
      return (partners || []).filter(l => selectedIds.includes(l.id));
  }, [partners, selectedIds]);

  const handleEnhanceBatch = (size: number) => {
      const targets = partners.filter(p => !p.email && p.researchStatus !== 'researching').slice(0, size);
      if (targets.length === 0) {
          toast({ title: "No candidates found" });
          return;
      }
      setSelectedIds(targets.map(t => t.id));
      setDialog({ type: 'batch-ai' });
  };

  const handleResetQueue = async () => {
      setIsResetting(true);
      try {
          const token = await getClientSideAuthToken();
          if (!token) return;
          const response = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'resetResearchQueue', payload: { type: 'driver' } }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          toast({ title: "Queue Reset", description: `${result.count} records set back to 'New'.` });
          forceRefresh();
      } catch (e: any) {
          toast({ variant: 'destructive', title: "Reset Failed", description: e.message });
      } finally {
          setIsResetting(false);
      }
  };

  async function handleDelete() {
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      await performAdminAction(token, 'deletePartner', { partnerId: dialog.data.id });
      toast({ title: 'Deleted' });
      forceRefresh();
      setDialog({ type: null });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  }

  const columns: ColumnDef<any>[] = [
    { header: 'Name', cell: ({ row }) => <div className="font-bold">{row.original.firstName} {row.original.lastName}</div> },
    { accessorKey: 'entryType', header: 'License', cell: ({row}) => <Badge variant="outline" className="text-[10px] uppercase font-bold">{row.original.entryType || 'General'}</Badge> },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'researchStatus', header: 'Enriched', cell: ({row}) => {
        if (row.original.researchStatus === 'researching') return <Badge variant="outline" className="animate-pulse text-amber-600 border-amber-200 bg-amber-50 text-[10px]">Searching...</Badge>;
        if (row.original.email) return <Badge variant="default" className="bg-green-100 text-green-700 border-green-200 text-[10px]">Enriched</Badge>;
        return <span className="text-xs text-muted-foreground">-</span>;
    }},
    { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <EnrichPartnerButton partner={row.original} onUpdate={forceRefresh} />
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'engage', data: row.original })} title="Engage"><Send className="h-4 w-4 text-primary" /></Button>
        <CommunicationLogDialog partnerId={row.original.id} partnerName={row.original.firstName} />
        <PartnerTasksDialog partner={row.original} />
        <PartnerOversightDialog partner={row.original} onUpdate={forceRefresh} />
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'edit', data: row.original })}><Edit className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => { setDialog({ type: 'delete', data: row.original }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <>
      <BatchResearchDialog open={dialog.type === 'batch-ai'} onOpenChange={(o) => !o && setDialog({ type: null })} selectedLeads={selectedLeadsForBatch} onComplete={() => { setSelectedIds([]); forceRefresh(); }} />
      <EngageDialog open={dialog.type === 'engage'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.data} audience="drivers" onEngageSuccess={forceRefresh} />
      <DriverDialog open={dialog.type === 'add' || dialog.type === 'edit'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.type === 'edit' ? dialog.data : undefined} onSave={forceRefresh} />
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(o) => !o && setDialog({ type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Record?</AlertDialogTitle><AlertDialogDescription>Delete driver "{dialog.data?.firstName} {dialog.data?.lastName}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialog({ type: null })}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="space-y-6">
        <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                    <Users /> Driver Talent Registry
                    <Badge variant="outline" className="ml-2 font-black border-primary text-primary">{partners.length} Records</Badge>
                </CardTitle>
                <CardDescription>Professional database of Code 14, Code 10, and specialized heavy vehicle drivers.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleResetQueue} disabled={isResetting}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Queue
                </Button>
                <Button variant="default" className="bg-amber-600 hover:bg-amber-700" onClick={() => handleEnhanceBatch(50)} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4" />} Batch (50)
                </Button>
                <BulkImportDialog type="driver" onComplete={forceRefresh}><Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import JSON</Button></BulkImportDialog>
                <DuplicateCleaner onComplete={forceRefresh} />
                <Button onClick={() => setDialog({ type: 'add' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Record</Button>
            </div>
        </CardHeader>

        {/* Data Integrity Audit Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card className="bg-muted/30 border-none shadow-none">
                <CardContent className="p-4 flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg"><Mail className="h-4 w-4 text-amber-600"/></div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Missing Email</p>
                        <p className="text-xl font-black mt-1">{auditStats.missingEmail}</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none shadow-none">
                <CardContent className="p-4 flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg"><Phone className="h-4 w-4 text-amber-600"/></div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Missing Phone</p>
                        <p className="text-xl font-black mt-1">{auditStats.missingPhone}</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none shadow-none">
                <CardContent className="p-4 flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg"><Globe className="h-4 w-4 text-amber-600"/></div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Missing Location</p>
                        <p className="text-xl font-black mt-1">{auditStats.missingLocation}</p>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><Filter className="h-3 w-3"/> Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Researching</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><Tag className="h-3 w-3"/> License Type</Label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {driverCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><Users className="h-3 w-3"/> Assignee</Label>
                        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All Staff</SelectItem><SelectItem value="none">Unallocated</SelectItem>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><Search className="h-3 w-3"/> Data Integrity</Label>
                        <Select value={dataFilter} onValueChange={setDataFilter}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Records</SelectItem>
                                <SelectItem value="has-email">Has Email</SelectItem>
                                <SelectItem value="no-email">Missing Email</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {isLoading ? <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div> : <DataTable columns={columns} data={filteredDrivers} onSelectionChange={setSelectedIds} />}
            </CardContent>
        </Card>
      </div>
    </>
  );
}
