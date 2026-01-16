'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, DollarSign, Cpu, AlertCircle, Handshake, CheckCircle } from 'lucide-react';
import React from 'react';

const sections = [
    {
        icon: <Cpu className="h-8 w-8 text-primary" />,
        title: "What is TransConnect?",
        points: [
            "An integrated digital ecosystem designed specifically for the South African transport industry.",
            "A platform that unifies four core business pillars: Funding, a multi-faceted Mall, a value-added Marketplace, and a powerful Tech division.",
            "A reward-first, loyalty-driven community where member participation and collaboration create a high-value network."
        ]
    },
    {
        icon: <AlertCircle className="h-8 w-8 text-destructive" />,
        title: "The Problem We Solve for Transporters",
        points: [
            "Access to capital is a primary roadblock, as traditional banks often reject viable businesses.",
            "Individual operators lack the collective buying power to secure meaningful discounts on parts, tires, and services.",
            "Profitability is severely impacted by 'deadhead miles'—empty return journeys that represent wasted capacity and revenue.",
            "The industry is highly fragmented, leading to major inefficiencies for small and medium operators."
        ]
    },
    {
        icon: <Handshake className="h-8 w-8 text-primary" />,
        title: "The Partnership Opportunity",
        points: [
            "Offer your existing network access to a platform that solves their biggest challenges: funding, cost savings, and finding work.",
            "Earn significant, recurring revenue from membership fees and a share of all transactions your referred members make on the platform.",
            "Solidify your position as a key enabler in the industry by providing tangible value to your members or clients.",
            "Partners receive a Free Lifetime Premium Membership to access all platform benefits."
        ]
    },
    {
        icon: <CheckCircle className="h-8 w-8 text-green-500" />,
        title: "Why TransConnect is the Ideal Partner",
        points: [
            "Our platform handles all tracking, transactions, and commission payouts automatically and transparently through your dedicated dashboard.",
            "We provide you with the marketing materials and unique referral links to make onboarding your network seamless.",
            "By partnering with us, you help create a stronger, more efficient industry, benefiting your network and generating a new revenue stream for your business."
        ]
    }
];

export default function PartnerElevatorPitch() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Partner Elevator Pitch</h1>
                <p className="text-lg text-muted-foreground mt-2">A concise summary of the TransConnect partnership opportunity.</p>
            </div>

            {sections.map(section => (
                <Card key={section.title}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            {section.icon}
                            {section.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                            {section.points.map((point, index) => (
                                <li key={index}>{point}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
