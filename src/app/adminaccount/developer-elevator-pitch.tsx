'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Code, DollarSign, Handshake } from 'lucide-react';
import React from 'react';

const sections = [
    {
        icon: <Code className="h-8 w-8 text-primary" />,
        title: "The Opportunity for Developers",
        points: [
            "Leverage a growing ecosystem of logistics data to build powerful, real-world applications.",
            "Gain access to a captive market of transport companies actively looking for tech solutions.",
            "Monetize your skills by building and selling custom integrations, tools, and services on our platform."
        ]
    },
    {
        icon: <Handshake className="h-8 w-8 text-primary" />,
        title: "What We're Looking For",
        points: [
            "Talented developers and teams who want to build innovative solutions for the transport industry.",
            "Partners to help us expand our API and create integrations with other leading software platforms.",
            "Innovators who can create new tools that provide value to our members."
        ]
    },
    {
        icon: <DollarSign className="h-8 w-8 text-primary" />,
        title: "The Commercial Model",
        points: [
            "We offer a revenue-sharing model for applications and services sold through our marketplace.",
            "Gain access to our user base without the high cost of sales and marketing.",
            "Potential for direct investment or project funding for promising applications."
        ]
    }
];

export default function DeveloperElevatorPitch() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Developer Elevator Pitch</h1>
                <p className="text-lg text-muted-foreground mt-2">A concise summary of the Logistics Flow partnership opportunity for developers.</p>
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
