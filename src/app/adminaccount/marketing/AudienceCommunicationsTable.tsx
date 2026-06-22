
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, RefreshCcw } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { formatDateSafe, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function AudienceCommunicationsTable({ audience }: { audience: string }) {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            const apiType = audience === 'isa' ? 'isa' : (audience === 'finance' ? 'finance' : (audience === 'drivers' ? 'driver' : audience.slice(0, -1)));
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getAudienceCommunications', payload: { type: apiType } }),
            });
            const result = await response.json();
            setLogs(result.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [audience]);

    useEffect(() => { loadData(); }, [loadData]);

    const columns: ColumnDef<any>[] = [
        { accessorKey: 'partnerName', header: 'Partner / Lead' },
        { accessorKey: 'type', header: 'Type', cell: ({row}) => <Badge variant="outline">{row.original.type}</Badge> },
        { accessorKey: 'subject', header: 'Subject' },
        { accessorKey: 'notes', header: 'Details', cell: ({row}) => <div className="text-xs text-muted-foreground truncate max-w-[300px]">{row.original.notes}</div> },
        { accessorKey: 'timestamp', header: 'Date', cell: ({row}) => formatDateSafe(row.original.timestamp, "dd MMM, HH:mm") },
    ];

    return (
        <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Global Communication Feed</h3>
                    <p className="text-xs text-muted-foreground">All recorded interactions for this audience segment.</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                    <RefreshCcw className={cn("h-3 w-3 mr-2", isLoading && "animate-spin")} />
                    Refresh Feed
                </Button>
            </div>
            {isLoading ? <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div> : <DataTable columns={columns} data={logs} />}
        </div>
    );
}
