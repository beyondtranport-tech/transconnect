
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, Star } from 'lucide-react';
import MemberLoyaltyStatus from './member-loyalty-status';
import { getClientSideAuthToken } from '@/firebase';

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
    return result.data || [];
}

export default function RewardsManagement() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [memberships, setMemberships] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            setError(null);
            try {
                const [companiesData, membershipsData] = await Promise.all([
                    fetchAdminData('getMembers'),
                    fetchAdminData('getMemberships')
                ]);
                setCompanies(companiesData);
                setMemberships(membershipsData);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20 text-destructive border-2 border-destructive/50 rounded-lg bg-destructive/10">
                <h3 className="text-xl font-semibold">Error Loading Data</h3>
                <p className="mt-2 text-sm">{error}</p>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Star className="h-6 w-6" /> Member Loyalty & Rewards Status</CardTitle>
                <CardDescription>
                    This dashboard shows the loyalty status of each member, their accumulated points, and the reward percentages they are entitled to based on their membership tier.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <MemberLoyaltyStatus companies={companies} memberships={memberships} />
            </CardContent>
        </Card>
    );
}
