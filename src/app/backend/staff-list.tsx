
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { getClientSideAuthToken } from '@/firebase';
import StaffActionMenu from './staff-action-menu';

interface Company {
    id: string;
    companyName?: string;
}

interface Staff {
    id: string;
    companyId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    title?: string;
    role?: string;
    status?: string;
}

export default function StaffList() {
  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUpdate = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const [staffResponse, companiesResponse] = await Promise.all([
                fetch('/api/admin', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'getStaff' })
                }),
                fetch('/api/admin', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'getMembers' })
                })
            ]);

            const staffResult = await staffResponse.json();
            if (!staffResult.success) {
                throw new Error(staffResult.error || 'Failed to fetch staff data');
            }

            const companiesResult = await companiesResponse.json();
            if (!companiesResult.success) {
                 throw new Error(companiesResult.error || 'Failed to fetch company data');
            }

            setStaff(staffResult.data || []);
            setCompanies(companiesResult.data || []);
        } catch(e: any) {
             setError(e.message || "An unknown error occurred");
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchData();
  }, [refreshKey]);
  
  const enrichedStaff = useMemo(() => {
    if (!staff || !companies) return [];
    const companyMap = new Map(companies.map(c => [c.id, c.companyName]));
    return staff.map(s => ({
      ...s,
      companyName: companyMap.get(s.companyId) || 'Unknown Company',
    }));
  }, [staff, companies]);

  const columns: ColumnDef<any>[] = useMemo(() => [
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
      cell: ({ row }) => <StaffActionMenu staffMember={row.original} onUpdate={handleUpdate} />,
    },
  ], [handleUpdate]);

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
                <DataTable columns={columns} data={enrichedStaff} />
            )}
        </CardContent>
    </Card>
  );
}
