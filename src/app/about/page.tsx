'use client';

import Image from "next/image";
import data from "@/lib/placeholder-images.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Store, Rocket, Handshake, Users, ShieldCheck, Database, Zap, Target, TrendingUp, Gift, Sparkles, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import { useUser } from "@/firebase";

const { placeholderImages } = data;
const aboutHeroImage = placeholderImages.find(p => p.id === 'about-hero');

export default function AboutPage() {
  const { user } = useUser();
  const ctaLink = user ? '/account?view=shop' : '/join?role=vendor';

  return (
    <div className="bg-background text-left">
        {/* HERO SECTION */}
        <section className="relative w-full h-64 md:h-96 bg-slate-950">
            {aboutHeroImage && (
                <Image
                    src={aboutHeroImage.imageUrl}
                    alt={aboutHeroImage.description}
                    fill
                    className="object-cover opacity-40"
                    priority
                    data-ai-hint="industrial logistics"
                />
            )}
            <div className="relative h-full flex flex-col items-center justify-center text-center text-white z-10 p-4">
                <Badge className="bg-primary/20 text-primary border-primary/30 mb-6 py-1.5 px-6 font-black uppercase tracking-widest text-[10px]">Ecosystem Mission</Badge>
                <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight">Breaking the Information Constraint</h1>
                <p className="mt-4 text-lg md:text-xl max-w-3xl text-slate-300">Logistics Flow is a Data-as-a-Service infrastructure built to map, optimize, and fund the South African transport grid.</p>
            </div>
        </section>

        {/* THE INTELLIGENCE MECHANISM */}
        <section className="py-24 bg-white border-b">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6 text-left">
                        <div className="bg-primary/10 p-4 rounded-2xl w-fit shadow-inner"><Zap className="h-10 w-10 text-primary"/></div>
                        <h3 className="text-4xl font-black font-headline text-foreground leading-tight">The Intelligence Mechanism</h3>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            We don't just list your business; we actively monitor market demand. Our proprietary <strong>Inbound Interest Ledger</strong> records every time a verified decision-maker selects your profile to engage.
                        </p>
                        <div className="space-y-4">
                            <div className="flex gap-4 items-start">
                                <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div className="text-left">
                                    <p className="font-bold text-foreground">High-Intent Signal Tracking</p>
                                    <p className="text-sm text-muted-foreground">Identify exactly which companies are seeking your capacity or products before they even call you.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div className="text-left">
                                    <p className="font-bold text-foreground">Forensic Lead Capture</p>
                                    <p className="text-sm text-muted-foreground">Unlock "Blind Leads" waiting on your dashboard through our Intelligence Access tier.</p>
                                </div>
                            </div>
                        </div>
                        <Button asChild size="lg" className="mt-6 font-black uppercase tracking-widest h-14 px-10 shadow-xl">
                            <Link href={ctaLink}>Activate Your Sales Node <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </div>
                    <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl border-8 border-slate-50">
                         <Image
                            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000"
                            alt="Data Analytics"
                            fill
                            className="object-cover"
                            data-ai-hint="data visualization"
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* THE DIGITAL BRANCH (SHOP) */}
        <section className="py-24 bg-slate-50 border-b">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="md:order-2 space-y-6 text-left">
                        <div className="bg-primary/10 p-4 rounded-2xl w-fit shadow-inner"><Store className="h-10 w-10 text-primary"/></div>
                        <h3 className="text-4xl font-black font-headline text-foreground leading-tight">Your Digital Branch</h3>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Bypass generic marketplaces. Establish a high-fidelity digital branch mapped directly to the industrial grid. Your node is the engine that powers your presence in our specialized malls.
                        </p>
                        <div className="grid grid-cols-1 gap-4 text-left">
                             <Card className="border-none shadow-sm bg-white">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <Building className="h-6 w-6 text-primary shrink-0" />
                                    <p className="text-sm font-bold">List fleet capacity, pallet positions, or technical spares catalogues.</p>
                                </CardContent>
                             </Card>
                             <Card className="border-none shadow-sm bg-white">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <Handshake className="h-6 w-6 text-primary shrink-0" />
                                    <p className="text-sm font-bold">Standardized handshake tools including OTPs and automated invoicing.</p>
                                </CardContent>
                             </Card>
                        </div>
                    </div>
                    <div className="md:order-1 relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                        <Image
                            src={placeholderImages.find(p => p.id === 'mall-division')!.imageUrl}
                            alt="Digital Branch"
                            fill
                            className="object-cover"
                            data-ai-hint="warehouse interior"
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* DATA AS CURRENCY (REWARDS) */}
        <section className="py-24 bg-white border-b">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6 text-left">
                        <div className="bg-amber-100 p-4 rounded-2xl w-fit shadow-inner"><Gift className="h-10 w-10 text-amber-600"/></div>
                        <h3 className="text-4xl font-black font-headline text-foreground leading-tight">Data as a Currency</h3>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Information is the oxygen of industrial growth. We incentivize members to contribute to the "Registry of Truth" by awarding reward points for verified data uploads.
                        </p>
                        <div className="space-y-4">
                            <p className="text-sm font-black uppercase text-primary tracking-widest border-l-4 border-primary pl-4">Earn Points For:</p>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-bold text-slate-700">
                                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500"/> RC1 Fleet Details</li>
                                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500"/> Supplier Mapping</li>
                                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500"/> Trade References</li>
                                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500"/> Data Vouching</li>
                            </ul>
                        </div>
                        <p className="text-xs text-muted-foreground italic bg-slate-50 p-4 rounded-lg border-2 border-dashed">
                            Reward points can be applied directly to reduce the cost of Intelligence Access and specialized node subscriptions.
                        </p>
                    </div>
                    <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-100">
                        <Image
                            src={placeholderImages.find(p => p.id === 'incentives-hero')!.imageUrl}
                            alt="Rewards Engine"
                            fill
                            className="object-cover"
                            data-ai-hint="earning points"
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* PASSIVE REVENUE (ISA PATHWAY) */}
        <section className="py-24 bg-slate-950 text-white overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="lg:order-2 space-y-8 text-left">
                        <div className="bg-primary/20 p-4 rounded-2xl w-fit shadow-inner border border-primary/20"><TrendingUp className="h-10 w-10 text-primary"/></div>
                        <h3 className="text-4xl md:text-5xl font-black font-headline text-white leading-tight">Passive Revenue & The ISA Pathway</h3>
                        <p className="text-xl text-slate-300 leading-relaxed">
                            Your industry network is your most valuable digital asset. Our <strong>Independent Sales Agent (ISA)</strong> program allows you to monetize your influence by digitalizing your existing contacts.
                        </p>
                        <div className="space-y-6">
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-primary transition-colors text-left">
                                <p className="font-black text-primary uppercase tracking-widest text-xs mb-2">Residual Annuity</p>
                                <p className="text-sm text-slate-400">Earn a recurring percentage share of every membership fee and transaction commission generated by your referred node network.</p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-primary transition-colors text-left">
                                <p className="font-black text-primary uppercase tracking-widest text-xs mb-2">AI Marketing Studio</p>
                                <p className="text-sm text-slate-400">Get the keys to our 4K video and image generators. Produce professional marketing assets to recruit members with zero overhead.</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg:order-1 relative">
                        <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-50 animate-pulse" />
                        <Card className="relative z-10 bg-slate-900 border-white/10 shadow-2xl p-10 overflow-hidden text-left">
                            <Sparkles className="absolute -top-6 -right-6 h-32 w-32 text-primary/5" />
                            <CardHeader className="p-0 mb-8 text-left text-white">
                                <CardTitle className="text-3xl font-black text-white text-left">Monetize Your Influence</CardTitle>
                                <CardDescription className="text-slate-400 text-lg mt-2 text-left">Turn industry connections into a perpetual yield engine.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 space-y-6">
                                <ul className="space-y-4">
                                    {["Residual Membership Splits", "Transactional Mall Commissions", "Marketplace Product Revenue", "Performance Tier Bonuses"].map(f => (
                                        <li key={f} className="flex items-center gap-3 text-lg font-bold text-slate-100">
                                            <CheckCircle className="h-6 w-6 text-primary fill-primary" /> {f}
                                        </li>
                                    ))}
                                </ul>
                                <Button asChild size="lg" className="w-full h-16 text-lg font-black uppercase tracking-tight shadow-xl shadow-primary/20 mt-6">
                                    <Link href="/join?role=associate">Apply for ISA Authorization</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </section>

        {/* SUMMARY SECTION */}
        <section className="py-24 bg-white text-center">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl font-black font-headline text-foreground">The Earning Pathway</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Our most successful members don't just use the data—they help build the registry and get paid in return.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <Card className="bg-slate-50 border-none shadow-lg text-left group hover:bg-primary transition-colors">
                        <CardHeader>
                            <Database className="h-8 w-8 text-primary mb-2 group-hover:text-white" />
                            <CardTitle className="group-hover:text-white">Data as an Asset</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground group-hover:text-white/80">Contribute your verified fleet or supplier data to earn reward points and de-risk your business for funders.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50 border-none shadow-lg text-left group hover:bg-primary transition-colors">
                        <CardHeader>
                            <Target className="h-8 w-8 text-primary mb-2 group-hover:text-white" />
                            <CardTitle className="group-hover:text-white">High-Intent Matches</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground group-hover:text-white/80">We match your specific fleet capabilities with incoming freight requirements in the Loads Mall.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50 border-none shadow-lg text-left group hover:bg-primary transition-colors">
                        <CardHeader>
                            <ShieldCheck className="h-8 w-8 text-primary mb-2 group-hover:text-white" />
                            <CardTitle className="group-hover:text-white">Trusted Handshake</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground group-hover:text-white/80">We verify identities to ensure you're transacting with real business owners, not middlemen.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>{children}</span>
}

