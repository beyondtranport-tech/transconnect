
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
import { Loader2, PlusCircle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { useRouter } from 'next/navigation';
import { AgreementActionMenu } from './agreements/AgreementActionMenu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

const agreementSchema = z.object({
  clientId: z.string().min(1, "A client must be selected."),
  type: z.enum(["loan", "installment-sale", "lease", "factoring"]),
  amount: z.coerce.number().positive('Amount must be positive'),
  rate: z.coerce.number().min(0, 'Rate cannot be negative'),
  term: z.coerce.number().int().positive('Term must be a positive integer'),
  assetId: z.string().optional(),
});
type FormValues = z.infer<typeof agreementSchema>;


function AgreementDialog({ open, onOpenChange, agreement, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, agreement?: any, onSave: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(agreementSchema),
  });

  useEffect(() => {
    async function loadDropdownData() {
        if (!open) return;
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");
            const [clientsRes, assetsRes] = await Promise.all([
                performAdminAction(token, 'getLendingData', { collectionName: 'lendingClients' }),
                performAdminAction(token, 'getLendingData', { collectionName: 'lendingAssets' }),
            ]);
            setClients(clientsRes.data || []);
            // Filter for available assets, but also include the asset currently linked to the agreement being edited.
            const availableAssets = (assetsRes.data || []).filter((a: any) => a.status === 'available' || a.id === agreement?.assetId);
            setAssets(availableAssets);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Failed to load clients/assets', description: e.message });
        }
    }
    loadDropdownData();
  }, [open, agreement, toast]);

  useEffect(() => {
    if (open) {
      form.reset(agreement || { clientId: '', type: 'loan', amount: 0, rate: 0, term: 0, assetId: '' });
    }
  }, [open, agreement, form]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Auth failed.");
        await performAdminAction(token, 'saveLendingAgreement', { agreement: { id: agreement?.id, ...values } });
        toast({ title: agreement ? 'Agreement Updated' : 'Agreement Created' });
        onSave();
        onOpenChange(false);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error saving agreement', description: e.message });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{agreement ? 'Edit Agreement' : 'New Agreement'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="clientId" render={({ field }) => (<FormItem><FormLabel>Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!agreement}><FormControl><SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Agreement Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="loan">Loan</SelectItem><SelectItem value="installment-sale">Installment Sale</SelectItem><SelectItem value="lease">Lease</SelectItem><SelectItem value="factoring">Factoring</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="rate" render={({ field }) => (<FormItem><FormLabel>Interest Rate (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="term" render={({ field }) => (<FormItem><FormLabel>Term (Months)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="assetId" render={({ field }) => (<FormItem><FormLabel>Linked Asset (Optional)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an available asset..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="">None</SelectItem>{assets.map(a => <SelectItem key={a.id} value={a.id}>{a.make} {a.model} ({a.year})</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <DialogFooter><Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : null} Save</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const formatCurrency = (value?: number) => {
    if (typeof value !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value);
};

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    pending: 'secondary',
    credit: 'outline',
    payout: 'default',
    active: 'default',
    completed: 'secondary',
    defaulted: 'destructive',
};

function AgreementsListComponent() {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dialogState, setDialogState] = useState<{ type: 'add' | 'edit' | null, data?: any }>({ type: null });

  const forceRefresh = useCallback(() => setRefreshTrigger(k => k + 1), []);

  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const token = await getClientSideAuthToken();
          if (!token) throw new Error("Auth failed.");
          
          const [agreementsResult, clientsResult] = await Promise.all([
              performAdminAction(token, 'getLendingData', { collectionName: 'agreements' }),
              performAdminAction(token, 'getLendingData', { collectionName: 'lendingClients' })
          ]);
    
          setAgreements(agreementsResult.data || []);
          setClients(clientsResult.data || []);
    
        } catch (e: any) {
          setError(e.message);
        } finally {
          setIsLoading(false);
        }
    };
    loadData();
  }, [refreshTrigger]);
  
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

  const enrichedAgreements = useMemo(() => agreements.map(a => ({
      ...a,
      clientName: clientMap.get(a.clientId) || 'Unknown Client',
  })), [agreements, clientMap]);

  const handleSave = () => {
    forceRefresh();
    setDialogState({ type: null });
  };
  
  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'id', header: 'Agreement ID' },
    { accessorKey: 'clientName', header: 'Client' },
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={statusColors[row.original.status] || 'secondary'} className="capitalize">{row.original.status}</Badge> },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => formatCurrency(row.original.amount) },
    { id: 'actions', header: () => <div className="text-right">Actions</div>, cell: ({ row }) => <div className="text-right"><AgreementActionMenu agreement={row.original} onUpdate={forceRefresh} onEdit={() => setDialogState({ type: 'edit', data: row.original })} /></div> },
  ], [forceRefresh, enrichedAgreements]);

  return (
    <>
        <AgreementDialog open={dialogState.type === 'add' || dialogState.type === 'edit'} onOpenChange={() => setDialogState({ type: null })} agreement={dialogState.data} onSave={handleSave} />
        <Card>
            <CardHeader className="flex-row justify-between items-center">
                <CardTitle className="flex items-center gap-2"><FileText /> Lending Agreements</CardTitle>
                <Button onClick={() => setDialogState({ type: 'add' })}><PlusCircle className="mr-2" /> New Agreement</Button>
            </CardHeader>
            <CardContent>
                {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : error ? <div className="text-destructive">{error}</div> : <DataTable columns={columns} data={enrichedAgreements} />}
            </CardContent>
        </Card>
    </>
  );
}

export default function AgreementsContent() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <AgreementsListComponent />
        </Suspense>
    );
}
