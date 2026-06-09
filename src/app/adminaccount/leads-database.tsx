
'use client';

import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
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
import { getClientSideAuthToken } from '@/firebase';
import { Loader2, PlusCircle, Users, Edit, Trash2, Search, Send, Copy, Filter, Mail, Download, Zap, RotateCcw, Upload, Tag, Save } from 'lucide-react';
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

import { EnrichPartnerButton } from '@/app/adminaccount/marketing/EnrichPartnerButton';
import { PartnerTasksDialog } from '@/app/adminaccount/marketing/PartnerTasksDialog';
import { CommunicationLogDialog } from '@/app/adminaccount/marketing/CommunicationLogDialog';
import { EngageDialog } from '@/app/adminaccount/marketing/EngageDialog';
import { BulkImportDialog } from '@/app/adminaccount/marketing/BulkImportDialog';
import { BatchResearchDialog } from '@/app/adminaccount/marketing/BatchResearchDialog';
import { PartnerOversightDialog } from '@/app/adminaccount/marketing/PartnerOversightDialog';

async function performAdminAction(token: string, action: string, payload?: any) {
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

const leadSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.string().min(1, 'Role is required'),
  status: z.enum(['new', 'contacted', 'qualified', 'invited', 'active']).default('new'),
  notes: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

function LeadsDatabaseComponent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [editLead, setEditLead] = useState<any | null>(null);
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [deleteLead, setDeleteLead] = useState<any | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [engageLead, setEngageLead] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isResetting, setIsResetting] = useState(false);

  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // QUOTA PROTECTION: Use API fetch instead of useCollection real-time listener
  const forceRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      const res = await performAdminAction(token, 'getLeads');
      setLeads(res.data || []);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Registry Load Failed', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { forceRefresh(); }, [forceRefresh]);

  const filteredLeads = useMemo(() => {
    return leads.filter(p => {
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || p.entryType === categoryFilter;
        return matchesStatus && matchesCategory;
    });
  }, [leads, statusFilter, categoryFilter]);

  const handleSearch = async (term: string) => {
      if (!term || term.length < 3) {
          if (term.length === 0) forceRefresh();
          return;
      }
      setIsLoading(true);
      try {
          const token = await getClientSideAuthToken();
          if (!token) return;
          const res = await performAdminAction(token, 'searchRegistry', { term });
          setLeads(res.data || []);
      } catch (e: any) {
          toast({ variant: 'destructive', title: 'Search Error', description: e.message });
      } finally {
          setIsLoading(false);
      }
  };

  async function handleDelete() {
    if (!deleteLead) return;
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Auth failed.");
      await performAdminAction(token, 'deleteLeads', { leadIds: [deleteLead.id] });
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
    { 
        accessorKey: 'companyName', 
        header: 'Company Name'
    },
    { 
        accessorKey: 'entryType', 
        header: 'Category',
        cell: ({row}) => row.original.entryType ? <Badge variant="outline" className="text-[10px] uppercase font-bold">{row.original.entryType}</Badge> : <span className="text-muted-foreground italic text-xs">Uncategorized</span>
    },
    { 
        accessorKey: 'contactPerson', 
        header: 'Contact Name'
    },
    { 
        accessorKey: 'email', 
        header: 'Email'
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <Badge variant="outline" className="capitalize text-[10px]">{row.original.status}</Badge>
    },
    {
      id: 'actions',
      header: <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right flex items-center justify-end gap-1">
          <EnrichPartnerButton partner={row.original} onUpdate={forceRefresh} />
          <Button variant="ghost" size="icon" onClick={() => setEngageLead(row.original)} title="Initiate Engagement">
            <Send className="h-4 w-4 text-primary" />
          </Button>
          <CommunicationLogDialog partnerId={row.original.id} partnerName={row.original.companyName} />
          <PartnerTasksDialog partner={row.original} />
          <Button variant="ghost" size="icon" onClick={() => { setEditLead(row.original); setIsEditLeadOpen(true); }}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => { setDeleteLead(row.original); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      )
    },
  ], [forceRefresh]);

  return (
    <>
      {engageLead && <EngageDialog open={!!engageLead} onOpenChange={(o) => !o && setEngageLead(null)} partner={engageLead} audience="suppliers" onEngageSuccess={forceRefresh} />}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Lead?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the record.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteLead(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-0 pt-0">
          <div>
            <CardTitle className="flex items-center gap-2"><Users /> Lead Database</CardTitle>
            <CardDescription>Capped view of recent leads. Use search for deep registry access.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BulkImportDialog type="lead" onComplete={forceRefresh}><Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import</Button></BulkImportDialog>
            <Button onClick={() => setIsAddLeadOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Lead</Button>
          </div>
        </CardHeader>

        <Card>
          <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="md:col-span-2 space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><Search className="h-3 w-3"/> Deep Registry Search</Label>
                      <Input placeholder="Type at least 3 letters to search thousands of leads..." onChange={(e) => handleSearch(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Researching</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                   <div className="flex items-end">
                      <Button variant="outline" size="sm" onClick={forceRefresh} className="h-8 text-xs w-full">
                          <RotateCcw className="mr-1 h-3 w-3" /> Reset View
                      </Button>
                  </div>
              </div>
              {isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div> : <DataTable columns={columns} data={filteredLeads} onSelectionChange={setSelectedIds} />}
          </CardContent>
        </Card>
      </div>
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
