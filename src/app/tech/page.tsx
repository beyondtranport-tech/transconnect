'use client';

import { useConfig } from '@/hooks/use-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Store, Wallet, Code, Cpu, Sparkles, Video, Search, Bot, Edit, Wand2, Truck } from 'lucide-react';
import FreightMatcher from './freight-matcher';
import TechCard from './tech-card';

const aiTools = [
    { id: 'pomelli', name: 'AI Marketing Strategist', description: 'Your on-demand strategist for generating complete marketing campaigns.', icon: Wand2, priceKey: 'seoBooster' },
    { id: 'nano-banana', name: 'AI Image Enhancer', description: 'Instantly edit and enhance your product photos using simple text commands.', icon: Edit, priceKey: 'imageEnhancer' },
    { id: 'anti-gravity', name: 'AI Video Ads', description: 'Create stunning, dynamic video advertisements for your products from a text prompt.', icon: Video, priceKey: 'aiVideoGenerator' },
    { id: 'veo', name: 'AI Cinematic Shorts', description: 'Generate high-quality, cinematic video clips for social media or your website.', icon: Video, priceKey: 'aiVideoGenerator' },
    { id: 'jules', name: 'AI Freight Matcher', description: 'The core logistics tool to find the most profitable loads and reduce empty miles.', icon: Truck, priceKey: 'aiFreightMatcher' },
    { id: 'mixboard', name: 'AI Designer', description: 'Your creative partner for generating logos, banners, and marketing images instantly.', icon: Sparkles, priceKey: 'aiImageGenerator' },
    { id: 'canvas', name: 'AI SEO Booster', description: 'Automatically generate optimized titles, descriptions, and tags to boost your shop\'s visibility.', icon: Search, priceKey: 'seoBooster' },
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
                        <div>
                             <h2 className="text-2xl md:text-3xl font-bold font-headline mb-8 text-center">The TransConnect AI Toolkit</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {aiTools.map(item => (
                                    <TechCard key={item.id} {...item} price={pricing?.[item.priceKey]} />
                                ))}
                             </div>
                        </div>

                        <div className="max-w-4xl mx-auto">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Interactive Tool: AI Freight Matcher (Jules)</CardTitle>
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
