'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getClientSideAuthToken } from '@/firebase';
import { Loader2, PlusCircle, Handshake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { useRouter } from 'next/navigation';
import { PartnerActionMenu } from './partners/PartnerActionMenu';
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
    active: 'default',
    inactive: 'destructive',
};

function PartnerListComponent() {
  const [partners, setPartners] = useState<any[]>([]);
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
          const result = await performAdminAction(token, 'getLendingData', { collectionName: 'lendingPartners' });
          setPartners(result.data || []);
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
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => <Badge className="capitalize">{row.original.type}</Badge> },
    { accessorKey: 'globalFacilityLimit', header: 'Facility Limit', cell: ({ row }) => formatCurrency(row.original.globalFacilityLimit || 0) },
    { id: 'actions', cell: ({ row }) => <PartnerActionMenu partner={row.original} onUpdate={forceRefresh} /> },
  ], [forceRefresh]);

  return (
      <Card>
        <CardHeader className="flex-row justify-between items-center"><CardTitle className="flex items-center gap-2"><Handshake />Lending Partners</CardTitle><Button onClick={() => router.push('/lending/partners/new')}><PlusCircle className="mr-2"/>Add Partner</Button></CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : error ? <div className="text-destructive">{error}</div> : <DataTable columns={columns} data={partners} />}
        </CardContent>
      </Card>
  );
}

export default function PartnersContent() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <PartnerListComponent />
        </Suspense>
    );
}
