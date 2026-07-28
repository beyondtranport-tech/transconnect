'use client';

import Image from "next/image";
import data from "@/lib/placeholder-images.json";
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
  Target,
  UserCheck,
  FileCheck,
  Truck,
  Building,
  BrainCircuit,
  Loader2,
  ShieldCheck,
  Landmark
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
        {/* HERO SECTION - THE MISSION */}
        <section className="relative w-full h-80 bg-slate-900 text-white flex items-center">
            {aboutHeroImage && (
                <Image
                    src={aboutHeroImage.imageUrl}
                    alt="Industry Map"
                    fill
                    className="object-cover opacity-20"
                    priority
                />
            )}
            <div className="container relative mx-auto px-4 text-left z-10">
                <Badge className="bg-primary text-white mb-6 py-1 px-4 font-black uppercase tracking-widest text-[10px] border-none">The Industrial Brain</Badge>
                <h1 className="text-4xl md:text-7xl font-black font-headline tracking-tighter text-white uppercase leading-none">Solving the <br/>Information <span className="text-primary">Divide</span>.</h1>
                <p className="mt-6 text-xl max-w-2xl text-slate-300 leading-relaxed font-medium text-left">Logistics Flow is a Data-as-a-Service company. We don't drive trucks; we provide the intelligence to make them more profitable.</p>
            </div>
        </section>

        {/* HOW IT WORKS - THREE PILLARS */}
        <section className="py-24 bg-white border-b">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-black font-headline text-slate-900 uppercase text-center">The 3 Pillars of Flow</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed text-center">
                        We provide the map, the engine, and the fuel to scale your industrial footprint.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-12 max-w-7xl mx-auto">
                    {/* DISCOVERY */}
                    <div className="space-y-6 text-left">
                        <div className="bg-slate-100 p-5 rounded-3xl w-fit"><Database className="h-10 w-10 text-primary" /></div>
                        <h3 className="text-2xl font-black uppercase text-slate-900">1. Discovery</h3>
                        <p className="text-muted-foreground leading-relaxed text-left">
                            Our AI discovery engine has mapped the South African transport grid. We bypass gatekeepers to provide you with the direct lines to decision-makers across 22,000 verified records.
                        </p>
                        <ul className="space-y-2 pt-2 text-left">
                            <li className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-tight text-left"><CheckCircle className="h-4 w-4 text-primary" /> Forensic CRM Registry</li>
                            <li className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-tight text-left"><CheckCircle className="h-4 w-4 text-primary" /> Verified Mobile Numbers</li>
                        </ul>
                    </div>

                    {/* MATCHING */}
                    <div className="space-y-6 text-left">
                        <div className="bg-slate-100 p-5 rounded-3xl w-fit"><BrainCircuit className="h-10 w-10 text-primary" /></div>
                        <h3 className="text-2xl font-black uppercase text-slate-900">2. Matching</h3>
                        <p className="text-muted-foreground leading-relaxed text-left">
                            We match your specific fleet capacity or spare parts catalog with high-intent demand in real-time. Our matching engine eliminates the friction of manual cold-calling.
                        </p>
                         <ul className="space-y-2 pt-2 text-left">
                            <li className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-tight text-left"><CheckCircle className="h-4 w-4 text-primary" /> AI Freight Matching</li>
                            <li className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-tight text-left"><CheckCircle className="h-4 w-4 text-primary" /> Digital Node Handshakes</li>
                        </ul>
                    </div>

                    {/* CAPITAL */}
                    <div className="space-y-6 text-left">
                        <div className="bg-slate-100 p-5 rounded-3xl w-fit"><Landmark className="h-10 w-10 text-primary" /></div>
                        <h3 className="text-2xl font-black uppercase text-slate-900">3. Capital</h3>
                        <p className="text-muted-foreground leading-relaxed text-left">
                            Data is the best collateral. By analyzing your platform activity and standing, our funding division can provide asset finance and working capital where traditional banks fail.
                        </p>
                         <ul className="space-y-2 pt-2 text-left">
                            <li className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-tight text-left"><CheckCircle className="h-4 w-4 text-primary" /> In-House Business Loans</li>
                            <li className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-tight text-left"><CheckCircle className="h-4 w-4 text-primary" /> Asset Growth Funding</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        {/* SYNDICATE POWER */}
        <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                    <div className="space-y-6 text-left">
                        <Badge className="bg-amber-100 text-amber-700 border-none px-4 py-1 font-black uppercase tracking-widest text-[10px]">The Efficiency Syndicate</Badge>
                        <h3 className="text-4xl md:text-5xl font-black font-headline text-slate-900 leading-none uppercase text-left">Collective <br/>Buying Power.</h3>
                        <p className="text-xl text-muted-foreground leading-relaxed text-left">
                            Logistics Flow acts as a community syndicate. We negotiate massive discounts with national suppliers for tires, parts, and fuel, passing that value directly to our members.
                        </p>
                        <Button asChild size="lg" className="h-14 px-10 font-black uppercase shadow-xl text-white">
                            <Link href="/pricing">View Savings Tiers <ArrowRight className="ml-2 h-5 w-5" /></Link>
                        </Button>
                    </div>
                    <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><Zap className="h-40 w-40 text-primary" /></div>
                        <h4 className="text-primary font-black text-xs uppercase tracking-[0.2em] mb-8 text-left">Verified Impact</h4>
                        <div className="space-y-8 relative z-10 text-left">
                            <div className="space-y-1 text-left">
                                <p className="text-4xl font-black text-white text-left">7.5%</p>
                                <p className="text-xs text-slate-400 font-bold uppercase text-left">Avg. Maintenance Cost Reduction</p>
                            </div>
                            <div className="space-y-1 text-left">
                                <p className="text-4xl font-black text-white text-left">12%</p>
                                <p className="text-xs text-slate-400 font-bold uppercase text-left">Increase in Fleet Utilization</p>
                            </div>
                            <div className="space-y-1 text-left">
                                <p className="text-4xl font-black text-white text-left">24hr</p>
                                <p className="text-xs text-slate-400 font-bold uppercase text-left">Avg. Response on funding Enquiries</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* FINAL TRUST BAR */}
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4 text-center">
                <div className="max-w-2xl mx-auto space-y-8">
                    <div className="bg-slate-100 p-4 rounded-full w-fit mx-auto"><ShieldCheck className="h-10 w-10 text-slate-600" /></div>
                    <h3 className="text-2xl font-black uppercase text-slate-900 text-center">A Trusted Industrial Partner.</h3>
                    <p className="text-muted-foreground leading-relaxed text-center">
                        Logistics Flow is a secure, closed-loop network. We do not sell data; we optimize industrial capacity. Our team has over 25 years of experience in financing and scaling South African transport businesses.
                    </p>
                    <div className="pt-8 text-center">
                        <Button asChild size="lg" className="h-16 px-12 text-lg font-black uppercase tracking-tight shadow-xl text-white">
                            <Link href={ctaLink}>Establish My Standing</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    </div>
  );
}
