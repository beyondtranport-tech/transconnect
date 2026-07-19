
'use client';

import { useUser, useFirestore, useDoc } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Gem, Loader2, HeartHandshake, ArrowRight, Sparkles, Wallet, ShieldAlert, Star, CheckCircle, ShieldCheck, Landmark, Globe, Zap, Link as LinkIcon, Copy, Lock, Truck, ImageIcon, ExternalLink } from "lucide-react";
import { doc, collection, query, limit, where } from 'firebase/firestore';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import EnquiriesCard from './enquiries-card';
import QuotesCard from './quotes-card';
import { cn, formatCurrency } from '@/lib/utils';
import { useMemoFirebase, useCollection } from '@/firebase';
import { useConfig } from '@/hooks/use-config';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

/**
 * AD BILLBOARD COMPONENT
 * Renders high-impact banners targeting the current user's role.
 */
function AdBillboard({ audience }: { audience: string }) {
    const firestore = useFirestore();
    
    const billboardQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'adCampaigns'),
            where('status', '==', 'active'),
            where('format', '==', 'billboard_banner'),
            where('targetAudience', 'in', [audience, 'all']),
            limit(1)
        );
    }, [firestore, audience]);

    const { data: ads, isLoading } = useCollection(billboardQuery);

    if (isLoading || !ads || ads.length === 0) return null;

    const ad = ads[0];
    const trackUrl = `/api/trackEmailOpen/${ad.id}?source=ad_impression&campaignId=${ad.id}&advertiserId=${ad.companyId}`;
    const clickUrl = `/api/trackEmailOpen/${ad.id}?source=ad_click&campaignId=${ad.id}&advertiserId=${ad.companyId}`;

    return (
        <a href={clickUrl} target="_blank" rel="noopener noreferrer" className="block group">
            <Card className="relative overflow-hidden border-none shadow-xl bg-slate-900 h-40 md:h-48 rounded-3xl transition-transform hover:scale-[1.01] active:scale-[0.99] text-left">
                <Image src={ad.creativeUrl} alt={ad.title} fill className="object-cover opacity-60 group-hover:opacity-70 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                <div className="relative z-10 h-full flex flex-col justify-center p-8 md:p-10 space-y-2">
                    <Badge className="w-fit bg-primary text-white border-none uppercase font-black text-[9px] tracking-widest px-3 mb-2">Partner Promotion</Badge>
                    <h3 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase tracking-tight">{ad.title}</h3>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs">
                        Open Digital Branch <ArrowRight className="h-4 w-4" />
                    </div>
                </div>
                <img src={trackUrl} width="1" height="1" className="hidden" alt="" />
            </Card>
        </a>
    );
}

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
    const audience = companyData?.shopType || userData?.declaredPosition || 'all';
    
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
            <div className="flex justify-center items-center min-h-[calc(100vh-8rem)] w-full text-left">
                <Card className="m-4 w-full max-w-2xl shadow-lg border-destructive/20 text-left">
                    <CardHeader className="border-b bg-destructive/5 text-left">
                        <CardTitle className="text-destructive flex items-center gap-2 text-left">
                            <ShieldAlert className="h-5 w-5" /> Error Loading Dashboard
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 text-left">
                        <p className="font-medium text-left">There was a problem fetching your account data.</p>
                        <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded font-mono text-left">{error.message}</p>
                    </CardContent>
                    <CardFooter className="border-t pt-6 text-left">
                        <Button onClick={() => window.location.reload()}>Try Again</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="w-full space-y-8 text-left text-foreground">
            <div className="flex items-center gap-4 text-left text-foreground">
                <div className="text-left text-foreground">
                    <h1 className="text-3xl md:text-4xl font-bold font-headline text-left">Dashboard</h1>
                    <p className="text-lg text-muted-foreground text-left">Welcome back, {userData?.firstName || 'Member'}!</p>
                </div>
            </div>

            {/* AD BILLBOARD SLOT */}
            <AdBillboard audience={audience} />

            {isAdmin && (
                 <Card className="border-primary bg-primary/5 text-left text-foreground">
                    <CardHeader className="text-left">
                        <div className="flex items-center gap-4 text-left">
                            <ShieldCheck className="h-10 w-10 text-primary" />
                            <div className="text-left text-foreground">
                                <CardTitle className="text-2xl text-left">Administrator Account</CardTitle>
                                <CardDescription className="text-primary/90 text-left">You are currently viewing the standard member dashboard.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="text-left text-foreground">
                        <p className="text-lg leading-relaxed text-left">
                           All administrative functions are located in the secure <span className="font-semibold text-primary">Admin Portal</span>.
                        </p>
                    </CardContent>
                    <CardFooter className="text-left">
                        <Button variant="default" size="lg" asChild className="text-white">
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
                        <CardHeader className="flex flex-row items-center justify-between pb-2 text-left">
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
                                <p className="text-xs text-muted-foreground text-left">You have a premium membership.</p>
                            )}
                        </CardContent>
                    </Card>
                 )}
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 text-left">
                        <CardTitle className="text-sm font-medium">Available to Spend</CardTitle>
                         <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="text-left text-foreground">
                        <div className="text-2xl font-bold text-left">{formatCurrency(companyData?.availableBalance)}</div>
                         <Button asChild variant="link" size="sm" className="p-0 h-auto">
                            <Link href="/account?view=wallet">Manage Wallet</Link>
                        </Button>
                    </CardContent>
                </Card>

                 {!isAssociate && !isLender && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 text-left">
                            <CardTitle className="text-sm font-medium">Loyalty Status</CardTitle>
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
                 )}
            </div>

            {/* Associate Specific Referral Card */}
            {isAssociate && (
                <Card className="border-primary bg-primary/5 text-left text-foreground">
                    <CardHeader className="text-left text-foreground">
                        <CardTitle className="flex items-center gap-2 text-left"><LinkIcon className="h-5 w-5 text-primary" /> My Tracking Node</CardTitle>
                        <CardDescription className="text-left">Share your unique referral link to grow your network and earn recurring revenue.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-left text-foreground">
                        <div className="flex gap-2 items-center bg-white p-3 rounded-lg border shadow-inner text-left">
                            <Input value={referralLink} readOnly className="font-mono text-xs border-none bg-transparent focus-visible:ring-0 text-left" />
                            <Button size="sm" onClick={copyReferral} className="gap-2 font-bold text-white"><Copy className="h-3 w-3" /> Copy Link</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Lender Specific Control Card */}
            {isLender && !isAdmin && (
                <Card className="border-primary bg-primary/5 text-left text-foreground">
                    <CardHeader className="text-left text-foreground">
                        <CardTitle className="flex items-center gap-2 text-left"><Landmark className="text-primary" /> Lender Control Center</CardTitle>
                        <CardDescription className="text-left text-foreground">Manage your lending mandate and review inbound deal flow matching your criteria.</CardDescription>
                    </CardHeader>
                    <CardFooter className="text-left">
                        <Button asChild size="lg" className="text-white">
                            <Link href="/account?view=lending-desk">Open Lending Desk <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* General Member Sections */}
            {!isAssociate && !isLender && (
                <>
                    {isFreeMember && (
                        <Card className="bg-primary/5 border-primary/20 text-left text-foreground">
                            <CardHeader className="text-left text-foreground text-left">
                                <div className="flex items-start gap-4 text-left text-foreground">
                                    <div className="bg-primary/10 p-3 rounded-full shrink-0">
                                    <Sparkles className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <CardTitle className="text-left text-foreground">Unlock Your Full Potential</CardTitle>
                                        <CardDescription className="mt-1 text-left text-foreground">
                                            You are currently on the Free plan. Upgrade your membership to access forensic data and publishing tools.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardFooter className="text-left">
                                <Button asChild className="text-white">
                                    <Link href="/pricing">
                                        Compare Plans and Upgrade <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    <div className="space-y-4 text-left text-foreground">
                        <h2 className="text-2xl font-black font-headline text-left">Strategic Funding Center</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-foreground">
                            <Card className="border-primary/20 bg-primary/5 shadow-md flex flex-col text-left text-foreground">
                                <CardHeader className="pb-2 text-left text-foreground">
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="bg-primary/20 p-2 rounded-lg"><Landmark className="h-5 w-5 text-primary" /></div>
                                        <CardTitle className="text-lg font-bold text-left">Direct In-House Funding</CardTitle>
                                    </div>
                                    <CardDescription className="text-left">Apply directly to the Logistics Flow capital division.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow text-left text-foreground">
                                    <p className="text-sm text-muted-foreground leading-relaxed text-left">Use this path for prioritized, BFIs rapid decisions based on your platform activity and verified fleet profile.</p>
                                </CardContent>
                                <CardFooter className="pt-4 border-t border-primary/10 text-left">
                                    <Button asChild className="w-full font-bold h-11 shadow-lg text-white" variant="default">
                                        <Link href="/funding">
                                            Direct Application <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>

                            <Card className="border-blue-200 bg-blue-50/30 shadow-md flex flex-col text-left text-foreground">
                                <CardHeader className="pb-2 text-left text-foreground">
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="bg-blue-100 p-2 rounded-lg"><Globe className="h-5 w-5 text-blue-600" /></div>
                                        <CardTitle className="text-lg font-bold text-left">Finance Mall Broadcast</CardTitle>
                                    </div>
                                    <CardDescription className="text-left">Distribute your enquiry to our 85+ partner lenders.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow text-left text-foreground">
                                    <p className="text-sm text-muted-foreground leading-relaxed text-left">Compare the market. Your application is automatically matched with niche lenders based on your criteria.</p>
                                </CardContent>
                                <CardFooter className="pt-4 border-t border-blue-100 text-left">
                                    <Button asChild className="w-full font-bold h-11" variant="outline">
                                        <Link href="/funding/apply?origination=market">
                                            Market Broadcast <Zap className="ml-2 h-4 w-4 text-blue-600" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-foreground">
                        <Card className="shadow-sm text-left text-foreground">
                            <CardHeader className="bg-slate-50 border-b text-left text-foreground">
                                <CardTitle className="flex items-center gap-2 text-left">
                                    <Landmark className="h-5 w-5 text-primary" />
                                    Issued Funding Facilities
                                </CardTitle>
                                <CardDescription className="text-left">
                                    Active capital offers issued to your business.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 text-left">
                                {isFacilitiesLoading ? <Loader2 className="animate-spin h-6 w-6 text-primary mx-auto"/> : (
                                    facilities && facilities.length > 0 ? (
                                        <div className="space-y-4 text-left">
                                            {facilities.map((f: any) => (
                                                <div key={f.id} className="flex justify-between items-center p-3 border rounded-lg bg-white shadow-sm text-left">
                                                    <div className="text-left text-foreground">
                                                        <p className="font-bold text-sm capitalize text-left">{f.type?.replace(/_/g, ' ')}</p>
                                                        {isFreeMember && !isAdmin ? (
                                                            <div className="flex items-center gap-1.5 mt-1 text-left">
                                                                <Lock className="h-3 w-3 text-amber-600"/>
                                                                <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest text-left">Terms Restricted</span>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs font-mono font-bold text-primary text-left">{formatCurrency(f.limit)}</p>
                                                        )}
                                                    </div>
                                                    <Button variant="ghost" size="icon" asChild className="text-[10px] font-black uppercase h-8 px-3 text-left">
                                                        <Link href="/account?view=my-facilities">Manage <ArrowRight className="ml-1 h-3 w-3" /></Link>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 border-2 border-dashed rounded-lg opacity-40">
                                            <p className="text-xs font-bold uppercase tracking-widest text-center">No Facilities Issued</p>
                                        </div>
                                    )
                                )}
                            </CardContent>
                            <CardFooter className="border-t pt-4 text-left">
                                <Button variant="outline" size="sm" asChild className="w-full font-bold h-9 text-left">
                                    <Link href="/account?view=my-facilities">View All Facilities</Link>
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card className="shadow-sm text-left text-foreground">
                            <CardHeader className="bg-slate-50 border-b text-left text-foreground">
                                <CardTitle className="flex items-center gap-2 text-left">
                                    <Award className="h-5 w-5 text-primary" />
                                    My Loyalty Benefits
                                </CardTitle>
                                <CardDescription className="text-left text-foreground">
                                    You are on the <span className="font-semibold text-primary capitalize">{loyaltyTier}</span> tier.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 text-left">
                                {userBenefits.length > 0 ? (
                                    <ul className="space-y-3 text-left text-foreground">
                                        {userBenefits.map((benefit: any) => (
                                            <li key={benefit.name} className="flex items-center gap-3 text-left">
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                <span className="font-medium text-sm text-left">{benefit.name}: <span className="font-bold text-primary">{benefit.value}</span></span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-muted-foreground text-sm italic text-center">No benefits are currently configured for your tier.</p>
                                )}
                            </CardContent>
                            <CardFooter className="border-t pt-4 text-left">
                                <Button variant="outline" size="sm" asChild className="w-full font-bold h-9">
                                    <Link href="/connect?view=rewards">Open Rewards Store</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    <Card className="bg-primary/5 border-primary/20 text-left text-foreground">
                        <CardHeader className="text-left text-foreground text-left text-foreground">
                            <CardTitle className="flex items-center gap-2 text-left text-foreground"><HeartHandshake className="text-primary text-left text-foreground" /> Help the Community & Earn Rewards</CardTitle>
                        </CardHeader>
                        <CardContent className="text-left text-foreground text-foreground">
                            <p className="text-muted-foreground text-sm leading-relaxed text-left text-foreground text-foreground">Help the community by sharing anonymous data. Each contribution earns you reward points.</p>
                        </CardContent>
                        <CardFooter className="text-left text-foreground">
                            <Button asChild size="sm" className="text-white text-foreground">
                                <Link href="/contribute">Contribute Data <ArrowRight className="ml-2 h-4 w-4 text-foreground" /></Link>
                            </Button>
                        </CardFooter>
                    </Card>
                    
                    <div className="space-y-8 text-left text-foreground text-foreground">
                        <QuotesCard />
                        <EnquiriesCard />
                    </div>
                </>
            )}
        </div>
    );
}
