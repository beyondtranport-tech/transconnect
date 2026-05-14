'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Target, Lightbulb, CheckCircle, Handshake, ArrowRight } from "lucide-react";
import Image from 'next/image';
import data from '@/lib/placeholder-images.json';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useMemo } from "react";

const { placeholderImages } = data;

const heroImage = placeholderImages.find(p => p.id === 'about-hero');

const corePillars = [
    {
        title: "Commerce",
        description: "Enabling transporters and suppliers to create digital storefronts, sell products, and transact within a trusted network.",
    },
    {
        title: "Community",
        description: "Leveraging collective buying power and data contributions to negotiate group discounts and benefits for all members.",
    },
    {
        title: "Capital",
        description: "Using real-world operational data from platform activity to create a more accurate risk profile, unlocking access to flexible funding solutions.",
    },
];

export default function CompanyProfile({ audience, partner }: { audience: string, partner?: any }) {
    const recipientName = partner?.firstName || 'Partner';
    const companyName = partner?.companyName || 'your business';

    const opportunityConfig = useMemo(() => {
        if (audience === 'transporters') {
            return {
                title: `${recipientName}'s Transporter Opportunity`,
                content: (
                    <div className="space-y-6">
                        <p className="text-lg text-muted-foreground">Logistics Flow offers two powerful pathways for {companyName}: benefit from the ecosystem as a Member, or earn significant revenue by building the network as an ISA Partner.</p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold text-foreground">1. Membership Benefits</h4>
                                <ul className="mt-2 list-disc list-inside space-y-2 text-muted-foreground">
                                    <li>Access group discounts on parts, fuel, and services.</li>
                                    <li>Use AI tools to find loads and reduce empty miles.</li>
                                    <li>Build a trusted business profile to unlock funding opportunities.</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground">2. Become an ISA Partner</h4>
                                <ul className="mt-2 list-disc list-inside space-y-2 text-muted-foreground">
                                    <li>For transporters with a strong network of industry contacts.</li>
                                    <li>Earn recurring commissions from every member you refer.</li>
                                    <li>Turn your relationships into a new, consistent revenue stream.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )
            };
        }
        if (audience === 'suppliers') {
            return {
                title: `${recipientName}'s Supplier Opportunity`,
                content: (
                    <div className="space-y-6">
                        <p className="text-lg text-muted-foreground">Logistics Flow provides a direct, high-value sales channel for {companyName}. List your products, reach qualified buyers, and grow your market share.</p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold text-foreground">1. Your Digital Branch</h4>
                                <ul className="mt-2 list-disc list-inside space-y-2 text-muted-foreground">
                                    <li>Create a professional online shop within our Supplier Mall.</li>
                                    <li>Reach transport operators actively looking for your products.</li>
                                    <li>Reduce customer acquisition costs with a targeted audience.</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground">2. Become a Network Partner</h4>
                                <ul className="mt-2 list-disc list-inside space-y-2 text-muted-foreground">
                                    <li>Onboard your existing clients to the platform.</li>
                                    <li>Earn a recurring commission on their activity and fees.</li>
                                    <li>Monetize your customer base without operational overhead.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )
            };
        }
        return {
            title: `Partnership Opportunity for ${recipientName}`,
            content: (
                <p className="text-lg text-muted-foreground">
                    We are seeking strategic partners like {companyName} who share our vision. By joining us, you can participate in a high-growth platform that is fundamentally changing the way the logistics industry operates.
                </p>
            )
        };
    }, [audience, recipientName, companyName]);

    return (
        <div className="space-y-12">
            <section className="relative w-full h-64 rounded-xl overflow-hidden">
                 {heroImage && (
                    <Image
                        src={heroImage.imageUrl}
                        alt={heroImage.description}
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={heroImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <Building className="h-16 w-16 mb-4" />
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Logistics Flow: Company Profile</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Digitizing the logistics ecosystem to create a continuous flow of commerce, capital, and opportunity.</p>
                </div>
            </section>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Target className="h-6 w-6 text-primary" />
                        Our Mission
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-muted-foreground">
                        Our mission is to break the constraints that hold back transport businesses. By creating a unified digital platform, we empower every member of the logistics community—from independent transporters to large suppliers—with the tools to increase efficiency, reduce costs, access capital, and grow their business.
                    </p>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8 items-start">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Lightbulb className="h-6 w-6 text-destructive" />
                            The Industry Problem
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">The transport sector is the backbone of the economy, yet it operates in a fragmented, inefficient, and capital-constrained environment. Businesses like {companyName} often face:</p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li><span className="font-semibold text-foreground">High Operating Costs:</span> Lack of collective buying power means paying premium prices.</li>
                            <li><span className="font-semibold text-foreground">Limited Access to Capital:</span> Banks often don't understand the real-time health of transport businesses.</li>
                            <li><span className="font-semibold text-foreground">Inefficient Operations:</span> Empty miles and manual paperwork eating into margins.</li>
                        </ul>
                    </CardContent>
                </Card>
                 <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                           <CheckCircle className="h-6 w-6 text-green-600" />
                            The Unified Solution
                        </CardTitle>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <p className="text-muted-foreground">Logistics Flow tackles these challenges by integrating three core pillars into a single platform:</p>
                        <div className="space-y-3 pt-2">
                            {corePillars.map(pillar => (
                                <div key={pillar.title}>
                                    <h4 className="font-semibold text-foreground">{pillar.title}</h4>
                                    <p className="text-sm text-muted-foreground">{pillar.description}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Handshake className="h-6 w-6 text-primary" />
                        {opportunityConfig.title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {opportunityConfig.content}
                </CardContent>
            </Card>

        </div>
    );
}
