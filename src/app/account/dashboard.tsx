
'use client';

import { useUser, useFirestore, useDoc } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, FileText, Gem, User, Loader2, DollarSign, HeartHandshake, ArrowRight, Sparkles, Wallet, ShieldAlert, Landmark, Star } from "lucide-react";
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import EnquiriesCard from './enquiries-card';
import QuotesCard from './quotes-card';
import { cn } from '@/lib/utils';
import { useMemoFirebase } from '@/hooks/use-config';

export default function AccountDashboard() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const isAdmin = user && user.email === 'beyondtransport@gmail.com';

    const userDocRef = useMemoFirebase(() => {
        if (isAdmin || !firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user, isAdmin]);
    const { data: userData } = useDoc<{ companyId: string }>(userDocRef);

    const companyDocRef = useMemoFirebase(() => {
        if (isAdmin || !firestore || !userData?.companyId) return null;
        return doc(firestore, 'companies', userData.companyId);
    }, [firestore, userData, isAdmin]);

    const { data: companyData, isLoading: isCompanyLoading, error } = useDoc(companyDocRef);
    
    const isFreeMember = companyData?.membershipId === 'free';
    
    const loyaltyTier = companyData?.loyaltyTier || 'bronze';
    const tierColors: {[key: string]: string} = {
        bronze: 'bg-orange-200 text-orange-800',
        silver: 'bg-slate-200 text-slate-800',
        gold: 'bg-yellow-200 text-yellow-800',
    }
    
    // Admin View
    if (isAdmin) {
        return (
             <div className="w-full space-y-8">
                 <Card className="border-primary bg-primary/5">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <ShieldAlert className="h-10 w-10 text-primary" />
                            <div>
                                <CardTitle className="text-2xl">Administrator Account</CardTitle>
                                <CardDescription className="text-primary/90">You are currently viewing the standard member dashboard.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg">
                           All administrative functions are located in the secure <span className="font-semibold">Admin Backend</span>.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="default" size="lg" asChild>
                            <Link href="/backend">
                                Go to Admin Backend <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
             </div>
        )
    }

    if (isUserLoading || (user && isCompanyLoading)) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-8rem)] w-full">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-8rem)] w-full">
                <Card className="m-4">
                    <CardHeader>
                        <CardTitle className="text-destructive">Error Loading Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>There was a problem fetching your account data.</p>
                        <p className="text-xs text-muted-foreground mt-2">{error.message}</p>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => window.location.reload()}>Try Again</Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (!user) {
        return null;
    }
    
    return (
        <div className="w-full space-y-8">
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold font-headline">Dashboard</h1>
                    <p className="text-lg text-muted-foreground">Welcome back, {userData?.firstName || 'Member'}!</p>
                </div>
            </div>

            {isFreeMember && (
                 <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <div className="flex items-start gap-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                               <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Unlock Your Full Potential</CardTitle>
                                <CardDescription className="mt-1">
                                    You are currently on the Free plan. Upgrade your membership to access powerful tools, exclusive discounts, and new revenue opportunities.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <p className="text-sm text-muted-foreground">
                            By upgrading, you gain access to our advanced Tech division, including the AI Freight Matcher, plus the ability to activate Loyalty and Actions plans to save money and earn commission.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild>
                            <Link href="/pricing">
                                Compare Plans and Upgrade <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Membership Tier</CardTitle>
                        <Gem className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary capitalize">{companyData?.membershipId || 'Free'}</div>
                         {isFreeMember ? (
                             <Button asChild variant="link" size="sm" className="p-0 h-auto">
                                <Link href="/pricing">Upgrade to a paid plan</Link>
                            </Button>
                         ) : (
                            <p className="text-xs text-muted-foreground">You have a premium membership.</p>
                         )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Loyalty Status</CardTitle>
                        <div className="flex items-center gap-1">
                             <Award className="h-4 w-4 text-muted-foreground" />
                             <Star className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <span className={cn("px-2 py-1 rounded-md text-base", tierColors[loyaltyTier])}>{loyaltyTier.charAt(0).toUpperCase() + loyaltyTier.slice(1)}</span>
                            <span>{companyData?.rewardPoints || 0} Points</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Earn points for community actions.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Community Contribution</CardTitle>
                        <HeartHandshake className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Help the community and unlock greater savings by sharing anonymous data. Each contribution earns you 10 points.</p>
                         <Button asChild>
                            <Link href="/contribute">Contribute Data</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
            
            <div className="space-y-8">
                <QuotesCard />
                <EnquiriesCard />
            </div>
        </div>
    );
}
