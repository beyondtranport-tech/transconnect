
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import StaffActionMenu from './staff-action-menu';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, collectionGroup } from 'firebase/firestore';

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

export default function StaffList() {
    const firestore = useFirestore();

    const staffQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'staff')) : null, [firestore]);
    const { data: staff, isLoading: isStaffLoading, forceRefresh } = useCollection<StaffMember>(staffQuery);

    const companiesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'companies')) : null, [firestore]);
    const { data: companies, isLoading: areCompaniesLoading } = useCollection<Company>(companiesQuery);
    
    const isLoading = isStaffLoading || areCompaniesLoading;

    const enrichedStaff = useMemo(() => {
        if (!staff || !companies) return [];
        const companyMap = new Map(companies.map(c => [c.id, c.companyName]));
        
        return staff.map(s => ({
            ...s,
            id: `${s.companyId}-${s.id}`, // Create a truly unique key for the table
            companyName: companyMap.get(s.companyId) || 'Unknown Company',
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
            cell: ({ row }) => (
                <div className="text-right">
                    <StaffActionMenu staffMember={row.original} onUpdate={forceRefresh} />
                </div>
            ),
        }
    ], [forceRefresh]);

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Users /> All Staff Members
                    </CardTitle>
                    <CardDescription>
                        A consolidated view of all staff across all member companies.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <DataTable columns={columns} data={enrichedStaff} />
                )}
            </CardContent>
        </Card>
    );
}
