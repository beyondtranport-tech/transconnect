'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getClientSideAuthToken } from '@/firebase';
import { Loader2, PlusCircle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { useRouter } from 'next/navigation';
import { AgreementActionMenu } from './agreements/AgreementActionMenu';

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
  
  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'id', header: 'Agreement ID' },
    { accessorKey: 'clientName', header: 'Client' },
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={statusColors[row.original.status] || 'secondary'} className="capitalize">{row.original.status}</Badge> },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => formatCurrency(row.original.amount) },
    { id: 'actions', header: () => <div className="text-right">Actions</div>, cell: ({ row }) => <div className="text-right"><AgreementActionMenu agreement={row.original} onUpdate={forceRefresh} /></div> },
  ], [forceRefresh, enrichedAgreements]);

  return (
    <Card>
        <CardHeader className="flex-row justify-between items-center">
            <CardTitle className="flex items-center gap-2"><FileText /> Lending Agreements</CardTitle>
            <Button onClick={() => router.push('/lending/agreements/new')}><PlusCircle className="mr-2" /> New Agreement</Button>
        </CardHeader>
        <CardContent>
            {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : error ? <div className="text-destructive">{error}</div> : <DataTable columns={columns} data={enrichedAgreements} />}
        </CardContent>
    </Card>
  );
}

export default function AgreementsContent() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <AgreementsListComponent />
        </Suspense>
    );
}