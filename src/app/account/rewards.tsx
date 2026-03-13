
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useConfig } from '@/hooks/use-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Star, Award, Gift, Percent, HeartHandshake, User, Store, Package, Search, Video, Building, Truck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { doc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RewardsContent() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const { data: loyaltySettings, isLoading: isSettingsLoading } = useConfig<any>('loyaltySettings');

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userData, isLoading: isUserDocLoading } = useDoc(userDocRef);

    const companyDocRef = useMemoFirebase(() => {
        if (!firestore || !userData?.companyId) return null;
        return doc(firestore, 'companies', userData.companyId);
    }, [firestore, userData]);

    const { data: companyData, isLoading: isCompanyLoading } = useDoc(companyDocRef);

    const isLoading = isUserLoading || isUserDocLoading || isCompanyLoading || isSettingsLoading;
    
    const tier = companyData?.loyaltyTier || 'bronze';
    const tierColors: {[key: string]: string} = {
        bronze: 'bg-orange-200 text-orange-800',
        silver: 'bg-slate-200 text-slate-800',
        gold: 'bg-yellow-200 text-yellow-800',
    }
    
    const earningActions = [
        { points: loyaltySettings?.userSignupPoints, name: 'Sign up for an account', icon: User, cta: { label: 'Completed!', href: '#', disabled: true } },
        { points: loyaltySettings?.shopCreationPoints, name: 'Create a Vendor Shop', icon: Store, cta: { label: 'Create Shop', href: '/account?view=shop' } },
        { points: loyaltySettings?.productAddPoints, name: 'Add a Product to your Shop', icon: Package, cta: { label: 'Add Product', href: '/account?view=shop' } },
        { points: loyaltySettings?.truckContributionPoints, name: 'Contribute Truck/Trailer Data', icon: Truck, cta: { label: 'Contribute', href: '/contribute' } },
        { points: loyaltySettings?.supplierContributionPoints, name: 'Contribute Supplier Data', icon: Building, cta: { label: 'Contribute', href: '/contribute?tab=suppliers' } },
        { points: loyaltySettings?.debtorContributionPoints, name: 'Contribute Debtor Data', icon: Users, cta: { label: 'Contribute', href: '/contribute?tab=debtors' } },
        { points: loyaltySettings?.partnerReferralPoints, name: 'Refer a New Member', icon: HeartHandshake, cta: { label: 'Refer Now', href: '/account?view=network' } },
        { points: loyaltySettings?.aiVideoGeneratorPoints, name: 'Generate an AI Video', icon: Video, cta: { label: 'Go to Tech', href: '/tech' } },
        { points: loyaltySettings?.seoBoosterPoints, name: 'Use the AI SEO Booster', icon: Search, cta: { label: 'Go to My Shop', href: '/account?view=shop' } },
    ]

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl"><Gift /> My Rewards Dashboard</CardTitle>
                    <CardDescription>Your current loyalty status, points, and opportunities to earn more.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                     ) : companyData ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                <Card className="bg-muted/50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Star /> Loyalty Status</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className={cn("w-fit text-2xl font-bold px-4 py-2 rounded-lg capitalize flex items-center gap-2", tierColors[tier])}>
                                           <Award /> {tier}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-muted/50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Gift /> Reward Points</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-5xl font-extrabold text-primary">{companyData.rewardPoints || 0}</p>
                                    </CardContent>
                                </Card>
                                 <Card className="bg-muted/50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Percent /> Your Tier Benefits</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                         <div className="flex justify-between items-center text-lg">
                                            <p>Commission Share:</p>
                                            <p className="font-bold text-primary">{companyData.commissionShare || 0}%</p>
                                        </div>
                                         <div className="flex justify-between items-center text-lg">
                                            <p>Discount Share:</p>
                                            <p className="font-bold text-primary">{companyData.discountShare || 0}%</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>How to Earn Points</CardTitle>
                                        <CardDescription>Complete actions to earn points and climb the loyalty tiers.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Action</TableHead>
                                                    <TableHead className="text-center">Points</TableHead>
                                                    <TableHead className="text-right">Go</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {earningActions.map((action) => {
                                                    const Icon = action.icon;
                                                    return (
                                                        <TableRow key={action.name}>
                                                            <TableCell className="font-medium flex items-center gap-3"><Icon className="h-5 w-5 text-muted-foreground" /> {action.name}</TableCell>
                                                            <TableCell className="text-center font-bold text-primary">{action.points || 0}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Button asChild size="sm" variant="outline" disabled={action.cta.disabled}>
                                                                    <Link href={action.cta.href}>{action.cta.label}</Link>
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                     ) : (
                        <div className="text-center py-20">
                            <p className="text-muted-foreground">Could not load your rewards information.</p>
                        </div>
                     )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Rewards Store</CardTitle>
                    <CardDescription>Redeem your hard-earned points for valuable rewards.</CardDescription>
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
