
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Users, Wallet, Gem, Star } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getClientSideAuthToken } from '@/firebase';
import { cn } from '@/lib/utils';

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

    useEffect(() => {
        // Temporarily disabled to prevent infinite loops and quota errors.
        // This will be re-enabled correctly in a future step.
        const fetchMembers = async () => {
          setIsLoading(true);
          // Simulating no data being loaded to prevent API calls
          setMembers([]);
          setIsLoading(false);
        }
        fetchMembers();
    }, []);

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
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Owner</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Membership</TableHead>
                                <TableHead>Loyalty Tier</TableHead>
                                <TableHead>Reward Points</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members && members.length > 0 ? members.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="font-medium">{member.firstName || ''} {member.lastName || ''}</div>
                                        <div className="text-sm text-muted-foreground">{member.email || ''}</div>
                                    </TableCell>
                                    <TableCell>{member.companyName}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">{member.membershipId || 'N/A'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                         <Badge className={cn("capitalize", tierColors[member.loyaltyTier || 'bronze'])}>
                                            <Star className="mr-1 h-3 w-3"/>
                                            {member.loyaltyTier || 'bronze'}
                                         </Badge>
                                    </TableCell>
                                     <TableCell>
                                        <div className="flex items-center gap-1 font-semibold">
                                           <Gem className="h-3 w-3 text-primary"/> {member.rewardPoints || 0}
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatDate(member.createdAt)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild variant="ghost" size="sm">
                                            <Link href={`/backend?view=wallet&memberId=${member.id}`}>
                                                <Wallet className="mr-2 h-4 w-4" />
                                                Wallet
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                      {/* Temporarily showing this message while data fetching is disabled */}
                                      No members found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
