
'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, getClientSideAuthToken, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Loader2, PlusCircle, Users, Edit, Trash2, Search, Send, Copy, Filter, Mail, Download, Zap, Info, RotateCcw, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { roles } from '@/lib/roles';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { formatDateSafe, cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

// Fixed relative imports
import { EnrichPartnerButton } from '@/app/adminaccount/marketing/EnrichPartnerButton';
import { PartnerTasksDialog } from '@/app/adminaccount/marketing/PartnerTasksDialog';
import { CommunicationLogDialog } from '@/app/adminaccount/marketing/CommunicationLogDialog';
import { EngageDialog } from '@/app/adminaccount/marketing/EngageDialog';
import { BulkImportDialog } from '@/app/adminaccount/marketing/BulkImportDialog';
import { BatchResearchDialog } from '@/app/adminaccount/marketing/BatchResearchDialog';
import { BulkOutreachUpdateDialog } from '@/app/adminaccount/marketing/BulkOutreachUpdateDialog';
import { PartnerOversightDialog } from '@/app/adminaccount/marketing/PartnerOversightDialog';

const leadSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.string().min(1, 'Role is required'),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'invited', 'registered']).default('new'),
  notes: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

function LeadDialog({ open, onOpenChange, lead, onSave, defaultValues }: { open: boolean; onOpenChange: (open: boolean) => void; lead?: any; onSave: () => void; defaultValues?: Partial<LeadFormValues> }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
  });

  useEffect(() => {
    if (open) {
      if (lead) {
        form.reset({
          ...lead,
          status: lead.status || 'new',
        });
      } else {
        form.reset({
          companyName: defaultValues?.companyName || '',
          contactPerson: defaultValues?.contactPerson || '',
          email: defaultValues?.email || '',
          phone: defaultValues?.phone || '',
          role: defaultValues?.role || '',
          status: 'new',
          notes: '',
          website: defaultValues?.website || '',
          address: defaultValues?.address || '',
        });
      }
    }
  }, [open, lead, form, defaultValues]);

  async function onSubmit(values: LeadFormValues) {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");

      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveLead',
          payload: { lead: { id: lead?.id, ...values } }
        }),
        cache: 'no-store'
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save lead.');

      toast({ title: 'Record Updated!' });
      onSave();
      onOpenChange(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit' : 'Add New'} Lead</DialogTitle>
          <DialogDescription>
            Enter the details for the potential member.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <FormField control={form.control} name="companyName" render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="contactPerson" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input {...field} type="email" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="website" render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl><Input {...field} type="url" placeholder="https://example.com" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem>
                <FormLabel>Physical Address</FormLabel>
                <FormControl><Textarea {...field} placeholder="Enter full address..." /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Potential Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map(r => <SelectItem key={r.id} value={r.title}>{r.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="unqualified">Unqualified</SelectItem>
                      <SelectItem value="invited">Invited</SelectItem>
                      <SelectItem value="registered">Registered</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Internal Notes</FormLabel>
                <FormControl><Textarea {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="pt-4 border-t">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Lead
              </Button>
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

function LeadsDatabaseComponent() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const leadsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'leads')) : null, [firestore]);
  const { data: leads, isLoading, forceRefresh } = useCollection(leadsQuery);
  const { toast } = useToast();

  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [editLead, setEditLead] = useState<any | null>(null);
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [deleteLead, setDeleteLead] = useState<any | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [engageLead, setEngageLead] = useState<any | null>(null);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isResetting, setIsResetting] = useState(false);

  const [statusFilter, setStatusFilter] = useState('all');
  const [dataFilter, setDataFilter] = useState('all');

  const newLeadDefaults = useMemo(() => {
    const companyName = searchParams.get('newCompanyName');
    if (companyName) {
      return {
        companyName,
        role: searchParams.get('newRole') || '',
        address: searchParams.get('newAddress') || '',
        website: searchParams.get('newWebsite') || '',
        phone: searchParams.get('newPhone') || '',
        email: searchParams.get('newEmail') || '',
        contactPerson: searchParams.get('newContactPerson') || '',
      };
    }
    return undefined;
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('action') === 'add-member' || newLeadDefaults) {
      setIsAddLeadOpen(true);
      const newPath = `${window.location.pathname}?view=leads-database`;
      router.replace(newPath, { scroll: false });
    }
  }, [searchParams, newLeadDefaults, router]);

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    return leads.filter(p => {
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        
        let matchesData = true;
        const email = (p.email || p.email_address || '').toString().toLowerCase().trim();
        const isInvalidEmail = !email || email === 'null' || email === 'n/a' || email === 'none';

        if (dataFilter === 'no-email') matchesData = isInvalidEmail;
        else if (dataFilter === 'no-phone') matchesData = !p.phone;
        else if (dataFilter === 'no-website') matchesData = !p.website;
        else if (dataFilter === 'has-email') matchesData = !isInvalidEmail;
        else if (dataFilter === 'has-phone') matchesData = !!p.phone;
        else if (dataFilter === 'has-website') matchesData = !!p.website;

        return matchesStatus && matchesData;
    });
  }, [leads, statusFilter, dataFilter]);

  const handleCopyBccList = () => {
      const emails = filteredLeads
          .map(l => (l.email || '').toString().toLowerCase().trim())
          .filter(email => email && email !== 'null' && email !== 'n/a' && email.includes('@'));
      
      if (emails.length === 0) {
          toast({ variant: 'destructive', title: "No Emails Found", description: "The current filtered list has no valid email addresses." });
          return;
      }
      
      navigator.clipboard.writeText(emails.join(', '));
      toast({ title: "BCC List Copied!", description: `${emails.length} email addresses are ready for Gmail.` });
  };

  const handleExportCsv = () => {
    if (filteredLeads.length === 0) return;
    
    const headers = ["Company Name", "Contact Person", "Email", "Phone", "Role", "Status", "Website"];
    const rows = filteredLeads.map(l => [
        l.companyName || '',
        l.contactPerson || '',
        l.email || '',
        l.phone || '',
        l.role || '',
        l.status || '',
        l.website || ''
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `logistics-flow-leads-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Ready", description: "CSV file downloaded. You can upload this to Gmail Mail Merge." });
  };

  const candidatesRemaining = useMemo(() => {
    return (leads || []).filter(p => {
        const email = (p.email || p.email_address || '').toString().toLowerCase().trim();
        const isInvalidEmail = !email || email === 'null' || email === 'n/a' || email === 'none';
        
        const isSearching = p.researchStatus === 'researching';
        const isEnriched = p.researchStatus === 'completed' || !isInvalidEmail;
        
        return !isSearching && !isEnriched;
    }).length;
  }, [leads]);

  const selectedLeadsForBatch = useMemo(() => {
      return (leads || []).filter(l => selectedIds.includes(l.id));
  }, [leads, selectedIds]);

  const handleEnhanceBatch = (size: number) => {
      if (!leads) return;
      const uniqueNames = new Set<string>();
      const targets: any[] = [];
      
      for (const p of leads) {
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
          toast({ title: "No fresh candidates found", description: "All records are either already enriched or currently locked in another search. Try 'Reset Stuck Research' if necessary." });
          return;
      }

      setSelectedIds(targets.map(t => t.id));
      setBatchDialogOpen(true);
  };

  const handleResetQueue = async () => {
      setIsResetting(true);
      try {
          const token = await getClientSideAuthToken();
          if (!token) return;
          const response = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'resetResearchQueue', payload: { type: 'lead' } }),
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
    if (!deleteLead) return;
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteLead', payload: { leadId: deleteLead.id } }),
        cache: 'no-store'
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete lead.');
      toast({ title: 'Lead Deleted' });
      forceRefresh();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    } finally {
      setIsDeleteAlertOpen(false);
      setDeleteLead(null);
    }
  }

  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'companyName', header: 'Company' },
    { 
        accessorKey: 'contactPerson', 
        header: 'Contact Name',
        cell: ({ row }) => <div>{row.original.contactPerson || 'N/A'}</div>
    },
    { 
        accessorKey: 'phone', 
        header: 'Contact Number',
        cell: ({ row }) => <div>{row.original.phone || 'N/A'}</div>
    },
    { 
        accessorKey: 'email', 
        header: 'Email',
        cell: ({ row }) => {
            const email = (row.original.email || '').toString().toLowerCase().trim();
            const isInvalid = !email || email === 'null' || email === 'n/a' || email === 'none';
            return <div className={cn(isInvalid ? "text-muted-foreground italic" : "")}>{isInvalid ? "Missing" : email}</div>
        }
    },
    {
        accessorKey: 'researchStatus',
        header: 'Enhanced Status',
        cell: ({row}) => {
            const isResearching = row.original.researchStatus === 'researching';
            const email = (row.original.email || '').toString().toLowerCase().trim();
            const isInvalidEmail = !email || email === 'null' || email === 'n/a';
            const isCompleted = row.original.researchStatus === 'completed' || !isInvalidEmail;

            if (isResearching) return <Badge variant="outline" className="animate-pulse text-amber-600 border-amber-200 bg-amber-50">Searching...</Badge>;
            if (isCompleted) return <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">Enriched</Badge>;
            return <span className="text-xs text-muted-foreground">-</span>;
        }
    },
    {
        accessorKey: 'lastOutreachAt',
        header: 'Outreach Status',
        cell: ({row}) => {
            if (!row.original.lastOutreachAt) return <span className="text-[10px] text-muted-foreground uppercase font-bold">No Outreach</span>;
            return (
                <div className="flex flex-col gap-1.5">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-primary">{row.original.lastOutreachSubject}</span>
                        <span className="text-[10px] text-muted-foreground">{formatDateSafe(row.original.lastOutreachAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {row.original.lastOpenedAt ? (
                            <Badge variant="default" className="bg-green-100 text-green-700 border-green-200 text-[10px] h-4">
                                <Mail className="mr-1 h-3 w-3" /> Read
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-muted-foreground text-[10px] h-4">
                                <Mail className="mr-1 h-3 w-3" /> Sent
                            </Badge>
                        )}
                    </div>
                </div>
            )
        }
    },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge className="capitalize">{row.original.status}</Badge> },
    {
      id: 'actions',
      header: <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right flex items-center justify-end gap-1">
          <EnrichPartnerButton partner={row.original} onUpdate={forceRefresh} />
          <Button variant="ghost" size="icon" onClick={() => setEngageLead(row.original)} title="Initiate Engagement">
            <Send className="h-4 w-4 text-primary" />
          </Button>
          <CommunicationLogDialog partnerId={row.original.id} partnerName={row.original.firstName} />
          <PartnerTasksDialog partner={row.original} />
          <PartnerOversightDialog partner={row.original} onUpdate={forceRefresh} />
          <Button variant="ghost" size="icon" onClick={() => { setEditLead(row.original); setIsEditLeadOpen(true); }}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => { setDeleteLead(row.original); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      )
    },
  ], [forceRefresh]);

  return (
    <>
      <BatchResearchDialog 
        open={batchDialogOpen} 
        onOpenChange={setBatchDialogOpen} 
        selectedLeads={selectedLeadsForBatch} 
        onComplete={() => { setSelectedIds([]); forceRefresh(); }} 
      />
      {engageLead && (
        <EngageDialog 
          open={!!engageLead} 
          onOpenChange={(o) => !o && setEngageLead(null)} 
          partner={engageLead} 
          audience={engageLead.role?.toLowerCase().includes('supplier') ? 'suppliers' : engageLead.role?.toLowerCase().includes('transporter') ? 'transporters' : 'partners'} 
          onEngageSuccess={forceRefresh}
        />
      )}
      <LeadDialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen} onSave={forceRefresh} defaultValues={newLeadDefaults} />
      {editLead && <LeadDialog open={isEditLeadOpen} onOpenChange={setIsEditLeadOpen} lead={editLead} onSave={forceRefresh} />}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Delete lead for {deleteLead?.companyName}.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteLead(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
                <Users /> Lead Database
                <Badge variant="secondary" className="ml-2">{candidatesRemaining} Candidates Left</Badge>
            </CardTitle>
            <CardDescription>Manage your sales leads.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleExportCsv} title="Export for Gmail Mail Merge">
                <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" onClick={handleCopyBccList} title="Copy addresses for Gmail BCC">
                <Copy className="mr-2 h-4 w-4" /> Copy BCC List
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetQueue} disabled={isResetting}>
                {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RotateCcw className="mr-2 h-4 w-4" />}
                Reset Stuck Research
            </Button>
            <BulkOutreachUpdateDialog onComplete={forceRefresh}>
                <Button variant="outline"><Send className="mr-2 h-4 w-4" /> Bulk Update Status</Button>
            </BulkOutreachUpdateDialog>
            <Button variant="default" className="bg-amber-600 hover:bg-amber-700" onClick={() => handleEnhanceBatch(100)}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4" />}
                Master Batch (100)
            </Button>
            <BulkImportDialog type="lead" onComplete={forceRefresh}>
                <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Bulk Import JSON</Button>
            </BulkImportDialog>
            <DuplicateCleaner onComplete={forceRefresh} />
            <Button onClick={() => setIsAddLeadOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Lead</Button>
          </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-4 mb-6">
                <Alert className="bg-primary/5 border-primary/20">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle>Pipeline Guide</AlertTitle>
                    <AlertDescription className="text-xs space-y-1">
                        <p>• <span className="font-bold text-amber-600">Searching (Orange):</span> Record is currently locked in an AI research batch. Use the <strong>Bulk Import</strong> tool to add findings.</p>
                        <p>• <span className="font-bold text-green-700">Enriched (Green):</span> Contact details have been successfully found by AI.</p>
                        <p>• <span className="font-bold">New:</span> Record is available for future research batches.</p>
                    </AlertDescription>
                </Alert>
                <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex-1 space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5"><Filter className="h-3 w-3"/> Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="unqualified">Unqualified</SelectItem>
                                <SelectItem value="invited">Invited</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5"><Search className="h-3 w-3"/> Data Integrity</Label>
                        <Select value={dataFilter} onValueChange={setDataFilter}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Records</SelectItem>
                                <SelectItem value="has-email">Has Email</SelectItem>
                                <SelectItem value="no-email">Missing Email</SelectItem>
                                <SelectItem value="has-phone">Has Phone</SelectItem>
                                <SelectItem value="no-phone">Missing Phone</SelectItem>
                                <SelectItem value="has-website">Has WWW</SelectItem>
                                <SelectItem value="no-website">Missing WWW</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            {isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div> : <DataTable columns={columns} data={filteredLeads} onSelectionChange={setSelectedIds} />}
        </CardContent>
      </Card>
    </>
  );
}

export default function LeadsDatabase() {
  return (
    <Suspense>
      <LeadsDatabaseComponent />
    </Suspense>
  );
}
