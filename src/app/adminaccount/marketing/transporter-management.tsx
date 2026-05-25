'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Loader2, PlusCircle, Truck, Edit, Trash2, Send, CheckCircle, Users, MailCheck, MailQuestion, Filter, Save, Search, Zap, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PartnerOversightDialog } from './PartnerOversightDialog';
import { EngageDialog } from './EngageDialog';
import { formatDateSafe } from '@/lib/utils';
import { EnrichPartnerButton, BulkEnrichButton } from './EnrichPartnerButton';
import { Label } from '@/components/ui/label';
import { BatchResearchDialog } from './BatchResearchDialog';
import { BulkImportDialog } from './BulkImportDialog';
import { Checkbox } from '@/components/ui/checkbox';

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
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  contactPerson: z.string().optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive', 'contacted', 'new']),
  type: z.enum(['partner', 'isa', 'investor', 'developer', 'supplier', 'transporter']),
});
type PartnerFormValues = z.infer<typeof partnerSchema>;

function TransporterDialog({ open, onOpenChange, partner, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; partner?: any; onSave: () => void; }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<PartnerFormValues>({ 
      resolver: zodResolver(partnerSchema),
      defaultValues: { type: 'transporter', status: 'active' }
  });

  useEffect(() => {
    if (open) {
      if (partner) form.reset(partner);
      else form.reset({ firstName: '', lastName: '', email: '', phone: '', contactPerson: '', companyName: '', address: '', status: 'active', type: 'transporter' });
    }
  }, [open, partner, form]);

  async function onSubmit(values: PartnerFormValues) {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");
      await performAdminAction(token, 'savePartner', { partner: { id: partner?.id, ...values } });
      toast({ title: 'Transporter Saved' });
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
          <DialogTitle>{partner ? 'Edit' : 'Add'} Transporter</DialogTitle>
          <DialogDescription>Enter the transporter details.</DialogDescription>
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
            <FormField control={form.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Contact Person (Alternative)</FormLabel><FormControl><Input {...field} placeholder="Full Name" /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="Enter physical address..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="partner">Partner</SelectItem>
                            <SelectItem value="isa">ISA</SelectItem>
                            <SelectItem value="supplier">Supplier</SelectItem>
                            <SelectItem value="transporter">Transporter</SelectItem>
                        </SelectContent>
                    </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="contacted">Researching</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                        </SelectContent>
                    </Select>
                </FormItem>
              )} />
            </div>
            <DialogFooter className="pt-4 border-t">
              <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
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
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteLeads', payload: { leadIds: idsToDelete } }),
        cache: 'no-store'
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);

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
      <Button variant="outline" onClick={findDuplicates} disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
        Find & Clean Duplicates
      </Button>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Duplicate Transporter Cleaner</DialogTitle>
          <DialogDescription>
            Select the records you want to keep. The others will be deleted.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 max-h-[60vh] overflow-y-auto p-4">
          {duplicates.map((group, groupIndex) => (
            <Card key={groupIndex}>
              <CardHeader><CardTitle>Group: {group[0]?.companyName}</CardTitle></CardHeader>
              <CardContent>
                {group.map(lead => (
                  <div key={lead.id} className="flex items-start gap-4 p-2 border-b last:border-b-0">
                    <Checkbox
                      id={`lead-${groupIndex}-${lead.id}`}
                      checked={selections[groupIndex] === lead.id}
                      onCheckedChange={() => setSelections(prev => ({ ...prev, [groupIndex]: lead.id }))}
                    />
                    <label htmlFor={`lead-${groupIndex}-${lead.id}`} className="text-sm">
                      <p className="font-semibold">{lead.contactPerson || lead.firstName + ' ' + lead.lastName}</p>
                      <p className="text-muted-foreground">{lead.email || 'No Email'}</p>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleClean} disabled={isLoading}>Clean Selected</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TransporterManagement() {
  const { toast } = useToast();
  const [partners, setPartners] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [dialog, setDialog] = useState<{ type: 'add' | 'edit' | 'delete' | 'engage' | 'batch-ai' | null, data?: any }>({ type: null });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [dataFilter, setDataFilter] = useState('all');

  const forceRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      
      const t = Date.now();
      const [res, staffRes] = await Promise.all([
        performAdminAction(token, 'getPartnersByType', { type: 'transporter', t }),
        performAdminAction(token, 'getPlatformStaff', { t })
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

  const staffMap = useMemo(() => new Map(staff.map(s => [s.id, `${s.firstName} ${s.lastName}`])), [staff]);

  const filteredTransporters = useMemo(() => {
    return partners.filter(p => {
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchesAssignee = assigneeFilter === 'all' || p.assigneeId === assigneeFilter;
        
        let matchesData = true;
        if (dataFilter === 'no-email') matchesData = !p.email;
        else if (dataFilter === 'no-phone') matchesData = !p.phone;
        else if (dataFilter === 'no-website') matchesData = !p.website;
        else if (dataFilter === 'has-email') matchesData = !!p.email;
        else if (dataFilter === 'has-phone') matchesData = !!p.phone;
        else if (dataFilter === 'has-website') matchesData = !!p.website;

        return matchesStatus && matchesAssignee && matchesData;
    });
  }, [partners, statusFilter, assigneeFilter, dataFilter]);

  const newRecordsRemaining = useMemo(() => {
      return partners.filter(p => !p.email && (!p.status || p.status === 'new')).length;
  }, [partners]);

  const selectedLeads = useMemo(() => {
      return partners.filter(p => selectedIds.includes(p.id));
  }, [partners, selectedIds]);

  const handleEnhance30 = () => {
      if (isLoading) return;
      
      const uniqueNames = new Set<string>();
      const targets: any[] = [];
      
      // Broader discovery logic: treat missing status as 'new'
      for (const p of partners) {
          const name = (p.companyName || '').trim().toLowerCase();
          const isNew = !p.status || p.status === 'new';
          if (!p.email && isNew && name && !uniqueNames.has(name)) {
              targets.push(p);
              uniqueNames.add(name);
              if (targets.length >= 30) break; // Reduced to 30 for reliability
          }
      }
      
      if (targets.length === 0) {
          toast({ title: "No targets found", description: "All records already have emails or are currently being researched." });
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
          const result = await performAdminAction(token, 'resetResearchQueue', { type: 'transporter' });
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
    { 
        accessorKey: 'companyName', 
        header: 'Transporter', 
        cell: ({ row }) => <div className="font-bold">{row.original.companyName || `${row.original.firstName} ${row.original.lastName}`}</div> 
    },
    { 
        accessorKey: 'contactPerson', 
        header: 'Contact Name',
        cell: ({ row }) => <div>{row.original.contactPerson || `${row.original.firstName || ''} ${row.original.lastName || ''}`.trim() || 'N/A'}</div>
    },
    { 
        accessorKey: 'phone', 
        header: 'Contact Number',
        cell: ({ row }) => <div>{row.original.phone || row.original.telephone_number || 'N/A'}</div>
    },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'lastOutreachSubject', header: 'Last Outreach', cell: ({row}) => (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-primary">{row.original.lastOutreachSubject || 'None'}</span>
            {row.original.lastOutreachAt && <span className="text-[10px] text-muted-foreground">{formatDateSafe(row.original.lastOutreachAt)}</span>}
        </div>
    )},
    { accessorKey: 'lastOpenedAt', header: 'Read Status', cell: ({row}) => (
        <div className="flex items-center gap-2">
            {row.original.lastOpenedAt ? <Badge className="bg-green-100 text-green-700"><MailCheck className="mr-1 h-3 w-3" /> Read</Badge> : <Badge variant="outline" className="text-muted-foreground"><MailQuestion className="mr-1 h-3 w-3" /> Sent</Badge>}
        </div>
    )},
    { accessorKey: 'assigneeId', header: 'Assignee', cell: ({row}) => (
        <div className="flex items-center gap-2">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium">{staffMap.get(row.original.assigneeId) || 'Unallocated'}</span>
        </div>
    )},
    { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <EnrichPartnerButton partner={row.original} onUpdate={forceRefresh} />
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'engage', data: row.original })} title="Initiate Engagement"><Send className="h-4 w-4 text-primary" /></Button>
        <PartnerOversightDialog partner={row.original} onUpdate={forceRefresh} />
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'edit', data: row.original })}><Edit className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'delete', data: row.original })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <>
      <BatchResearchDialog open={dialog.type === 'batch-ai'} onOpenChange={(o) => !o && setDialog({ type: null })} selectedLeads={selectedLeads} onComplete={() => { setSelectedIds([]); forceRefresh(); }} />
      <EngageDialog open={dialog.type === 'engage'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.data} audience="transporters" onEngageSuccess={forceRefresh} />
      <TransporterDialog open={dialog.type === 'add' || dialog.type === 'edit'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.type === 'edit' ? dialog.data : undefined} onSave={forceRefresh} />
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(o) => !o && setDialog({ type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Transporter?</AlertDialogTitle><AlertDialogDescription>Delete "{dialog.data?.companyName}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setDialog({ type: null })}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
                <Truck /> Transporters
                <Badge variant="secondary" className="ml-2">{newRecordsRemaining} New Records</Badge>
            </CardTitle>
            <CardDescription>Manage your transporter leads and pipeline.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleResetQueue} disabled={isResetting}>
                {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RotateCcw className="mr-2 h-4 w-4" />}
                Reset Stuck Research
            </Button>
            <Button variant="default" className="bg-amber-600 hover:bg-amber-700" onClick={handleEnhance30} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4" />}
                Enhance 30 Records
            </Button>
            <BulkImportDialog type="transporter" onComplete={forceRefresh}><Button variant="outline">Bulk Import AI JSON</Button></BulkImportDialog>
            <DuplicateCleaner onComplete={forceRefresh} />
            <Button onClick={() => setDialog({ type: 'add' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Record</Button>
          </div>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
                <div className="flex-1 space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5"><Filter className="h-3 w-3"/> Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="contacted">Researching</SelectItem><SelectItem value="new">New</SelectItem></SelectContent>
                    </Select>
                </div>
                <div className="flex-1 space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5"><Users className="h-3 w-3"/> Assignee</Label>
                    <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="none">Unallocated</SelectItem>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="flex-1 space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5"><Search className="h-3 w-3"/> Data Integrity</Label>
                    <Select value={dataFilter} onValueChange={setDataFilter}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="has-email">Has Email</SelectItem><SelectItem value="no-email">No Email</SelectItem></SelectContent>
                    </Select>
                </div>
            </div>
            {isLoading ? <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div> : (
                <DataTable columns={columns} data={filteredTransporters} onSelectionChange={setSelectedIds} />
            )}
        </CardContent>
      </Card>
    </>
  );
}
