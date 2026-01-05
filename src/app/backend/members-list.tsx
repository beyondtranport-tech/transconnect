
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getClientSideAuthToken } from '@/firebase';
import { cn } from '@/lib/utils';

interface Member {
    id: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    membershipId?: string;
    walletBalance?: number;
    createdAt?: string;
}

const tierColors: { [key: string]: string } = {
  free: 'bg-gray-200 text-gray-800',
  basic: 'bg-blue-200 text-blue-800',
  standard: 'bg-green-200 text-green-800',
  premium: 'bg-purple-200 text-purple-800',
  enterprise: 'bg-yellow-200 text-yellow-800',
};

// Helper function moved outside the component to ensure it's stable
async function fetchFromAdminAPI(action: string, payload?: any) {
    const token = await getClientSideAuthToken();
    if (!token) throw new Error("Authentication failed.");
    
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

export default function MembersList() {
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMembers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchFromAdminAPI('getMembers');
            // Sort data by creation date descending
            data.sort((a: Member, b: Member) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
            setMembers(data);
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);
    
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
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/backend/wallet/${row.original.id}`}>
                            View Wallet
                        </Link>
                    </Button>
                </div>
            )
        }
    ], []);


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
                        <p className="text-sm">{error}</p>
                        <Button variant="destructive" onClick={fetchMembers} className="mt-4">Try Again</Button>
                    </div>
                 ) : (
                    <DataTable columns={columns} data={members} />
                 )}
            </CardContent>
        </Card>
    );
}
