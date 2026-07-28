'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Gem, Loader2, ArrowRight, Sparkles, Wallet, ShieldAlert, Star, CheckCircle, ShieldCheck, Landmark, Globe, Zap, Link as LinkIcon, Copy, Lock, Truck, ImageIcon, ExternalLink, MousePointer2, UserPlus, Info, Gift, CheckCircle2, ShoppingBasket, PackageSearch } from "lucide-react";
import { doc, collection, query, limit, where, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { useMemo } from 'react';
import EnquiriesCard from './enquiries-card';
import QuotesCard from './quotes-card';
import { cn, formatCurrency, formatDateSafe } from '@/lib/utils';
import { useConfig } from '@/hooks/use-config';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

/**
 * MEMBER VOUCHER VAULT
 */
function VoucherVault({ isPaid }: { isPaid: boolean }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const incentivesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'configuration/communityIncentives/active'), limit(6));
    }, [firestore]);
    const { data: incentives, isLoading } = useCollection(incentivesQuery);

    if (isLoading || !incentives || incentives.length === 0) return null;

    return (
        <Card className={cn(
            "border-none shadow-2xl overflow-hidden text-left bg-white",
            !isPaid && "ring-2 ring-amber-500/10"
        )}>
            <CardHeader className="bg-slate-900 text-white p-6 text-left">
                <div className="flex justify-between items-center text-left">
                    <div className="text-left">
                        <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                            <Gift className="h-5 w-5 text-primary" />
                            Loyalty: Voucher Vault
                        </CardTitle>
                        <CardDescription className="text-slate-400">Your activated community welcome gifts.</CardDescription>
                    </div>
                    <Badge className="bg-primary text-white border-none">{incentives.length}</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0 text-left">
                <div className={cn("relative grid grid-cols-1 md:grid-cols-2 divide-x divide-y border-t", !isPaid && "max-h-[300px] overflow-hidden")}>
                    {incentives.map((inc) => (
                        <div key={inc.id} className="p-6 space-y-4 hover:bg-slate-50 transition-colors text-left">
                            <div className="space-y-1 text-left">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{inc.supplierName}</p>
                                <h4 className="text-lg font-black text-foreground leading-tight">{inc.title}</h4>
                            </div>
                            <Button 
                                className="w-full font-bold h-10 gap-2 shadow-sm" 
                                variant={isPaid ? "default" : "secondary"}
                                onClick={() => isPaid ? toast({ title: "Voucher Redeemed", description: "The supplier has been notified to establish the handshake." }) : null}
                            >
                                {isPaid ? <><CheckCircle2 className="h-4 w-4" /> Redeem Gift</> : <><Lock className="h-4 w-4" /> Operator Plan Required</>}
                            </Button>
                        </div>
                    ))}

                    {!isPaid && (
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent flex flex-col items-center justify-center p-8 text-center pt-20">
                             <div className="bg-amber-500/10 p-3 rounded-full mb-2">
                                <Lock className="h-6 w-6 text-amber-600" />
                            </div>
                            <h4 className="text-xl font-black text-foreground">Loyalty Rewards Restricted</h4>
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1 leading-relaxed text-center">
                                Active trading nodes instantly unlock over **R500 in community value**. Establish your Operator handshake today.
                            </p>
                            <Button asChild size="sm" className="mt-4 font-black uppercase text-[10px] tracking-widest h-10 px-8 shadow-xl">
                                <Link href="/checkout/standard">Activate Active Trading</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * ENGAGEMENT YIELD MODULE
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
                    <div className="text-left text-white">
                        <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                            <Search className="h-5 w-5 text-primary" />
                            Sales intelligence Ledger
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
                                <div className="flex items-center gap-3 text-left text-foreground">
                                    <div className="bg-primary/10 p-2 rounded-full text-foreground"><UserPlus className="h-4 w-4 text-primary" /></div>
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
                             <div className="bg-amber-500/10 p-3 rounded-full mb-2 text-center text-foreground">
                                <Lock className="h-6 w-6 text-amber-600" />
                            </div>
                            <h4 className="text-xl font-black text-foreground">Lead Details Restricted</h4>
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1 leading-relaxed text-center">
                                <strong>{pings.length} companies</strong> have selected your profile to engage. Upgrade to an intelligence plan to reveal their identities.
                            </p>
                            <Button asChild size="sm" className="mt-4 font-black uppercase text-[10px] tracking-widest h-10 px-8 shadow-xl">
                                <Link href="/checkout/intelligence">Unlock Discovery Leads</Link>
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

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    
    const { data: userData } = useDoc<{ companyId: string, firstName: string, declaredPosition?: string }>(userDocRef);

    const companyDocRef = useMemoFirebase(() => {
        if (!firestore || !userData?.companyId) return null;
        return doc(firestore, 'companies', userData.companyId);
    }, [firestore, userData?.companyId]);

    const { data: companyData, isLoading: isCompanyLoading } = useDoc(companyDocRef);

    const isPaidIntelligence = ['intelligence', 'standard', 'premium'].includes(companyData?.membershipId || '');
    const isPaidOperator = ['standard', 'premium'].includes(companyData?.membershipId || '');
    
    const loyaltyTier = companyData?.loyaltyTier || 'bronze';
    const tierColors: {[key: string]: string} = {
        bronze: 'bg-orange-200 text-orange-800',
        silver: 'bg-slate-200 text-slate-800',
        gold: 'bg-yellow-200 text-yellow-800',
    };

    const isAssociate = userData?.declaredPosition === 'associate' || user?.role === 'associate';

    if (isUserLoading || (user && isCompanyLoading)) {
        return <div className="flex justify-center items-center py-40 w-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    
    if (!user) return null;

    return (
        <div className="w-full space-y-8 text-left text-foreground">
            <div className="flex justify-between items-end">
                <div className="text-left text-foreground">
                    <h1 className="text-3xl md:text-4xl font-black font-headline uppercase tracking-tight">Commerce Command</h1>
                    <p className="text-lg text-muted-foreground font-medium">Welcome back, {userData?.firstName || 'Member'}!</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="font-bold">
                        <Link href="/mall"><ShoppingBasket className="mr-2 h-4 w-4 text-primary" /> Malls</Link>
                    </Button>
                    <Button asChild size="sm" className="font-bold shadow-md">
                        <Link href="/account?view=shop"><Store className="mr-2 h-4 w-4" /> My Digital Branch</Link>
                    </Button>
                </div>
            </div>

            {/* REVEAL: SALES INTELLIGENCE */}
            {userData?.companyId && (
                <EngagementYieldModule companyId={userData.companyId} isPaid={isPaidIntelligence} />
            )}

            {/* REVEAL: LOYALTY DIVIDEND */}
            <VoucherVault isPaid={isPaidOperator} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left text-foreground">
                <Card className="text-left text-foreground border-none shadow-lg bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 text-left">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Available Wallet</CardTitle>
                         <Wallet className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent className="text-left">
                        <div className="text-2xl font-black">{formatCurrency(companyData?.availableBalance)}</div>
                         <Button asChild variant="link" size="sm" className="p-0 h-auto font-bold text-primary">
                            <Link href="/account?view=wallet">Manage Payouts &rarr;</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="text-left text-foreground border-none shadow-lg bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loyalty Standing</CardTitle>
                        <Award className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent className="text-left">
                        <div className="text-2xl font-black flex items-center gap-2">
                            <Badge className={cn("capitalize border-none", tierColors[loyaltyTier])}>{loyaltyTier}</Badge>
                            <span>{companyData?.rewardPoints || 0} pts</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="text-left text-foreground border-none shadow-lg bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Membership Node</CardTitle>
                        <Gem className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent className="text-left">
                        <div className="text-2xl font-black capitalize text-primary">{companyData?.membershipId || 'Free'}</div>
                        <Button asChild variant="link" size="sm" className="p-0 h-auto font-bold text-primary">
                            <Link href="/pricing">Upgrade Tier &rarr;</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {!isAssociate && (
                <div className="space-y-8 text-left text-foreground">
                    <div className="flex items-center gap-4 text-left">
                        <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                            <PackageSearch className="h-5 w-5 text-primary" /> Active Handshakes
                        </h2>
                        <Separator className="flex-1" />
                    </div>
                    <QuotesCard />
                    <EnquiriesCard />
                </div>
            )}
        </div>
    );
}
