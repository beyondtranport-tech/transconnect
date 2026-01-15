'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Handshake, Loader2, MessageSquare, ArrowRight, MoreVertical } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser, getClientSideAuthToken } from '@/firebase';
import Link from 'next/link';
import MemberActionMenu from './member-action-menu';
import { cn } from '@/lib/utils';

// This component no longer uses useCollection or Firestore directly.

async function fetchNetworkData() {
  const token = await getClientSideAuthToken();
  if (!token) {
    throw new Error('You must be logged in to view your network.');
  }

  const response = await fetch('/api/getNetwork', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch network data.');
  }
  return result.data;
}

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  active: 'default',
  suspended: 'destructive',
  pending: 'secondary',
};


export default function NetworkContent() {
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const [networkData, setNetworkData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadNetwork = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchNetworkData();
            setNetworkData(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isUserLoading && user) {
            loadNetwork();
        } else if (!isUserLoading && !user) {
            setError("You must be logged in to view your network.");
            setIsLoading(false);
        }
    }, [user, isUserLoading, loadNetwork]);

    const handleInvite = () => {
        if (!user || !user.companyId) {
            toast({ variant: 'destructive', title: 'Could not generate invite link. Your company profile might not be fully set up.' });
            return;
        }
        // Updated to use companyId for referral link
        const referralLink = `${window.location.origin}/join?ref=${user.companyId}`;
        const message = encodeURIComponent(
            `Hi, I'd like to invite you to join TransConnect, a network for transporters that helps you save money and find more work. Use my personal link to sign up: ${referralLink}`
        );
        const whatsappUrl = `https://wa.me/?text=${message}`;
        window.open(whatsappUrl, '_blank');
        toast({
            title: "Invite Opened!",
            description: `You can now send your personal referral link via WhatsApp.`
        });
    };
    
    const columns: ColumnDef<any>[] = useMemo(() => [
        {
          accessorKey: 'ownerName',
          header: 'Member Name',
          cell: ({ row }) => <div className="font-medium">{row.original.ownerName}</div>,
        },
        {
          accessorKey: 'ownerEmail',
          header: 'Email',
          cell: ({ row }) => <div className="font-mono text-xs">{row.original.ownerEmail}</div>,
        },
        {
          accessorKey: 'companyName',
          header: 'Company Name',
        },
        {
          accessorKey: 'membershipId',
          header: 'Membership',
          cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.membershipId || 'Free'}</Badge>,
        },
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }) => (
            <Badge variant={statusColors[row.original.status] || 'secondary'} className="capitalize">
              {row.original.status || 'Pending'}
            </Badge>
          ),
        },
    ], []);
    
    const pageIsLoading = isLoading || isUserLoading;

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Handshake />
                            My Network
                        </CardTitle>
                        <CardDescription>
                            Manage your leads, send invites, and track the growth of your referral network.
                        </CardDescription>
                    </div>
                     <Button onClick={handleInvite}>
                        <MessageSquare className="mr-2" /> Invite Lead
                    </Button>
                </CardHeader>
                <CardContent>
                    {pageIsLoading ? (
                        <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : error ? (
                        <div className="text-center py-10 text-destructive bg-destructive/10 rounded-md">
                            <h3 className="font-semibold">Error loading your network</h3>
                            <p>{error}</p>
                            <Button onClick={loadNetwork} variant="destructive" className="mt-4">Try Again</Button>
                        </div>
                    ) : (
                        <DataTable columns={columns} data={networkData || []} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
