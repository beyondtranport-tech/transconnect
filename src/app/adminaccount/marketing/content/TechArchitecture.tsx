'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Server, Database, BrainCircuit, ShieldCheck } from "lucide-react";
import Image from 'next/image';

export default function TechArchitecture() {
    const techStack = [
        { name: 'Next.js & React', description: 'For a high-performance, server-rendered frontend.', logo: 'https://placehold.co/40x40?text=Next' },
        { name: 'Firebase', description: 'Powers our secure backend, database, and authentication.', logo: 'https://placehold.co/40x40?text=FB' },
        { name: 'Google Cloud & Genkit', description: 'Drives all AI features, from content generation to data analysis.', logo: 'https://placehold.co/40x40?text=GCP' },
        { name: 'Tailwind CSS & ShadCN', description: 'For a modern, responsive, and customizable user interface.', logo: 'https://placehold.co/40x40?text=UI' },
    ];

    return (
        <div className="space-y-8">
            <CardHeader className="px-0">
                <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-6 w-6" />
                    Technology Architecture
                </CardTitle>
                <CardDescription>An overview of the robust, scalable, and secure technologies that power the Logistics Flow platform.</CardDescription>
            </CardHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><Server className="h-5 w-5 text-primary"/>Frontend & Backend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Our platform is built on a modern, serverless architecture using Next.js for the frontend, providing a fast and responsive user experience. The backend is powered by Firebase, including serverless functions for scalable, on-demand processing.
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><Database className="h-5 w-5 text-primary"/>Database & Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            We use Firestore, a NoSQL document database from Google, to securely store all platform data. It's designed for massive scale, real-time data synchronization, and robust security rules to ensure data privacy and integrity.
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><BrainCircuit className="h-5 w-5 text-primary"/>Artificial Intelligence</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            All AI capabilities are built using Google's Genkit framework, leveraging powerful models like Gemini for tasks such as freight matching, content generation, and business intelligence.
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-primary"/>Security</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Security is foundational. We use Firebase Authentication for secure user management and enforce strict access control with Firestore Security Rules. All data is encrypted in transit and at rest.
                        </p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                 <CardHeader>
                    <CardTitle>Core Technologies</CardTitle>
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
