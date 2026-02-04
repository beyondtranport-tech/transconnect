
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, DollarSign, Cpu, AlertCircle, Building, CheckCircle } from 'lucide-react';
import React from 'react';

const sections = [
    {
        icon: <Cpu className="h-8 w-8 text-primary" />,
        title: "What is Logistics Flow?",
        points: [
            "An integrated digital ecosystem designed specifically for the South African transport industry.",
            "A platform that unifies four core business pillars: Funding, a multi-faceted Mall, a value-added Marketplace, and a powerful Tech division.",
            "A reward-first, loyalty-driven community where member participation and moderation create a trusted, high-value network.",
        ]
    },
    {
        icon: <AlertCircle className="h-8 w-8 text-destructive" />,
        title: "The Problem We Solve",
        points: [
            "The industry is highly fragmented, leading to major inefficiencies for small and medium operators.",
            "Access to capital is a primary roadblock, as traditional banks reject viable businesses due to a lack of understanding of industry specifics.",
            "Individual operators lack the collective buying power to secure meaningful discounts on essential operational costs like parts, tires, and services.",
            "Profitability is severely impacted by 'deadhead miles'—empty return journeys that represent wasted capacity and revenue.",
        ]
    },
    {
        icon: <DollarSign className="h-8 w-8 text-primary" />,
        title: "Our Business Model",
        points: [
            "Recurring Revenue from tiered membership fees and optional 'Connect' plan subscriptions (Loyalty, Rewards, Actions).",
            "Transactional Commissions from successful deals in the Finance Mall, sales in the Supplier & Buy/Sell Malls, and value-added product sales.",
            "SaaS (Software-as-a-Service) fees for specific pay-per-use technology components, like our AI tools and API access.",
        ]
    },
    {
        icon: <CheckCircle className="h-8 w-8 text-green-500" />,
        title: "Why Logistics Flow is The Solution",
        points: [
            "Our Finance Mall connects pre-vetted borrowers with a network of niche lenders, directly solving the funding access problem.",
            "The Supplier Mall aggregates member demand to negotiate significant bulk discounts, directly reducing operational costs.",
            "Our AI Freight Matcher in the Tech Division turns wasted capacity into revenue by filling empty trucks on return journeys.",
            "The Marketplace and 'Actions Plan' empower members to become resellers, creating new, recurring revenue streams by leveraging their own networks.",
        ]
    }
];

export default function ElevatorPitch() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Elevator Pitch</h1>
                <p className="text-lg text-muted-foreground mt-2">A concise summary of the Logistics Flow opportunity.</p>
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
    