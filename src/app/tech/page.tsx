
'use client';

import { useConfig } from '@/hooks/use-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Store, Wallet, Code, Cpu, Sparkles, Video, Search, Bot, Edit } from 'lucide-react';
import FreightMatcher from './freight-matcher';
import TechCard from './tech-card';

const aiTools = [
    { id: 'aiFreightMatcher', name: 'AI Freight Matcher', description: 'Find the most profitable loads with our intelligent freight matching engine.', icon: Bot },
    { id: 'seoBooster', name: 'AI SEO Booster', description: 'Automatically generate SEO-friendly titles, descriptions, and tags for your shop.', icon: Search },
    { id: 'aiImageGenerator', name: 'AI Designer', description: 'Generate logos, banners, and product images from a text prompt.', icon: Sparkles },
    { id: 'aiVideoGenerator', name: 'AI Video Ads', description: 'Create stunning video advertisements for your products automatically.', icon: Video },
    { id: 'imageEnhancer', name: 'AI Image Enhancer', description: 'Edit and improve your existing product photos with simple text commands.', icon: Edit },
    { id: 'apiAccessPerCall', name: 'API Access', description: 'Integrate your own systems with TransConnect data via pay-per-call API access.', icon: Code, per: 'call' },
];


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
                                    <CardTitle>Interactive Tool: AI Freight Matcher</CardTitle>
                                    <CardDescription>Enter your details to find matching loads instantly. This tool is available with the AI Freight Matcher subscription.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FreightMatcher />
                                </CardContent>
                            </Card>
                        </div>
                        
                        <div>
                             <h2 className="text-2xl md:text-3xl font-bold font-headline mb-8 text-center">The TransConnect AI Toolkit</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {aiTools.map(item => (
                                    <TechCard key={item.id} {...item} price={pricing?.[item.id]} />
                                ))}
                             </div>
                        </div>

                    </div>
                 )}
            </div>
        </div>
    );
}
