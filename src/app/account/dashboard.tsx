'use client';

import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, FileText, Gem, User, Loader2, DollarSign, HeartHandshake } from "lucide-react";
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Membership Tier</CardTitle>
                        <Gem className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary capitalize">{memberData?.membershipId || 'Free'}</div>
                        <p className="text-xs text-muted-foreground">Upgrade to unlock more benefits.</p>
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
