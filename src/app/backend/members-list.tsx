
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Users, Wallet, Gem, Star } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getClientSideAuthToken } from '@/firebase';
import { cn } from '@/lib/utils';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';

interface Member {
    id: string; // This will now be the Company ID
    firstName?: string;
    lastName?: string;
    email?: string;
    companyName?: string;
    membershipId?: string;
    walletBalance?: number;
    createdAt?: string;
    rewardPoints?: number;
    loyaltyTier?: 'bronze' | 'silver' | 'gold';
}

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
    return result;
}


const formatDate = (isoString: string | undefined) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleDateString('en-ZA');
    } catch (e) {
        return 'Invalid Date';
    }
};

const tierColors: { [key: string]: string } = {
    bronze: 'bg-orange-200 text-orange-800',
    silver: 'bg-slate-200 text-slate-800',
    gold: 'bg-yellow-200 text-yellow-800',
};


export default function MembersList() {
    const [members, setMembers] = useState<Member[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMembers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await fetchFromAdminAPI('getMembers');
            setMembers(result.data as Member[]);
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
            accessorKey: 'firstName',
            header: 'Owner',
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.firstName || ''} {row.original.lastName || ''}</div>
                    <div className="text-sm text-muted-foreground">{row.original.email || ''}</div>
                </div>
            )
        },
        { accessorKey: 'companyName', header: 'Company', cell: ({ row }) => <div>{row.original.companyName}</div> },
        { 
            accessorKey: 'membershipId', 
            header: 'Membership', 
            cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.membershipId || 'N/A'}</Badge>
        },
        {
            accessorKey: 'loyaltyTier',
            header: 'Loyalty Tier',
            cell: ({ row }) => (
                <Badge className={cn("capitalize", tierColors[row.original.loyaltyTier || 'bronze'])}>
                    <Star className="mr-1 h-3 w-3"/>
                    {row.original.loyaltyTier || 'bronze'}
                </Badge>
            )
        },
        {
            accessorKey: 'rewardPoints',
            header: 'Reward Points',
            cell: ({ row }) => (
                <div className="flex items-center gap-1 font-semibold">
                   <Gem className="h-3 w-3 text-primary"/> {row.original.rewardPoints || 0}
                </div>
            )
        },
        { accessorKey: 'createdAt', header: 'Joined', cell: ({ row }) => <div>{formatDate(row.original.createdAt)}</div> },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <Button asChild variant="ghost" size="sm">
                        <Link href={`/backend?view=wallet&memberId=${row.original.id}`}>
                            <Wallet className="mr-2 h-4 w-4" />
                            Wallet
                        </Link>
                    </Button>
                </div>
            )
        }
    ], []);


    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Member Roster</CardTitle>
                    <CardDescription>Fetching the list of all members...</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }
    
    if (error) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Member Roster</CardTitle>
                    <CardDescription>Could not load members.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                        <h4 className="font-semibold">Error loading members</h4>
                        <p className="text-sm">{error}</p>
                    </div>
                </CardContent>
            </Card>
        )
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users /> Member Roster</CardTitle>
                <CardDescription>
                    A list of all registered members on the TransConnect platform.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <DataTable columns={columns} data={members || []} />
            </CardContent>
        </Card>
    );
}

    