
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Store, RefreshCcw } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { getClientSideAuthToken } from '@/firebase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ShopActionMenu } from './shop-action-menu';
import { format as formatDateFns } from 'date-fns';

// --- Interfaces & Helper Functions ---
interface Shop {
    id: string;
    shopName: string;
    ownerId: string;
    companyId: string;
    category: string;
    status: 'draft' | 'pending_review' | 'approved' | 'rejected';
    createdAt: string;
    [key: string]: any;
}

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  draft: 'secondary',
  pending_review: 'outline',
  approved: 'default',
  rejected: 'destructive',
};

const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    let date;
    if (typeof dateValue === 'string') {
        date = new Date(dateValue);
    } else if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
    } else {
        return 'N/A';
    }

    if (isNaN(date.getTime())) return 'Invalid Date';
    return formatDateFns(date, "dd MMM yyyy, HH:mm");
};

async function fetchFromAdminAPI(token: string, action: string, payload?: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}

// --- Main Component ---
export default function ShopsList() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const result = await fetchFromAdminAPI(token, 'getShops');
            setShops(result.data || []);
        } catch(e: any) {
            setError(e.message)
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);


    const columns: ColumnDef<Shop>[] = useMemo(() => [
        { 
            accessorKey: 'shopName', 
            header: 'Shop Name',
            cell: ({ row }) => <div>{row.original.shopName}</div>,
        },
        { 
            accessorKey: 'category', 
            header: 'Category',
            cell: ({ row }) => <div>{row.original.category}</div>,
        },
        { 
          accessorKey: 'status', 
          header: 'Status',
          cell: ({ row }) => <Badge variant={statusColors[row.original.status] || 'secondary'} className="capitalize">{row.original.status?.replace(/_/g, ' ')}</Badge>
        },
        { 
            accessorKey: 'createdAt', 
            header: 'Date', 
            cell: ({row}) => formatDate(row.original.createdAt) 
        },
        {
            id: 'actions',
            header: <div className="text-right">Actions</div>,
            cell: ({ row }) => <ShopActionMenu shop={row.original} onUpdate={loadData} />
        }
    ], [loadData]);
    
    if (error) {
        return (
            <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                <h4 className="font-semibold">Error loading data</h4>
                <p className="text-sm">{error}</p>
                 <Button onClick={loadData} variant="destructive" className="mt-2">Try Again</Button>
            </div>
        );
    }
    
    return (
        <Card>
            <CardHeader className="flex-row justify-between items-start">
                 <div>
                    <CardTitle className="flex items-center gap-2"><Store /> All Shops</CardTitle>
                    <CardDescription>Review and manage all shops on the platform.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                    <RefreshCcw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                    Refresh
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                ) : (
                    <DataTable columns={columns} data={shops} />
                )}
            </CardContent>
        </Card>
    );
}
