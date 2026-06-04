'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, SearchCode, CheckCircle2, ShieldCheck, Database, Truck, Landmark, Building2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import data from "@/lib/placeholder-images.json";
import { useUser } from "@/firebase";
import * as React from "react";
import { useState } from "react";
import * as gtag from '@/lib/gtag';
import { HomeIntentModal } from "./home-intent-modal";
import { useConfig } from "@/hooks/use-config";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const { placeholderImages } = data;
const heroImage = placeholderImages.find(p => p.id === 'hero-home');

// Node Component for the orbital visual
const RegistryNode = ({ title, count, icon: Icon, categories, colorClass }: { title: string, count: string, icon: any, categories: string[], colorClass: string }) => (
    <div className="relative group p-4 flex flex-col items-center">
        {/* Central Node */}
        <div className={cn(
            "relative z-10 w-40 h-40 md:w-48 md:h-48 rounded-full flex flex-col items-center justify-center text-center shadow-2xl transition-transform group-hover:scale-105 border-4",
            colorClass
        )}>
            <Icon className="h-10 w-10 mb-2" />
            <p className="text-2xl md:text-3xl font-black">{count}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{title}</p>
        </div>

        {/* Orbital Categories */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[320px] md:h-[320px] pointer-events-none hidden sm:block">
            {categories.map((cat, i) => {
                const angle = (i * (360 / categories.length)) * (Math.PI / 180);
                const radius = 130; 
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                return (
                    <div 
                        key={cat}
                        className="absolute text-[9px] font-black uppercase bg-white/10 backdrop-blur-md border border-white/20 text-white px-2 py-1 rounded-full whitespace-nowrap shadow-lg animate-pulse"
                        style={{ 
                            left: `calc(50% + ${x}px)`, 
                            top: `calc(50% + ${y}px)`,
                            transform: 'translate(-50%, -50%)',
                            animationDelay: `${i * 0.5}s`
                        }}
                    >
                        {cat}
                    </div>
                );
            })}
        </div>
    </div>
);

export default function HomePage() {
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: statsData } = useConfig<any>('supplierDiscoveryStats');

  const supplierCount = statsData?.counts ? Object.values(statsData.counts).reduce((a: any, b: any) => a + (Number(b) || 0), 0) : 22140;
  const transporterCount = 5420; 
  const totalRecords = (Number(supplierCount) || 0) + transporterCount;

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
      
      {/* Hero Section: Dynamic Orbital Visual */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-slate-950 text-white">
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

        <div className="container relative z-10 mx-auto px-4 flex flex-col items-center">
            <Badge className="mb-8 bg-primary text-white border-none py-1.5 px-6 text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20">
                The Industry's Master Registry
            </Badge>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-24 lg:gap-12 mb-20 items-center justify-center">
                <RegistryNode 
                    title="Verified Transporters"
                    count="5,420"
                    icon={Truck}
                    colorClass="bg-blue-600/20 border-blue-500/50 text-blue-100"
                    categories={["Long Haul", "Refrigerated", "Flatbed", "Tipper", "Distribution"]}
                />
                <RegistryNode 
                    title="Spares & Service Suppliers"
                    count={`${(Number(supplierCount) || 22140).toLocaleString()}+`}
                    icon={Building2}
                    colorClass="bg-primary/20 border-primary/50 text-primary-foreground"
                    categories={["Engine parts", "Tyres", "Differential", "Prop Shafts", "Air Systems", "Mechanical"]}
                />
                <RegistryNode 
                    title="Finance Partners"
                    count="85"
                    icon={Landmark}
                    colorClass="bg-amber-600/20 border-amber-500/50 text-amber-100"
                    categories={["Asset Finance", "Working Capital", "Debt Funders", "Niche Lenders"]}
                />
            </div>

            <div className="max-w-4xl text-center space-y-6">
                <h1 className="text-4xl md:text-6xl font-black font-headline leading-tight">
                    Information to <span className="text-primary underline decoration-primary/30">Action</span>
                </h1>
                <p className="text-lg md:text-2xl text-slate-400 max-w-2xl mx-auto">
                    The Information Divide is the biggest constraint to your growth. Access {totalRecords.toLocaleString()}+ verified records and forensic human contact data for R100/month.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
                    <Button asChild size="lg" className="h-16 px-12 text-xl font-black uppercase tracking-tight shadow-2xl shadow-primary/40" onClick={handleJoinClick}>
                        <Link href={ctaLink}>
                            Start for Free <ArrowRight className="ml-2 h-6 w-6" />
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="h-16 px-12 text-xl font-black uppercase tracking-tight border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10">
                        <Link href="/mall">Browse Registry</Link>
                    </Button>
                </div>
            </div>
        </div>

        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
      </section>

      {/* Forensic Intelligence Section */}
      <section className="py-16 md:py-24 border-y">
        <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
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
                <div className="relative">
                    <Card className="shadow-2xl border-none overflow-hidden bg-slate-900 text-white rotate-1 lg:rotate-3 scale-95 hover:rotate-0 transition-transform duration-500">
                        <CardHeader className="bg-slate-800 p-6 border-b border-white/5">
                            <CardTitle className="flex items-center gap-2 text-lg italic"><ShieldCheck className="text-primary h-5 w-5"/> Registry Access Shield</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6 font-mono text-xs">
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/10">
                                <div className="space-y-1">
                                    <p className="font-bold text-slate-400">MD IDENTITY</p>
                                    <p className="text-white text-sm">SIPHO NKOSI [VERIFIED]</p>
                                </div>
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/10 opacity-50">
                                <div className="space-y-1">
                                    <p className="font-bold text-slate-400">DIRECT MOBILE</p>
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
