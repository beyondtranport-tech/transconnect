'use client';

import Image from "next/image";
import data from "@/lib/placeholder-images.json";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  ArrowRight, 
  Fingerprint, 
  Database, 
  Zap, 
  Scale, 
  ShieldCheck, 
  Globe, 
  Banknote, 
  Landmark, 
  Store, 
  Handshake, 
  Award, 
  Activity, 
  Sparkles, 
  Search, 
  Target,
  UserCheck,
  FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import React from "react";
import { useUser } from "@/firebase";

const { placeholderImages } = data;
const aboutHeroImage = placeholderImages.find(p => p.id === 'about-hero');

export default function AboutPage() {
  const { user } = useUser();
  const ctaLink = user ? '/account' : '/join';

  return (
    <div className="bg-background text-left text-foreground">
        {/* HERO SECTION */}
        <section className="relative w-full h-64 md:h-96 bg-slate-950 text-white">
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
                <Badge className="bg-primary/20 text-primary border-primary/30 mb-6 py-1.5 px-6 font-black uppercase tracking-widest text-[10px]">Industrial Infrastructure</Badge>
                <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight text-center text-white uppercase">Data Foundation. Transactional Engine.</h1>
                <p className="mt-4 text-lg md:text-xl max-w-3xl text-slate-300 text-center text-white">Logistics Flow is a Data-as-a-Service ecosystem built to map, optimize, and fund the South African transport grid.</p>
            </div>
        </section>

        {/* SECTION 1: THE INTELLIGENCE MECHANISM */}
        <section className="py-24 bg-white border-b">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6 text-left">
                        <div className="bg-primary/10 p-4 rounded-2xl w-fit shadow-inner text-left"><Activity className="h-10 w-10 text-primary"/></div>
                        <h3 className="text-4xl font-black font-headline text-foreground leading-tight text-left uppercase">The Intelligence Mechanism</h3>
                        <p className="text-lg text-muted-foreground leading-relaxed text-left text-foreground">
                            We don't just list your business; we actively monitor market demand. Our proprietary **Inbound Interest Ledger** records every time a verified decision-maker selects your profile to engage.
                        </p>
                        <div className="space-y-6 text-left text-foreground">
                            <div className="flex gap-4 items-start text-left text-foreground">
                                <Target className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div className="text-left text-foreground">
                                    <p className="font-bold text-foreground">High-Intent Signal Tracking</p>
                                    <p className="text-sm text-muted-foreground text-left text-foreground">Identify exactly which companies are seeking your capacity or products before they even call you.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start text-left text-foreground">
                                <Search className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div className="text-left text-foreground">
                                    <p className="font-bold text-foreground">Forensic Lead Capture</p>
                                    <p className="text-sm text-muted-foreground text-left text-foreground">Unlock "Blind Leads" waiting on your dashboard through our Intelligence Access tier.</p>
                                </div>
                            </div>
                        </div>
                        <Button asChild className="h-12 px-8 font-black uppercase text-xs tracking-widest text-white">
                            <Link href={ctaLink}>Activate Your Sales Node</Link>
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

        {/* SECTION 2: THE DIGITAL BRANCH */}
        <section className="py-24 bg-slate-950 text-white border-b">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="md:order-2 space-y-6 text-left">
                        <div className="bg-primary/10 p-4 rounded-2xl w-fit shadow-inner text-left"><Store className="h-10 w-10 text-primary"/></div>
                        <h3 className="text-4xl font-black font-headline text-white leading-tight text-left uppercase">Your Digital Branch</h3>
                        <p className="text-lg text-slate-300 leading-relaxed text-left text-white">
                            Bypass generic marketplaces. Establish a high-fidelity digital branch mapped directly to the industrial grid. Your node is the engine that powers your presence in our specialized malls.
                        </p>
                        <div className="space-y-6 text-left text-white">
                            <div className="flex gap-4 items-start text-left text-white">
                                <Database className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div className="text-left text-white text-white">
                                    <p className="font-bold text-white uppercase text-xs tracking-widest">List fleet capacity, pallet positions, or technical spares catalogues.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start text-left text-white text-white">
                                <FileCheck className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div className="text-left text-white text-white">
                                    <p className="font-bold text-white uppercase text-xs tracking-widest">Standardized handshake tools including OTPs and automated invoicing.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="md:order-1 relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                        <Image
                            src={placeholderImages.find(p => p.id === 'mall-division')!.imageUrl}
                            alt="Digital Engine"
                            fill
                            className="object-cover"
                            data-ai-hint="futuristic logistics"
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* SECTION 3: DATA AS A CURRENCY */}
        <section className="py-24 bg-white border-b">
            <div className="container mx-auto px-4 text-left">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6 text-left">
                        <div className="bg-primary/10 p-4 rounded-2xl w-fit shadow-inner text-left"><Award className="h-10 w-10 text-primary"/></div>
                        <h3 className="text-4xl font-black font-headline text-foreground leading-tight text-left uppercase">Data as a Currency</h3>
                        <p className="text-lg text-muted-foreground leading-relaxed text-left text-foreground">
                            Information is the oxygen of industrial growth. We incentivize members to contribute to the "Registry of Truth" by awarding reward points for verified data uploads.
                        </p>
                        <div className="p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed space-y-6">
                            <p className="font-black uppercase text-xs tracking-[0.2em] text-primary">Earn Points For:</p>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                <div className="flex items-center gap-2 font-bold text-sm"><CheckCircle className="h-4 w-4 text-primary"/> RC1 Fleet Details</div>
                                <div className="flex items-center gap-2 font-bold text-sm"><CheckCircle className="h-4 w-4 text-primary"/> Supplier Mapping</div>
                                <div className="flex items-center gap-2 font-bold text-sm"><CheckCircle className="h-4 w-4 text-primary"/> Trade References</div>
                                <div className="flex items-center gap-2 font-bold text-sm"><CheckCircle className="h-4 w-4 text-primary"/> Data Vouching</div>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground italic">
                            Reward points can be applied directly to reduce the cost of Intelligence Access and specialized node subscriptions.
                        </p>
                        <Button asChild variant="outline" className="h-12 px-8 font-black uppercase text-xs tracking-widest border-2">
                            <Link href="/contribute">Enter Rewards Engine</Link>
                        </Button>
                    </div>
                    <div className="relative aspect-square max-w-sm mx-auto">
                        <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
                        <div className="relative z-10 bg-white p-12 rounded-full shadow-2xl border flex items-center justify-center">
                             <Star className="h-24 w-24 text-primary fill-primary" />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* SECTION 4: PASSIVE REVENUE & ISA PATHWAY */}
        <section className="py-24 bg-slate-950 text-white border-b">
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6 text-left text-white">
                        <div className="bg-primary/10 p-3 rounded-2xl w-fit"><Zap className="h-10 w-10 text-primary fill-current" /></div>
                        <h2 className="text-4xl font-black font-headline text-white leading-tight text-left uppercase">Passive Revenue & The ISA Pathway</h2>
                        <p className="text-lg text-slate-300 leading-relaxed text-left">
                            Your industry network is your most valuable digital asset. Our Independent Sales Agent (ISA) program allows you to monetize your influence by digitalizing your existing contacts.
                        </p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                                <div className="flex items-center gap-2"><Banknote className="h-5 w-5 text-primary" /> <p className="font-bold text-sm">Residual Annuity</p></div>
                                <p className="text-xs text-slate-400 leading-relaxed">Earn a recurring percentage share of every membership fee and transaction commission generated by your referred node network.</p>
                            </div>
                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                                <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> <p className="font-bold text-sm">AI Marketing Studio</p></div>
                                <p className="text-xs text-slate-400 leading-relaxed">Get the keys to our 4K video and image generators. Produce professional marketing assets to recruit members with zero overhead.</p>
                            </div>
                        </div>
                        <div className="pt-4 space-y-4">
                            <p className="font-black uppercase text-[10px] tracking-widest text-primary">Turn industry connections into a perpetual yield engine.</p>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="border-white/20 text-white text-[9px] uppercase font-bold">Residual Membership Splits</Badge>
                                <Badge variant="outline" className="border-white/20 text-white text-[9px] uppercase font-bold">Transactional Mall Commissions</Badge>
                                <Badge variant="outline" className="border-white/20 text-white text-[9px] uppercase font-bold">Performance Tier Bonuses</Badge>
                            </div>
                        </div>
                        <Button asChild className="h-12 px-8 font-black uppercase text-xs tracking-widest text-white shadow-xl" variant="default">
                            <Link href="/incentives">Apply for ISA Authorization</Link>
                        </Button>
                    </div>
                    <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white/5">
                        <Image
                            src={placeholderImages.find(p => p.id === 'tech-home')!.imageUrl}
                            alt="ISA Engine"
                            fill
                            className="object-cover opacity-60"
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* SECTION 5: THE EARNING PATHWAY */}
        <section className="py-24 bg-white text-center">
            <div className="container mx-auto px-4 text-left">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <h2 className="text-4xl font-black font-headline text-foreground text-center uppercase">The Earning Pathway</h2>
                    <p className="text-lg text-muted-foreground text-center">
                        Our most successful members don't just use the data—they help build the registry and get paid in return.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 text-left text-foreground">
                    <Card className="bg-slate-50 border-none shadow-lg group hover:bg-primary transition-colors text-left text-foreground">
                        <CardContent className="p-8 space-y-4 text-left text-foreground text-foreground">
                            <Database className="h-10 w-10 text-primary group-hover:text-white" />
                            <h3 className="text-xl font-bold group-hover:text-white text-left uppercase tracking-tight">Data as an Asset</h3>
                            <p className="text-sm text-muted-foreground group-hover:text-white/80 leading-relaxed text-left text-foreground">Contribute your verified fleet or supplier data to earn reward points and de-risk your business for funders.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50 border-none shadow-lg group hover:bg-primary transition-colors text-left text-foreground text-foreground">
                        <CardContent className="p-8 space-y-4 text-left text-foreground text-foreground">
                            <Zap className="h-10 w-10 text-primary group-hover:text-white fill-current" />
                            <h3 className="text-xl font-bold group-hover:text-white text-left text-foreground uppercase tracking-tight">High-Intent Matches</h3>
                            <p className="text-sm text-muted-foreground group-hover:text-white/80 leading-relaxed text-left text-foreground">We match your specific fleet capabilities with incoming freight requirements in the Loads Mall.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50 border-none shadow-lg group hover:bg-primary transition-colors text-left text-foreground text-foreground">
                        <CardContent className="p-8 space-y-4 text-left text-foreground text-foreground">
                            <UserCheck className="h-10 w-10 text-primary group-hover:text-white" />
                            <h3 className="text-xl font-bold group-hover:text-white text-left text-foreground uppercase tracking-tight">Trusted Handshake</h3>
                            <p className="text-sm text-muted-foreground group-hover:text-white/80 leading-relaxed text-left text-foreground">We verify identities to ensure you're transacting with real business owners, not middlemen.</p>
                        </CardContent>
                    </Card>
                </div>
                <div className="mt-16 text-center">
                    <Button asChild size="lg" className="h-16 px-12 text-lg font-black uppercase tracking-tight shadow-xl text-white">
                        <Link href={ctaLink}>Establish My Digital standing <ArrowRight className="ml-2 h-5 w-5"/></Link>
                    </Button>
                </div>
            </div>
        </section>
    </div>
  );
}
