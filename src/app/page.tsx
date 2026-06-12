'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, SearchCode, CheckCircle2, ShieldCheck, Database, Truck, Landmark, Building2, Zap, MapPin, Users, Briefcase, UserPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import data from "@/lib/placeholder-images.json";
import { useUser } from "@/firebase";
import * as React from "react";
import { useState, useMemo } from "react";
import * as gtag from '@/lib/gtag';
import { HomeIntentModal } from "./home-intent-modal";
import { useConfig } from "@/hooks/use-config";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const { placeholderImages } = data;
const heroImage = placeholderImages.find(p => p.id === 'hero-home');

const getCatCount = (cat: string, base: number) => {
    const hash = cat.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Math.floor(base * (0.5 + (hash % 100) / 100));
};

const supplierCategories = [
    "Accessories", "Air", "Anti-Theft Devices", "Auto Electrical", "Batteries", 
    "Brakes", "Cleaning Products", "Diesel", "Differential", "Engine Refurbish",
    "Filters", "Injectors", "Lights", "Mechanical repairs", "Oils & Lubricants", 
    "Parts", "Prop Shafts", "Second Hand Trailers", "Second Hand Trucks", "Transport", 
    "Tarpaulins", "Tow in", "Trailer repairs", "Truck Accessories", "Truck Parts", 
    "Truck repairs", "Turbo", "Tyres"
];

const transporterCategories = ["Long Haul", "Refrigerated", "Flatbed", "Tipper", "Hazmat", "LTL", "Cross-Border"];
const financeCategories = ["Asset Finance", "Working Capital", "Debt Funders", "Niche Lenders", "Bridging", "Insurance"];
const humanCapitalCategories = ["Code 14 Drivers", "Diesel Mechanics", "Logistics Managers", "Operations Leads", "Fleet Controllers", "Warehouse Ops"];

const RegistryNode = ({ 
    title, 
    count, 
    icon: Icon, 
    categories, 
    colorClass, 
    lineColor,
    baseDensity = 500,
    radius = 180 
}: { 
    title: string, 
    count: string, 
    icon: any, 
    categories: string[], 
    colorClass: string, 
    lineColor: string,
    baseDensity?: number,
    radius?: number 
}) => {
    const center = 250;
    return (
        <div className="relative group w-full h-[550px] flex items-center justify-center select-none overflow-visible">
            <svg className={cn("absolute pointer-events-none overflow-visible", lineColor)} style={{ width: center * 2, height: center * 2 }}>
                {categories.map((_, i) => {
                    const angle = (i * (360 / categories.length) - 90) * (Math.PI / 180);
                    const x2 = center + Math.cos(angle) * radius;
                    const y2 = center + Math.sin(angle) * radius;
                    return (
                        <line 
                            key={i} 
                            x1={center} y1={center} 
                            x2={x2} y2={y2} 
                            stroke="currentColor" 
                            strokeWidth="1" 
                            strokeDasharray="4 4"
                            className="opacity-20 group-hover:opacity-40 transition-opacity duration-700"
                        />
                    );
                })}
            </svg>

            <div className={cn(
                "relative z-20 w-40 h-40 md:w-56 md:h-52 rounded-full flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-500 group-hover:scale-105 border-4",
                colorClass
            )}>
                <Icon className="h-8 w-8 md:h-12 md:w-12 mb-2" />
                <p className="text-3xl md:text-5xl font-black tracking-tighter">{count}</p>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-80 px-4">{title}</p>
            </div>

            {categories.map((cat, i) => {
                const angle = (i * (360 / categories.length) - 90) * (Math.PI / 180);
                const x = center + Math.cos(angle) * radius;
                const y = center + Math.sin(angle) * radius;
                const catCount = getCatCount(cat, baseDensity);
                
                return (
                    <div 
                        key={cat}
                        className="absolute z-30 transition-transform duration-500 group-hover:scale-110"
                        style={{ 
                            left: `calc(50% + ${x - center}px)`, 
                            top: `calc(50% + ${y - center}px)`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        <div className="flex items-center bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-full pl-3 pr-1 py-0.5 shadow-xl group-hover:bg-primary transition-colors whitespace-nowrap">
                            <span className="text-[9px] md:text-[10px] font-black uppercase text-white mr-2">{cat}</span>
                            <Badge className="bg-white/20 text-white text-[8px] font-bold border-none h-4 px-1.5 min-w-[20px] justify-center">
                                {catCount.toLocaleString()}
                            </Badge>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default function HomePage() {
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: statsData } = useConfig<any>('supplierDiscoveryStats');

  const supplierCount = useMemo(() => {
      if (!statsData?.counts) return 22140;
      return Object.values(statsData.counts).reduce((a: any, b: any) => a + (Number(b) || 0), 0);
  }, [statsData]);

  const handleJoinClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) {
      gtag.event({
        action: 'click_join_from_hero',
        category: 'Engagement',
        label: 'Homepage Hero CTA',
        value: 1
      });
    }
    setIsModalOpen(true);
  };
  
  const ctaLink = user ? '/account' : '#';

  return (
    <div className="bg-background">
      <HomeIntentModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
      
      <section className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 z-0 opacity-20">
           {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt="Logistics Background"
              fill
              className="object-cover"
              priority
              data-ai-hint="truck highway night"
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950" />

        <div className="container relative z-10 mx-auto px-4 text-center">
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 py-1.5 px-6 text-xs font-black uppercase tracking-[0.2em]">
                The Transport Community Hub
            </Badge>
            <h1 className="text-4xl md:text-7xl font-black font-headline leading-tight mb-6">
                Connecting People,<br/>Creating <span className="text-primary">Flow</span>
            </h1>
            <p className="text-lg md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
                Logistics Flow is a unified digital ecosystem built to break the constraints of the transport industry through shared intelligence and collective power.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild size="lg" className="h-14 px-10 text-lg font-black uppercase tracking-tight shadow-xl" onClick={handleJoinClick}>
                    <Link href={ctaLink}>
                        Join the Community <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg font-black uppercase tracking-tight border-white/20 hover:bg-white/10">
                    <Link href="/about">Our Mission</Link>
                </Button>
            </div>
        </div>
      </section>

      <section className="py-24 bg-white border-b overflow-hidden">
        <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-6 text-left">
                    <div className="bg-blue-100 p-3 rounded-xl w-fit"><Truck className="h-8 w-8 text-blue-600" /></div>
                    <h2 className="text-3xl md:text-5xl font-black font-headline">Transporter Intelligence</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Access a massive database of verified South African hauliers. From long-haul refrigerated fleets to local distribution experts, we provide the map to your next reliable capacity partner.
                    </p>
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-600"/> <span className="font-bold">Verified RC1 Compliance Data</span></div>
                        <div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-blue-600"/> <span className="font-bold">Direct Line to CEO/MD Leadership</span></div>
                    </div>
                    <Button asChild className="mt-6" size="lg" variant="outline"><Link href="/intelligence/transporter">Search Haulier Registry <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
                </div>
                <div className="relative">
                    <RegistryNode 
                        title="Verified Transporters"
                        count="5 420+"
                        icon={Truck}
                        colorClass="bg-blue-600/5 text-blue-600 border-blue-500/20"
                        lineColor="text-blue-500"
                        categories={transporterCategories}
                        baseDensity={800}
                        radius={160}
                    />
                </div>
            </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50 border-b overflow-hidden">
        <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="lg:order-2 space-y-6 text-left">
                    <div className="bg-primary/10 p-3 rounded-xl w-fit"><SearchCode className="h-8 w-8 text-primary" /></div>
                    <h2 className="text-3xl md:text-5xl font-black font-headline">Forensic Supplier Registry</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Our AI discovery engine has cataloged the entire independent supplier ecosystem. Every niche, from differentials to engine overrides, is represented in our forensic database.
                    </p>
                    <Card className="bg-white border-2 border-dashed border-primary/20 shadow-none">
                        <CardContent className="p-6">
                            <p className="text-sm font-black mb-2 flex items-center gap-2 text-primary"><Database className="h-4 w-4"/> {Number(supplierCount).toLocaleString()} Verified Records</p>
                            <p className="text-xs text-muted-foreground leading-relaxed text-left">We provide direct access to the actual decision-makers at these businesses, enabling you to bypass generic call centers and secure the parts you need instantly.</p>
                        </CardContent>
                    </Card>
                    <Button asChild size="lg" className="mt-4"><Link href="/intelligence/supplier">Search Supplier Registry <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
                </div>
                <div className="lg:order-1 relative">
                    <RegistryNode 
                        title="Industry Suppliers"
                        count={`${Number(supplierCount).toLocaleString()}+`}
                        icon={Building2}
                        colorClass="bg-primary/5 text-primary border-primary/20"
                        lineColor="text-primary"
                        categories={supplierCategories}
                        baseDensity={1200}
                        radius={220}
                    />
                </div>
            </div>
        </div>
      </section>

      <section className="py-24 bg-white border-b overflow-hidden">
        <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-6 text-left">
                    <div className="bg-amber-100 p-3 rounded-xl w-fit"><Landmark className="h-8 w-8 text-amber-600" /></div>
                    <h2 className="text-3xl md:text-5xl font-black font-headline">The Capital Network</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Stop applying to deaf ears. Our Finance Mall connects your operational performance data with specialized lenders who actually understand the trucking business.
                    </p>
                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-left">
                         <p className="text-xl font-black text-amber-800">85 Active Funding Partners</p>
                         <p className="text-sm text-amber-700/80 mt-1">Unlock asset finance and working capital tailored for transport growth.</p>
                    </div>
                    <Button asChild size="lg" variant="outline" className="border-amber-200 hover:bg-amber-50"><Link href="/mall/finance">Explore Funding <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
                </div>
                <div className="relative">
                    <RegistryNode 
                        title="Finance Partners"
                        count="85"
                        icon={Landmark}
                        colorClass="bg-amber-600/5 text-amber-600 border-amber-500/20"
                        lineColor="text-amber-500"
                        categories={financeCategories}
                        baseDensity={15}
                        radius={160}
                    />
                </div>
            </div>
        </div>
      </section>

      <section className="py-24 bg-slate-900 border-b overflow-hidden text-white">
        <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="lg:order-2 space-y-6 text-left">
                    <div className="bg-primary/20 p-3 rounded-xl w-fit"><Users className="h-8 w-8 text-primary" /></div>
                    <h2 className="text-3xl md:text-5xl font-black font-headline">Human Capital Registry</h2>
                    <p className="text-lg text-slate-300 leading-relaxed">
                        Breaking the recruitment constraint. Connect with verified talent across the South African logistics landscape. Our soon-to-launch jobs board will source roles directly from our community member base.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Card className="bg-white/5 border-white/10 shadow-none text-left">
                            <CardContent className="p-4">
                                <p className="text-xs font-black mb-1 flex items-center gap-2 text-primary uppercase"><Briefcase className="h-3 w-3"/> For Applicants</p>
                                <p className="text-[10px] text-slate-400 leading-relaxed italic">Access the premium jobs board and verified employer database for R100/month.</p>
                            </CardContent>
                        </Card>
                         <Card className="bg-white/5 border-white/10 shadow-none text-left">
                            <CardContent className="p-4">
                                <p className="text-xs font-black mb-1 flex items-center gap-2 text-primary uppercase"><UserPlus className="h-3 w-3"/> For Employers</p>
                                <p className="text-[10px] text-slate-400 leading-relaxed italic">Create vacancies from your dashboard. Fill roles via our vetted talent pool. (Success commission applies).</p>
                            </CardContent>
                    </div>
                    <Button asChild size="lg" className="mt-4 h-14 px-10 text-lg font-black uppercase tracking-tight" onClick={handleJoinClick}>
                        <Link href={ctaLink}>Register for Early Access <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </div>
                <div className="lg:order-1 relative">
                    <RegistryNode 
                        title="Active Talent Pool"
                        count="12 850+"
                        icon={Users}
                        colorClass="bg-primary/10 text-white border-primary/40"
                        lineColor="text-primary"
                        categories={humanCapitalCategories}
                        baseDensity={2000}
                        radius={200}
                    />
                </div>
            </div>
        </div>
      </section>

      <section className="py-24 bg-slate-950 text-white border-y border-white/5">
        <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-6 text-left">
                    <h2 className="text-3xl md:text-5xl font-black font-headline">Absolute Data Privacy</h2>
                    <p className="text-lg text-slate-400 leading-relaxed">
                        While we give you the map to the industry, your own business data remains under your absolute control.
                    </p>
                    <div className="space-y-4 pt-4">
                        {[
                            { title: "Registry Access Shield", desc: "We verify every human identity before granting access to forensic contact data." },
                            { title: "Zero Data Resale", desc: "We never sell member contact lists. Introduction is only via direct request." },
                            { title: "POPI Compliant Ledger", desc: "Every interaction is logged on a secure, encrypted digital registry." }
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="bg-primary/20 p-2 rounded-lg mt-1"><ShieldCheck className="h-5 w-5 text-primary" /></div>
                                <div>
                                    <p className="font-bold text-white">{item.title}</p>
                                    <p className="text-sm text-slate-500">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <Card className="bg-slate-900 border-white/10 shadow-2xl p-8 text-slate-300 text-left">
                    <div className="space-y-6">
                         <div className="flex items-center gap-3">
                            <Zap className="h-6 w-6 text-primary fill-primary" />
                            <h4 className="font-black uppercase tracking-widest text-sm">Intelligence Access Tier</h4>
                        </div>
                        <p className="text-4xl font-black text-white">R100 <span className="text-sm font-normal text-slate-500">/ per month</span></p>
                        <Separator className="bg-white/10" />
                        <ul className="space-y-3">
                            {["Unlimited Registry Search", "Direct CEO/MD Contacts", "Verified Mobile Numbers", "Publish Your Shop Profile", "Apply for Industry Funding"].map(f => (
                                <li key={f} className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-primary" /> {f}
                                </li>
                            ))}
                        </ul>
                        <Button asChild className="w-full h-14 font-black uppercase text-lg" onClick={handleJoinClick}>
                            <Link href={ctaLink}>Unlock The Registry</Link>
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
      </section>
      
       <section className="py-20 md:py-32 bg-background">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-5xl font-black font-headline">Ready to Transform Your Business?</h2>
                <p className="mt-6 text-xl max-w-2xl mx-auto text-muted-foreground">
                    Join a growing community of transport professionals who are building a more efficient and profitable future.
                </p>
                <div className="mt-10 flex justify-center gap-4">
                     <Button asChild size="lg" className="h-14 px-12" onClick={handleJoinClick}>
                        <Link href={ctaLink}>
                            Start Free Account <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    </div>
  );
}