
'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import { Loader2, PlusCircle, Landmark, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}

const facilitySchema = z.object({
  clientId: z.string().min(1, "A client must be selected."),
  partnerId: z.string().min(1, "A partner must be selected."),
  type: z.enum(['loan', 'lease', 'factoring', 'installment_sale']),
  limit: z.coerce.number().positive('Limit must be a positive number'),
  status: z.enum(['active', 'inactive', 'pending']),
});
type FacilityFormValues = z.infer<typeof facilitySchema>;

function FacilityDialog({ open, onOpenChange, facility, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, facility?: any, onSave: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const { toast } = useToast();

  const form = useForm<FacilityFormValues>({ resolver: zodResolver(facilitySchema) });

  useEffect(() => {
    async function loadDropdownData() {
        if (!open) return;
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");
            const [clientsRes, partnersRes] = await Promise.all([
                performAdminAction(token, 'getLendingData', { collectionName: 'lendingClients' }),
                performAdminAction(token, 'getLendingData', { collectionName: 'lendingPartners' }),
            ]);
            setClients(clientsRes.data || []);
            setPartners(partnersRes.data || []);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Failed to load data', description: e.message });
        }
    }
    loadDropdownData();
  }, [open, toast]);

  useEffect(() => {
    if (open) {
      form.reset(facility || { clientId: '', partnerId: '', type: 'loan', limit: 0, status: 'pending' });
    }
  }, [open, facility, form]);

  const onSubmit = async (values: FacilityFormValues) => {
    setIsLoading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Auth failed.");
        await performAdminAction(token, 'saveLendingFacility', { facility: { id: facility?.id, ...values } });
        toast({ title: facility ? 'Facility Updated' : 'Facility Created' });
        onSave();
        onOpenChange(false);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
    } finally {
        setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{facility ? 'Edit Facility' : 'New Facility'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="clientId" render={({ field }) => (<FormItem><FormLabel>Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="partnerId" render={({ field }) => (<FormItem><FormLabel>Partner</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a partner..." /></SelectTrigger></FormControl><SelectContent>{partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="loan">Loan</SelectItem><SelectItem value="installment_sale">Installment Sale</SelectItem><SelectItem value="lease">Lease</SelectItem><SelectItem value="factoring">Factoring</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="limit" render={({ field }) => (<FormItem><FormLabel>Limit (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <DialogFooter><Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : null} Save Facility</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function FacilityActionMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void; }) {
  return (
    <div className="flex justify-end items-center gap-1">
      <Button variant="ghost" size="icon" onClick={onEdit}><Edit className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>
    </div>
  );
}

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    pending: 'secondary',
    active: 'default',
    inactive: 'destructive',
};

function FacilitiesListComponent() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [dialogState, setDialogState] = useState<{ type: 'add' | 'edit' | 'delete' | null, data?: any }>({ type: null });

  const forceRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Auth failed.");
      const result = await performAdminAction(token, 'getLendingData', { collectionName: 'facilities' });
      setFacilities(result.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { forceRefresh(); }, [forceRefresh]);

  const handleSave = () => {
    forceRefresh();
    setDialogState({ type: null });
  };
  
  const handleDelete = async () => {
    if (dialogState.type !== 'delete' || !dialogState.data) return;
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        await performAdminAction(token, 'deleteLendingFacility', { clientId: dialogState.data.clientId, facilityId: dialogState.data.id });
        toast({ title: 'Facility Deleted' });
        handleSave();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    }
  };
  
  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'id', header: 'Facility ID' },
    { accessorKey: 'clientId', header: 'Client ID' },
    { accessorKey: 'partnerId', header: 'Partner ID' },
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={statusColors[row.original.status] || 'secondary'} className="capitalize">{row.original.status}</Badge> },
    { accessorKey: 'limit', header: 'Limit', cell: ({ row }) => formatCurrency(row.original.limit) },
    { id: 'actions', cell: ({ row }) => <FacilityActionMenu onEdit={() => setDialogState({ type: 'edit', data: row.original })} onDelete={() => setDialogState({ type: 'delete', data: row.original })} /> },
  ], []);

  return (
    <>
      <FacilityDialog open={dialogState.type === 'add' || dialogState.type === 'edit'} onOpenChange={() => setDialogState({ type: null })} facility={dialogState.data} onSave={handleSave} />
      <AlertDialog open={dialogState.type === 'delete'} onOpenChange={() => setDialogState({ type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Facility?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this credit facility.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} variant="destructive">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Card>
        <CardHeader className="flex-row justify-between items-center"><CardTitle className="flex items-center gap-2"><Landmark />Credit Facilities</CardTitle><Button onClick={() => setDialogState({ type: 'add' })}><PlusCircle className="mr-2"/>Add Facility</Button></CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : error ? <div className="text-destructive">{error}</div> : <DataTable columns={columns} data={facilities} />}
        </CardContent>
      </Card>
    </>
  );
}

export default function FacilitiesContent() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <FacilitiesListComponent />
        </Suspense>
    );
}
