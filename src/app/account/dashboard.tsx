
'use client';

import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, FileText, Gem, User, Loader2, DollarSign, HeartHandshake, ArrowRight, Sparkles, Wallet, ShieldAlert } from "lucide-react";
import { doc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import Link from 'next/link';
import RecentTransactions from './recent-transactions';
import { useEffect, useState } from 'react';

export default function AccountDashboard() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const memberRef = useMemoFirebase(() => {
        if (isUserLoading || !firestore || !user) return null;
        return doc(firestore, 'members', user.uid);
    }, [firestore, user, isUserLoading]);

    const { data: memberData, isLoading: isMemberLoading } = useDoc(memberRef);
    
    // Explicit Admin Check
    const isAdmin = user && user.email === 'beyondtransport@gmail.com';
    const isFreeMember = memberData?.membershipId === 'free';
    
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
    };

    if (isUserLoading || (user && isMemberLoading)) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-8rem)] w-full">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!user) {
        return null; // or a message telling user to sign in
    }

    return (
        <div className="w-full space-y-8">
            {/* <<< START: ADMIN-ONLY BACKEND ACCESS CARD >>> */}
            {isAdmin && (
                <Card className="mb-8 border-destructive bg-destructive/10">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <ShieldAlert className="h-8 w-8 text-destructive" />
                            <div>
                                <CardTitle>Admin Backend Access</CardTitle>
                                <CardDescription className="text-destructive/80">Direct access to the platform's administrative backend.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">The navigation link in the avatar menu may be broken. Use this button to access the backend.</p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="destructive" asChild>
                            <Link href="/backend">
                                Go to Backend <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            )}
            {/* <<< END: ADMIN-ONLY BACKEND ACCESS CARD >>> */}

            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold font-headline">Dashboard</h1>
                    <p className="text-lg text-muted-foreground">Welcome back, {memberData?.firstName || 'Member'}!</p>
                </div>
            </div>

            {isFreeMember && !isAdmin && (
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Membership Tier</CardTitle>
                        <Gem className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary capitalize">{memberData?.membershipId || 'Free'}</div>
                         {isFreeMember && !isAdmin ? (
                             <Button asChild variant="link" size="sm" className="p-0 h-auto">
                                <Link href="/pricing">Upgrade to a paid plan</Link>
                            </Button>
                         ) : (
                            <p className="text-xs text-muted-foreground">{isAdmin ? 'Admin Account' : 'You have a premium membership.'}</p>
                         )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(memberData?.walletBalance || 0)}</div>
                        <p className="text-xs text-muted-foreground">Used for membership payments.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Reward Points</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{memberData?.rewardPoints || 0}</div>
                        <p className="text-xs text-muted-foreground">Earned from community actions.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Community Contribution</CardTitle>
                        <HeartHandshake className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Help the community and unlock greater savings by sharing anonymous data.</p>
                         <Button asChild>
                            <Link href="/contribute">Contribute Data</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
            
            <div className="mt-8">
                <RecentTransactions />
            </div>
        </div>
    );
}
