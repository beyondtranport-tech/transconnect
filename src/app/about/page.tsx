'use client';

import Image from "next/image";
import data from "@/lib/placeholder-images.json";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Fingerprint, Database, Zap, Scale, ShieldCheck, Globe, Banknote, Landmark } from "lucide-react";
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
                <Badge className="bg-primary/20 text-primary border-primary/30 mb-6 py-1.5 px-6 font-black uppercase tracking-widest text-[10px]">Industrial Infrastructure</Badge>
                <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight">Data Foundation. Transactional Engine.</h1>
                <p className="mt-4 text-lg md:text-xl max-w-3xl text-slate-300">Logistics Flow is a Data-as-a-Service ecosystem built to map, optimize, and fund the South African transport grid.</p>
            </div>
        </section>

        {/* LAYER 1 & 2: THE MAP */}
        <section className="py-24 bg-white border-b">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6 text-left">
                        <div className="bg-primary/10 p-4 rounded-2xl w-fit shadow-inner"><Database className="h-10 w-10 text-primary"/></div>
                        <h3 className="text-4xl font-black font-headline text-foreground leading-tight">The Map: Forensic Intelligence</h3>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            We have cataloged over 22,000 industrial records. We provide the forensic map of every haulier, supplier, and lender in the grid, giving you direct lines to MD/CEO level decision-makers.
                        </p>
                        <div className="space-y-4">
                            <div className="flex gap-4 items-start">
                                <Fingerprint className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div className="text-left">
                                    <p className="font-bold text-foreground">Layer 1: Node Ownership</p>
                                    <p className="text-sm text-muted-foreground">Claim your existing record for R10/mo to verify your digital identity and manage your community reputation.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <Database className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div className="text-left">
                                    <p className="font-bold text-foreground">Layer 2: Registry Intelligence</p>
                                    <p className="text-sm text-muted-foreground">Unlock absolute transparency with direct contact details for 22,000+ verified transport and supply entities.</p>
                                </div>
                            </div>
                        </div>
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

        {/* LAYER 3 & 4: THE ENGINE */}
        <section className="py-24 bg-slate-950 text-white border-b">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="md:order-2 space-y-6 text-left">
                        <div className="bg-primary/10 p-4 rounded-2xl w-fit shadow-inner"><Scale className="h-10 w-10 text-primary"/></div>
                        <h3 className="text-4xl font-black font-headline text-white leading-tight">The Engine: Transactional Execution</h3>
                        <p className="text-lg text-slate-300 leading-relaxed text-left">
                            A map is useless without a vehicle. Logistics Flow provides the transactional engine to execute deals, verify compliance, and fund your growth.
                        </p>
                        <div className="space-y-4">
                            <div className="flex gap-4 items-start">
                                <Zap className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div className="text-left">
                                    <p className="font-bold text-white">Layer 3: Mall Intelligence</p>
                                    <p className="text-sm text-slate-400">Access deep-data nodes within specialized malls to find matching loads, fleet capacity, or warehousing space.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div className="text-left">
                                    <p className="font-bold text-white">Layer 4: Transactional Membership</p>
                                    <p className="text-sm text-slate-400">The operational tier. Use our fulfillment ledger, digital branch tools, and settlement engine to close business on-platform.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="md:order-1 relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                        <Image
                            src={placeholderImages.find(p => p.id === 'tech-division')!.imageUrl}
                            alt="Digital Engine"
                            fill
                            className="object-cover"
                            data-ai-hint="futuristic logistics"
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* SUMMARY SECTION */}
        <section className="py-24 bg-white text-center">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl font-black font-headline text-foreground">The Industrial Handshake</h2>
                    <p className="mt-4 text-lg text-muted-foreground text-center">
                        Our most successful members don't just use the data—they help build the registry and get paid in return.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 text-left">
                    <Card className="bg-slate-50 border-none shadow-lg text-left group hover:bg-primary transition-colors">
                        <CardContent className="p-8 space-y-4">
                            <Globe className="h-10 w-10 text-primary group-hover:text-white" />
                            <h3 className="text-xl font-bold group-hover:text-white">Absolute Visibility</h3>
                            <p className="text-sm text-muted-foreground group-hover:text-white/80 leading-relaxed">Stop operating in the dark. Use our forensic registry to find every haulier and supplier in South Africa.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50 border-none shadow-lg text-left group hover:bg-primary transition-colors">
                        <CardContent className="p-8 space-y-4">
                            <Banknote className="h-10 w-10 text-primary group-hover:text-white" />
                            <h3 className="text-xl font-bold group-hover:text-white">Direct Capital</h3>
                            <p className="text-sm text-muted-foreground group-hover:text-white/80 leading-relaxed">We use your real-world transactional data to fund your business where traditional banks fail.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50 border-none shadow-lg text-left group hover:bg-primary transition-colors">
                        <CardContent className="p-8 space-y-4">
                            <Landmark className="h-10 w-10 text-primary group-hover:text-white" />
                            <h3 className="text-xl font-bold group-hover:text-white">Reputation Nodes</h3>
                            <p className="text-sm text-muted-foreground group-hover:text-white/80 leading-relaxed">Build a verified track record in the community. Secure your identity and earn the trust of the grid.</p>
                        </CardContent>
                    </Card>
                </div>
                <div className="mt-16">
                    <Button asChild size="lg" className="h-16 px-12 text-lg font-black uppercase tracking-tight shadow-xl">
                        <Link href={ctaLink}>Establish My Digital standing <ArrowRight className="ml-2 h-5 w-5"/></Link>
                    </Button>
                </div>
            </div>
        </section>
    </div>
  );
}
