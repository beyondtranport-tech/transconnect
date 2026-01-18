
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/hooks/use-config';
import { cn } from '@/lib/utils';
import MemberActionMenu from './member-action-menu';
import { collection, query } from 'firebase/firestore';

interface Member {
    id: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    membershipId?: string;
    status?: 'active' | 'suspended';
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
};

export default function MembersList() {
    const firestore = useFirestore();
    const companiesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'companies')) : null, [firestore]);
    const { data: members, isLoading, forceRefresh, error } = useCollection<Member>(companiesQuery);

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
            const date = row.original.createdAt ? new Date(row.original.createdAt) : null;
            return date ? date.toLocaleDateString('en-ZA') : 'N/A';
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
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users /> Member Roster</CardTitle>
                <CardDescription>
                    A list of all registered members on the TransConnect platform.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                 ) : error ? (
                    <div className="text-center py-20 text-destructive bg-destructive/10 rounded-md">
                        <h3 className="font-semibold">Error loading members</h3>
                        <p className="text-sm">{error.message}</p>
                    </div>
                 ) : (
                    <DataTable columns={columns} data={members || []} />
                 )}
            </CardContent>
        </Card>
    );
}
