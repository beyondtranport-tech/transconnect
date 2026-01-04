
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, Star, Gem, Percent, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getClientSideAuthToken } from '@/firebase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Company {
    id: string;
    companyName?: string;
    membershipId?: string;
    rewardPoints?: number;
    loyaltyTier?: 'bronze' | 'silver' | 'gold';
    ownerId: string;
}

interface User {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
}

interface Membership {
    id: string;
    name: string;
    commissionShare?: number;
    discountShare?: number;
}

interface EnrichedMember {
    companyId: string;
    ownerId: string;
    companyName?: string;
    ownerName?: string;
    email?: string;
    loyaltyTier?: 'bronze' | 'silver' | 'gold';
    rewardPoints?: number;
    membershipTier?: string;
    commissionShare?: number;
    discountShare?: number;
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

const tierColors: { [key: string]: string } = {
    bronze: 'bg-orange-200 text-orange-800',
    silver: 'bg-slate-200 text-slate-800',
    gold: 'bg-yellow-200 text-yellow-800',
};

export default function RewardsManagement() {
    const [enrichedMembers, setEnrichedMembers] = useState<EnrichedMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            setError(null);
            try {
                const [companies, users, memberships] = await Promise.all([
                    fetchAdminData('getMembers'), // Already fetches companies and merges user info
                    fetchAdminData('getMemberships')
                ]);

                const userMap = new Map<string, User>(companies.map((u: any) => [u.userId, { id: u.userId, firstName: u.firstName, lastName: u.lastName, email: u.email }]));
                const membershipMap = new Map<string, Membership>(memberships.map((m: Membership) => [m.id, m]));

                const enrichedData = companies.map((company: Company) => {
                    const owner = userMap.get(company.ownerId);
                    const membership = membershipMap.get(company.membershipId || '');
                    
                    return {
                        companyId: company.id,
                        ownerId: company.ownerId,
                        companyName: company.companyName,
                        ownerName: owner ? `${owner.firstName} ${owner.lastName}`.trim() : 'N/A',
                        email: owner?.email,
                        loyaltyTier: company.loyaltyTier,
                        rewardPoints: company.rewardPoints,
                        membershipTier: membership?.name || company.membershipId,
                        commissionShare: membership?.commissionShare,
                        discountShare: membership?.discountShare,
                    };
                });
                
                enrichedData.sort((a, b) => (b.rewardPoints || 0) - (a.rewardPoints || 0));

                setEnrichedMembers(enrichedData);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Star className="h-6 w-6" /> Member Loyalty & Rewards Status</CardTitle>
                <CardDescription>
                    This dashboard shows the loyalty status of each member, their accumulated points, and the reward percentages they are entitled to based on their membership tier.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-destructive border-2 border-destructive/50 rounded-lg bg-destructive/10">
                        <h3 className="text-xl font-semibold">Error Loading Data</h3>
                        <p className="mt-2 text-sm">{error}</p>
                    </div>
                ) : (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Loyalty Tier</TableHead>
                                    <TableHead><div className="flex items-center gap-1.5"><Gem className="h-4 w-4"/>Points</div></TableHead>
                                    <TableHead><div className="flex items-center gap-1.5"><Percent className="h-4 w-4"/>Commission Share</div></TableHead>
                                    <TableHead><div className="flex items-center gap-1.5"><Percent className="h-4 w-4"/>Discount Share</div></TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enrichedMembers.map(member => (
                                    <TableRow key={member.companyId}>
                                        <TableCell>
                                            <div className="font-medium">{member.ownerName}</div>
                                            <div className="text-xs text-muted-foreground">{member.companyName}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn("capitalize", tierColors[member.loyaltyTier || 'bronze'])}>
                                                <Star className="mr-1 h-3 w-3" />
                                                {member.loyaltyTier || 'bronze'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono font-semibold">{member.rewardPoints?.toLocaleString() || 0}</TableCell>
                                        <TableCell className="font-mono font-semibold">{member.commissionShare || 0}%</TableCell>
                                        <TableCell className="font-mono font-semibold">{member.discountShare || 0}%</TableCell>
                                        <TableCell className="text-right">
                                             <Button asChild variant="outline" size="sm">
                                                <Link href={`/backend?view=wallet&memberId=${member.companyId}`}>
                                                    View Wallet <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 <p className="text-xs text-muted-foreground">This table reflects the real-time loyalty status of all members on the platform.</p>
            </CardFooter>
        </Card>
    );
}
