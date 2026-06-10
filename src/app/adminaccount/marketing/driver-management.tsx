
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { 
  Loader2, PlusCircle, Users, Edit, Trash2, Send, Filter, RotateCcw, Search, Database, Upload, MapPin, Mail, Lock, ShieldCheck
} from 'lucide-react';
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
import { CommunicationLogDialog } from './CommunicationLogDialog';
import { PartnerTasksDialog } from './PartnerTasksDialog';
import { formatDateSafe, cn } from '@/lib/utils';
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
    if (text.includes('<html>')) {
        throw new Error("Server Timeout: Operation taking too long. Try refreshing.");
    }
    throw new Error(text || `API Error: ${action}`);
  }

  const result = await response.json();
  if (!result.success) throw new Error(result.error || `API Error: ${action}`);
  return result;
}

export default function DriverManagement() {
  const { toast } = useToast();
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Load Failed', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { forceRefresh(); }, [forceRefresh]);

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
        const res = await performAdminAction(token, 'searchRegistry', { term: searchTerm });
        setPartners(res.data || []);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Search Error', description: e.message });
    } finally {
        setIsLoading(false);
    }
  };

  const integrityStats = useMemo(() => {
    const stats = { missingEmail: 0, nonMobile: 0, missingLocation: 0 };
    partners.forEach(p => {
        const email = (p.email || '').toString().toLowerCase();
        if (!email || email === 'null' || email === 'n/a') stats.missingEmail++;
        
        const phone = (p.phone || p.registry_line || '').toString();
        if (phone.startsWith('+271') || phone.startsWith('+272') || phone.startsWith('+273')) stats.nonMobile++;
        
        if (!p.address && !p.operational_hub) stats.missingLocation++;
    });
    return stats;
  }, [partners]);

  const filteredDrivers = useMemo(() => {
    return partners.filter(p => {
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || p.entryType === categoryFilter;
        return matchesStatus && matchesCategory;
    });
  }, [partners, statusFilter, categoryFilter]);

  const columns: ColumnDef<any>[] = [
    { 
        header: 'Driver Identity', 
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="font-bold">{row.original.service_handle || `${row.original.firstName} ${row.original.lastName}`}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-black">{row.original.operational_hub || row.original.address || 'SA Region'}</span>
            </div>
        )
    },
    { accessorKey: 'entryType', header: 'License', cell: ({row}) => <Badge variant="outline" className="text-[10px] uppercase font-bold">{row.original.entryType || 'General'}</Badge> },
    { accessorKey: 'phone', header: 'Contact' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant="outline" className="capitalize text-[10px]">{row.original.status}</Badge> },
    { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <EnrichPartnerButton partner={row.original} onUpdate={forceRefresh} />
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'engage', data: row.original })} title="Engage"><Send className="h-4 w-4 text-primary" /></Button>
        <CommunicationLogDialog partnerId={row.original.id} partnerName={row.original.firstName || row.original.service_handle} />
        <PartnerTasksDialog partner={row.original} />
        <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'delete', data: row.original })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <>
      <EngageDialog open={dialog.type === 'engage'} onOpenChange={(o) => !o && setDialog({ type: null })} partner={dialog.data} audience="drivers" onEngageSuccess={forceRefresh} />
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(o) => !o && setDialog({ type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Record?</AlertDialogTitle><AlertDialogDescription>Delete driver record?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setDialog({ type: null })}>Cancel</AlertDialogCancel><AlertDialogAction onClick={forceRefresh} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="space-y-6">
        <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
                <CardTitle className="flex items-center gap-2"><Users /> Industrial Workforce Registry</CardTitle>
                <CardDescription>Targeted view of recent commercial service providers. Use search for deep access.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <BulkImportDialog type="driver" onComplete={forceRefresh}><Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import</Button></BulkImportDialog>
                <Button onClick={() => setDialog({ type: 'add' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Record</Button>
            </div>
        </CardHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 flex items-center gap-4">
                    <Mail className="h-8 w-8 text-amber-600 opacity-40" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Missing Emails</p>
                        <p className="text-2xl font-black text-amber-700">{integrityStats.missingEmail}</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 flex items-center gap-4">
                    <Phone className="h-8 w-8 text-blue-600 opacity-40" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Non-Mobile Lines</p>
                        <p className="text-2xl font-black text-blue-700">{integrityStats.nonMobile}</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-4 flex items-center gap-4">
                    <MapPin className="h-8 w-8 text-slate-600 opacity-40" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Unknown Regions</p>
                        <p className="text-2xl font-black text-slate-700">{integrityStats.missingLocation}</p>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
                    <div className="md:col-span-2 space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5"><Search className="h-3 w-3"/> Deep Registry Search</Label>
                        <div className="flex gap-2">
                            <Input placeholder="Type name or ID to search thousands of drivers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                            <Button onClick={handleSearch} disabled={isLoading}><Search className="h-4 w-4"/></Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Category</Label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {driverCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button variant="outline" onClick={forceRefresh} className="h-10 w-full"><RotateCcw className="mr-2 h-4 w-4" /> Reset</Button>
                    </div>
                </div>
                {isLoading ? <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div> : <DataTable columns={columns} data={filteredDrivers} />}
            </CardContent>
        </Card>
      </div>
    </>
  );
}
