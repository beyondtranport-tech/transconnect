'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, AlertCircle, Handshake, CheckCircle } from 'lucide-react';
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
        title: "The Investment Opportunity",
        points: [
            "Capitalize on a first-mover advantage in a massive, underserved market with a proven business model.",
            "Invest in a platform with multiple, diversified revenue streams: subscription fees, transaction commissions, and SaaS product sales.",
            "The platform is designed for exponential growth through powerful network effects; as the community grows, its value and revenue potential increase.",
            "Our technology is built to scale, ensuring low marginal costs for each new member added to the ecosystem."
        ]
    },
    {
        icon: <CheckCircle className="h-8 w-8 text-green-500" />,
        title: "Why TransConnect is the Right Investment",
        points: [
            "We have deep industry expertise and a clear understanding of the market's pain points.",
            "Our business model is not just theoretical; it's a practical solution already generating traction.",
            "We are solving fundamental problems in a critical sector of the economy, creating both financial returns and significant social impact."
        ]
    }
];

export default function InvestorElevatorPitch() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Investor Elevator Pitch</h1>
                <p className="text-lg text-muted-foreground mt-2">A concise summary of the TransConnect investment opportunity.</p>
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
