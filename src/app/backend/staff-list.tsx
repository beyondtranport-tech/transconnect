
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { getClientSideAuthToken } from '@/firebase';
import StaffActionMenu from './staff-action-menu';

interface StaffMember {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    companyId: string;
    companyName?: string;
    title: string;
    role: string;
    status: 'confirmed' | 'unconfirmed';
}

interface Company {
    id: string;
    companyName: string;
}

async function fetchAdminData(action: string) {
    const token = await getClientSideAuthToken();
    if (!token) throw new Error("Authentication failed.");
    
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result.data;
}

export default function StaffList() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [staffData, companiesData] = await Promise.all([
                fetchAdminData('getStaff'),
                fetchAdminData('getMembers')
            ]);
            setStaff(staffData || []);
            setCompanies(companiesData || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const enrichedStaff = useMemo(() => {
        const companyMap = new Map(companies.map(c => [c.id, c.companyName]));
        return staff.map(s => ({
            ...s,
            companyName: companyMap.get(s.companyId) || 'Unknown Company'
        }));
    }, [staff, companies]);

    const columns: ColumnDef<StaffMember>[] = useMemo(() => [
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
            accessorKey: 'companyName',
            header: 'Company',
            cell: ({ row }) => <div>{row.original.companyName}</div>,
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
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => <div className="text-right"><StaffActionMenu staffMember={row.original} onUpdate={fetchData} /></div>,
        }
    ], [fetchData]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users /> All Staff Members
                </CardTitle>
                <CardDescription>
                    A consolidated view of all staff across all member companies.
                </CardDescription>
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
