'use client';

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Award, Gem, Loader2, Percent, Star, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useConfig } from '@/hooks/use-config';
import { getClientSideAuthToken } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface Company {
    id: string;
    companyName?: string;
    membershipId?: string;
    rewardPoints?: number;
    loyaltyTier?: 'bronze' | 'silver' | 'gold';
    ownerId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
}

const tierColors: { [key: string]: string } = {
    bronze: 'bg-orange-200 text-orange-800',
    silver: 'bg-slate-200 text-slate-800',
    gold: 'bg-yellow-200 text-yellow-800',
};


async function fetchFromAdminAPI(token: string, action: string, payload?: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || `API Error for action: ${action}`);
    return result.data;
}


export default function MemberLoyaltyStatus() {
    const { toast } = useToast();
    const [companies, setCompanies] = useState<Company[]>([]);
    const { data: loyaltySettings, isLoading: isSettingsLoading } = useConfig<any>('loyaltySettings');
    const [isLoadingData, setIsLoadingData] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            const companyData = await fetchFromAdminAPI(token, 'getMembers', {});
            setCompanies(companyData);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error Loading Data', description: e.message });
        } finally {
            setIsLoadingData(false);
        }
    }, [toast]);
    
    useEffect(() => {
        loadData();
    }, [loadData]);

    const displayedBenefits = useMemo(() => (loyaltySettings?.benefits || []).slice(0, 2), [loyaltySettings]);

    const enrichedMembers = useMemo(() => {
        if (!companies || !loyaltySettings) return [];
        return companies.map((company: Company) => {
            const tier = company.loyaltyTier || 'bronze';
            const currentPoints = company.rewardPoints || 0;
            const nextTier = tier === 'bronze' ? 'silver' : 'gold';
            const nextTierPoints = loyaltySettings[`${nextTier}Points`];
            const progress = tier === 'gold' ? 100 : nextTierPoints > 0 ? (currentPoints / nextTierPoints) * 100 : 0;
            
            const benefits: Record<string, string> = {};
            displayedBenefits.forEach((benefit: any) => {
                benefits[benefit.name] = benefit[`${tier}Value`] || 'N/A';
            });

            return {
                companyId: company.id,
                ownerId: company.ownerId,
                companyName: company.companyName,
                ownerName: `${company.firstName || ''} ${company.lastName || ''}`.trim() || 'N/A',
                email: company.email,
                loyaltyTier: tier,
                rewardPoints: currentPoints,
                benefits,
                progressToNext: progress,
                nextTierName: tier !== 'gold' ? nextTier : null,
            };
        }).sort((a,b) => b.rewardPoints - a.rewardPoints);
    }, [companies, loyaltySettings, displayedBenefits]);
    
    const isLoading = isLoadingData || isSettingsLoading;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Award/> Member Loyalty Overview</CardTitle>
                <CardDescription>A live look at all member loyalty statuses, points, and earned benefits.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                ) : (
                    <div className="border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Tier</TableHead>
                                    <TableHead>Points</TableHead>
                                    <TableHead>Progress to Next Tier</TableHead>
                                    {displayedBenefits.map((b: any) => <TableHead key={b.name} className="text-center">{b.name}</TableHead>)}
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                               {enrichedMembers.length > 0 ? enrichedMembers.map(member => (
                                <TableRow key={member.companyId}>
                                    <TableCell>
                                        <p className="font-semibold">{member.ownerName}</p>
                                        <p className="text-xs text-muted-foreground">{member.companyName}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={cn("capitalize", tierColors[member.loyaltyTier || 'bronze'])}>{member.loyaltyTier}</Badge>
                                    </TableCell>
                                    <TableCell className="font-mono font-semibold">{member.rewardPoints.toLocaleString()}</TableCell>
                                    <TableCell>
                                        {member.nextTierName ? (
                                            <>
                                                <Progress value={member.progressToNext} className="h-2 w-full" />
                                                <p className="text-xs text-muted-foreground mt-1">To {member.nextTierName}</p>
                                            </>
                                        ) : (
                                            <span className="text-xs font-semibold text-primary">Max Tier Reached</span>
                                        )}
                                    </TableCell>
                                    {displayedBenefits.map((b: any) => (
                                        <TableCell key={b.name} className="text-center font-semibold text-primary">{member.benefits[b.name] || 'N/A'}</TableCell>
                                    ))}
                                    <TableCell className="text-right">
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/backend?view=wallet&memberId=${member.companyId}`}>
                                                View Member
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                               )) : (
                                <TableRow>
                                    <TableCell colSpan={displayedBenefits.length + 5} className="h-24 text-center">
                                        No member data found.
                                    </TableCell>
                                </TableRow>
                               )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
