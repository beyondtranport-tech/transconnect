'use client';

import Image from "next/image";
import data from "@/lib/placeholder-images.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Store, Rocket, Handshake, Users, ShieldCheck, Database, Zap, Target } from "lucide-react";
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
        <section className="relative w-full h-64 md:h-80 bg-slate-900">
            {aboutHeroImage && (
                <Image
                    src={aboutHeroImage.imageUrl}
                    alt={aboutHeroImage.description}
                    fill
                    className="object-cover opacity-50"
                    priority
                    data-ai-hint="logistics dark"
                />
            )}
            <div className="relative h-full flex flex-col items-center justify-center text-center text-white z-10 p-4">
                <h1 className="text-4xl md:text-5xl font-black font-headline">Breaking the Information Constraint</h1>
                <p className="mt-4 text-lg md:text-xl max-w-3xl">Logistics Flow is a Data-as-a-Service ecosystem built to map the South African transport industry.</p>
            </div>
        </section>

        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline">From Information to Transaction</h2>
                    <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                       The biggest barrier to growth is the lack of verified information. We provide the forensic intelligence to find your next partner, and the digital tools to close the deal.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="bg-primary/10 p-4 rounded-2xl w-fit"><Zap className="h-10 w-10 text-primary"/></div>
                        <h3 className="text-3xl font-black font-headline text-foreground">The Intelligence Mechanism</h3>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            We don't just list your business; we actively track market interest. Our system records every time a verified member selects your profile to engage, creating a high-intent sales pipeline for you.
                        </p>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                                <div>
                                    <p className="font-bold">Inbound Interest Tracking</p>
                                    <p className="text-sm text-muted-foreground">Receive real-time alerts on your dashboard when community members are looking at your capacity.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                                <div>
                                    <p className="font-bold">Forensic Lead Generation</p>
                                    <p className="text-sm text-muted-foreground">Unlock "Blind Leads" to see exactly which companies want to do business with you.</p>
                                </div>
                            </div>
                        </div>
                        <Button asChild size="lg" className="mt-4 font-bold">
                            <Link href={ctaLink}>Activate Your Sales Node <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </div>
                    <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
                         <Image
                            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000"
                            alt="Data Analytics"
                            fill
                            className="object-cover"
                            data-ai-hint="data analytics"
                        />
                    </div>
                </div>
            </div>
        </section>

        <section className="py-16 md:py-24 bg-slate-900 text-white">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-black font-headline text-primary">The Earning Pathway</h2>
                    <p className="mt-4 text-lg text-slate-400">
                        Our most successful members don't just use the data—they help build the registry and get paid in return.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <Card className="bg-white/5 border-white/10 text-white">
                        <CardHeader>
                            <Database className="h-8 w-8 text-primary mb-2" />
                            <CardTitle>Data as an Asset</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-400">Contribute your verified fleet or supplier data to earn reward points and de-risk your business for funders.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/5 border-white/10 text-white">
                        <CardHeader>
                            <Target className="h-8 w-8 text-primary mb-2" />
                            <CardTitle>High-Intent Matches</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-400">We match your specific fleet capabilities with incoming freight requirements in the Loads Mall.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/5 border-white/10 text-white">
                        <CardHeader>
                            <ShieldCheck className="h-8 w-8 text-primary mb-2" />
                            <CardTitle>Trusted Handshake</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-400">We verify identities to ensure you're transacting with real business owners, not middlemen.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    </div>
  );
}
