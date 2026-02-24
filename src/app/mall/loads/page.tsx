
'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Loader2, PlusCircle } from "lucide-react";
import FreightMatcher from "@/app/tech/freight-matcher";
import Image from "next/image";
import data from "@/lib/placeholder-images.json";
import LoadCalculator from "@/app/tech/load-calculator";
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';


const { placeholderImages } = data;
const techImage = placeholderImages.find(p => p.id === "tech-home");

export default function LoadsMallPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

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

    const isLoading = isUserLoading || isUserDocLoading || isCompanyLoading;
    const isFreeTier = companyData?.membershipId === 'free';

    const handlePostLoadClick = () => {
        if (!user) {
            router.push('/signin?redirect=/mall/loads');
            return;
        }

        if (isFreeTier) {
            setIsUpgradeModalOpen(true);
        } else {
            // This is where the form to post a load would be triggered.
            // For now, it's a placeholder.
            toast({
                title: "Ready to Post!",
                description: "The 'Post a Load' form will be implemented here for paid members.",
            });
        }
    };


    return (
        <div>
            <AlertDialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Upgrade to Post Loads</AlertDialogTitle>
                    <AlertDialogDescription>
                        This is a premium feature. Upgrade your membership to post loads and connect with our network of available transporters.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Maybe Later</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Link href="/pricing">View Plans</Link>
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <section className="relative w-full h-80 bg-card">
                {techImage && (
                    <Image
                        src={techImage.imageUrl}
                        alt="Loads Mall"
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={techImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Loads Mall</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Find available loads, reduce empty miles, and maximize your profitability.</p>
                </div>
            </section>

            <section className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-8">
                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Truck className="h-6 w-6"/>AI Freight Matcher</CardTitle>
                                    <CardDescription>Enter your vehicle details and route to find matching loads from our network.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FreightMatcher />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><PlusCircle className="h-6 w-6"/>Post a Load</CardTitle>
                                    <CardDescription>Have cargo that needs moving? Post your load to our network to get competitive quotes from available transporters.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Posting loads is a premium feature that connects you with our entire network of drivers. Upgrade your plan to get started.
                                    </p>
                                    <Button onClick={handlePostLoadClick} disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Post a Load
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                         <div className="lg:col-span-1 space-y-8">
                           <LoadCalculator />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
