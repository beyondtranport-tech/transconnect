'use client';

import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, FileText, Gem, User, Loader2, DollarSign } from "lucide-react";
import { doc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';

export default function AccountPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();

    const memberRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'members', user.uid);
    }, [firestore, user]);

    const { data: memberData, isLoading: isMemberLoading } = useDoc(memberRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/signin');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user || isMemberLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="bg-background min-h-full">
            <div className="container mx-auto px-4 py-16">
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <User className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold font-headline">My Account</h1>
                        <p className="text-lg text-muted-foreground">Welcome back, {memberData?.firstName || 'Member'}!</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                            <CardTitle className="text-sm font-medium">My Documents</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Securely store and manage your important documents.</p>
                             <Button disabled>Upload Documents</Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Manage your personal and company details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {memberData ? (
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium">Full Name</h4>
                                        <p className="text-muted-foreground">{memberData.firstName} {memberData.lastName}</p>
                                    </div>
                                     <div>
                                        <h4 className="font-medium">Company Name</h4>
                                        <p className="text-muted-foreground">{memberData.companyName}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium">Email</h4>
                                        <p className="text-muted-foreground">{memberData.email}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium">Phone</h4>
                                        <p className="text-muted-foreground">{memberData.phone}</p>
                                    </div>
                                </div>
                            ): (
                               <p className="text-muted-foreground">Could not load profile information.</p>
                            )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                               <DollarSign className="h-6 w-6" />
                               Transactions
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
        </div>
    );
}
