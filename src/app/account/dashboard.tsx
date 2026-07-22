
'use client';

import { useUser, useFirestore, useDoc } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Gem, Loader2, HeartHandshake, ArrowRight, Sparkles, Wallet, ShieldAlert, Star, CheckCircle, ShieldCheck, Landmark, Globe, Zap, Link as LinkIcon, Copy, Lock, Truck, ImageIcon, ExternalLink, MousePointer2, UserPlus, Info } from "lucide-react";
import { doc, collection, query, limit, where, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import EnquiriesCard from './enquiries-card';
import QuotesCard from './quotes-card';
import { cn, formatCurrency, formatDateSafe } from '@/lib/utils';
import { useMemoFirebase, useCollection } from '@/firebase';
import { useConfig } from '@/hooks/use-config';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

/**
 * AD BILLBOARD COMPONENT
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
            </Card>
        </a>
    );
}

/**
 * ENGAGEMENT YIELD MODULE
 * Conversion trigger for target members.
 */
function EngagementYieldModule({ companyId, isPaid }: { companyId: string, isPaid: boolean }) {
    const firestore = useFirestore();
    
    const pingsQuery = useMemoFirebase(() => {
        if (!firestore || !companyId) return null;
        return query(
            collection(firestore, 'engagementPings'),
            where('targetId', '==', companyId),
            orderBy('timestamp', 'desc'),
            limit(20)
        );
    }, [firestore, companyId]);

    const { data: pings, isLoading } = useCollection(pingsQuery);

    if (isLoading || !pings || pings.length === 0) return null;

    return (
        <Card className={cn(
            "border-none shadow-2xl overflow-hidden text-left bg-white",
            !isPaid && "ring-2 ring-amber-500/20"
        )}>
            <CardHeader className="bg-slate-900 text-white p-6">
                <div className="flex justify-between items-center">
                    <div className="text-left">
                        <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            Engagement Yield Audit
                        </CardTitle>
                        <CardDescription className="text-slate-400">High-intent traffic recorded on your digital node.</CardDescription>
                    </div>
                    <Badge className="bg-primary text-white border-none">{pings.length}</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className={cn("relative", !isPaid && "max-h-[250px] overflow-hidden")}>
                    <div className="divide-y text-left">
                        {pings.map((ping) => (
                            <div key={ping.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-full"><UserPlus className="h-4 w-4 text-primary" /></div>
                                    <div className="text-left">
                                        <p className={cn("text-sm font-bold", !isPaid && "blur-sm select-none")}>
                                            {isPaid ? ping.engagerName : "Forensic Lead Hidden"}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{formatDateSafe(ping.timestamp, "dd MMM, HH:mm")}</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[9px] uppercase font-black">Engagement</Badge>
                            </div>
                        ))}
                    </div>

                    {!isPaid && (
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent flex flex-col items-center justify-center p-8 text-center pt-20">
                             <div className="bg-amber-500/10 p-3 rounded-full mb-2">
                                <Lock className="h-6 w-6 text-amber-600" />
                            </div>
                            <h4 className="text-xl font-black text-foreground">Sales Leads Restricted</h4>
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1 leading-relaxed">
                                <strong>{pings.length} companies</strong> have engaged with your profile. Upgrade to Intelligence Access to reveal their identities and initiate the handshake.
                            </p>
                            <Button asChild size="sm" className="mt-4 font-black uppercase text-[10px] tracking-widest h-10 px-8 shadow-xl">
                                <Link href="/checkout/intelligence">Unlock Leads Now</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
            {isPaid && (
                <CardFooter className="bg-slate-50 border-t p-4 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mx-auto">Lead recording is live and verified.</p>
                </CardFooter>
            )}
        </Card>
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
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studio--ecosystem-hub.us-central1.hosted.app';
        return `${baseUrl}/join?ref=${userData?.companyId || 'SYSTEM'}`;
    }, [userData?.companyId]);

    const copyReferral = () => {
        navigator.clipboard.writeText(referralLink);
        toast({ title: "Referral Link Copied!" });
    };

    if (isUserLoading || (user && (isCompanyLoading || isSettingsLoading))) {
        return (
            <div className="flex justify-center items-center py-40 w-full text-left">
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

            <AdBillboard audience={audience} />

            {/* ENGAGEMENT PINGS MODULE */}
            {userData?.companyId && (
                <EngagementYieldModule companyId={userData.companyId} isPaid={!isFreeMember} />
            )}

            {isAdmin && (
                 <Card className="border-primary bg-primary/5 text-left text-foreground">
                    <CardHeader className="text-left">
                        <div className="flex items-center gap-4 text-left text-foreground">
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
                        <Button variant="default" size="lg" asChild className="text-white text-foreground text-left">
                            <Link href="/adminaccount">
                                Go to Admin Portal <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            )}

            <div className={cn(
                "grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-foreground",
                !isAssociate && !isLender && "lg:grid-cols-3"
            )}>
                 {!isAssociate && !isLender && (
                    <Card className="text-left text-foreground">
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
                
                <Card className="text-left text-foreground">
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
                    <Card className="text-left text-foreground">
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

            {!isAssociate && !isLender && (
                <>
                    <div className="space-y-4 text-left text-foreground">
                        <h2 className="text-2xl font-black font-headline text-left">Strategic Funding Center</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-foreground">
                            <Card className="border-primary/20 bg-primary/5 shadow-md flex flex-col text-left text-foreground">
                                <CardHeader className="pb-2 text-left text-foreground">
                                    <div className="flex items-center gap-3 text-left text-foreground">
                                        <div className="bg-primary/20 p-2 rounded-lg"><Landmark className="h-5 w-5 text-primary" /></div>
                                        <CardTitle className="text-lg font-bold text-left">Direct In-House Funding</CardTitle>
                                    </div>
                                    <CardDescription className="text-left">Apply directly to the Logistics Flow capital division.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow text-left text-foreground">
                                    <p className="text-sm text-muted-foreground leading-relaxed text-left">Use this path for prioritized decisions based on your verified fleet profile.</p>
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
                                    <p className="text-sm text-muted-foreground leading-relaxed text-left">Compare the market. Your application is automatically matched with niche lenders.</p>
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
                    
                    <div className="space-y-8 text-left text-foreground">
                        <QuotesCard />
                        <EnquiriesCard />
                    </div>
                </>
            )}
        </div>
    );
}
