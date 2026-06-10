
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Search, Database, Globe, UserCheck, ShieldAlert, Send, RefreshCcw } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { getClientSideAuthToken } from '@/firebase';
import { Button } from '@/components/ui/button';
import { PartnerOversightDialog } from './marketing/PartnerOversightDialog';
import MemberActionMenu from '@/app/backend/member-action-menu';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

async function performAdminAction(token: string, action: string, payload?: any) {
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
    return result.data;
}

export default function UnifiedDirectory() {
    const [members, setMembers] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const { toast } = useToast();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const [membersRes, leadsRes] = await Promise.all([
                performAdminAction(token, 'getMembers'),
                performAdminAction(token, 'getPartnersByType', { type: 'all' })
            ]);
            
            setMembers(membersRes || []);
            setLeads(leadsRes || []);
            setHasLoaded(true);
            toast({ title: "Registry Loaded", description: "Capped at top 100 records per source to save quota." });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Load Error', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const combinedData = useMemo(() => {
        const enrichedMembers = members.map(m => ({ ...m, source: 'Member', status: m.status || 'active' }));
        const enrichedLeads = leads.map(l => ({ ...l, source: 'Lead', status: l.status || 'new' }));
        
        return [...enrichedMembers, ...enrichedLeads].sort((a,b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });
    }, [members, leads]);

    const columns: ColumnDef<any>[] = [
        {
            header: 'Entity Name',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold">{row.original.companyName || `${row.original.firstName} ${row.original.lastName}`}</span>
                    <div className="flex items-center gap-2 mt-1">
                         <Badge variant={row.original.source === 'Member' ? 'default' : 'outline'} className="text-[10px] uppercase h-4">
                            {row.original.source}
                        </Badge>
                        <span className="text-[10px] font-black text-muted-foreground uppercase">{row.original.entryType || 'General'}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Leadership',
            cell: ({ row }) => (
                <div className="text-sm">
                    <p className="font-medium">{row.original.contactPerson || `${row.original.firstName || ''} ${row.original.lastName || ''}`.trim() || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">{row.original.email || 'No email recorded'}</p>
                </div>
            )
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={['active', 'qualified'].includes(row.original.status) ? 'default' : 'secondary'} className="capitalize text-[10px]">
                    {row.original.status}
                </Badge>
            )
        },
        {
            id: 'actions',
            header: <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                    {row.original.source === 'Lead' ? (
                        <>
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={`/adminaccount?view=marketing-suppliers&subview=management&engage=${row.original.id}`}>
                                    <Send className="h-4 w-4 text-primary" />
                                </Link>
                            </Button>
                            <PartnerOversightDialog partner={row.original} onUpdate={loadData} />
                        </>
                    ) : (
                        <MemberActionMenu member={row.original} onUpdate={loadData} />
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {!hasLoaded ? (
                 <Card className="bg-primary/5 border-primary/20 p-12 text-center">
                    <Database className="mx-auto h-16 w-16 text-primary/20 mb-4" />
                    <h2 className="text-2xl font-black font-headline mb-2">Registry Offline</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-8">Click below to load the industry directory. This is a capped view to protect your usage quota.</p>
                    <Button size="lg" onClick={loadData} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCcw className="mr-2 h-4 w-4" />}
                        Load Master Registry
                    </Button>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-primary/5 border-primary/10">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <Database className="h-8 w-8 text-primary" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Registry Snapshot</p>
                                        <p className="text-2xl font-black">{combinedData.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-50 border-blue-100">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <UserCheck className="h-8 w-8 text-blue-600" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Registered Members</p>
                                        <p className="text-2xl font-black text-blue-700">{members.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-amber-50 border-amber-100">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <Globe className="h-8 w-8 text-amber-600" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">AI Leads</p>
                                        <p className="text-2xl font-black text-amber-700">{leads.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2"><Users /> Unified Industry Directory</CardTitle>
                                <CardDescription>Capped view of the most recent 100 entries from each source.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCcw className="mr-2 h-4 w-4" />}
                                Refresh Snapshot
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={columns} data={combinedData} />
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
