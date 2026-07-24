
'use client';

import Image from "next/image";
import data from "@/lib/placeholder-images.json";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  ArrowRight, 
  Database, 
  Zap, 
  Scale, 
  Store, 
  Handshake, 
  Award, 
  Activity, 
  Sparkles, 
  Search, 
  Target,
  UserCheck,
  FileCheck,
  Star,
  Trophy,
  Coins,
  Percent,
  TrendingDown,
  ShieldCheck,
  Banknote,
  Truck,
  Building,
  Fingerprint,
  Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
                    data-ai-hint="freight trucks"
                />
            )}
            <div className="relative h-full flex flex-col items-center justify-center text-center text-white z-10 p-4">
                <Badge className="bg-primary/20 text-primary border-primary/30 mb-6 py-1.5 px-6 font-black uppercase tracking-widest text-[10px]">Industrial Infrastructure</Badge>
                <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight text-center text-white uppercase">Data Foundation. Transactional Engine.</h1>
                <p className="mt-4 text-lg md:text-xl max-w-3xl text-slate-300 text-center text-white mx-auto">Logistics Flow is a Data-as-a-Service ecosystem built to map, optimize, and fund the South African transport grid.</p>
            </div>
        </section>

        {/* SECTION 1: THE INTELLIGENCE MECHANISM */}
        <section className="py-24 bg-white border-b">
            <div className="container mx-auto px-4 text-left">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6 text-left">
                        <div className="bg-primary/10 p-4 rounded-2xl w-fit shadow-inner text-left"><Activity className="h-10 w-10 text-primary"/></div>
                        <h3 className="text-4xl font-black font-headline text-foreground leading-tight text-left uppercase">The Intelligence Mechanism</h3>
                        <p className="text-lg text-muted-foreground leading-relaxed text-left">
                            We don't just list your business; we actively monitor market demand. Our proprietary **Inbound Interest Ledger** records every time a verified decision-maker selects your profile to engage.
                        </p>
                        <div className="space-y-6 text-left">
                            <div className="flex gap-4 items-start text-left">
                                <Target className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div className="text-left">
                                    <p className="font-bold">High-Intent Signal Tracking</p>
                                    <p className="text-sm text-muted-foreground">Identify exactly which companies are seeking your capacity or products before they even call you.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start text-left">
                                <Search className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div className="text-left">
                                    <p className="font-bold">Forensic Lead Capture</p>
                                    <p className="text-sm text-muted-foreground">Unlock "Blind Leads" waiting on your dashboard through our Intelligence Access tier.</p>
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
            <div className="container mx-auto px-4 text-left">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="md:order-2 space-y-6 text-left">
                        <div className="bg-primary/10 p-4 rounded-2xl w-fit shadow-inner text-left"><Store className="h-10 w-10 text-primary"/></div>
                        <h3 className="text-4xl font-black font-headline text-white leading-tight text-left uppercase">Your Digital Branch</h3>
                        <p className="text-lg text-slate-300 leading-relaxed text-left">
                            Bypass generic marketplaces. Establish a high-fidelity digital branch mapped directly to the industrial grid. Your node is the engine that powers your presence in our specialized malls.
                        </p>
                        <div className="space-y-6 text-left">
                            <div className="flex gap-4 items-start text-left">
                                <Database className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div className="text-left">
                                    <p className="font-bold uppercase text-xs tracking-widest">List fleet capacity, pallet positions, or technical spares catalogues.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start text-left text-foreground">
                                <FileCheck className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div className="text-left">
                                    <p className="font-bold uppercase text-xs tracking-widest text-white">Standardized handshake tools including OTPs and automated invoicing.</p>
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

        {/* SECTION 3: REWARDS & LOYALTY - THE INFORMATION DIVIDEND */}
        <section className="py-24 bg-white border-b">
            <div className="container mx-auto px-4 text-left">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <div className="bg-primary/10 p-4 rounded-2xl w-fit mx-auto shadow-inner"><Award className="h-10 w-10 text-primary"/></div>
                    <h3 className="text-4xl font-black font-headline text-foreground uppercase tracking-tight text-center">The Information Dividend</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed text-center">
                        Information is the oxygen of industrial growth. We reward contribution. By helping us map the "Registry of Truth", you unlock access to specialized tools and membership reductions.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 mb-16 text-left">
                    <Card className="border-none bg-slate-50 p-8 space-y-6 shadow-sm hover:shadow-xl transition-all text-left">
                        <div className="flex justify-between items-start text-left">
                            <Badge className="bg-orange-100 text-orange-800 border-none uppercase font-black text-[10px] tracking-widest">Tier 01</Badge>
                            <span className="text-sm font-bold text-muted-foreground">0 - 999 pts</span>
                        </div>
                        <h4 className="text-3xl font-black text-slate-900 uppercase text-left">Bronze</h4>
                        <Separator />
                        <div className="space-y-4 text-left">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-1.5 rounded-full"><Percent className="h-4 w-4 text-primary" /></div>
                                <p className="text-sm font-bold">20% Reduction: intelligence Access</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-200 p-1.5 rounded-full"><Fingerprint className="h-4 w-4 text-slate-600" /></div>
                                <p className="text-sm font-bold">Unlock: Member Reputation Badge</p>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-black text-left">Access: Regional Registry Scans</p>
                    </Card>

                    <Card className="border-primary border-2 bg-primary/5 p-8 space-y-6 shadow-2xl relative text-left">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            <Badge className="bg-primary text-white border-none uppercase font-black text-[10px] tracking-widest px-4 py-1 shadow-lg">Target Status</Badge>
                        </div>
                        <div className="flex justify-between items-start text-left">
                            <Badge className="bg-slate-200 text-slate-800 border-none uppercase font-black text-[10px] tracking-widest">Tier 02</Badge>
                            <span className="text-sm font-bold text-muted-foreground">1,000 - 4,999 pts</span>
                        </div>
                        <h4 className="text-3xl font-black text-slate-900 uppercase text-left">Silver</h4>
                        <Separator />
                        <div className="space-y-4 text-left">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-1.5 rounded-full"><Percent className="h-4 w-4 text-primary" /></div>
                                <p className="text-sm font-bold">35% Reduction: Mall intelligence Node</p>
                            </div>
                            <div className="flex items-center gap-3 text-left">
                                <div className="bg-primary/10 p-1.5 rounded-full"><Sparkles className="h-4 w-4 text-primary" /></div>
                                <p className="text-sm font-bold text-left">Unlock: AI Branding & Content Studio</p>
                            </div>
                        </div>
                        <p className="text-[10px] text-primary leading-relaxed uppercase font-black text-left">Access: Forensic Lead Signal Tracking</p>
                    </Card>

                    <Card className="border-none bg-slate-900 text-white p-8 space-y-6 shadow-xl text-left">
                        <div className="flex justify-between items-start text-left text-white">
                            <Badge className="bg-yellow-500/20 text-yellow-500 border-none uppercase font-black text-[10px] tracking-widest">Tier 03</Badge>
                            <span className="text-sm font-bold text-slate-500">5,000+ pts</span>
                        </div>
                        <h4 className="text-3xl font-black text-white uppercase text-left text-white">Gold</h4>
                        <Separator className="bg-white/10" />
                        <div className="space-y-4 text-left text-white">
                            <div className="flex items-center gap-3 text-left text-white">
                                <div className="bg-primary/20 p-1.5 rounded-full text-white"><Percent className="h-4 w-4 text-primary" /></div>
                                <p className="text-sm font-bold text-left text-white">50% Reduction: All intelligence Nodes</p>
                            </div>
                            <div className="flex items-center gap-3 text-left text-white">
                                <div className="bg-yellow-500/20 p-1.5 rounded-full text-white"><Zap className="h-4 w-4 text-yellow-500 fill-current" /></div>
                                <p className="text-sm font-bold text-left text-white">Unlock: 4K AI Video & Discovery Tools</p>
                            </div>
                        </div>
                        <p className="text-[10px] text-yellow-500 leading-relaxed uppercase font-black text-left">Access: Priority Marketplace Ranking</p>
                    </Card>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center text-left">
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed space-y-8 text-left">
                        <div className="text-left">
                            <p className="font-black uppercase text-xs tracking-[0.2em] text-primary mb-2">Build Your Balance:</p>
                            <p className="text-sm text-muted-foreground font-medium text-left">Reward points are earned through registry contribution and platform engagement interaction.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                            <div className="flex items-center gap-3 font-bold text-sm text-slate-700 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-left">
                                <div className="bg-primary/10 p-2 rounded-lg text-left"><Truck className="h-4 w-4 text-primary" /></div>
                                +50 pts (RC1 Fleet)
                            </div>
                            <div className="flex items-center gap-3 font-bold text-sm text-slate-700 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-left">
                                <div className="bg-primary/10 p-2 rounded-lg text-left"><Building className="h-4 w-4 text-primary" /></div>
                                +20 pts (Supplier Map)
                            </div>
                            <div className="flex items-center gap-3 font-bold text-sm text-slate-700 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-left">
                                <div className="bg-primary/10 p-2 rounded-lg text-left"><FileCheck className="h-4 w-4 text-primary" /></div>
                                +10 pts (References)
                            </div>
                            <div className="flex items-center gap-3 font-bold text-sm text-slate-700 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-left">
                                <div className="bg-primary/10 p-2 rounded-lg text-left"><UserCheck className="h-4 w-4 text-primary" /></div>
                                +5 pts (Verification)
                            </div>
                        </div>
                        <Button asChild size="lg" className="h-14 w-full font-black uppercase text-xs tracking-widest text-white shadow-xl">
                            <Link href="/contribute">Enter Rewards Engine <ArrowRight className="ml-2 h-4 w-4"/></Link>
                        </Button>
                    </div>
                    <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl">
                         <Image
                            src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1000"
                            alt="Financial growth"
                            fill
                            className="object-cover"
                            data-ai-hint="accounting coins"
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* SECTION 4: PASSIVE REVENUE & ISA PATHWAY */}
        <section className="py-24 bg-slate-950 text-white border-b">
            <div className="container mx-auto px-4 text-left">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6 text-left">
                        <div className="bg-primary/10 p-3 rounded-2xl w-fit text-left"><Zap className="h-10 w-10 text-primary fill-current" /></div>
                        <h2 className="text-4xl font-black font-headline text-white leading-tight text-left uppercase">Passive Revenue & The ISA Pathway</h2>
                        <p className="text-lg text-slate-300 leading-relaxed text-left">
                            Your industry network is your most valuable digital asset. Our Independent Sales Agent (ISA) program allows you to monetize your influence by digitalizing your existing contacts.
                        </p>
                        <div className="grid md:grid-cols-2 gap-6 text-left">
                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3 text-left">
                                <div className="flex items-center gap-2 text-left"><Banknote className="h-5 w-5 text-primary" /> <p className="font-bold text-sm text-white">Residual Annuity</p></div>
                                <p className="text-xs text-slate-400 leading-relaxed">Earn a recurring percentage share of every membership fee and transaction commission generated by your referred node network.</p>
                            </div>
                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3 text-left">
                                <div className="flex items-center gap-2 text-left"><Sparkles className="h-5 w-5 text-primary" /> <p className="font-bold text-sm text-white">AI Marketing Studio</p></div>
                                <p className="text-xs text-slate-400 leading-relaxed">Get the keys to our 4K video and image generators. Produce professional marketing assets to recruit members with zero overhead.</p>
                            </div>
                        </div>
                        <div className="pt-4 space-y-4 text-left">
                            <p className="font-black uppercase text-[10px] tracking-widest text-primary text-left">Turn industry connections into a perpetual yield engine.</p>
                            <div className="flex flex-wrap gap-2 text-left">
                                <Badge variant="outline" className="border-white/20 text-white text-[9px] uppercase font-bold text-left">Residual Membership Splits</Badge>
                                <Badge variant="outline" className="border-white/20 text-white text-[9px] uppercase font-bold text-left">Transactional Mall Commissions</Badge>
                                <Badge variant="outline" className="border-white/20 text-white text-[9px] uppercase font-bold text-left">Performance Tier Bonuses</Badge>
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
            <div className="container mx-auto px-4 text-center">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <h2 className="text-4xl font-black font-headline text-foreground text-center uppercase">The Earning Pathway</h2>
                    <p className="text-lg text-muted-foreground text-center">
                        Our most successful members don't just use the data—they help build the registry and get paid in return.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 text-left">
                    <Card className="bg-slate-50 border-none shadow-lg group hover:bg-primary transition-colors text-left">
                        <CardContent className="p-8 space-y-4 text-left">
                            <Database className="h-10 w-10 text-primary group-hover:text-white" />
                            <h3 className="text-xl font-bold group-hover:text-white uppercase tracking-tight text-left text-foreground">Data as an Asset</h3>
                            <p className="text-sm text-muted-foreground group-hover:text-white/80 leading-relaxed text-left text-foreground">Contribute your verified fleet or supplier data to earn reward points and de-risk your business for funders.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50 border-none shadow-lg group hover:bg-primary transition-colors text-left">
                        <CardContent className="p-8 space-y-4 text-left">
                            <Zap className="h-10 w-10 text-primary group-hover:text-white fill-current" />
                            <h3 className="text-xl font-bold group-hover:text-white uppercase tracking-tight text-left text-foreground">High-Intent Matches</h3>
                            <p className="text-sm text-muted-foreground group-hover:text-white/80 leading-relaxed text-left text-foreground">We match your specific fleet capabilities with incoming freight requirements in the Loads Mall.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50 border-none shadow-lg group hover:bg-primary transition-colors text-left">
                        <CardContent className="p-8 space-y-4 text-left">
                            <UserCheck className="h-10 w-10 text-primary group-hover:text-white" />
                            <h3 className="text-xl font-bold group-hover:text-white uppercase tracking-tight text-left text-foreground">Trusted Handshake</h3>
                            <p className="text-sm text-muted-foreground group-hover:text-white/80 leading-relaxed text-left text-foreground">We verify identities to ensure you're transacting with real business owners, not middlemen.</p>
                        </CardContent>
                    </Card>
                </div>
                <div className="mt-16 text-center">
                    <Button asChild size="lg" className="h-16 px-12 text-lg font-black uppercase tracking-tight shadow-xl text-white text-center">
                        <Link href={ctaLink}>Establish My Digital standing <ArrowRight className="ml-2 h-5 w-5"/></Link>
                    </Button>
                </div>
            </div>
        </section>
    </div>
  );
}
