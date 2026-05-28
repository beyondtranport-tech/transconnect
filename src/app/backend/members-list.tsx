'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, PlusCircle, Sparkles, Building2 } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { getClientSideAuthToken } from '@/firebase';
import { cn, formatDateSafe } from '@/lib/utils';
import MemberActionMenu from './member-action-menu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Member {
    id: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    membershipId?: string;
    status?: 'active' | 'suspended' | 'pending';
    createdAt?: string;
    email?: string;
    leadId?: string;
    source?: string;
}

const tierColors: { [key: string]: string } = {
  free: 'bg-gray-200 text-gray-800',
  provisional: 'bg-amber-100 text-amber-800',
  basic: 'bg-blue-200 text-blue-800',
  standard: 'bg-green-200 text-green-800',
  premium: 'bg-purple-200 text-purple-800',
  enterprise: 'bg-yellow-200 text-yellow-800',
};

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  active: 'default',
  suspended: 'destructive',
  pending: 'secondary',
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


export default function MembersList() {
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const forceRefresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const result = await fetchFromAdminAPI(token, 'getMembers');
            setMembers(result.data || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        forceRefresh();
    }, [forceRefresh]);


    const columns: ColumnDef<Member>[] = useMemo(() => [
        {
          accessorKey: 'owner',
          header: 'Primary Contact',
          cell: ({ row }) => (
            <div className="flex flex-col">
              <p className="font-bold text-sm">{row.original.firstName} {row.original.lastName}</p>
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          ),
        },
        {
          accessorKey: 'companyName',
          header: 'Business Entity',
          cell: ({ row }) => (
            <div className="flex flex-col">
              <p className="font-semibold text-sm">{row.original.companyName}</p>
              <p className="text-[10px] font-mono text-muted-foreground uppercase">{row.original.id}</p>
            </div>
          )
        },
        {
          accessorKey: 'source',
          header: 'Source Origin',
          cell: ({ row }) => {
            const isAI = row.original.source === 'AI Converted' || !!row.original.leadId;
            return (
              <Badge variant="outline" className={cn(
                "text-[10px] uppercase font-bold gap-1",
                isAI ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-muted-foreground"
              )}>
                {isAI ? <Sparkles className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                {isAI ? 'AI Converted' : 'Organic Sign-up'}
              </Badge>
            )
          }
        },
        {
          accessorKey: 'membershipId',
          header: 'Plan',
          cell: ({ row }) => (
            <Badge 
                className={cn("capitalize text-[10px]", tierColors[row.original.membershipId?.toLowerCase() || 'free'] || 'bg-gray-200 text-gray-800')}
                variant="outline"
            >
                {row.original.membershipId}
            </Badge>
          ),
        },
        {
            accessorKey: 'status',
            header: 'System Status',
            cell: ({ row }) => (
                <Badge variant={statusColors[row.original.status || 'active'] || 'default'} className="capitalize text-[10px]">
                    {row.original.status || 'Active'}
                </Badge>
            ),
        },
        {
          accessorKey: 'createdAt',
          header: 'Acquisition Date',
          cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDateSafe(row.original.createdAt, 'dd MMM yyyy')}</span>
        },
        {
            id: 'actions',
            header: <div className="text-right">Manage</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <MemberActionMenu member={row.original} onUpdate={forceRefresh} />
                </div>
            )
        }
    ], [forceRefresh]);


    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><Users /> Member Registry</CardTitle>
                    <CardDescription>
                        Unified view of live accounts and engagement conversions. {members.length} entities tracked.
                    </CardDescription>
                </div>
                 <Button asChild variant="outline">
                    <Link href="/adminaccount?view=leads-database&action=add-member">
                        <PlusCircle className="mr-2 h-4 w-4" /> Provision New Member
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                 ) : error ? (
                    <div className="text-center py-20 text-destructive bg-destructive/10 rounded-md">
                        <h3 className="font-semibold">Error joining member data</h3>
                        <p className="text-sm">{error}</p>
                    </div>
                 ) : (
                    <DataTable columns={columns} data={members || []} />
                 )}
            </CardContent>
        </Card>
    );
}
