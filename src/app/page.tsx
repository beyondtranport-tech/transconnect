'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowRight, SearchCode, Zap, CheckCircle2, ShieldCheck, Database, Users, Building2 } from "lucide-react";
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

export default function HomePage() {
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: statsData } = useConfig<any>('supplierDiscoveryStats');

  // Hardcoded fallback counts based on user input
  const supplierCount = statsData?.counts ? Object.values(statsData.counts).reduce((a: any, b: any) => a + b, 0) : 22140;
  const transporterCount = 5420; 
  const totalRecords = supplierCount + transporterCount;

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
      
      {/* Hero Section: Data-First Branding */}
      <section className="relative w-full py-20 md:py-32 overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 z-0 opacity-40">
           {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt="Logistics Background"
              fill
              className="object-cover"
              priority
              data-ai-hint="logistics dark"
            />
          )}
        </div>
        <div className="container relative z-10 mx-auto px-4 text-center">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 py-1 px-4 text-sm font-bold uppercase tracking-widest">
            The Industry's Master Registry
          </Badge>
          <h1 className="text-4xl md:text-7xl font-black font-headline leading-tight max-w-5xl mx-auto">
            Access {totalRecords.toLocaleString()}+ Verified <span className="text-primary">Industry Records</span>
          </h1>
          <p className="mt-6 text-lg md:text-2xl max-w-3xl mx-auto text-slate-300">
            Break the constraint of limited information. Instantly find transporters, suppliers, and specialized finance partners in South Africa's largest digital logistics ecosystem.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="h-14 px-10 text-lg font-bold shadow-xl" onClick={handleJoinClick}>
              <Link href={ctaLink}>
                Get Access Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg font-bold border-white/30 hover:bg-white/10">
              <Link href="/mall">Browse the Registry</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Registry Snapshot Ticker */}
      <section className="py-12 bg-white border-y">
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center space-y-2">
                    <p className="text-5xl font-black text-primary">{supplierCount.toLocaleString()}</p>
                    <p className="text-sm font-bold uppercase tracking-tighter text-muted-foreground">Spares & Service Suppliers</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2 border-x md:px-8">
                    <p className="text-5xl font-black text-primary">{transporterCount.toLocaleString()}</p>
                    <p className="text-sm font-bold uppercase tracking-tighter text-muted-foreground">Verified Transporters</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                    <p className="text-5xl font-black text-primary">85</p>
                    <p className="text-sm font-bold uppercase tracking-tighter text-muted-foreground">Specialized Finance Partners</p>
                </div>
            </div>
        </div>
      </section>

      {/* The Intelligence Hook */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-6">
                    <div className="bg-primary/10 p-3 rounded-xl w-fit"><SearchCode className="h-8 w-8 text-primary" /></div>
                    <h2 className="text-3xl md:text-5xl font-black font-headline">Information to Action</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Searching for reliable partners used to take days of phone calls and manual vetting. With the <strong>Intelligence Membership</strong>, we give you the map to the entire ecosystem. 
                    </p>
                    <ul className="space-y-4">
                        {[
                            "Search by industrial category, location, and specialization.",
                            "Unlock forensic human data (CEO names, direct emails, mobile numbers).",
                            "Initiate digital handshakes and request quotes instantly.",
                            "Track all interactions on a secure, compliant digital ledger."
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm font-medium">
                                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                    <Button asChild size="lg" variant="outline" className="mt-4">
                        <Link href="/pricing">View Intelligence Membership <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </div>
                <Card className="shadow-2xl border-none overflow-hidden bg-slate-50">
                    <CardHeader className="bg-slate-900 text-white p-6">
                        <CardTitle className="flex items-center gap-2 text-xl"><Zap className="text-primary"/> Live Discovery Engine</CardTitle>
                        <CardDescription className="text-slate-400">Our AI agents are constantly scanning and vetting new partners.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="p-6 space-y-4 font-mono text-xs overflow-hidden">
                             <div className="flex justify-between items-center p-2 bg-white rounded border animate-pulse">
                                <span>[DISCOVERY] New Supplier: Parts SA</span>
                                <Badge variant="outline" className="text-[10px]">VERIFIED</Badge>
                             </div>
                             <div className="flex justify-between items-center p-2 bg-white rounded border opacity-80">
                                <span>[DISCOVERY] New Transporter: Cape Haulage</span>
                                <Badge variant="outline" className="text-[10px]">VERIFIED</Badge>
                             </div>
                             <div className="flex justify-between items-center p-2 bg-white rounded border opacity-60">
                                <span>[DISCOVERY] New Vendor: Tyre Tech JHB</span>
                                <Badge variant="outline" className="text-[10px]">VERIFIED</Badge>
                             </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-white p-6 border-t flex flex-col items-center">
                        <p className="text-center text-sm font-bold mb-4 uppercase tracking-widest text-muted-foreground">Ready to search the full database?</p>
                        <Button className="w-full" onClick={handleJoinClick}>Unlock All {totalRecords.toLocaleString()}+ Records</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
      </section>

      {/* Call to Action Section */}
       <section className="py-20 md:py-32 bg-slate-50 border-t">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-5xl font-black font-headline">One Membership. Absolute Access.</h2>
                <p className="mt-6 text-xl max-w-2xl mx-auto text-muted-foreground">
                    Get the Intelligence Membership for just R100/month. No complex tiers. No hidden fees. Just the data you need to grow.
                </p>
                <div className="mt-10 flex justify-center gap-4">
                     <Button asChild size="lg" className="h-14 px-12" onClick={handleJoinClick}>
                        <Link href={ctaLink}>
                            Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    </div>
  );
}