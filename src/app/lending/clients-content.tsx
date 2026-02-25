'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { Loader2, PlusCircle, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { ClientActionMenu } from '@/app/lending/client-action-menu';

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

const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required.'),
  status: z.enum(['active', 'inactive', 'draft']).default('draft'),
  globalFacilityLimit: z.coerce.number().min(0).optional(),
});
type ClientFormValues = z.infer<typeof clientSchema>;

function ClientDialog({ open, onOpenChange, client, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, client?: any, onSave: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<ClientFormValues>({ resolver: zodResolver(clientSchema) });

  useEffect(() => {
    if (open) {
      form.reset(client || { name: '', status: 'draft', globalFacilityLimit: 0 });
    }
  }, [open, client, form]);

  const onSubmit = async (values: ClientFormValues) => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Auth failed.");
      await performAdminAction(token, 'saveLendingClient', { client: { id: client?.id, ...values } });
      toast({ title: client ? 'Client Updated' : 'Client Added' });
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
        <DialogHeader><DialogTitle>{client ? 'Edit Client' : 'Add New Client'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Client Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="globalFacilityLimit" render={({ field }) => (<FormItem><FormLabel>Global Facility Limit (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <DialogFooter><Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : null} Save Client</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function ClientListComponent() {
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [dialogState, setDialogState] = useState<{ type: 'add' | 'edit' | 'delete' | null, data?: any }>({ type: null });

  const forceRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Auth failed.");
      const result = await performAdminAction(token, 'getLendingData', { collectionName: 'lendingClients' });
      setClients(result.data || []);
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
  
  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge className="capitalize">{row.original.status}</Badge> },
    { accessorKey: 'globalFacilityLimit', header: 'Facility Limit', cell: ({ row }) => `R ${Number(row.original.globalFacilityLimit || 0).toLocaleString()}` },
    { id: 'actions', cell: ({ row }) => <ClientActionMenu client={row.original} onEdit={() => setDialogState({ type: 'edit', data: row.original })} onUpdate={forceRefresh} /> },
  ], [forceRefresh]);

  return (
    <>
      <ClientDialog open={dialogState.type === 'add' || dialogState.type === 'edit'} onOpenChange={() => setDialogState({ type: null })} client={dialogState.data} onSave={handleSave} />
      <Card>
        <CardHeader className="flex-row justify-between items-center"><CardTitle className="flex items-center gap-2"><Users />Lending Clients (Debtors)</CardTitle><Button onClick={() => setDialogState({ type: 'add' })}><PlusCircle className="mr-2"/>Add Client</Button></CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : error ? <div className="text-destructive">{error}</div> : <DataTable columns={columns} data={clients} />}
        </CardContent>
      </Card>
    </>
  );
}
