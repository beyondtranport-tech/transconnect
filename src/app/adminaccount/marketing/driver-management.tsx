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
  DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { 
  Loader2, PlusCircle, Users, Edit, Trash2, Send, Filter, RotateCcw, Search, Upload, Save, Download, RefreshCcw, Database
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PartnerOversightDialog } from './PartnerOversightDialog';
import { EngageDialog } from './EngageDialog';
import { CommunicationLogDialog } from './CommunicationLogDialog';
import { PartnerTasksDialog } from './PartnerTasksDialog';
import { cn, downloadDataAsCSV } from '@/lib/utils';
import { EnrichPartnerButton } from './EnrichPartnerButton';
import { Label } from '@/components/ui/label';
import { BulkImportDialog } from './BulkImportDialog';
import { driverCategories } from './driver-discovery';

async function performAdminAction(token: string, action: string, payload: any) {
  const response = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
    cache: 'no-store'
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API Error: ${action}`);
  }

  const result = await response.json();
  if (!result.success) throw new Error(result.error || `API Error: ${action}`);
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
  address: z.string().optional(),
  status: z.enum(['active', 'inactive', 'contacted', 'new', 'qualified', 'invited', 'registered']),
  type: z.literal('driver'),
});
type PartnerFormValues = z.infer<typeof partnerSchema>;

function DriverDialog({ open, onOpenChange, partner, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; partner?: any; onSave: () => void; }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<PartnerFormValues>({ 
    resolver: zodResolver(partnerSchema),
    defaultValues: { type: 'driver', status: 'new' }
  });

  useEffect(() => {
    if (open) {
      if (partner) form.reset(partner);
      else form.reset({ firstName: '', lastName: '', email: '', phone: '', mobile: '', contactPerson: '', companyName: '', address: '', status: 'new', type: 'driver' });
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
      <DialogContent className="sm:max-w-2xl text-left">
        <DialogHeader>
          <DialogTitle>{partner ? 'Edit' : 'Add'} Driver Record</DialogTitle>
          <DialogDescription>Enter verified record for the industrial service unit.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2 text-left">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Landline</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="mobile" render={({ field }) => (<FormItem><FormLabel>Mobile (Direct)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Service Handle / Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem className="text-left">
                    <FormLabel>Status</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Researching</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                        </SelectContent>
                    </Select>
                </FormItem>
            )} />
            <DialogFooter className="pt-4 border-t">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} 
                Save Record
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
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialog, setDialog] = useState<{ type: 'add' | 'edit' | 'delete' | 'engage' | null, data?: any }>({ type: null });

  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const forceRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) return;
      const res = await performAdminAction(token, 'getPartnersByType', { type: 'driver' });
      setPartners(res.data || []);
      setHasLoaded(true);
    } catch (e: any) {
        console.warn("Manual fetch failed", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = async () => {
    if (!searchTerm || searchTerm.length < 3) {
        if (searchTerm.length === 0) forceRefresh();
        else toast({ title: "Min 3 characters required" });
        return;
    }
    setIsLoading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) return;
        const res = await performAdminAction(token, 'searchRegistry', { term: searchTerm, type: 'driver' });
        setPartners(res.data || []);
        setHasLoaded(true);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Search Error', description: e.message });
    } finally {
        setIsLoading(false);
    }
  };

  const handleExport = () => {
      if (filteredDrivers.length === 0) return;
      downloadDataAsCSV(filteredDrivers, `drivers-backup-${new Date().toISOString().split('T')[0]}.csv`);
      toast({ title: "Backup Ready" });
  };

  const filteredDrivers = useMemo(() => {
    return (partners || []).filter(p => {
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || p.entryType === categoryFilter;
        return matchesStatus && matchesCategory;
    });
  }, [partners, statusFilter, categoryFilter]);

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
        header: 'Driver Identity', 
        cell: ({ row }) => (
            <div className="flex flex-col text-sm text-left">
                <span className="font-bold">{row.original.service_handle || `${row.original.firstName} ${row.original.lastName}`}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-black">{row.original.operational_hub || row.original.address || 'SA Region'}</span>
            </div>
        )
    },
    { accessorKey: 'entryType', header: 'License', cell: ({row}) => <Badge variant="outline" className="text-[10px] uppercase font-bold">{row.original.entryType || 'General'}</Badge> },
    { accessorKey: 'phone', header: 'Landline' },
    { accessorKey: 'mobile', header: 'Mobile' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant="outline" className="capitalize text-[10px]">{row.original.status}</Badge> },
    { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <EnrichPartnerButton partner={row.original} onUpdate={forceRefresh} />
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'engage', data: row.original })} title="Engage"><Send className="h-4 w-4 text-primary" /></Button>
        <CommunicationLogDialog partnerId={row.original.id} partnerName={row.original.firstName || row.original.service_handle} />
        <PartnerTasksDialog partner={row.original} />
        <PartnerOversightDialog partner={row.original} onUpdate={forceRefresh} />
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'edit', data: row.original })}><Edit className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'delete', data: row.original })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <>
      <EngageDialog open={dialog.type === 'engage'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.data} audience="drivers" onEngageSuccess={forceRefresh} />
      <DriverDialog open={dialog.type === 'add' || dialog.type === 'edit'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.type === 'edit' ? dialog.data : undefined} onSave={forceRefresh} />
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(o) => !o && setDialog({ type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete driver record?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setDialog({ type: null })}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="space-y-6">
        <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-left">
                <CardTitle className="flex items-center gap-2"><Users /> Driver Registry</CardTitle>
                <CardDescription>Targeted view of recent commercial service providers.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExport} disabled={isLoading || !hasLoaded}>
                    <Download className="mr-2 h-4 w-4" /> Backup
                </Button>
                <BulkImportDialog type="driver" onComplete={forceRefresh}><Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import</Button></BulkImportDialog>
                <Button onClick={() => setDialog({ type: 'add' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Record</Button>
            </div>
        </CardHeader>

        {!hasLoaded ? (
            <Card className="bg-primary/5 border-primary/20 p-12 text-center">
                <Database className="mx-auto h-16 w-16 text-primary/20 mb-4" />
                <h2 className="text-2xl font-black font-headline mb-2 text-foreground">Registry Search Variables</h2>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8">Enter your search criteria or load the master driver registry below. This targets your session to preserve your daily data quota.</p>
                <div className="flex flex-col md:flex-row justify-center gap-4 max-w-2xl mx-auto">
                    <div className="flex-1 space-y-2 text-left">
                         <Label className="text-xs font-bold uppercase ml-1">Identity or Region</Label>
                         <Input placeholder="Type name, ID or region to search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="h-12 bg-white" />
                    </div>
                     <div className="flex-1 space-y-2 text-left">
                         <Label className="text-xs font-bold uppercase ml-1">License Class</Label>
                         <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="h-12 bg-white"><SelectValue placeholder="All Classes" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {driverCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="pt-8">
                        <Button size="lg" onClick={handleSearch} disabled={isLoading} className="h-12 px-8">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
                            Load Targeted Records
                        </Button>
                    </div>
                </div>
            </Card>
        ) : (
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg text-left">
                        <div className="md:col-span-2 space-y-2 text-left">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><Search className="h-3 w-3"/> Registry Search</Label>
                            <div className="flex gap-2">
                                <Input placeholder="Type name or ID to search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                                <Button onClick={handleSearch} disabled={isLoading}><Search className="h-4 w-4"/></Button>
                            </div>
                        </div>
                        <div className="flex items-end">
                            <Button variant="outline" onClick={() => setHasLoaded(false)} className="h-10 w-full"><RotateCcw className="mr-2 h-4 w-4" /> Reset Variables</Button>
                        </div>
                    </div>
                    {isLoading ? <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div> : <DataTable columns={columns} data={filteredDrivers} />}
                </CardContent>
            </Card>
        )}
      </div>
    </>
  );
}
