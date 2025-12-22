'use client';

import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, FileText, Gem, User, Loader2, DollarSign, HeartHandshake, ArrowRight, Sparkles } from "lucide-react";
import { doc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import Link from 'next/link';

export default function AccountDashboard() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const memberRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'members', user.uid);
    }, [firestore, user]);

    const { data: memberData, isLoading: isMemberLoading } = useDoc(memberRef);

    const isFreeMember = memberData?.membershipId === 'free';

    if (isUserLoading || !user || isMemberLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-8rem)] w-full">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold font-headline">Dashboard</h1>
                    <p className="text-lg text-muted-foreground">Welcome back, {memberData?.firstName || 'Member'}!</p>
                </div>
            </div>

            {isFreeMember && (
                 <Card className="mb-8 bg-primary/5 border-primary/20">
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
                        <CardTitle className="text-sm font-medium">Reward Points</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{memberData?.rewardPoints || 0}</div>
                        <p className="text-xs text-muted-foreground">Redeem points in the Mall.</p>
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
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">My Documents</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Securely store and manage your important documents.</p>
                         <Button disabled>Upload Documents</Button>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-12">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <DollarSign className="h-6 w-6" />
                           Recent Transactions
                        </CardTitle>
                        <CardDescription>View your membership payments and marketplace history.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-10">
                        <p className="text-muted-foreground">You have no transactions yet.</p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline">View All Transactions</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
