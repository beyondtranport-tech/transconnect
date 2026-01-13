'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Handshake, MoreVertical, Edit, Trash2, CheckCircle, XCircle, PlusCircle, Loader2, MessageSquare } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser, getClientSideAuthToken } from '@/firebase';

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

    const handleInvite = (member: any) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'You must be logged in to invite someone.' });
            return;
        }
        const referralLink = `${window.location.origin}/join?ref=${user.uid}`;
        const message = encodeURIComponent(
            `Hi, I'd like to invite you to join TransConnect, a network for transporters that helps you save money and find more work. Use my personal link to sign up: ${referralLink}`
        );
        const whatsappUrl = `https://wa.me/?text=${message}`;
        window.open(whatsappUrl, '_blank');
        toast({
            title: "Invite Sent!",
            description: `You've opened WhatsApp to invite ${member.companyName}.`
        });
    };
    
    const columns: ColumnDef<any>[] = useMemo(() => [
        {
          accessorKey: 'companyName',
          header: 'Company Name',
          cell: ({ row }) => <div className="font-medium">{row.original.companyName}</div>,
        },
        {
          accessorKey: 'ownerEmail',
          header: 'Owner Email',
          cell: ({ row }) => <div className="font-mono text-xs">{row.original.ownerEmail}</div>,
        },
        {
          accessorKey: 'membershipId',
          header: 'Membership',
          cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.membershipId || 'Free'}</Badge>,
        },
        {
          accessorKey: 'createdAt',
          header: 'Date Joined',
          cell: ({ row }) => {
            if (!row.original.createdAt) return 'N/A';
            const date = new Date(row.original.createdAt);
            return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
          },
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
                    {/* The dialog for adding leads can remain as it is for now, as it's a demo feature. */}
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