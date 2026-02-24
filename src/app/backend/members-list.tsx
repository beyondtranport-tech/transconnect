
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, PlusCircle } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { getClientSideAuthToken } from '@/firebase';
import { cn } from '@/lib/utils';
import MemberActionMenu from './member-action-menu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';

interface Member {
    id: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    membershipId?: string;
    status?: 'active' | 'suspended' | 'pending';
    createdAt?: string;
    email?: string;
}

const tierColors: { [key: string]: string } = {
  free: 'bg-gray-200 text-gray-800',
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
          header: 'Owner',
          cell: ({ row }) => (
            <div>
              <p className="font-medium">{row.original.firstName} {row.original.lastName}</p>
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          ),
        },
        {
          accessorKey: 'companyName',
          header: 'Company',
          cell: ({ row }) => <div>{row.original.companyName}</div>,
        },
        {
          accessorKey: 'membershipId',
          header: 'Membership',
          cell: ({ row }) => (
            <Badge 
                className={cn("capitalize", tierColors[row.original.membershipId?.toLowerCase() || 'free'] || 'bg-gray-200 text-gray-800')}
                variant="outline"
            >
                {row.original.membershipId}
            </Badge>
          ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={statusColors[row.original.status || 'active'] || 'default'} className="capitalize">
                    {row.original.status || 'Active'}
                </Badge>
            ),
        },
        {
          accessorKey: 'createdAt',
          header: 'Joined',
          cell: ({ row }) => {
            const dateStr = row.original.createdAt;
            if (!dateStr) return 'N/A';
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return 'Invalid Date';
                return format(date, "dd MMM yyyy");
            } catch {
                return 'Invalid Date';
            }
          },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
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
                    <CardTitle className="flex items-center gap-2"><Users /> Member Roster</CardTitle>
                    <CardDescription>
                        A list of all registered member companies on the TransConnect platform.
                    </CardDescription>
                </div>
                 <Button asChild>
                    <Link href="/adminaccount?view=leads-database&action=add-member">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Member
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
                        <h3 className="font-semibold">Error loading members</h3>
                        <p className="text-sm">{error}</p>
                    </div>
                 ) : (
                    <DataTable columns={columns} data={members || []} />
                 )}
            </CardContent>
        </Card>
    );
}
