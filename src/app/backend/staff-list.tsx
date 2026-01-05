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
    companyName?: string;
}

async function fetchAdminData(action: string) {
    const token = await getClientSideAuthToken();
    if (!token) throw new Error("Authentication failed.");
    
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result.data;
}

export default function StaffList() {
  const [enrichedStaff, setEnrichedStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const [staffData, companyData] = await Promise.all([
            fetchAdminData('getStaff'),
            fetchAdminData('getMembers'),
        ]);
        const companyMap = new Map(companyData.map((c: Company) => [c.id, c.companyName]));
        const enriched = staffData.map((s: Staff) => ({
          ...s,
          companyName: companyMap.get(s.companyId) || 'Unknown Company',
        }));
        setEnrichedStaff(enriched);
    } catch(e: any) {
         setError(e.message || "An unknown error occurred");
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleUpdate = useCallback((staffId: string, updates: Partial<Staff>) => {
    setEnrichedStaff(currentStaff => {
        if (updates._deleted) {
            return currentStaff.filter(s => s.id !== staffId);
        }
        return currentStaff.map(s => s.id === staffId ? { ...s, ...updates } : s);
    });
  }, []);

  const columns: ColumnDef<Staff>[] = useMemo(() => [
    { accessorKey: 'companyName', header: 'Company', cell: ({ row }) => <div>{row.original.companyName}</div> },
    { accessorKey: 'firstName', header: 'First Name', cell: ({ row }) => <div>{row.original.firstName}</div> },
    { accessorKey: 'lastName', header: 'Last Name', cell: ({ row }) => <div>{row.original.lastName}</div> },
    { accessorKey: 'email', header: 'Email', cell: ({ row }) => <div>{row.original.email}</div> },
    { accessorKey: 'title', header: 'Title', cell: ({ row }) => <div>{row.original.title}</div> },
    { accessorKey: 'role', header: 'Role', cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge> },
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
