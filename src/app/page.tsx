'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  ArrowRight, 
  CheckCircle2, 
  Database, 
  Truck, 
  Landmark, 
  Building2, 
  Zap, 
  Scale, 
  Handshake, 
  Fingerprint, 
  FileCheck, 
  Banknote, 
  ShieldCheck, 
  ShoppingCart, 
  Network, 
  Sparkles, 
  Star, 
  Users, 
  Briefcase, 
  Store, 
  Award,
  Lock,
  Search,
  ShieldAlert,
  UserCheck
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import data from "@/lib/placeholder-images.json";
import { useUser } from "@/firebase";
import { useState } from "react";
import * as gtag from '@/lib/gtag';
import { HomeIntentModal } from "@/app/home-intent-modal";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const { placeholderImages } = data;
const heroImage = placeholderImages.find(p => p.id === 'hero-home');

export default function HomePage() {
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleJoinClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) {
      gtag.event({ action: 'click_join_from_hero', category: 'Engagement', label: 'Homepage Hero CTA', value: 1 });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="bg-background text-left text-foreground">
      <HomeIntentModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
      
      {/* HERO SECTION */}
      <section className="relative w-full h-[85vh] flex items-center justify-center overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 z-0 opacity-20">
           {heroImage && <Image src={heroImage.imageUrl} alt="Logistics Background" fill className="object-cover" priority data-ai-hint="truck highway night" />}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950" />

        <div className="container relative z-10 mx-auto px-4 text-center">
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 py-1.5 px-6 text-xs font-black uppercase tracking-[0.2em]">Data Foundation • Transactional Engine</Badge>
            <h1 className="text-5xl md:text-8xl font-black font-headline leading-tight mb-6 tracking-tighter text-center text-white">Map the Grid.<br/>Execute the <span className="text-primary">Flow</span>.</h1>
            <p className="text-lg md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed text-center text-white">Logistics Flow is a data-as-a-service company. We provide the forensic map of the industry, and the transactional engine to fund and move it.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" className="h-16 px-12 text-lg font-black uppercase tracking-tight shadow-xl text-white" onClick={handleJoinClick}>
                    Establish Handshake <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button asChild size="lg" variant="outline" className="h-16 px-12 text-lg font-black uppercase tracking-tight border-white/20 hover:bg-white/10 text-white">
                    <Link href="/pricing">Explore Industrial Nodes</Link>
                </Button>
            </div>
        </div>
      </section>

      {/* THE 4-LAYER ARCHITECTURE GRID */}
      <section className="py-24 bg-white border-b">
        <div className="container mx-auto px-4 text-left">
            <div className="max-w-4xl mx-auto text-center mb-20 space-y-4">
                <Badge variant="outline" className="border-primary/30 text-primary font-black uppercase text-[10px] tracking-widest px-4">Platform Blueprint</Badge>
                <h2 className="text-4xl md:text-6xl font-black font-headline text-slate-900 tracking-tight text-center">The Industrial Grid Architecture</h2>
                <p className="text-lg text-muted-foreground leading-relaxed text-center">
                    Logistics Flow is built in four modular layers. Establish your <strong>Foundation</strong> in the registry, then activate specialized intelligence nodes to plug into the grid.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto text-left">
                <Card className="bg-slate-50 border-2 border-slate-100 p-8 flex flex-col h-full hover:border-primary/20 transition-all text-left text-foreground">
                    <div className="flex items-center gap-3 mb-6 text-left">
                        <div className="bg-slate-200 p-2 rounded-lg text-left text-foreground"><Fingerprint className="h-5 w-5 text-slate-600" /></div>
                        <span className="font-black text-[10px] uppercase tracking-widest text-slate-500">Layer 1</span>
                    </div>
                    <h3 className="text-xl font-black mb-2 text-left">Node Ownership</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-8 text-left">Bind your digital identity to the registry. Verification and reputation management foundation.</p>
                    <div className="mt-auto text-left">
                        <p className="font-black text-primary text-xl text-left">R10 <span className="text-[10px] text-muted-foreground font-bold">/ MONTH</span></p>
                    </div>
                </Card>

                <Card className="bg-primary/5 border-2 border-primary/20 p-8 flex flex-col h-full hover:border-primary transition-all text-left">
                    <div className="flex items-center gap-3 mb-6 text-left">
                        <div className="bg-primary/10 p-2 rounded-lg text-left"><Database className="h-5 w-5 text-primary" /></div>
                        <span className="font-black text-[10px] uppercase tracking-widest text-primary">Layer 2</span>
                    </div>
                    <h3 className="text-xl font-black mb-2 text-left">Registry Intelligence</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-8 text-left">Unlock the global map. Full direct contact details for 22,000+ verified decision makers.</p>
                    <div className="mt-auto text-left">
                        <p className="font-black text-primary text-xl text-left">R100 <span className="text-[10px] text-muted-foreground font-bold">/ MONTH</span></p>
                    </div>
                </Card>

                <Card className="bg-amber-50 border-2 border-amber-200 p-8 flex flex-col h-full hover:border-amber-400 transition-all text-left">
                    <div className="flex items-center gap-3 mb-6 text-left">
                        <div className="bg-amber-100 p-2 rounded-lg text-left"><Zap className="h-5 w-5 text-amber-600" /></div>
                        <span className="font-black text-[10px] uppercase tracking-widest text-amber-600 text-left">Layer 3</span>
                    </div>
                    <h3 className="text-xl font-black mb-2 text-left">Mall Intelligence</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-8 text-left">Deep-data access to detailed records within specific industrial malls (Fleet specs, Catalogs, Loads).</p>
                    <div className="mt-auto text-left">
                        <Badge variant="outline" className="border-amber-200 text-amber-700 font-bold uppercase text-[9px] text-left">Earning Nodes</Badge>
                    </div>
                </Card>

                <Card className="bg-blue-50 border-2 border-blue-200 p-8 flex flex-col h-full hover:border-blue-400 transition-all text-left">
                    <div className="flex items-center gap-3 mb-6 text-left">
                        <div className="bg-blue-100 p-2 rounded-lg text-left"><Scale className="h-5 w-5 text-blue-600" /></div>
                        <span className="font-black text-[10px] uppercase tracking-widest text-blue-600 text-left">Layer 4</span>
                    </div>
                    <h3 className="text-xl font-black mb-2 text-left">Transactional Tiers</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-8 text-left">The Engine. Operational memberships to create shops, process handshakes, and conclude deals.</p>
                    <div className="mt-auto text-left">
                        <Badge variant="outline" className="border-blue-200 text-blue-700 font-bold uppercase text-[9px] text-left">Operational</Badge>
                    </div>
                </Card>
            </div>
        </div>
      </section>

      {/* INTELLIGENCE REGISTRIES */}
      <section className="py-24 bg-slate-50 border-b">
        <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto text-left">
                {/* TRANSPORTER */}
                <div className="space-y-6 text-left">
                    <div className="bg-primary/10 p-4 rounded-2xl w-fit text-left"><Truck className="h-10 w-10 text-primary" /></div>
                    <h3 className="text-3xl font-black font-headline uppercase text-left">Transporter intelligence</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed text-left">
                        Access a massive database of verified South African hauliers. From long-haul refrigerated fleets to local distribution experts, we provide the map to your next reliable capacity partner.
                    </p>
                    <div className="space-y-3 text-left">
                        <p className="flex items-center gap-3 font-bold text-slate-700 text-left"><CheckCircle2 className="h-5 w-5 text-primary" /> Verified RC1 Compliance Data</p>
                        <p className="flex items-center gap-3 font-bold text-slate-700 text-left"><CheckCircle2 className="h-5 w-5 text-primary" /> Direct Line to CEO/MD Leadership</p>
                    </div>
                    <Button asChild variant="outline" className="h-12 px-8 font-black uppercase text-xs tracking-widest text-left">
                        <Link href="/intelligence/transporter">Search Haulier Registry</Link>
                    </Button>
                </div>

                {/* SUPPLIER */}
                <div className="space-y-6 text-left">
                    <div className="bg-primary/10 p-4 rounded-2xl w-fit text-left"><Building2 className="h-10 w-10 text-primary" /></div>
                    <h3 className="text-3xl font-black font-headline uppercase text-left">Supplier intelligence</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed text-left">
                        Our AI discovery engine has cataloged the entire independent supplier ecosystem. Every niche, from differentials to engine overrides, is represented in our forensic database.
                    </p>
                    <div className="bg-slate-900 text-white p-4 rounded-xl text-left">
                        <p className="text-primary font-black text-xl text-left">22,480 Verified Records</p>
                        <p className="text-[10px] uppercase text-slate-400 font-bold text-left">Direct Decision-Maker Access</p>
                    </div>
                    <Button asChild variant="outline" className="h-12 px-8 font-black uppercase text-xs tracking-widest text-left">
                        <Link href="/intelligence/supplier">Search Supplier Registry</Link>
                    </Button>
                </div>

                {/* CAPITAL */}
                <div className="space-y-6 text-left">
                    <div className="bg-primary/10 p-4 rounded-2xl w-fit text-left"><Landmark className="h-10 w-10 text-primary" /></div>
                    <h3 className="text-3xl font-black font-headline uppercase text-left">Capital intelligence</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed text-left">
                        Stop applying to deaf ears. Our Capital Intelligence portal connects your operational performance data with specialized lenders who actually understand the trucking business.
                    </p>
                    <div className="flex items-center gap-2 text-left">
                        <Badge className="bg-primary text-white border-none px-3 font-black text-[10px] uppercase tracking-widest">85 Active Funding Partners</Badge>
                    </div>
                    <Button asChild variant="outline" className="h-12 px-8 font-black uppercase text-xs tracking-widest text-left">
                        <Link href="/funding">Explore Funding</Link>
                    </Button>
                </div>

                {/* HUMAN CAPITAL */}
                <div className="space-y-6 text-left">
                    <div className="bg-primary/10 p-4 rounded-2xl w-fit text-left"><Users className="h-10 w-10 text-primary" /></div>
                    <h3 className="text-3xl font-black font-headline uppercase text-left">Human Capital intelligence</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed text-left">
                        Breaking the recruitment constraint. Connect with verified talent across the South African logistics landscape. Our soon-to-launch jobs board will source roles directly from our community member base.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <div className="text-left">
                            <p className="font-bold text-sm text-left">For Applicants</p>
                            <p className="text-[10px] text-muted-foreground leading-tight">Access premium jobs board for R100/mo.</p>
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-sm text-left">For Employers</p>
                            <p className="text-[10px] text-muted-foreground leading-tight">Fill roles via vetted talent pool.</p>
                        </div>
                    </div>
                    <Button asChild variant="outline" className="h-12 px-8 font-black uppercase text-xs tracking-widest text-left">
                        <Link href="/intelligence/human-capital">Explore Human Capital</Link>
                    </Button>
                </div>
            </div>
        </div>
      </section>

      {/* DATA PRIVACY */}
      <section className="py-24 bg-white border-b">
          <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto space-y-12 text-left">
                  <div className="text-left space-y-4">
                    <h2 className="text-4xl font-black font-headline text-slate-900 text-left">Absolute Data Privacy</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed text-left">
                        While we give you the map to the industry, your own business data remains under your absolute control.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                      <div className="space-y-3 text-left">
                          <div className="bg-slate-100 p-2 rounded-lg w-fit text-left"><ShieldAlert className="h-6 w-6 text-slate-600" /></div>
                          <h4 className="font-black text-sm uppercase tracking-tight text-left">Registry Access Shield</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed text-left">We verify every human identity before granting access to forensic contact data.</p>
                      </div>
                      <div className="space-y-3 text-left">
                          <div className="bg-slate-100 p-2 rounded-lg w-fit text-left"><Scale className="h-6 w-6 text-slate-600" /></div>
                          <h4 className="font-black text-sm uppercase tracking-tight text-left">Zero Data Resale</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed text-left">We never sell member contact lists. Introduction is only via direct request.</p>
                      </div>
                      <div className="space-y-3 text-left">
                          <div className="bg-slate-100 p-2 rounded-lg w-fit text-left"><FileCheck className="h-6 w-6 text-slate-600" /></div>
                          <h4 className="font-black text-sm uppercase tracking-tight text-left">POPI Compliant Ledger</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed text-left">Every interaction is logged on a secure, encrypted digital registry.</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* INTELLIGENCE ACCESS TIER */}
      <section className="py-24 bg-slate-950 text-white">
          <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                  <Card className="bg-slate-900 border-2 border-primary/30 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden text-left">
                      <div className="absolute top-0 right-0 p-10 opacity-10">
                          <Database className="h-40 w-40 text-primary" />
                      </div>
                      <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 text-left">
                          <div className="flex-1 space-y-6 text-left">
                              <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-1 font-black uppercase text-[10px] tracking-widest">Gateway Node</Badge>
                              <h3 className="text-4xl md:text-5xl font-black font-headline text-white leading-tight text-left">Intelligence Access Tier</h3>
                              <p className="text-2xl font-black text-primary text-left">R100 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">/ per month</span></p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 pt-4 text-left">
                                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-left"><CheckCircle2 className="h-4 w-4 text-primary" /> Unlimited Registry Search</div>
                                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-left"><CheckCircle2 className="h-4 w-4 text-primary" /> Direct CEO/MD Contacts</div>
                                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-left"><CheckCircle2 className="h-4 w-4 text-primary" /> Verified Mobile Numbers</div>
                                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-left"><CheckCircle2 className="h-4 w-4 text-primary" /> Publish Your Shop Profile</div>
                              </div>
                              <Button asChild size="lg" className="h-16 px-12 text-lg font-black uppercase tracking-tight shadow-xl w-full sm:w-auto text-white">
                                  <Link href="/checkout/intelligence">Unlock The Registry</Link>
                              </Button>
                          </div>
                      </div>
                  </Card>
              </div>
          </div>
      </section>

      {/* PASSIVE REVENUE ENGINE (ISA) */}
      <section className="py-24 bg-white border-b">
        <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="lg:order-2 space-y-6 text-left text-foreground">
                    <div className="bg-amber-100 p-3 rounded-2xl w-fit text-left"><Zap className="h-10 w-10 text-amber-600 fill-amber-600" /></div>
                    <h2 className="text-4xl font-black font-headline text-slate-900 leading-tight text-left uppercase">The Passive Revenue Engine</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed text-left text-foreground">
                        The transport industry thrives on relationships. Our **ISA (Independent Sales Agent)** framework allows you to monetize your influence. By digitalizing your network into our grid, you build a recurring annuity stream.
                    </p>
                    <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4 shadow-xl text-left text-white">
                        <div className="flex justify-between items-center text-left text-white">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400 text-left">ISA Base Share</span>
                            <span className="text-xl font-black text-primary text-left">30%</span>
                        </div>
                        <Separator className="bg-white/10" />
                        <p className="text-xs text-slate-400 text-left">Earn a recurring percentage of every membership fee and a transactional split on all Mall activity generated by your referred nodes.</p>
                    </div>
                    <Button asChild className="h-12 px-8 font-black uppercase text-xs tracking-widest text-white shadow-lg" variant="default">
                        <Link href="/incentives">View ISA Offer</Link>
                    </Button>
                </div>
                <div className="lg:order-1 relative aspect-square max-w-md mx-auto">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                    <div className="relative z-10 bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                        <Handshake className="h-16 w-16 text-primary mb-6" />
                        <h3 className="text-2xl font-black mb-2 text-foreground">Network Monetization</h3>
                        <p className="text-sm text-muted-foreground text-center">Turn your existing industry contacts into a high-fidelity revenue engine.</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* DATA AS CURRENCY (REWARDS) */}
      <section className="py-24 bg-slate-50 border-b">
        <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-16 text-left">
                <div className="flex-1 space-y-6 text-left text-foreground">
                    <div className="bg-primary/10 p-3 rounded-2xl w-fit text-left"><Award className="h-10 w-10 text-primary" /></div>
                    <h2 className="text-4xl font-black font-headline leading-tight text-left uppercase">Data as a Platform Currency</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed text-left">
                        Don't want to pay cash for Intelligence? Our **Rewards Ledger** allows you to trade verified industrial data for platform access.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <div className="p-4 bg-white border-2 border-primary/20 rounded-2xl">
                            <p className="font-black text-primary text-xl text-left">+50 pts</p>
                            <p className="text-[10px] uppercase text-slate-500 font-bold text-left">Per RC1 Contribution</p>
                        </div>
                        <div className="p-4 bg-white border-2 border-primary/20 rounded-2xl text-left">
                            <p className="font-black text-primary text-xl text-left">+20 pts</p>
                            <p className="text-[10px] uppercase text-slate-500 font-bold text-left">Per Verified Supplier Log</p>
                        </div>
                    </div>
                    <Button asChild size="lg" className="h-12 px-10 font-black uppercase text-xs tracking-widest shadow-xl text-white">
                        <Link href="/contribute">Start Earning Points</Link>
                    </Button>
                </div>
                <div className="relative h-64 w-64 shrink-0">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Star className="h-24 w-24 text-primary fill-primary animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 bg-background">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-4xl md:text-7xl font-black font-headline text-slate-900 tracking-tighter text-center uppercase">Ready to plug into the grid?</h2>
                <p className="mt-8 text-xl max-w-2xl mx-auto text-muted-foreground leading-relaxed text-center">Join thousands of industry professionals who have moved from fragmented manual processes to a high-velocity digital ecosystem.</p>
                <div className="mt-12 flex justify-center gap-6">
                     <Button size="lg" className="h-16 px-16 text-lg font-black uppercase shadow-2xl text-white" onClick={handleJoinClick}>
                        Join for Free <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </div>
        </section>
    </div>
  );
}
