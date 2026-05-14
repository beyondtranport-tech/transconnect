'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Server, Database, BrainCircuit, ShieldCheck } from "lucide-react";
import Image from 'next/image';

export default function TechArchitecture({ partner }: { partner?: any }) {
    const recipientName = partner?.firstName || 'Partner';
    const companyName = partner?.companyName || 'your business';

    const techStack = [
        { name: 'Next.js & React', description: 'For a high-performance, server-rendered frontend experience.', logo: 'https://placehold.co/40x40?text=Next' },
        { name: 'Firebase', description: 'Powers our secure backend, database, and authentication.', logo: 'https://placehold.co/40x40?text=FB' },
        { name: 'Google Cloud & Genkit', description: 'Drives all AI features, from load matching to business intelligence.', logo: 'https://placehold.co/40x40?text=GCP' },
        { name: 'Tailwind CSS', description: 'Ensures a modern, responsive interface on any device.', logo: 'https://placehold.co/40x40?text=UI' },
    ];

    return (
        <div className="space-y-8">
            <CardHeader className="px-0">
                <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-6 w-6" />
                    Technology Architecture for {recipientName}
                </CardTitle>
                <CardDescription>
                    How Logistics Flow provides {companyName} with a robust, scalable, and secure digital infrastructure.
                </CardDescription>
            </CardHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><Server className="h-5 w-5 text-primary"/>Performance & Scale</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Built on a modern, serverless architecture, our platform ensures that {companyName} experiences zero downtime and lightning-fast load times, even when managing large inventories or fleet data.
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><Database className="h-5 w-5 text-primary"/>Real-Time Ledger</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Utilizing Google's Firestore, we maintain a real-time digital ledger of all activity. This creates an immutable track record of performance that {recipientName} can leverage for funding and partnership validations.
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><BrainCircuit className="h-5 w-5 text-primary"/>Integrated Intelligence</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            AI is not an add-on; it's core to our system. Using Gemini 1.5, we provide tools that help {companyName} automate SEO, generate marketing assets, and match freight loads with unprecedented accuracy.
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-primary"/>Enterprise-Grade Security</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Security is our priority. We employ full encryption and strict Firestore Security Rules, ensuring that {companyName}'s sensitive business data remains private and protected at all times.
                        </p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                 <CardHeader>
                    <CardTitle>Core Technology Stack</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {techStack.map(tech => (
                             <div key={tech.name} className="flex items-center gap-4 p-3 border rounded-lg">
                                <Image src={tech.logo} alt={`${tech.name} logo`} width={40} height={40} className="rounded-md" />
                                <div>
                                    <h4 className="font-semibold">{tech.name}</h4>
                                    <p className="text-sm text-muted-foreground">{tech.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
