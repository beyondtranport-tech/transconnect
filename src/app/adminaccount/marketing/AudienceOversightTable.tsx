
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Globe, RefreshCcw, Search, Sparkles, CheckCircle2, UserCheck, Smartphone } from 'lucide-react';
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
                body: JSON.stringify({ action: 'searchRegistry', payload: { type: apiType, limit: 200 } }),
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
            header: 'Read & Access', 
            cell: ({row}) => (
                <div className="flex flex-col gap-1 items-start">
                    {row.original.lastOpenedAt && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 w-fit">
                            <UserCheck className="h-2.5 w-2.5" />
                            Opened {formatDateSafe(row.original.lastOpenedAt, "dd/MM")}
                        </div>
                    )}
                    {row.original.lastAccessedAt && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 w-fit">
                            <Smartphone className="h-2.5 w-2.5" />
                            Accessed {formatDateSafe(row.original.lastAccessedAt, "dd/MM")}
                        </div>
                    )}
                    {!row.original.lastOpenedAt && !row.original.lastAccessedAt && (
                        <span className="text-[10px] text-muted-foreground italic">No activity</span>
                    )}
                </div>
            )
        },
        { 
            header: 'CRM Status', 
            cell: ({row}) => (
                <div className="flex flex-col gap-1 items-start">
                    <Badge variant="outline" className="capitalize text-[9px]">{row.original.status}</Badge>
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
             <div className="flex items-center justify-between text-left">
                <div className="text-left">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Search className="h-5 w-5 text-primary" /> Forensic Oversight</h3>
                    <p className="text-xs text-muted-foreground">Tracking engagement opens and landing pings for {audience}.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                        <RefreshCcw className={cn("h-3 w-3 mr-2", isLoading && "animate-spin")} />
                        Refresh Oversight
                    </Button>
                </div>
            </div>
            {isLoading ? <div className="flex justify-center p-12 text-left"><Loader2 className="animate-spin text-primary" /></div> : <DataTable columns={columns} data={records} />}
        </div>
    );
}
