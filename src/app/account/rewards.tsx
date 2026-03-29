'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift } from 'lucide-react';

export default function RewardsContent() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl"><Gift /> My Rewards</CardTitle>
                    <CardDescription>Redeem your hard-earned points for valuable rewards in the store.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="text-center py-20 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">The Rewards Store is coming soon.</p>
                        <p className="text-sm text-muted-foreground mt-1">You'll be able to redeem points for fuel vouchers, service discounts, and more.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
