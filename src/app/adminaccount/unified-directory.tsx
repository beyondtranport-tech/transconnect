'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Search, Filter, Mail, Phone, Building, UserCheck, Handshake } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { getClientSideAuthToken } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PartnerOversightDialog } from './marketing/PartnerOversightDialog';
import { EngageDialog } from './marketing/EngageDialog';
import MemberActionMenu from '@/app/backend/member-action-menu';
import { formatDateSafe } from '@/lib/utils';
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
            
            const [membersRes, leadsRes] = await Promise.all([
                performAdminAction(token, 'getMembers'),
                performAdminAction(token, 'getPartnersByType', { type: 'transporter' }) // Start with transporters
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
        const enrichedMembers = members.map(m => ({ ...m, entryType: 'Member', status: m.status || 'active' }));
        const enrichedLeads = leads.map(l => ({ ...l, entryType: 'Lead', status: l.status || 'new' }));
        return [...enrichedMembers, ...enrichedLeads].sort((a,b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });
    }, [members, leads]);

    const columns: ColumnDef<any>[] = [
        {
            header: 'Entity',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold">{row.original.companyName || `${row.original.firstName} ${row.original.lastName}`}</span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{row.original.entryType}</span>
                </div>
            )
        },
        {
            header: 'Primary Contact',
            cell: ({ row }) => (
                <div className="text-sm">
                    <p className="font-medium">{row.original.firstName} {row.original.lastName}</p>
                    <p className="text-xs text-muted-foreground">{row.original.email}</p>
                </div>
            )
        },
        {
            accessorKey: 'type',
            header: 'Role',
            cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.type || row.original.membershipId || 'N/A'}</Badge>
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={row.original.status === 'active' || row.original.status === 'qualified' ? 'default' : 'secondary'} className="capitalize">
                    {row.original.status}
                </Badge>
            )
        },
        {
            header: 'Action',
            cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                    {row.original.entryType === 'Lead' ? (
                        <>
                            <EngageDialog open={false} onOpenChange={() => {}} partner={row.original} audience="transporters" />
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users /> Unified Directory</CardTitle>
                <CardDescription>A single master view combining registered Members and prospective Leads.</CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={combinedData} />
            </CardContent>
        </Card>
    );
}