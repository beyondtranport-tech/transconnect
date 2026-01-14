
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Gem, Percent, Star, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
    savingsEarned?: number; // Placeholder for future calculation
}

const tierColors: { [key: string]: string } = {
    bronze: 'bg-orange-200 text-orange-800',
    silver: 'bg-slate-200 text-slate-800',
    gold: 'bg-yellow-200 text-yellow-800',
};

export default function MemberLoyaltyStatus({ companies, memberships }: { companies: Company[], memberships: Membership[] }) {
    const membershipMap = useMemo(() => new Map<string, Membership>(memberships.map(m => [m.id, m])), [memberships]);

    const enrichedMembers = useMemo(() => {
        const data = companies.map((company: Company) => {
            const membership = membershipMap.get(company.membershipId || '');
            return {
                companyId: company.id,
                ownerId: company.ownerId,
                companyName: company.companyName,
                ownerName: `${company.firstName || ''} ${company.lastName || ''}`.trim() || 'N/A',
                email: company.email,
                loyaltyTier: company.loyaltyTier,
                rewardPoints: company.rewardPoints,
                membershipTier: membership?.name || company.membershipId,
                commissionShare: membership?.commissionShare,
                discountShare: membership?.discountShare,
                savingsEarned: 0, // Placeholder
            };
        });
        data.sort((a, b) => (b.rewardPoints || 0) - (a.rewardPoints || 0));
        return data;
    }, [companies, membershipMap]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrichedMembers.map(member => (
                <Card key={member.companyId} className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">{member.ownerName}</CardTitle>
                        <CardDescription>{member.companyName}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow">
                        <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                            <span className="text-sm font-medium flex items-center gap-1.5"><Star className="h-4 w-4"/> Loyalty Tier</span>
                            <span className={cn("font-bold capitalize px-2 py-0.5 rounded-full text-sm", tierColors[member.loyaltyTier || 'bronze'])}>{member.loyaltyTier || 'bronze'}</span>
                        </div>
                        <div className="flex justify-between items-center p-2">
                            <span className="text-sm font-medium flex items-center gap-1.5"><Gem className="h-4 w-4"/> Reward Points</span>
                            <span className="font-bold font-mono">{member.rewardPoints?.toLocaleString() || 0}</span>
                        </div>
                         <div className="flex justify-between items-center p-2">
                            <span className="text-sm font-medium flex items-center gap-1.5"><Percent className="h-4 w-4"/> Commission Share</span>
                            <span className="font-bold font-mono">{member.commissionShare || 0}%</span>
                        </div>
                        <div className="flex justify-between items-center p-2">
                            <span className="text-sm font-medium flex items-center gap-1.5"><Percent className="h-4 w-4"/> Discount Share</span>
                            <span className="font-bold font-mono">{member.discountShare || 0}%</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-primary/10 rounded-md mt-2">
                            <span className="text-sm font-bold flex items-center gap-1.5"><DollarSign className="h-4 w-4"/> Total Savings Earned</span>
                            <span className="font-bold text-lg text-primary">R {member.savingsEarned?.toFixed(2) || '0.00'}</span>
                        </div>
                    </CardContent>
                     <CardFooter>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/backend?view=wallet&memberId=${member.companyId}`}>
                                View Member Details
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}

    