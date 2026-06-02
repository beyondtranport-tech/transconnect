
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Search, Filter, Mail, Phone, Building, UserCheck, Handshake, Database, Globe } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { getClientSideAuthToken } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PartnerOversightDialog } from './marketing/PartnerOversightDialog';
import { EngageDialog } from './marketing/EngageDialog';
import MemberActionMenu from '@/app/backend/member-action-menu';
import { formatDateSafe, cn } from '@/lib/utils';
import Link from 'next/link';

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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            // Fetch ALL entities from the database
            const [membersRes, leadsRes] = await Promise.all([
                performAdminAction(token, 'getMembers'),
                performAdminAction(token, 'getPartnersByType', { type: 'all' })
            ]);
            
            setMembers(membersRes || []);
            setLeads(leadsRes || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

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
            header: 'Leadership & Contact',
            cell: ({ row }) => (
                <div className="text-sm">
                    <p className="font-medium flex items-center gap-1.5">
                        <UserCheck className="h-3 w-3 text-muted-foreground" />
                        {row.original.contactPerson || `${row.original.firstName || ''} ${row.original.lastName || ''}`.trim() || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Mail className="h-3 w-3" />
                        {row.original.email || 'No email recorded'}
                    </p>
                </div>
            )
        },
        {
            header: 'Location',
            cell: ({ row }) => (
                <div className="max-w-[200px] truncate text-xs text-muted-foreground" title={row.original.address}>
                    {row.original.address || 'Location unknown'}
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
                                <Link href={`/adminaccount?view=marketing-suppliers&subview=management&engage=${row.original.id}`} title="Engage">
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

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <Database className="h-8 w-8 text-primary" />
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Registry Size</p>
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
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">AI Discovered Leads</p>
                                <p className="text-2xl font-black text-amber-700">{leads.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users /> Unified Industry Directory</CardTitle>
                    <CardDescription>A master registry combining your 300+ discovered leads with active community members for total ecosystem oversight.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={combinedData} />
                </CardContent>
            </Card>
        </div>
    );
}
