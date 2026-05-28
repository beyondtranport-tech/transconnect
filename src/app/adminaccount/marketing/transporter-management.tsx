
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { 
  Loader2, PlusCircle, Truck, Edit, Trash2, Send, CheckCircle, Users, Filter, Save, 
  Search, Zap, RotateCcw, XCircle, Info, Sparkles, AlertCircle, Mail, Download, Copy, ShieldCheck, Tag, Clock
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
import { EnrichPartnerButton, BulkEnrichButton } from './EnrichPartnerButton';
import { Label } from '@/components/ui/label';
import { BatchResearchDialog } from './BatchResearchDialog';
import { BulkImportDialog } from './BulkImportDialog';
import { BulkOutreachUpdateDialog } from './BulkOutreachUpdateDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  status: z.enum(['active', 'inactive', 'contacted', 'new', 'qualified', 'invited', 'registered']),
  type: z.enum(['partner', 'isa', 'investor', 'developer', 'supplier', 'transporter']),
});
type PartnerFormValues = z.infer<typeof partnerSchema>;

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
      <DialogTrigger asChild>
        <Button variant="outline" onClick={findDuplicates} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Find & Clean Duplicates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Duplicate Lead Cleaner</DialogTitle>
          <DialogDescription>
            Select the records you want to keep. All unselected records in the group will be deleted.
          </DialogDescription>
        </DialogHeader>
        
        <Alert className="bg-amber-50 border-amber-200">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertTitle>Recommendation Guide</AlertTitle>
            <AlertDescription className="text-xs">
                Always keep <strong>Members</strong> (Registered users) and delete <strong>Leads</strong> (Projections). 
                Deleting a Member record will break their live account access.
            </AlertDescription>
        </Alert>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="flex items-center justify-between mb-4 p-3 bg-muted rounded-md border border-dashed">
            <div className="flex items-center gap-2">
                <Checkbox 
                    id="select-all-recommended-leads" 
                    checked={Object.keys(selections).length === duplicates.length}
                    onCheckedChange={(checked) => {
                        if (checked) {
                            const newSelections: Record<number, string> = {};
                            duplicates.forEach((group, index) => {
                                const member = group.find(r => r.source === 'Member');
                                newSelections[index] = member ? member.id : group[0].id;
                            });
                            setSelections(newSelections);
                        } else {
                            setSelections({});
                        }
                    }}
                />
                <Label htmlFor="select-all-recommended-leads" className="text-xs font-bold cursor-pointer">Apply Recommended Selections to ALL Groups</Label>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">{duplicates.length} Duplicate Groups Found</p>
          </div>

          {duplicates.map((group, groupIndex) => {
             const groupName = group.find(r => r.companyName)?.companyName || 'Unnamed Group';
             return (
                <Card key={groupIndex} className="shadow-none border">
                <CardHeader className="py-3 bg-muted/30"><CardTitle className="text-sm font-bold">Group: {groupName}</CardTitle></CardHeader>
                <CardContent className="p-0">
                    {group.map(lead => {
                        const isRecommended = lead.source === 'Member';
                        return (
                            <div key={lead.id} className={cn("flex items-start gap-4 p-4 border-b last:border-b-0", selections[groupIndex] === lead.id ? "bg-primary/5" : "")}>
                                <Checkbox
                                    id={`lead-${groupIndex}-${lead.id}`}
                                    checked={selections[groupIndex] === lead.id}
                                    onCheckedChange={() => setSelections(prev => ({ ...prev, [groupIndex]: lead.id }))}
                                />
                                <label htmlFor={`lead-${groupIndex}-${lead.id}`} className="text-sm cursor-pointer w-full">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold">{lead.companyName || 'No Company Name'}</p>
                                                {isRecommended && <Badge variant="default" className="bg-green-100 text-green-700 text-[10px] uppercase">Recommended</Badge>}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{lead.contactPerson || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'No Contact Name'}</p>
                                            <p className="text-[10px] font-mono text-muted-foreground mt-1">{lead.id}</p>
                                        </div>
                                        <Badge variant={lead.source === 'Member' ? 'default' : 'outline'} className="text-[10px] uppercase font-extrabold">{lead.source}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">{lead.email || 'No Email'} • {lead.phone || lead.telephone_number || 'No Phone'}</p>
                                </label>
                            </div>
                        )
                    })}
                </CardContent>
                </Card>
             )
          })}
        </div>
        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleClean} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
             Delete Unselected & Clean
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
                        <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
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
                        <FormControl><SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="active">Member (Active)</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="contacted">Researching</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="invited">Invited</SelectItem>
                            <SelectItem value="registered">Registered</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                        </SelectContent>
                    </Select>
                </FormItem>
              )} />
            </div>
            <DialogFooter className="pt-4 border-t">
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
  const [partners, setPartners] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
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

  const freshCandidatesRemaining = useMemo(() => {
      return partners.filter(p => {
          const email = (p.email || p.email_address || '').toString().toLowerCase().trim();
          const isInvalidEmail = !email || email === 'null' || email === 'n/a' || email === 'none';
          
          const isSearching = p.researchStatus === 'researching';
          const isEnriched = p.researchStatus === 'completed' || !isInvalidEmail;
          
          return !isSearching && !isEnriched;
      }).length;
  }, [partners]);

  const selectedLeadsForBatch = useMemo(() => {
      return partners.filter(p => selectedIds.includes(p.id));
  }, [partners, selectedIds]);

  const filteredTransporters = useMemo(() => {
    return partners.filter(p => {
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchesAssignee = assigneeFilter === 'all' || p.assigneeId === assigneeFilter;
        const matchesCategory = categoryFilter === 'all' || p.entryType === categoryFilter;
        
        let matchesData = true;
        const email = (p.email || p.email_address || '').toString().toLowerCase().trim();
        const isInvalidEmail = !email || email === 'null' || email === 'n/a' || email === 'none';

        if (dataFilter === 'no-email') matchesData = isInvalidEmail;
        else if (dataFilter === 'no-phone') matchesData = !p.phone;
        else if (dataFilter === 'no-website') matchesData = !p.website;
        else if (dataFilter === 'has-email') matchesData = !isInvalidEmail;
        else if (dataFilter === 'has-phone') matchesData = !!p.phone;
        else if (dataFilter === 'has-website') matchesData = !!p.website;

        return matchesStatus && matchesAssignee && matchesCategory && matchesData;
    });
  }, [partners, statusFilter, assigneeFilter, categoryFilter, dataFilter]);

  const uniqueCategories = useMemo(() => {
    return [...new Set(partners.map(p => p.entryType).filter(Boolean))].sort();
  }, [partners]);

  const handleCopyBccList = () => {
    const emails = filteredTransporters
        .map(t => (t.email || t.email_address || '').toString().toLowerCase().trim())
        .filter(email => email && email !== 'null' && email !== 'n/a' && email.includes('@'));
    
    if (emails.length === 0) {
        toast({ variant: 'destructive', title: "No Emails Found", description: "The current filtered list has no valid email addresses." });
        return;
    }
    
    navigator.clipboard.writeText(emails.join(', '));
    toast({ title: "BCC List Copied!", description: `${emails.length} email addresses copied for Gmail.` });
  };

  const handleExportCsv = () => {
    if (filteredTransporters.length === 0) return;
    
    const headers = ["Transporter Name", "Contact Person", "Email", "Phone", "Status", "Assignee", "Category"];
    const rows = filteredTransporters.map(t => [
        t.companyName || `${t.firstName} ${t.lastName}`,
        t.contactPerson || '',
        t.email || t.email_address || '',
        t.phone || t.telephone_number || '',
        t.status || '',
        staffMap.get(t.assigneeId) || 'Unallocated',
        t.entryType || 'General'
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transporters-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Complete", description: "CSV downloaded." });
  };

  const handleEnhanceBatch = (size: number) => {
      if (isLoading) return;
      const uniqueNames = new Set<string>();
      const targets: any[] = [];
      for (const p of partners) {
          const name = (p.companyName || '').trim().toLowerCase();
          const email = (p.email || p.email_address || '').toString().toLowerCase().trim();
          const isInvalidEmail = !email || email === 'null' || email === 'n/a' || email === 'none';
          const isSearching = p.researchStatus === 'researching';
          const isEnriched = p.researchStatus === 'completed' || !isInvalidEmail;
          if (!isSearching && !isEnriched && name && !uniqueNames.has(name)) {
              targets.push(p);
              uniqueNames.add(name);
              if (targets.length >= size) break;
          }
      }
      if (targets.length === 0) {
          toast({ title: "No fresh candidates found" });
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

  const handleAutoCategorize = async () => {
      setIsCategorizing(true);
      try {
          const token = await getClientSideAuthToken();
          if (!token) return;
          const result = await performAdminAction(token, 'bulkCategorizeLeads', {});
          toast({ title: "Categorization Complete", description: `Auto-tagged ${result.count} transporters.` });
          forceRefresh();
      } catch (e: any) {
          toast({ variant: 'destructive', title: "Tagging Failed", description: e.message });
      } finally {
          setIsCategorizing(false);
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
        header: 'Company Name', 
        cell: ({ row }) => <div className="font-bold">{row.original.companyName || `${row.original.firstName} ${row.original.lastName}`}</div>
    },
    { 
        accessorKey: 'entryType', 
        header: 'Category',
        cell: ({row}) => row.original.entryType ? <Badge variant="outline" className="text-[10px] uppercase font-bold">{row.original.entryType}</Badge> : <span className="text-muted-foreground italic text-xs">Uncategorized</span>
    },
    { 
        accessorKey: 'contactPerson', 
        header: 'Contact Name',
        cell: ({ row }) => <div>{row.original.contactPerson || 'N/A'}</div>
    },
    { 
        accessorKey: 'email', 
        header: 'Email',
        cell: ({ row }) => {
            const email = (row.original.email || row.original.email_address || '').toString().toLowerCase().trim();
            const isInvalid = !email || email === 'null' || email === 'n/a' || email === 'none';
            return <div className={cn(isInvalid ? "text-muted-foreground italic" : "")}>{isInvalid ? "Missing" : email}</div>
        }
    },
    {
        accessorKey: 'researchStatus',
        header: 'Enhanced',
        cell: ({row}) => {
            const isResearching = row.original.researchStatus === 'researching';
            const email = (row.original.email || row.original.email_address || '').toString().toLowerCase().trim();
            const isInvalidEmail = !email || email === 'null' || email === 'n/a' || email === 'none';
            const isCompleted = row.original.researchStatus === 'completed' || !isInvalidEmail;
            if (isResearching) return <Badge variant="outline" className="animate-pulse text-amber-600 border-amber-200 bg-amber-50 text-[10px]">Searching...</Badge>;
            if (isCompleted) return <Badge variant="default" className="bg-green-100 text-green-700 border-green-200 text-[10px]">Enriched</Badge>;
            return <span className="text-xs text-muted-foreground">-</span>;
        }
    },
    {
        accessorKey: 'lastOutreachAt',
        header: 'Outreach',
        cell: ({row}) => {
            if (!row.original.lastOutreachAt) return <span className="text-[10px] text-muted-foreground uppercase font-bold">None</span>;
            return (
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-primary truncate max-w-[100px]">{row.original.lastOutreachSubject}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDateSafe(row.original.lastOutreachAt)}</span>
                </div>
            )
        }
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const statusMap: Record<string, { label: string, color: string }> = {
                'new': { label: 'New', color: 'bg-slate-100 text-slate-700' },
                'contacted': { label: 'Researching', color: 'bg-amber-100 text-amber-700' },
                'qualified': { label: 'Qualified', color: 'bg-blue-100 text-blue-700' },
                'invited': { label: 'Invited', color: 'bg-purple-100 text-purple-700' },
                'registered': { label: 'Registered', color: 'bg-green-100 text-green-700' },
                'active': { label: 'Member (Active)', color: 'bg-green-600 text-white' },
            };
            const config = statusMap[row.original.status] || { label: row.original.status, color: 'bg-muted' };
            return <Badge className={cn("capitalize text-[10px]", config.color)} variant="outline">{config.label}</Badge>
        }
    },
    { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <EnrichPartnerButton partner={row.original} onUpdate={forceRefresh} />
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'engage', data: row.original })} title="Initiate Engagement"><Send className="h-4 w-4 text-primary" /></Button>
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
      <EngageDialog open={dialog.type === 'engage'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.data} audience="transporters" onEngageSuccess={forceRefresh} />
      <TransporterDialog open={dialog.type === 'add' || dialog.type === 'edit'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.type === 'edit' ? dialog.data : undefined} onSave={forceRefresh} />
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(o) => !o && setDialog({ type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Delete "{dialog.data?.companyName || 'this record'}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setDialog({ type: null })}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
                <Truck /> Transporters
                <Badge variant="secondary" className="ml-2">{freshCandidatesRemaining} Fresh Candidates</Badge>
            </CardTitle>
            <CardDescription>Manage your transporter leads and pipeline.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleAutoCategorize} disabled={isCategorizing}>
                {isCategorizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Tag className="mr-2 h-4 w-4" />}
                Auto-Categorize
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetQueue} disabled={isResetting}>
                {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RotateCcw className="mr-2 h-4 w-4" />}
                Reset Stuck
            </Button>
            <BulkOutreachUpdateDialog onComplete={forceRefresh}>
                <Button variant="outline"><Send className="mr-2 h-4 w-4" /> Bulk Outreach</Button>
            </BulkOutreachUpdateDialog>
            <Button variant="default" className="bg-amber-600 hover:bg-amber-700" onClick={() => handleEnhanceBatch(100)} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4" />}
                Master Batch (100)
            </Button>
            <BulkImportDialog type="transporter" onComplete={forceRefresh}><Button variant="outline">Import JSON</Button></BulkImportDialog>
            <DuplicateCleaner onComplete={forceRefresh} />
            <Button onClick={() => setDialog({ type: 'add' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Record</Button>
          </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-4 mb-6">
                <Alert className="bg-primary/5 border-primary/20">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle>Intelligent CRM Funnel</AlertTitle>
                    <AlertDescription className="text-xs space-y-1 leading-relaxed">
                        <p>• <strong>New/Researching:</strong> Initial phase. Use Forensic AI to find names.</p>
                        <p>• <strong>Qualified:</strong> Contact details verified. Ready for the Digital Handshake.</p>
                        <p>• <strong>Invited:</strong> Sign-up link sent. Monitor open rates in the Outreach column.</p>
                        <p>• <strong>Member (Active):</strong> Account live and confirmed by administrator.</p>
                    </AlertDescription>
                </Alert>
                <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex-1 space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><Filter className="h-3 w-3"/> Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Researching</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="invited">Invited</SelectItem>
                                <SelectItem value="registered">Registered</SelectItem>
                                <SelectItem value="active">Member (Active)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><Tag className="h-3 w-3"/> Focus Category</Label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="Transport">Transport</SelectItem>
                                <SelectItem value="Logistics">Logistics</SelectItem>
                                <SelectItem value="Forwarder">Forwarder</SelectItem>
                                <SelectItem value="Distribution">Distribution</SelectItem>
                                {uniqueCategories.filter(c => !['Transport', 'Logistics', 'Forwarder', 'Distribution'].includes(c)).map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><Users className="h-3 w-3"/> Assignee</Label>
                        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All Staff</SelectItem><SelectItem value="none">Unallocated</SelectItem>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><Search className="h-3 w-3"/> Data Filter</Label>
                        <Select value={dataFilter} onValueChange={setDataFilter}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Records</SelectItem>
                                <SelectItem value="has-email">Has Email</SelectItem>
                                <SelectItem value="no-email">Missing Email</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
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
