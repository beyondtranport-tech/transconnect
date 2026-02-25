
'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
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
import { Loader2, PlusCircle, Handshake, Edit, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import Link from 'next/link';

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

const partnerSchema = z.object({
  name: z.string().min(1, 'Partner name is required.'),
  type: z.enum(['supplier', 'vendor', 'associate', 'funder']),
  globalFacilityLimit: z.coerce.number().min(0).optional(),
});
type PartnerFormValues = z.infer<typeof partnerSchema>;

function PartnerDialog({ open, onOpenChange, partner, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, partner?: any, onSave: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<PartnerFormValues>({ resolver: zodResolver(partnerSchema) });

  useEffect(() => {
    if (open) {
      form.reset(partner || { name: '', type: 'funder', globalFacilityLimit: 0 });
    }
  }, [open, partner, form]);

  const onSubmit = async (values: PartnerFormValues) => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Auth failed.");
      await performAdminAction(token, 'saveLendingPartner', { partner: { id: partner?.id, ...values } });
      toast({ title: partner ? 'Partner Updated' : 'Partner Added' });
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
        <DialogHeader><DialogTitle>{partner ? 'Edit Partner' : 'Add New Partner'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Partner Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="supplier">Supplier</SelectItem><SelectItem value="vendor">Vendor</SelectItem><SelectItem value="associate">Associate</SelectItem><SelectItem value="funder">Funder</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="globalFacilityLimit" render={({ field }) => (<FormItem><FormLabel>Global Facility Limit (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <DialogFooter><Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : null} Save Partner</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PartnerActionMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void; }) {
  return (
    <div className="flex justify-end items-center gap-1">
      <Button variant="ghost" size="icon" onClick={onEdit} title="Edit Partner">
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} title="Delete Partner">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

function PartnerListComponent() {
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [dialogState, setDialogState] = useState<{ type: 'add' | 'edit' | 'delete' | null, data?: any }>({ type: null });

  const forceRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Auth failed.");
      const result = await performAdminAction(token, 'getLendingData', { collectionName: 'lendingPartners' });
      setPartners(result.data || []);
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
        await performAdminAction(token, 'deleteLendingPartner', { partnerId: dialogState.data.id, collection: 'lendingPartners' });
        toast({ title: 'Partner Deleted' });
        handleSave();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    }
  };

  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => <Badge className="capitalize">{row.original.type}</Badge> },
    { accessorKey: 'globalFacilityLimit', header: 'Facility Limit', cell: ({ row }) => `R ${Number(row.original.globalFacilityLimit || 0).toLocaleString()}` },
    { id: 'actions', cell: ({ row }) => <PartnerActionMenu onEdit={() => setDialogState({ type: 'edit', data: row.original })} onDelete={() => setDialogState({ type: 'delete', data: row.original })} /> },
  ], [forceRefresh]);

  return (
    <>
      <PartnerDialog open={dialogState.type === 'add' || dialogState.type === 'edit'} onOpenChange={() => setDialogState({ type: null })} partner={dialogState.data} onSave={handleSave} />
      <AlertDialog open={dialogState.type === 'delete'} onOpenChange={() => setDialogState({ type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Partner?</AlertDialogTitle><AlertDialogDescription>This will permanently delete partner "{dialogState.data?.name}".</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} variant="destructive">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Card>
        <CardHeader className="flex-row justify-between items-center"><CardTitle className="flex items-center gap-2"><Handshake />Lending Partners</CardTitle><Button onClick={() => setDialogState({ type: 'add' })}><PlusCircle className="mr-2"/>Add Partner</Button></CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : error ? <div className="text-destructive">{error}</div> : <DataTable columns={columns} data={partners} />}
        </CardContent>
      </Card>
    </>
  );
}

export default function PartnersContent() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <PartnerListComponent />
        </Suspense>
    );
}
