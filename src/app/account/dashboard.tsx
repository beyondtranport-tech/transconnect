
'use client';

import { useUser, useFirestore, useDoc } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Gem, Loader2, HeartHandshake, ArrowRight, Sparkles, Wallet, ShieldAlert, Star, CheckCircle, ShieldCheck, Landmark, Globe, Zap } from "lucide-react";
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import { useMemo } from 'react';
import EnquiriesCard from './enquiries-card';
import QuotesCard from './quotes-card';
import { cn, formatCurrency } from '@/lib/utils';
import { useMemoFirebase } from '@/firebase';
import { useConfig } from '@/hooks/use-config';

export default function AccountDashboard() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const isAdmin = user && (
        user.email === 'beyondtransport@gmail.com' || 
        user.email === 'mkoton100@gmail.com' || 
        user.email === 'michael@logisticsflow.co.za'
    );

    const { data: loyaltySettings, isLoading: isSettingsLoading } = useConfig<any>('loyaltySettings');

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    
    const { data: userData } = useDoc<{ companyId: string, firstName: string }>(userDocRef);

    const companyDocRef = useMemoFirebase(() => {
        if (!firestore || !userData?.companyId) return null;
        return doc(firestore, 'companies', userData.companyId);
    }, [firestore, userData?.companyId]);

    const { data: companyData, isLoading: isCompanyLoading, error } = useDoc(companyDocRef);
    
    const isFreeMember = companyData?.membershipId === 'free' || !companyData?.membershipId;
    
    const loyaltyTier = companyData?.loyaltyTier || 'bronze';
    const tierColors: {[key: string]: string} = {
        bronze: 'bg-orange-200 text-orange-800',
        silver: 'bg-slate-200 text-slate-800',
        gold: 'bg-yellow-200 text-yellow-800',
    };

    const userBenefits = useMemo(() => {
        if (!loyaltySettings || !companyData) return [];
        const tier = companyData.loyaltyTier || 'bronze';
        const benefitsConfig = loyaltySettings.benefits || [];
        
        return benefitsConfig.map((benefit: any) => ({
            name: benefit.name,
            value: benefit[`${tier}Value`] || 'N/A',
        })).filter((b: any) => b.value && b.value !== 'N/A' && b.value !== '0');
    }, [loyaltySettings, companyData]);
    
    if (isUserLoading || (user && (isCompanyLoading || isSettingsLoading))) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-8rem)] w-full">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-8rem)] w-full text-left">
                <Card className="m-4 w-full max-w-2xl text-left shadow-lg border-destructive/20 text-foreground">
                    <CardHeader className="text-left border-b bg-destructive/5 text-foreground">
                        <CardTitle className="text-destructive text-left flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5" /> Error Loading Dashboard
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-left p-8 text-foreground">
                        <p className="text-left font-medium">There was a problem fetching your account data.</p>
                        <p className="text-xs text-muted-foreground mt-2 text-left bg-muted p-2 rounded font-mono">{error.message}</p>
                    </CardContent>
                    <CardFooter className="text-left border-t pt-6">
                        <Button onClick={() => window.location.reload()}>Try Again</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (!user) return null;

    if (isAdmin) {
        return (
             <div className="w-full space-y-8 text-left text-foreground">
                 <Card className="border-primary bg-primary/5 text-left text-foreground">
                    <CardHeader className="text-left">
                        <div className="flex items-center gap-4 text-left">
                            <ShieldCheck className="h-10 w-10 text-primary" />
                            <div className="text-left text-foreground">
                                <CardTitle className="text-2xl text-left text-foreground">Administrator Account</CardTitle>
                                <CardDescription className="text-primary/90 text-left">You are currently viewing the standard member dashboard.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="text-left text-foreground">
                        <p className="text-lg text-left leading-relaxed">
                           All administrative functions are located in the secure <span className="font-semibold text-primary">Admin Portal</span>.
                        </p>
                    </CardContent>
                    <CardFooter className="text-left">
                        <Button variant="default" size="lg" asChild>
                            <Link href="/adminaccount">
                                Go to Admin Portal <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
             </div>
        );
    }
    
    return (
        <div className="w-full space-y-8 text-left text-foreground">
            <div className="flex items-center gap-4 text-left">
                <div className="text-left text-foreground">
                    <h1 className="text-3xl md:text-4xl font-bold font-headline text-left">Dashboard</h1>
                    <p className="text-lg text-muted-foreground text-left">Welcome back, {userData?.firstName || 'Member'}!</p>
                </div>
            </div>

            {isFreeMember && (
                 <Card className="bg-primary/5 border-primary/20 text-left text-foreground">
                    <CardHeader className="text-left">
                        <div className="flex items-start gap-4 text-left text-foreground">
                            <div className="bg-primary/10 p-3 rounded-full shrink-0">
                               <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <div className="text-left text-foreground">
                                <CardTitle className="text-left text-foreground">Unlock Your Full Potential</CardTitle>
                                <CardDescription className="mt-1 text-left">
                                    You are currently on the Free plan. Upgrade your membership to access forensic data and publishing tools.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="text-left text-foreground">
                         <p className="text-sm text-muted-foreground text-left">
                            By upgrading, you gain access to our advanced Tech division, forensic haulier registries, and the ability to earn commission via Connect plans.
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left text-foreground">
                 <Card className="text-left text-foreground">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 text-left">
                        <CardTitle className="text-sm font-medium text-left">Membership Tier</CardTitle>
                        <Gem className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="text-left text-foreground">
                        <div className="text-2xl font-bold text-primary capitalize text-left">{companyData?.membershipId || 'Free'}</div>
                         {isFreeMember ? (
                             <Button asChild variant="link" size="sm" className="p-0 h-auto">
                                <Link href="/pricing">Upgrade to a paid plan</Link>
                            </Button>
                         ) : (
                            <p className="text-xs text-muted-foreground text-left">You have a premium membership.</p>
                         )}
                    </CardContent>
                </Card>
                <Card className="text-left text-foreground">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 text-left">
                        <CardTitle className="text-sm font-medium text-left text-foreground">Available to Spend</CardTitle>
                         <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="text-left text-foreground">
                        <div className="text-2xl font-bold text-left">{formatCurrency(companyData?.availableBalance)}</div>
                         <Button asChild variant="link" size="sm" className="p-0 h-auto">
                            <Link href="/account?view=wallet">Manage Wallet</Link>
                        </Button>
                    </CardContent>
                </Card>
                 <Card className="text-left text-foreground">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 text-left">
                        <CardTitle className="text-sm font-medium text-left text-foreground">Loyalty Status</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="text-left text-foreground">
                        <div className="text-2xl font-bold flex items-center gap-2 text-left">
                            <span className={cn("px-2 py-1 rounded-md text-base", tierColors[loyaltyTier])}>{loyaltyTier.charAt(0).toUpperCase() + loyaltyTier.slice(1)}</span>
                            <span>{companyData?.rewardPoints || 0} Points</span>
                        </div>
                        <p className="text-xs text-muted-foreground text-left">Earn points for community actions.</p>
                    </CardContent>
                </Card>
            </div>

            {/* --- STRATEGIC FUNDING CENTER --- */}
            <div className="space-y-4 text-left">
                <h2 className="text-2xl font-black font-headline text-foreground">Strategic Funding Center</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-foreground">
                    <Card className="border-primary/20 bg-primary/5 shadow-md flex flex-col text-left">
                        <CardHeader className="pb-2 text-left">
                            <div className="flex items-center gap-3 text-left">
                                <div className="bg-primary/20 p-2 rounded-lg text-left"><Landmark className="h-5 w-5 text-primary" /></div>
                                <CardTitle className="text-lg font-bold text-left">Direct In-House Funding</CardTitle>
                            </div>
                            <CardDescription className="text-left">Apply directly to the Logistics Flow capital division.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow text-left">
                            <p className="text-sm text-muted-foreground leading-relaxed text-left">Use this path for prioritized, rapid decisions based on your platform activity and verified fleet profile.</p>
                        </CardContent>
                        <CardFooter className="pt-4 border-t border-primary/10">
                            <Button asChild className="w-full font-bold h-11 shadow-lg" variant="default">
                                <Link href="/funding/apply?origination=direct">
                                    Direct Application <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50/30 shadow-md flex flex-col text-left">
                        <CardHeader className="pb-2 text-left">
                            <div className="flex items-center gap-3 text-left">
                                <div className="bg-blue-100 p-2 rounded-lg text-left"><Globe className="h-5 w-5 text-blue-600" /></div>
                                <CardTitle className="text-lg font-bold text-left">Finance Mall Broadcast</CardTitle>
                            </div>
                            <CardDescription className="text-left">Distribute your enquiry to our 85+ partner lenders.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow text-left">
                            <p className="text-sm text-muted-foreground leading-relaxed text-left">Compare the market. Your application is automatically matched with niche lenders based on your criteria.</p>
                        </CardContent>
                        <CardFooter className="pt-4 border-t border-blue-100">
                            <Button asChild className="w-full font-bold h-11" variant="outline">
                                <Link href="/funding/apply?origination=market">
                                    Market Broadcast <Zap className="ml-2 h-4 w-4 text-blue-600" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
            
            <Card className="text-left shadow-sm text-foreground">
                <CardHeader className="text-left bg-slate-50 border-b text-foreground">
                    <CardTitle className="flex items-center gap-2 text-left text-foreground">
                        <Award className="h-5 w-5 text-primary" />
                        My Loyalty Benefits
                    </CardTitle>
                    <CardDescription className="text-left">
                        You are on the <span className="font-semibold text-primary capitalize">{loyaltyTier}</span> tier.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-left p-6 text-foreground">
                    {userBenefits.length > 0 ? (
                        <ul className="space-y-3 text-left">
                            {userBenefits.map((benefit: any) => (
                                <li key={benefit.name} className="flex items-center gap-3 text-left">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span className="font-medium text-sm">{benefit.name}: <span className="font-bold text-primary">{benefit.value}</span></span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-sm text-left italic">No benefits are currently configured for your tier.</p>
                    )}
                </CardContent>
                 <CardFooter className="text-left border-t pt-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/connect?view=rewards">View Rewards Store</Link>
                    </Button>
                </CardFooter>
            </Card>

            <Card className="text-left border-primary/20 bg-primary/5 text-foreground">
                <CardHeader className="text-left">
                    <CardTitle className="flex items-center gap-2 text-left text-foreground"><HeartHandshake className="text-primary" /> Help the Community & Earn Rewards</CardTitle>
                </CardHeader>
                <CardContent className="text-left text-foreground">
                    <p className="text-muted-foreground text-sm leading-relaxed text-left">Help the community by sharing anonymous data. Each contribution earns you reward points.</p>
                </CardContent>
                <CardFooter className="text-left">
                    <Button asChild size="sm">
                        <Link href="/contribute">Contribute Data <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </CardFooter>
            </Card>
            
            <div className="space-y-8 text-left text-foreground">
                <QuotesCard />
                <EnquiriesCard />
            </div>
        </div>
    );
}
