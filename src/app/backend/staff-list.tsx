
'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { getClientSideAuthToken } from '@/firebase';
import StaffActionMenu from './staff-action-menu';

async function fetchCollectionGroup(path: string) {
    const token = await getClientSideAuthToken();
    if (!token) throw new Error("Authentication failed.");
    
    const response = await fetch('/api/getUserSubcollection', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: path, type: 'collection-group' }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for path: ${path}`);
    }
    return result.data;
}

async function fetchCollection(path: string) {
    const token = await getClientSideAuthToken();
    if (!token) throw new Error("Authentication failed.");

    const response = await fetch('/api/getUserSubcollection', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: path, type: 'collection' }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for path: ${path}`);
    }
    return result.data;
}


export default function StaffList() {
  const [staff, setStaff] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const [staffData, companiesData] = await Promise.all([
            fetchCollectionGroup('staff'),
            fetchCollection('companies')
        ]);
        
        const companyMap = new Map(companiesData.map((c: any) => [c.id, c.companyName]));

        const enrichedStaff = staffData.map((s: any) => ({
            ...s,
            companyName: companyMap.get(s.companyId) || 'Unknown Company',
        }));
        
        setStaff(enrichedStaff);
    } catch(e: any) {
        setError(e.message);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'companyName',
      header: 'Company',
      cell: ({ row }) => <div>{row.original.companyName}</div>,
    },
    {
      accessorKey: 'firstName',
      header: 'First Name',
      cell: ({ row }) => <div>{row.original.firstName}</div>,
    },
    {
      accessorKey: 'lastName',
      header: 'Last Name',
      cell: ({ row }) => <div>{row.original.lastName}</div>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <div>{row.original.email}</div>,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => <div>{row.original.title}</div>,
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge>,
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
            <Badge variant={row.original.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize">
                {row.original.status || 'unconfirmed'}
            </Badge>
        ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => <StaffActionMenu staffMember={row.original} onUpdate={fetchData} />,
    },
  ];

  return (
    <Card>
        <CardHeader>
            <div>
                 <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Users /> All Staff Members
                </CardTitle>
                <CardDescription>A consolidated view of all staff across all member companies.</CardDescription>
            </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : error ? (
                 <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                    <h4 className="font-semibold">Error loading staff</h4>
                    <p className="text-sm">{error}</p>
                </div>
            ) : (
                <DataTable columns={columns} data={staff || []} />
            )}
        </CardContent>
    </Card>
  );
}
