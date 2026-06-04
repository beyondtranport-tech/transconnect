'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, SearchCode, CheckCircle2, ShieldCheck, Database, Truck, Landmark, Building2 } from "lucide-react";
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

const { placeholderImages } = data;
const heroImage = placeholderImages.find(p => p.id === 'hero-home');

const supplierCategories = [
    "Accessories", 
    "Air",
    "Anti-Theft Devices", 
    "Auto Electrical", 
    "Batteries", 
    "Brakes", 
    "Cleaning Products",
    "Diesel", 
    "Differential",
    "Engine Refurbish",
    "Filters", 
    "Injectors", 
    "Lights", 
    "Mechanical repairs",
    "Oils & Lubricants", 
    "Parts", 
    "Prop Shafts",
    "Second Hand Trailers",
    "Second Hand Trucks",
    "Transport", 
    "Tarpaulins", 
    "Tow in", 
    "Trailer repairs", 
    "Truck Accessories", 
    "Truck Parts", 
    "Truck repairs", 
    "Turbo", 
    "Tyres"
];

// Node Component with SVG Lines and Orbital Badges
const RegistryNode = ({ title, count, icon: Icon, categories, colorClass, borderClass, lineClass, customRadius = 140 }: { title: string, count: string, icon: any, categories: string[], colorClass: string, borderClass: string, lineClass: string, customRadius?: number }) => {
    const center = 180;
    const nodeSize = 180; // Total canvas size for the node

    return (
        <div className="relative group p-4 flex flex-col items-center select-none">
            {/* SVG Connector Lines Layer */}
            <svg className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-visible transition-all duration-700", lineClass)} style={{ width: center * 2, height: center * 2 }}>
                {categories.map((_, i) => {
                    const angle = (i * (360 / categories.length) - 90) * (Math.PI / 180);
                    const x2 = center + Math.cos(angle) * customRadius;
                    const y2 = center + Math.sin(angle) * customRadius;
                    return (
                        <line 
                            key={i} 
                            x1={center} y1={center} 
                            x2={x2} y2={y2} 
                            stroke="currentColor" 
                            strokeWidth="1" 
                            strokeDasharray="3 3"
                            className="opacity-20 group-hover:opacity-60 transition-opacity duration-500"
                        />
                    );
                })}
            </svg>

            {/* Central Node */}
            <div className={cn(
                "relative z-20 w-32 h-32 md:w-40 md:h-44 rounded-full flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-500 group-hover:scale-110 border-4",
                colorClass,
                borderClass
            )}>
                <Icon className="h-6 w-6 md:h-8 md:w-8 mb-1" />
                <p className="text-xl md:text-2xl font-black tracking-tighter">{count}</p>
                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter opacity-80 px-2">{title}</p>
            </div>

            {/* Orbital Category Badges */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: center * 2, height: center * 2 }}>
                {categories.map((cat, i) => {
                    const angle = (i * (360 / categories.length) - 90) * (Math.PI / 180);
                    const x = center + Math.cos(angle) * customRadius;
                    const y = center + Math.sin(angle) * customRadius;
                    return (
                        <div 
                            key={cat}
                            className="absolute z-30"
                            style={{ 
                                left: `${x}px`, 
                                top: `${y}px`,
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                            <Badge className="text-[7px] md:text-[8px] font-black uppercase bg-slate-900/80 backdrop-blur-md border border-white/10 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-lg animate-in fade-in zoom-in duration-500 group-hover:bg-primary group-hover:text-white transition-colors">
                                {cat}
                            </Badge>
                        </div>
                    );
                })}
            </div>
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

  const transporterCount = 5420; 
  const totalRecords = Number(supplierCount) + transporterCount;

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
      
      {/* Hero Section: Staggered Triangle Node Formation */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-950 text-white py-12 md:py-20">
        <div className="absolute inset-0 z-0 opacity-10">
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

        <div className="container relative z-10 mx-auto px-4 flex flex-col items-center">
            <Badge className="mb-8 md:mb-12 bg-primary text-white border-none py-1.5 px-6 text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20">
                The Industry's Master Registry
            </Badge>

            {/* Triangle Formation */}
            <div className="relative w-full max-w-5xl h-[650px] md:h-[800px] mb-8 md:mb-12">
                {/* Top Node: Transporters */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2">
                    <RegistryNode 
                        title="Verified Transporters"
                        count={transporterCount.toLocaleString()}
                        icon={Truck}
                        colorClass="bg-blue-600/10 text-blue-100"
                        borderClass="border-blue-500/40"
                        lineClass="text-blue-500"
                        categories={["Long Haul", "Refrigerated", "Flatbed", "Tipper", "Hazmat", "LTL"]}
                        customRadius={130}
                    />
                </div>

                {/* Bottom Left Node: Suppliers - DISPLAY ALL CATEGORIES */}
                <div className="absolute bottom-0 left-0 md:left-[5%]">
                    <RegistryNode 
                        title="Spares & Service Suppliers"
                        count={`${Number(supplierCount).toLocaleString()}+`}
                        icon={Building2}
                        colorClass="bg-primary/10 text-primary-foreground"
                        borderClass="border-primary/40"
                        lineClass="text-primary"
                        categories={supplierCategories}
                        customRadius={160}
                    />
                </div>

                {/* Bottom Right Node: Finance */}
                <div className="absolute bottom-0 right-0 md:right-[5%]">
                    <RegistryNode 
                        title="Finance Partners"
                        count="85"
                        icon={Landmark}
                        colorClass="bg-amber-600/10 text-amber-100"
                        borderClass="border-amber-500/40"
                        lineClass="text-amber-500"
                        categories={["Asset Finance", "Working Capital", "Debt Funders", "Niche Lenders", "Bridging"]}
                        customRadius={130}
                    />
                </div>
            </div>

            <div className="max-w-4xl text-center space-y-6">
                <h1 className="text-3xl md:text-6xl font-black font-headline leading-tight">
                    Information to <span className="text-primary underline decoration-primary/30">Action</span>
                </h1>
                <p className="text-base md:text-2xl text-slate-400 max-w-2xl mx-auto px-4">
                    Access {totalRecords.toLocaleString()}+ verified records and forensic human contact data for R100/month.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6 pt-4 px-4 w-full">
                    <Button asChild size="lg" className="h-14 md:h-16 px-8 md:px-12 text-lg md:text-xl font-black uppercase tracking-tight shadow-2xl shadow-primary/40" onClick={handleJoinClick}>
                        <Link href={ctaLink}>
                            Start for Free <ArrowRight className="ml-2 h-6 w-6" />
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="h-14 md:h-16 px-8 md:px-12 text-lg md:text-xl font-black uppercase tracking-tight border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10">
                        <Link href="/mall">Browse Registry</Link>
                    </Button>
                </div>
            </div>
        </div>

        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </section>

      {/* Forensic Intelligence Section */}
      <section className="py-16 md:py-24 border-y bg-white">
        <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
                <div className="space-y-6">
                    <div className="bg-primary/10 p-3 rounded-xl w-fit"><SearchCode className="h-8 w-8 text-primary" /></div>
                    <h2 className="text-3xl md:text-5xl font-black font-headline">Forensic Business Intelligence</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Stop operating in the dark. Our <strong>Intelligence Membership</strong> provides the map and the direct line to the people who move the industry.
                    </p>
                    <ul className="space-y-4">
                        {[
                            "Unlock CEO/MD Names and Direct E-mails.",
                            "Access verified mobile numbers for operational leads.",
                            "Filter by industrial category and geographic hub.",
                            "Monitor community-wide supply and demand in real-time."
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm font-medium">
                                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                    <Button asChild size="lg" variant="outline" className="mt-4 font-bold border-2">
                        <Link href="/pricing">View Access Tiers</Link>
                    </Button>
                </div>
                <div className="relative mt-8 lg:mt-0">
                    <Card className="shadow-2xl border-none overflow-hidden bg-slate-900 text-white rotate-1 lg:rotate-3 scale-95 hover:rotate-0 transition-transform duration-500">
                        <CardHeader className="bg-slate-800 p-6 border-b border-white/5">
                            <CardTitle className="flex items-center gap-2 text-lg italic"><ShieldCheck className="text-primary h-5 w-5"/> Registry Access Shield</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6 font-mono text-xs">
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/10">
                                <div className="space-y-1">
                                    <p className="font-bold text-slate-400 uppercase tracking-tighter">Director Identity</p>
                                    <p className="text-white text-sm">SIPHO NKOSI [VERIFIED]</p>
                                </div>
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/10 opacity-50">
                                <div className="space-y-1">
                                    <p className="font-bold text-slate-400 uppercase tracking-tighter">Direct Mobile</p>
                                    <p className="text-white text-sm">082 *** **** [LOCKED]</p>
                                </div>
                                <Database className="h-5 w-5 text-slate-500" />
                            </div>
                             <p className="text-slate-500 text-center uppercase tracking-widest pt-4 font-sans font-bold">Subscribe to Unlock Forensic Data</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
      </section>

       <section className="py-20 md:py-32 bg-slate-50">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-5xl font-black font-headline">Absolute Access. Zero Friction.</h2>
                <p className="mt-6 text-xl max-w-2xl mx-auto text-muted-foreground">
                    Unlock the entire South African transport ecosystem for just R100/month. No setup fees, no complex tiers.
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
