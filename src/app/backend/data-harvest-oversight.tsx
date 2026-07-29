'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Database, ShieldCheck, Zap, BarChart3, SearchCode, Lock, Filter, RefreshCcw, Loader2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * DATA HARVEST OVERSIGHT
 * Strategic oversight of the platform's core IP: Mined and Anonymized Industrial Data.
 */
export default function DataHarvestOversight() {
    const [isLoading, setIsLoading] = useState(false);
    
    // Placeholder data representing the 3 silos
    const harvestLog = [
        { id: 'H_001', silo: 'behavioral', source: 'Visitor_XJ9', type: 'Search Pattern', reliability: 'High', tier: 'Medium' },
        { id: 'H_002', silo: 'operational', source: 'Member_P44', type: 'Fleet Configuration', reliability: 'Verified', tier: 'High' },
        { id: 'H_003', silo: 'financial', source: 'Member_K12', type: 'Repayment Velocity', reliability: 'High', tier: 'High' },
        { id: 'H_004', silo: 'behavioral', source: 'Visitor_A77', type: 'Category Interest', reliability: 'Medium', tier: 'Low' },
    ];

    const columns: ColumnDef<any>[] = [
        {
            header: 'Harvest ID',
            cell: ({row}) => <span className="font-mono text-[10px] font-bold uppercase">{row.original.id}</span>
        },
        {
            header: 'Data Silo',
            cell: ({row}) => (
                <Badge variant="outline" className={cn(
                    "capitalize text-[9px] font-black tracking-widest",
                    row.original.silo === 'behavioral' ? "text-purple-600 border-purple-200 bg-purple-50" :
                    row.original.silo === 'operational' ? "text-blue-600 border-blue-200 bg-blue-50" :
                    "text-green-600 border-green-200 bg-green-50"
                )}>
                    {row.original.silo}
                </Badge>
            )
        },
        { header: 'Metric Type', accessorKey: 'type' },
        { 
            header: 'Anonymized Source', 
            cell: ({row}) => <span className="text-xs text-muted-foreground italic">{row.original.source}</span>
        },
        {
            header: 'Resale Tier',
            cell: ({row}) => (
                <Badge className={cn(
                    "uppercase text-[8px] font-black",
                    row.original.tier === 'High' ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                )}>
                    {row.original.tier} Value
                </Badge>
            )
        }
    ];

    return (
        <div className="space-y-8 text-left text-foreground">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-left">
                <div className="text-left">
                    <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3">
                        <Database className="h-8 w-8 text-primary" />
                        The Data Vault
                    </h1>
                    <p className="text-muted-foreground mt-1">Strategic oversight of the platform's harvested, cleaned, and anonymized industrial IP.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 font-bold h-10">
                        <RefreshCcw className="h-4 w-4" /> Sync Silos
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <Card className="bg-white shadow-xl border-none text-left">
                    <CardHeader className="pb-2 border-b bg-purple-50/50">
                        <CardTitle className="text-[10px] font-black uppercase text-purple-700 tracking-[0.2em] flex items-center gap-2">
                            <SearchCode className="h-4 w-4" /> Behavioral Silo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 text-left">
                        <div className="text-3xl font-black">4,281</div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Raw Search & Interest Signals</p>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-xl border-none text-left">
                    <CardHeader className="pb-2 border-b bg-blue-50/50">
                        <CardTitle className="text-[10px] font-black uppercase text-blue-700 tracking-[0.2em] flex items-center gap-2">
                            <Zap className="h-4 w-4" /> Operational Silo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 text-left">
                        <div className="text-3xl font-black">1,104</div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Mined Fleet & Supplier Profiles</p>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-xl border-none text-left">
                    <CardHeader className="pb-2 border-b bg-green-50/50">
                        <CardTitle className="text-[10px] font-black uppercase text-green-700 tracking-[0.2em] flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" /> Financial Silo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 text-left">
                        <div className="text-3xl font-black">892</div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Anonymized Performance Nodes</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-2xl bg-white overflow-hidden text-left">
                <CardHeader className="bg-slate-900 text-white p-6">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Forensic Harvest Ledger
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <DataTable columns={columns} data={harvestLog} />
                </CardContent>
            </Card>

            <div className="p-8 bg-slate-900 text-white rounded-[2rem] shadow-2xl relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Lock className="h-40 w-40" /></div>
                <div className="relative z-10 space-y-6 text-left">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg"><Info className="h-6 w-6 text-primary" /></div>
                        <h3 className="text-2xl font-black uppercase tracking-tight">The "Secret Sauce" Architecture</h3>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-3xl text-left">
                        This vault is the engine for our 3rd Aspect: **Data Sales**. While the frontend manages commerce, the backend silently harvests anonymized market signals. Once cleaned and grouped into segment-specific bundles, this data becomes our most valuable resellable asset for institutional analysts and global logistics consultants.
                    </p>
                    <div className="flex gap-3 text-left">
                        <Badge className="bg-primary/20 text-primary border-none">Anonymization Layer Active</Badge>
                        <Badge className="bg-primary/20 text-primary border-none">IP Shield Engaged</Badge>
                    </div>
                </div>
            </div>
        </div>
    );
}