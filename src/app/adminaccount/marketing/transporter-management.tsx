'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Truck, Eye } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { getClientSideAuthToken } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

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

export default function TransporterManagement() {
    const [transporters, setTransporters] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const result = await fetchFromAdminAPI(token, 'getMembers');
            // Filter for companies that have a loadBoardId, making them a transporter
            const transporterCompanies = (result.data || []).filter((company: any) => !!company.loadBoardId);
            setTransporters(transporterCompanies);
        } catch (e: any) {
            setError(e.message);
            toast({ variant: 'destructive', title: 'Error loading transporters', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const columns: ColumnDef<any>[] = useMemo(() => [
        { accessorKey: 'companyName', header: 'Company Name' },
        { 
            accessorKey: 'ownerName', 
            header: 'Owner',
            cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`
        },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'loadBoardId', header: 'Load Board ID', cell: ({ row }) => <div className="font-mono text-xs">{row.original.loadBoardId}</div> },
        { id: 'actions', header: 'Actions', cell: ({ row }) => <div className="text-right"><Button asChild variant="ghost" size="icon"><Link href={`/backend?view=wallet&memberId=${row.original.id}`}><Eye className="h-4 w-4" /></Link></Button></div> },
    ], []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Truck /> Transporter Management</CardTitle>
                <CardDescription>A list of all members who have set up a load board on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : error ? (
                    <div className="text-destructive">{error}</div>
                ) : (
                    <DataTable columns={columns} data={transporters} />
                )}
            </CardContent>
        </Card>
    );
}
