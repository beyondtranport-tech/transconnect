'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Store, RefreshCcw, AlertTriangle } from 'lucide-react';
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

    if (!response.ok) {
        const errorText = await response.text();
        let message = `API Error ${response.status}`;
        try {
            const errorJson = JSON.parse(errorText);
            message = errorJson.error || message;
        } catch (e) {
            // Not JSON
        }
        throw new Error(message);
    }

    const result = await response.json();
    if (!result.success) {
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
            cell: ({ row }) => <div className="font-bold">{row.original.shopName}</div>,
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
            header: 'Date Created', 
            cell: ({row}) => <div className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</div> 
        },
        {
            id: 'actions',
            header: <div className="text-right">Actions</div>,
            cell: ({ row }) => <ShopActionMenu shop={row.original} onUpdate={loadData} />
        }
    ], [loadData]);
    
    return (
        <div className="space-y-6 text-left">
            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
                 <div className="text-left">
                    <CardTitle className="flex items-center gap-2 font-black font-headline text-left"><Store /> Supplier Mall Registry</CardTitle>
                    <CardDescription className="text-left">
                        Oversight of all member digital branches and catalog submissions.
                    </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                    <RefreshCcw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                    Refresh Mall
                </Button>
            </CardHeader>
            
            {error ? (
                <Card className="border-destructive bg-destructive/5">
                    <CardContent className="p-8 text-center space-y-4">
                        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
                        <div className="space-y-1">
                            <h3 className="font-bold text-destructive">Load Error</h3>
                            <p className="text-sm text-muted-foreground">{error}</p>
                        </div>
                        <Button onClick={loadData} variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white">Retry Connection</Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="text-left border-none shadow-xl">
                    <CardContent className="pt-6 text-left">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Retrieving Mall Nodes...</p>
                            </div>
                        ) : (
                            <DataTable columns={columns} data={shops} />
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
