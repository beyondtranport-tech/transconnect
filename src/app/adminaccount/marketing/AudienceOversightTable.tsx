
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Globe, RefreshCcw, Search, Sparkles, CheckCircle2, UserCheck } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { formatDateSafe, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function AudienceOversightTable({ audience }: { audience: string }) {
    const [records, setRecords] = useState<any[]>([]);
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
                body: JSON.stringify({ action: 'searchRegistry', payload: { type: apiType } }),
            });
            const result = await response.json();
            setRecords(result.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [audience]);

    useEffect(() => { loadData(); }, [loadData]);

    const columns: ColumnDef<any>[] = [
        { 
            header: 'Entity Name', 
            cell: ({row}) => (
                <div className="flex flex-col text-left">
                    <span className="font-bold">{row.original.companyName || row.original.company_name || row.original.trading_name || `${row.original.firstName} ${row.original.lastName}`}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{row.original.id}</span>
                </div>
            )
        },
        { 
            header: 'Research Status', 
            cell: ({row}) => {
                const isSearching = row.original.researchStatus === 'searching';
                const isCompleted = !!(row.original.minedServiceWording || row.original.notes || row.original.website);
                return (
                    <div className="flex flex-col gap-1 items-start">
                        {isSearching ? <Badge className="bg-amber-100 text-amber-700 animate-pulse border-none text-[9px]">Searching</Badge> : 
                         isCompleted ? <Badge className="bg-green-100 text-green-700 border-none text-[9px]">Completed</Badge> : 
                         <Badge variant="outline" className="text-[9px]">Pending</Badge>}
                        {row.original.lastForensicAt && (
                            <span className="text-[8px] text-muted-foreground">{formatDateSafe(row.original.lastForensicAt, "dd MMM")}</span>
                        )}
                    </div>
                );
            }
        },
        { 
            header: 'Enrichment', 
            cell: ({row}) => (
                <div className="flex items-center gap-2">
                    {row.original.website ? <Globe className="h-4 w-4 text-primary" /> : <Globe className="h-4 w-4 text-muted-foreground opacity-20" />}
                    {row.original.minedServiceWording || row.original.notes ? <Sparkles className="h-4 w-4 text-primary" /> : <Sparkles className="h-4 w-4 text-muted-foreground opacity-20" />}
                    {row.original.email ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <CheckCircle2 className="h-4 w-4 text-muted-foreground opacity-20" />}
                </div>
            )
        },
        { 
            header: 'CRM & Reads', 
            cell: ({row}) => (
                <div className="flex flex-col gap-1 items-start">
                    <Badge variant="outline" className="capitalize text-[9px]">{row.original.status}</Badge>
                    {row.original.lastOpenedAt && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            <UserCheck className="h-3 w-3" />
                            Read {formatDateSafe(row.original.lastOpenedAt, "dd/MM")}
                        </div>
                    )}
                </div>
            )
        },
        { 
            header: 'Allocation', 
            cell: ({row}) => (
                <div className="text-xs italic text-muted-foreground">
                    {row.original.assigneeId ? 'Allocated' : 'Unassigned'}
                </div>
            )
        },
    ];

    return (
        <div className="space-y-4 text-left">
             <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2"><Search className="h-5 w-5 text-primary" /> Forensic Oversight</h3>
                    <p className="text-xs text-muted-foreground">Tracking technical enrichment and engagement reads for {audience}.</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                    <RefreshCcw className={cn("h-3 w-3 mr-2", isLoading && "animate-spin")} />
                    Refresh Oversight
                </Button>
            </div>
            {isLoading ? <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div> : <DataTable columns={columns} data={records} />}
        </div>
    );
}
