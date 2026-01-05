
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, CheckCircle, XCircle, MoreVertical, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { getClientSideAuthToken } from '@/firebase';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

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

// Simplified Action Menu directly in the same file to avoid prop drilling issues
const StaffActionMenu = ({ staffMember, onActionComplete }: { staffMember: Staff, onActionComplete: () => void }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleAction = async (action: 'updateStatus' | 'delete', payload?: any) => {
        setIsLoading(true);
        let apiAction = '';
        let successMessage = '';

        if (action === 'updateStatus') {
            apiAction = 'updateStaffMember'; // Use the more generic update endpoint
            successMessage = `Status updated for ${staffMember.firstName}.`;
        } else if (action === 'delete') {
            apiAction = 'deleteStaffMember';
            successMessage = `${staffMember.firstName} has been deleted.`;
        }

        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: apiAction,
                    payload: {
                        companyId: staffMember.companyId,
                        staffId: staffMember.id,
                        data: payload, // For status updates
                    }
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'API call failed.');

            toast({ title: 'Success', description: successMessage });
            onActionComplete(); // Re-fetch data
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <AlertDialog>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link href={`/backend?view=wallet&memberId=${staffMember.companyId}`}>
                            <Eye className="mr-2 h-4 w-4" /> View Company
                        </Link>
                    </DropdownMenuItem>
                    {staffMember.status !== 'confirmed' ? (
                        <DropdownMenuItem onSelect={() => handleAction('updateStatus', { status: 'confirmed' })}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Confirm
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onSelect={() => handleAction('updateStatus', { status: 'unconfirmed' })}>
                            <XCircle className="mr-2 h-4 w-4" /> Un-confirm
                        </DropdownMenuItem>
                    )}
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete {staffMember.firstName}. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleAction('delete')} variant="destructive">
                        Yes, delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};


export default function StaffList() {
    const [data, setData] = useState<{ staff: Staff[], companies: any[] }>({ staff: [], companies: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // This function will fetch all data. We can call it again to refresh.
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const [staffRes, companiesRes] = await Promise.all([
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

            const staffResult = await staffRes.json();
            const companiesResult = await companiesRes.json();

            if (!staffResult.success) throw new Error(staffResult.error || 'Failed to fetch staff.');
            if (!companiesResult.success) throw new Error(companiesResult.error || 'Failed to fetch companies.');

            setData({ staff: staffResult.data, companies: companiesResult.data });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []); // Runs only once on component mount

    const enrichedStaff = React.useMemo(() => {
        const companyMap = new Map(data.companies.map(c => [c.id, c.companyName]));
        return data.staff.map(s => ({
            ...s,
            companyName: companyMap.get(s.companyId) || 'Unknown Company',
        }));
    }, [data.staff, data.companies]);
    
    const columns: ColumnDef<Staff>[] = React.useMemo(() => [
        { accessorKey: 'companyName', header: 'Company', cell: ({ row }) => <div>{row.original.companyName}</div> },
        { accessorKey: 'firstName', header: 'First Name', cell: ({ row }) => <div>{row.original.firstName}</div> },
        { accessorKey: 'lastName', header: 'Last Name', cell: ({ row }) => <div>{row.original.lastName}</div> },
        { accessorKey: 'email', header: 'Email', cell: ({ row }) => <div>{row.original.email}</div> },
        { accessorKey: 'title', header: 'Title', cell: ({ row }) => <div>{row.original.title}</div> },
        { accessorKey: 'role', header: 'Role', cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge> },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <Badge variant={row.original.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize">{row.original.status || 'unconfirmed'}</Badge>,
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => <StaffActionMenu staffMember={row.original} onActionComplete={fetchData} />,
        },
    ], [enrichedStaff]); // Dependency on fetchData is removed

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2"><Users /> All Staff Members</CardTitle>
                <CardDescription>A consolidated view of all staff across all member companies.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
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
