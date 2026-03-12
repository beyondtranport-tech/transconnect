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
import { Loader2, PlusCircle, Briefcase, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { AssetActionMenu } from './assets/AssetActionMenu';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    available: 'default',
    financed: 'outline',
    sold: 'secondary',
    decommissioned: 'destructive',
};

const assetSchema = z.object({
  clientId: z.string().min(1, "A client must be selected."),
  make: z.string().min(1, 'Make is required.'),
  model: z.string().min(1, 'Model is required.'),
  year: z.string().min(4, 'Year is required.'),
  costOfSale: z.coerce.number().min(0),
  registrationNumber: z.string().optional(),
  vin: z.string().optional(),
  engineNumber: z.string().optional(),
  status: z.enum(['available', 'financed', 'sold', 'decommissioned']).default('available'),
});
type AssetFormValues = z.infer<typeof assetSchema>;

function AssetDialog({ open, onOpenChange, asset, onSave, defaultClientId }: { open: boolean, onOpenChange: (open: boolean) => void, asset?: any, onSave: () => void, defaultClientId?: string | null }) {
    const [isLoading, setIsLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const { toast } = useToast();

    const form = useForm<AssetFormValues>({
        resolver: zodResolver(assetSchema),
    });

    useEffect(() => {
        async function loadClients() {
            if (!open) return;
            try {
                const token = await getClientSideAuthToken();
                if (!token) throw new Error("Auth failed.");
                const result = await performAdminAction(token, 'getLendingData', { collectionName: 'lendingClients' });
                setClients(result.data || []);
            } catch (e: any) {
                toast({ variant: 'destructive', title: 'Failed to load clients', description: e.message });
            }
        }
        loadClients();
    }, [open, toast]);

    useEffect(() => {
        if (open) {
            form.reset(asset || { clientId: defaultClientId || '', status: 'available' });
        }
    }, [open, asset, defaultClientId, form]);

    const onSubmit = async (values: AssetFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");
            await performAdminAction(token, 'saveLendingAsset', { asset: { id: asset?.id, ...values } });
            toast({ title: asset ? 'Asset Updated' : 'Asset Created' });
            onSave();
            onOpenChange(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error saving asset', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>{asset ? 'Edit Asset' : 'Add New Asset'}</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="clientId" render={({ field }) => (<FormItem><FormLabel>Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="make" render={({ field }) => (<FormItem><FormLabel>Make</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="model" render={({ field }) => (<FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="year" render={({ field }) => (<FormItem><FormLabel>Year</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="costOfSale" render={({ field }) => (<FormItem><FormLabel>Cost of Sale (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="status" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="available">Available</SelectItem>
                                        <SelectItem value="financed">Financed</SelectItem>
                                        <SelectItem value="sold">Sold</SelectItem>
                                        <SelectItem value="decommissioned">Decommissioned</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                        <DialogFooter><Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : null} Save</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


function AssetListComponent() {
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [dialogState, setDialogState] = useState<{ type: 'add' | 'edit' | null, data?: any }>({ type: null });
  const searchParams = useSearchParams();
  const defaultClientId = searchParams.get('clientId');

  const forceRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Auth failed.");
      const result = await performAdminAction(token, 'getLendingData', { collectionName: 'lendingAssets' });
      setAssets(result.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    forceRefresh();
  }, [forceRefresh]);

  const handleSave = () => {
    forceRefresh();
    setDialogState({ type: null });
  };
  
  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'make', header: 'Make' },
    { accessorKey: 'model', header: 'Model' },
    { accessorKey: 'year', header: 'Year' },
    { accessorKey: 'costOfSale', header: 'Cost', cell: ({ row }) => formatCurrency(row.original.costOfSale) },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={statusColors[row.original.status] || 'secondary'} className="capitalize">{row.original.status}</Badge> },
    { id: 'actions', header: 'Actions', cell: ({ row }) => <AssetActionMenu asset={row.original} onEdit={() => setDialogState({ type: 'edit', data: row.original })} onUpdate={forceRefresh} /> },
  ], [forceRefresh]);
  
  return (
    <>
        <AssetDialog open={dialogState.type === 'add' || dialogState.type === 'edit'} onOpenChange={() => setDialogState({ type: null })} asset={dialogState.data} onSave={handleSave} defaultClientId={defaultClientId} />
        <Card>
            <CardHeader className="flex-row justify-between items-center">
                <CardTitle className="flex items-center gap-2"><Briefcase /> Asset Register</CardTitle>
                <Button onClick={() => setDialogState({ type: 'add' })}><PlusCircle className="mr-2" /> Add Asset</Button>
            </CardHeader>
            <CardContent>
                {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : error ? <div className="text-destructive">{error}</div> : <DataTable columns={columns} data={assets} />}
            </CardContent>
        </Card>
    </>
  );
}

export default function AssetsContent() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <AssetListComponent />
        </Suspense>
    );
}
