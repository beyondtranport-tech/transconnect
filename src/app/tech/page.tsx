
'use client';

import { useConfig } from '@/hooks/use-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Cpu, Truck } from 'lucide-react';
import FreightMatcher from './freight-matcher';

export default function TechPage() {
    const { data: pricing, isLoading } = useConfig<any>('techPricing');

    return (
        <div className="bg-background min-h-full">
            <div className="container mx-auto px-4 py-16">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <div className="inline-block bg-primary/10 p-4 rounded-full mb-4">
                        <Cpu className="h-12 w-12 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">TransConnect Tech</h1>
                    <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                        Leverage our powerful AI tools and value-added services to optimize your routes, enhance your shop, and maximize your profits.
                    </p>
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
