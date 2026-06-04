'use client';

import Image from "next/image";
import data from "@/lib/placeholder-images.json";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, ArrowRight, DollarSign, Handshake, Cpu, Shield, Store, Rocket, Target, Users } from "lucide-react";
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
    <div className="bg-background">
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
                <h1 className="text-4xl md:text-5xl font-black font-headline">Business Success Engine</h1>
                <p className="mt-4 text-lg md:text-xl max-w-3xl">Beyond data: The infrastructure to scale your logistics operations.</p>
            </div>
        </section>

        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline">From Discovery to Transaction</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                       Logistics Flow starts with intelligence, but it succeeds through trade. Once you've used our registry to find your next lead or supplier, we provide the digital tools to close the deal.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="bg-primary/10 p-4 rounded-2xl w-fit"><Store className="h-10 w-10 text-primary"/></div>
                        <h3 className="text-3xl font-black font-headline">Your Digital Branch</h3>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Creating a professional online presence shouldn't be a constraint. With an Intelligence Membership, you can create a complete digital twin of your business in minutes.
                        </p>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                                <div>
                                    <p className="font-bold">Automated Shop Wizard</p>
                                    <p className="text-sm text-muted-foreground">Add products, service lanes, and routes with a simple form.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                                <div>
                                    <p className="font-bold">Verified RC1 Registry</p>
                                    <p className="text-sm text-muted-foreground">Contribute your fleet data to show customers you have verified capacity.</p>
                                </div>
                            </div>
                        </div>
                        <Button asChild size="lg" className="mt-4">
                            <Link href={ctaLink}>Create Your Digital Profile <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </div>
                    <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
                         <Image
                            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=1000"
                            alt="Business Growth"
                            fill
                            className="object-cover"
                            data-ai-hint="business growth"
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
                        Our most successful members don't just use the data—they help build it and get paid in return.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <Card className="bg-white/5 border-white/10 text-white">
                        <CardHeader>
                            <Users className="h-8 w-8 text-primary mb-2" />
                            <CardTitle>Invite Your Network</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-400">Invite your trusted transporters and suppliers to the registry. Each successful sign-up earns you recurring points and potential commission.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/5 border-white/10 text-white">
                        <CardHeader>
                            <Rocket className="h-8 w-8 text-primary mb-2" />
                            <CardTitle>ISA Partnership</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-400">Top contributors can graduate to our Independent Sales Agent tier, unlocking a share of total ecosystem revenue generated by their network.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/5 border-white/10 text-white">
                        <CardHeader>
                            <Handshake className="h-8 w-8 text-primary mb-2" />
                            <CardTitle>Collective Power</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-400">By centralizing industrial intelligence, we negotiate bulk discounts on tires, fuel, and parts that were previously only available to giant fleets.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    </div>
  );
}
