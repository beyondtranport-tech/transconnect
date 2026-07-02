'use client';

import { useUser, useFirestore, useDoc } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Gem, Loader2, HeartHandshake, ArrowRight, Sparkles, Wallet, ShieldAlert, Star, CheckCircle, ShieldCheck, Landmark, Globe, Zap, Link as LinkIcon, Copy, Lock, Truck } from "lucide-react";
import { doc, collection, query, limit } from 'firebase/firestore';
import Link from 'next/link';
import { useMemo } from 'react';
import EnquiriesCard from './enquiries-card';
import QuotesCard from './quotes-card';
import { cn, formatCurrency } from '@/lib/utils';
import { useMemoFirebase, useCollection } from '@/firebase';
import { useConfig } from '@/hooks/use-config';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export default function AccountDashboard() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

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
    
    const { data: userData } = useDoc<{ companyId: string, firstName: string, declaredPosition?: string }>(userDocRef);

    const companyDocRef = useMemoFirebase(() => {
        if (!firestore || !userData?.companyId) return null;
        return doc(firestore, 'companies', userData.companyId);
    }, [firestore, userData?.companyId]);

    const { data: companyData, isLoading: isCompanyLoading, error } = useDoc(companyDocRef);

    const facilitiesQuery = useMemoFirebase(() => {
        if (!firestore || !userData?.companyId) return null;
        return query(collection(firestore, `companies/${userData.companyId}/facilities`), limit(5));
    }, [firestore, userData?.companyId]);
    const { data: facilities, isLoading: isFacilitiesLoading } = useCollection(facilitiesQuery);
    
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
    
    const isAssociate = userData?.declaredPosition === 'associate' || user?.role === 'associate';
    const isLender = userData?.declaredPosition === 'lender' || user?.role === 'lender' || companyData?.declaredRole === 'lender';
    
    const referralLink = useMemo(() => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://logisticsflow.co.za';
        return `${baseUrl}/join?ref=${userData?.companyId || 'SYSTEM'}`;
    }, [userData?.companyId]);

    const copyReferral = () => {
        navigator.clipboard.writeText(referralLink);
        toast({ title: "Referral Link Copied!" });
    };

    if (isUserLoading || (user && (isCompanyLoading || isSettingsLoading))) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-8rem)] w-full">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-8rem)] w-full">
                <Card className="m-4 w-full max-w-2xl shadow-lg border-destructive/20">
                    <CardHeader className="border-b bg-destructive/5">
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5" /> Error Loading Dashboard
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <p className="font-medium text-left">There was a problem fetching your account data.</p>
                        <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded font-mono text-left">{error.message}</p>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button onClick={() => window.location.reload()}>Try Again</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="w-full space-y-8">
            <div className="flex items-center gap-4">
                <div className="text-left">
                    <h1 className="text-3xl md:text-4xl font-bold font-headline">Dashboard</h1>
                    <p className="text-lg text-muted-foreground">Welcome back, {userData?.firstName || 'Member'}!</p>
                </div>
            </div>

            {isAdmin && (
                 <Card className="border-primary bg-primary/5">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <ShieldCheck className="h-10 w-10 text-primary" />
                            <div className="text-left">
                                <CardTitle className="text-2xl">Administrator Account</CardTitle>
                                <CardDescription className="text-primary/90">You are currently viewing the standard member dashboard.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="text-left">
                        <p className="text-lg leading-relaxed">
                           All administrative functions are located in the secure <span className="font-semibold text-primary">Admin Portal</span>.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="default" size="lg" asChild>
                            <Link href="/adminaccount">
                                Go to Admin Portal <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Core Stats - Role Filtered */}
            <div className={cn(
                "grid grid-cols-1 md:grid-cols-2 gap-8",
                !isAssociate && !isLender && "lg:grid-cols-3"
            )}>
                 {!isAssociate && !isLender && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Membership Tier</CardTitle>
                            <Gem className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="text-left">
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
                 )}
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Available to Spend</CardTitle>
                         <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="text-left">
                        <div className="text-2xl font-bold">{formatCurrency(companyData?.availableBalance)}</div>
                         <Button asChild variant="link" size="sm" className="p-0 h-auto">
                            <Link href="/account?view=wallet">Manage Wallet</Link>
                        </Button>
                    </CardContent>
                </Card>

                 {!isAssociate && !isLender && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Loyalty Status</CardTitle>
                            <Award className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="text-left">
                            <div className="text-2xl font-bold flex items-center gap-2">
                                <span className={cn("px-2 py-1 rounded-md text-base", tierColors[loyaltyTier])}>{loyaltyTier.charAt(0).toUpperCase() + loyaltyTier.slice(1)}</span>
                                <span>{companyData?.rewardPoints || 0} Points</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Earn points for community actions.</p>
                        </CardContent>
                    </Card>
                 )}
            </div>

            {/* Associate Specific Referral Card */}
            {isAssociate && (
                <Card className="border-primary bg-primary/5">
                    <CardHeader className="text-left">
                        <CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5 text-primary" /> My Tracking Node</CardTitle>
                        <CardDescription>Share your unique referral link to grow your network and earn recurring revenue.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2 items-center bg-white p-3 rounded-lg border shadow-inner">
                            <Input value={referralLink} readOnly className="font-mono text-xs border-none bg-transparent focus-visible:ring-0" />
                            <Button size="sm" onClick={copyReferral} className="gap-2 font-bold"><Copy className="h-3 w-3" /> Copy Link</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Lender Specific Control Card */}
            {isLender && !isAdmin && (
                <Card className="border-primary bg-primary/5">
                    <CardHeader className="text-left">
                        <CardTitle className="flex items-center gap-2"><Landmark className="text-primary" /> Lender Control Center</CardTitle>
                        <CardDescription>Manage your lending mandate and review inbound deal flow matching your criteria.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild size="lg">
                            <Link href="/account?view=lending-desk">Open Lending Desk <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* General Member Sections */}
            {!isAssociate && !isLender && (
                <>
                    {isFreeMember && (
                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader>
                                <div className="flex items-start gap-4 text-left">
                                    <div className="bg-primary/10 p-3 rounded-full shrink-0">
                                    <Sparkles className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <CardTitle>Unlock Your Full Potential</CardTitle>
                                        <CardDescription className="mt-1">
                                            You are currently on the Free plan. Upgrade your membership to access forensic data and publishing tools.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardFooter>
                                <Button asChild>
                                    <Link href="/pricing">
                                        Compare Plans and Upgrade <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    <div className="space-y-4 text-left">
                        <h2 className="text-2xl font-black font-headline">Strategic Funding Center</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card className="border-primary/20 bg-primary/5 shadow-md flex flex-col">
                                <CardHeader className="pb-2 text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/20 p-2 rounded-lg"><Landmark className="h-5 w-5 text-primary" /></div>
                                        <CardTitle className="text-lg font-bold">Direct In-House Funding</CardTitle>
                                    </div>
                                    <CardDescription>Apply directly to the Logistics Flow capital division.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow text-left">
                                    <p className="text-sm text-muted-foreground leading-relaxed">Use this path for prioritized, rapid decisions based on your platform activity and verified fleet profile.</p>
                                </CardContent>
                                <CardFooter className="pt-4 border-t border-primary/10">
                                    <Button asChild className="w-full font-bold h-11 shadow-lg" variant="default">
                                        <Link href="/funding">
                                            Direct Application <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>

                            <Card className="border-blue-200 bg-blue-50/30 shadow-md flex flex-col">
                                <CardHeader className="pb-2 text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-lg"><Globe className="h-5 w-5 text-blue-600" /></div>
                                        <CardTitle className="text-lg font-bold">Finance Mall Broadcast</CardTitle>
                                    </div>
                                    <CardDescription>Distribute your enquiry to our 85+ partner lenders.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow text-left">
                                    <p className="text-sm text-muted-foreground leading-relaxed">Compare the market. Your application is automatically matched with niche lenders based on your criteria.</p>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                        <Card className="shadow-sm">
                            <CardHeader className="bg-slate-50 border-b text-left">
                                <CardTitle className="flex items-center gap-2">
                                    <Landmark className="h-5 w-5 text-primary" />
                                    Issued Funding Facilities
                                </CardTitle>
                                <CardDescription>
                                    Active capital offers issued to your business.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                {isFacilitiesLoading ? <Loader2 className="animate-spin h-6 w-6 text-primary mx-auto"/> : (
                                    facilities && facilities.length > 0 ? (
                                        <div className="space-y-4">
                                            {facilities.map((f: any) => (
                                                <div key={f.id} className="flex justify-between items-center p-3 border rounded-lg bg-white shadow-sm">
                                                    <div className="text-left">
                                                        <p className="font-bold text-sm capitalize">{f.type?.replace(/_/g, ' ')}</p>
                                                        {isFreeMember && !isAdmin ? (
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <Lock className="h-3 w-3 text-amber-600"/>
                                                                <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Terms Restricted</span>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs font-mono font-bold text-primary">{formatCurrency(f.limit)}</p>
                                                        )}
                                                    </div>
                                                    <Button variant="ghost" size="sm" asChild className="text-[10px] font-black uppercase h-8 px-3">
                                                        <Link href="/account?view=my-facilities">Manage <ArrowRight className="ml-1 h-3 w-3" /></Link>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 border-2 border-dashed rounded-lg opacity-40">
                                            <p className="text-xs font-bold uppercase tracking-widest">No Facilities Issued</p>
                                        </div>
                                    )
                                )}
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <Button variant="outline" size="sm" asChild className="w-full font-bold h-9">
                                    <Link href="/account?view=my-facilities">View All Facilities</Link>
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="bg-slate-50 border-b text-left">
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5 text-primary" />
                                    My Loyalty Benefits
                                </CardTitle>
                                <CardDescription>
                                    You are on the <span className="font-semibold text-primary capitalize">{loyaltyTier}</span> tier.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                {userBenefits.length > 0 ? (
                                    <ul className="space-y-3 text-left">
                                        {userBenefits.map((benefit: any) => (
                                            <li key={benefit.name} className="flex items-center gap-3">
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                <span className="font-medium text-sm">{benefit.name}: <span className="font-bold text-primary">{benefit.value}</span></span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-muted-foreground text-sm italic">No benefits are currently configured for your tier.</p>
                                )}
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <Button variant="outline" size="sm" asChild className="w-full font-bold h-9">
                                    <Link href="/connect?view=rewards">Open Rewards Store</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="text-left">
                            <CardTitle className="flex items-center gap-2"><HeartHandshake className="text-primary" /> Help the Community & Earn Rewards</CardTitle>
                        </CardHeader>
                        <CardContent className="text-left">
                            <p className="text-muted-foreground text-sm leading-relaxed">Help the community by sharing anonymous data. Each contribution earns you reward points.</p>
                        </CardContent>
                        <CardFooter>
                            <Button asChild size="sm">
                                <Link href="/contribute">Contribute Data <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </CardFooter>
                    </Card>
                    
                    <div className="space-y-8">
                        <QuotesCard />
                        <EnquiriesCard />
                    </div>
                </>
            )}
        </div>
    );
}
