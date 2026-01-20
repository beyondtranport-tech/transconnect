
'use client';

import { useConfig } from '@/hooks/use-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Cpu, Truck } from 'lucide-react';
import FreightMatcher from './freight-matcher';
import Image from 'next/image';
import data from '@/lib/placeholder-images.json';

const { placeholderImages } = data;
const techImage = placeholderImages.find(p => p.id === "tech-home");

export default function TechPage() {
    const { data: pricing, isLoading } = useConfig<any>('techPricing');

    return (
        <div className="bg-background min-h-full">
            <div className="container mx-auto px-4 py-16">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <div className="inline-block bg-primary/10 p-4 rounded-full mb-4">
                        <Cpu className="h-12 w-12 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Create Your Information Flow</h1>
                    <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                        Inefficiency is a constraint on your profitability. Our Tech Division provides AI-powered tools, like the Freight Matcher, to break the constraint of wasted capacity and empty miles, creating a seamless flow of data-driven decisions that boost your bottom line.
                    </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-12 items-center my-16 md:my-24">
                    <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl">
                        {techImage && (
                        <Image
                            src={techImage.imageUrl}
                            alt={techImage.description}
                            fill
                            className="object-cover"
                            data-ai-hint={techImage.imageHint}
                        />
                        )}
                    </div>
                    <div>
                        <span className="text-primary font-semibold">TECH-POWERED</span>
                        <h2 className="text-3xl md:text-4xl font-bold font-headline mt-2">Smarter, Faster, Further</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                        Our advanced technology suite, featuring an AI-powered freight matching system, helps you eliminate guesswork, reduce empty miles, and maximize your profitability. Find the perfect load in real-time.
                        </p>
                    </div>
                </div>

                 {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                 ) : (
                    <div className="space-y-16">
                        <div className="max-w-4xl mx-auto">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Truck className="h-6 w-6"/>AI Freight Matcher</CardTitle>
                                    <CardDescription>Enter your details to find matching loads instantly. This tool is available with the AI Freight Matcher subscription.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FreightMatcher />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                 )}
            </div>
        </div>
    );
}
