'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getClientSideAuthToken } from '@/firebase';
import { Loader2, PlusCircle, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { ClientActionMenu } from '@/app/lending/client-action-menu';
import { useRouter } from 'next/navigation';
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

function ClientListComponent() {
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const forceRefresh = useCallback(() => setRefreshTrigger(k => k + 1), []);

  useEffect(() => {
    const loadData = async () => {
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
    };
    loadData();
  }, [refreshTrigger]);
  
  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge className="capitalize">{row.original.status}</Badge> },
    { accessorKey: 'globalFacilityLimit', header: 'Facility Limit', cell: ({ row }) => formatCurrency(row.original.globalFacilityLimit || 0) },
    { id: 'actions', cell: ({ row }) => <ClientActionMenu client={row.original} onUpdate={forceRefresh} /> },
  ], [forceRefresh]);

  return (
      <Card>
        <CardHeader className="flex-row justify-between items-center"><CardTitle className="flex items-center gap-2"><Users />Lending Clients (Debtors)</CardTitle><Button onClick={() => router.push('/lending/clients/new')}><PlusCircle className="mr-2"/>Add Client</Button></CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : error ? <div className="text-destructive">{error}</div> : <DataTable columns={columns} data={clients} />}
        </CardContent>
      </Card>
  );
}

export default function ClientsContent() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <ClientListComponent />
        </Suspense>
    );
}
