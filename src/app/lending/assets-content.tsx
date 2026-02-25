
'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { Loader2, PlusCircle, Briefcase, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { AssetActionMenu } from './assets/AssetActionMenu';
import { useRouter, useSearchParams } from 'next/navigation';
import { AssetWizard } from './asset-wizard';

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
    available: 'default',
    financed: 'outline',
    sold: 'secondary',
    decommissioned: 'destructive',
};

function AssetListComponent() {
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'wizard'>('list');
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
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

  const handleEdit = (asset: any) => {
      setSelectedAsset(asset);
      setView('wizard');
  }

  const handleAddNew = () => {
      setSelectedAsset(null);
      setView('wizard');
  }

  const handleBackToList = () => {
      setView('list');
      setSelectedAsset(null);
  }

  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'make', header: 'Make' },
    { accessorKey: 'model', header: 'Model' },
    { accessorKey: 'year', header: 'Year' },
    { accessorKey: 'costOfSale', header: 'Cost', cell: ({ row }) => formatCurrency(row.original.costOfSale) },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={statusColors[row.original.status] || 'secondary'} className="capitalize">{row.original.status}</Badge> },
    { id: 'actions', cell: ({ row }) => <AssetActionMenu asset={row.original} onEdit={() => handleEdit(row.original)} onUpdate={forceRefresh} /> },
  ], [forceRefresh]);

  if (view === 'wizard') {
      return <AssetWizard asset={selectedAsset} onBack={handleBackToList} onSaveSuccess={handleBackToList} defaultClientId={defaultClientId}/>;
  }
  
  return (
    <Card>
      <CardHeader className="flex-row justify-between items-center">
        <CardTitle className="flex items-center gap-2"><Briefcase /> Asset Register</CardTitle>
        <Button onClick={handleAddNew}><PlusCircle className="mr-2" /> Add Asset</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : error ? <div className="text-destructive">{error}</div> : <DataTable columns={columns} data={assets} />}
      </CardContent>
    </Card>
  );
}

export default function AssetsContent() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <AssetListComponent />
        </Suspense>
    );
}
