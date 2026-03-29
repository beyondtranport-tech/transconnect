'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { useConfig } from '@/hooks/use-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Star, Award, Gift, HeartHandshake, User, Store, Package, Search, Video, Building, Truck, Users, CheckCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { doc, collection } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React, { useMemo } from 'react';

export default function ActionsPlanPage() {
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

    // Fetch products to check if at least one has been added
    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !companyData?.shopId) return null;
        return collection(firestore, `companies/${companyData.id}/shops/${companyData.shopId}/products`);
    }, [firestore, companyData]);
    const { data: products, isLoading: areProductsLoading } = useCollection(productsQuery);

    const isLoading = isUserLoading || isUserDocLoading || isCompanyLoading || isSettingsLoading || areProductsLoading;
    
    const earningActions = useMemo(() => [
        { 
            points: loyaltySettings?.userSignupPoints, 
            name: 'Sign up for an account', 
            icon: User, 
            isCompleted: true, // Always completed if viewing this page
            cta: { label: 'Completed!', href: '#', disabled: true } 
        },
        { 
            points: loyaltySettings?.shopCreationPoints, 
            name: 'Create a Vendor Shop', 
            icon: Store, 
            isCompleted: !!companyData?.shopId,
            cta: { label: 'Create Shop', href: '/account?view=shop' } 
        },
        { 
            points: loyaltySettings?.productAddPoints, 
            name: 'Add a Product to your Shop', 
            icon: Package, 
            isCompleted: (products?.length || 0) > 0,
            cta: { label: 'Add Product', href: '/account?view=shop' } 
        },
        { 
            points: loyaltySettings?.loadBoardCreationPoints,
            name: 'Create a Load Board',
            icon: Truck,
            isCompleted: !!companyData?.loadBoardId,
            cta: { label: 'Create Board', href: '/account?view=load-board' }
        },
        { 
            points: loyaltySettings?.truckContributionPoints, 
            name: 'Contribute Truck/Trailer Data', 
            icon: Truck, 
            isCompleted: false, // Cannot easily track this yet
            cta: { label: 'Contribute', href: '/contribute' } 
        },
        { 
            points: loyaltySettings?.supplierContributionPoints, 
            name: 'Contribute Supplier Data', 
            icon: Building, 
            isCompleted: false,
            cta: { label: 'Contribute', href: '/contribute?tab=suppliers' } 
        },
        { 
            points: loyaltySettings?.debtorContributionPoints, 
            name: 'Contribute Debtor Data', 
            icon: Users,
            isCompleted: false,
            cta: { label: 'Contribute', href: '/contribute?tab=debtors' } 
        },
        { 
            points: loyaltySettings?.partnerReferralPoints, 
            name: 'Refer a New Member', 
            icon: HeartHandshake, 
            isCompleted: false,
            cta: { label: 'Refer Now', href: '/account?view=network' } 
        },
        { 
            points: loyaltySettings?.aiVideoGeneratorPoints, 
            name: 'Generate an AI Video', 
            icon: Video, 
            isCompleted: false,
            cta: { label: 'Go to AI Studio', href: '/account?view=marketing-studio' } 
        },
        { 
            points: loyaltySettings?.seoBoosterPoints, 
            name: 'Use the AI SEO Booster', 
            icon: Search, 
            isCompleted: false,
            cta: { label: 'Go to My Shop', href: '/account?view=shop' } 
        },
    ], [loyaltySettings, companyData, products]);


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl"><Zap /> Actions Plan</CardTitle>
                <CardDescription>
                    This is your action hub. Complete these tasks to earn loyalty points, climb the loyalty tiers, and unlock powerful rewards and benefits for your business.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Action</TableHead>
                                <TableHead className="text-center">Points</TableHead>
                                <TableHead className="text-right">Status / Link</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {earningActions.map((action) => {
                                if (!action.points) return null; // Don't render if points are 0 or not set
                                const Icon = action.icon;
                                return (
                                    <TableRow key={action.name}>
                                        <TableCell className="font-medium flex items-center gap-3"><Icon className="h-5 w-5 text-muted-foreground" /> {action.name}</TableCell>
                                        <TableCell className="text-center font-bold text-primary">{action.points || 0}</TableCell>
                                        <TableCell className="text-right">
                                            {action.isCompleted ? (
                                                <Button size="sm" variant="ghost" disabled className="text-green-600">
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Completed
                                                </Button>
                                            ) : (
                                                <Button asChild size="sm" variant="outline">
                                                    <Link href={action.cta.href}>{action.cta.label}</Link>
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
