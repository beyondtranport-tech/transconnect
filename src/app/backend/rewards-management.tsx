
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Star } from 'lucide-react';
import MemberLoyaltyStatus from './member-loyalty-status';

interface Member {
    id: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    membershipId?: string;
    walletBalance?: number;
    createdAt?: string;
    rewardPoints?: number;
    loyaltyTier?: 'bronze' | 'silver' | 'gold';
    ownerId: string;
    email?: string;
}

interface Membership {
    id: string;
    name: string;
    commissionShare?: number;
    discountShare?: number;
}

// NOTE: Data fetching is temporarily disabled to prevent infinite loops.
// The component will render with empty static data.

export default function RewardsManagement() {
    const [companies] = useState<Member[]>([]);
    const [memberships] = useState<Membership[]>([]);
    const [isLoading] = useState(false);
    const [error] = useState<string | null>(null);

    
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Star /> Member Loyalty Status</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center py-20">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive"><Star /> Error Loading Status</CardTitle>
                    <CardDescription>Could not fetch member or membership data.</CardDescription>
                </CardHeader>
                <CardContent className="text-destructive bg-destructive/10 p-4 rounded-md">
                   {error}
                </CardContent>
            </Card>
        );
    }
    
    return (
         <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Member Loyalty & Rewards Status</h1>
                <p className="text-muted-foreground mt-2">
                    This dashboard shows the loyalty status of each member, their accumulated points, and the reward percentages they are entitled to based on their membership tier.
                </p>
            </div>
            <MemberLoyaltyStatus companies={companies || []} memberships={memberships || []} />
        </div>
    );
}
