
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Handshake } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import data from "@/lib/placeholder-images.json";

const { placeholderImages } = data;

const wctaHeroImage = placeholderImages.find(p => p.id === 'wcta-mall-hero');

export default function WCTAMallPage() {

    return (
        <div>
            <section className="relative w-full h-80 bg-card">
                {wctaHeroImage && (
                    <Image
                        src={wctaHeroImage.imageUrl}
                        alt="WCTA Mall"
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={wctaHeroImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <div className="mb-4">
                         <Image src="/wcta-logo.png" alt="WCTA Logo" width={200} height={80} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Western Cape Truckers Association Mall</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">An exclusive hub for WCTA members to connect, grow, and save.</p>
                </div>
            </section>
            
             <section className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                     <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">A Partnership for Growth</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Logistics Flow is proud to partner with the WCTA to provide its members with unparalleled digital tools and financial opportunities.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <Card className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <Handshake className="h-8 w-8 text-primary" />
                                    <CardTitle>Become a WCTA Member</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                <p className="text-muted-foreground">Join a powerful network of transport professionals in the Western Cape. Enjoy benefits like:</p>
                                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                    <li>Industry advocacy and representation.</li>
                                    <li>Exclusive networking events.</li>
                                    <li>Access to training and resources.</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full" variant="outline">
                                    <a href="https://www.wcta.example.com/join" target="_blank" rel="noopener noreferrer">
                                        Join the WCTA
                                    </a>
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card className="border-primary border-2 flex flex-col">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                     <Image src="/logo.svg" alt="Logistics Flow Logo" width={32} height={32} />
                                    <CardTitle>Logistics Flow Special Offer</CardTitle>
                                </div>
                                <CardDescription>Exclusive for WCTA Members</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                <p className="text-muted-foreground">As a WCTA member, get <span className="font-bold text-primary">50% off your first year</span> on any Logistics Flow Premium Membership plan.</p>
                                <ul className="list-none space-y-2 text-muted-foreground">
                                    <li className="flex items-start"><CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" /> <span>Create your own professional online shop.</span></li>
                                    <li className="flex items-start"><CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" /> <span>Access funding opportunities.</span></li>
                                    <li className="flex items-start"><CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" /> <span>Use AI tools to find loads and save costs.</span></li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full">
                                    <Link href="/join?ref=WCTA">
                                        Claim Your Discount <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
}
