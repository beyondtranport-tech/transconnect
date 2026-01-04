'use client';

import { useConfig } from '@/hooks/use-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Store, Wallet, Code, Cpu, Sparkles, Video, Search } from 'lucide-react';
import FreightMatcher from './freight-matcher';
import TechCard from './tech-card';

const techOfferings = {
  shop: [
    { id: 'premiumThemes', name: 'Premium Themes', description: 'Unlock advanced, high-conversion themes for your shop.', icon: Store },
    { id: 'seoBooster', name: 'AI SEO Booster', description: 'AI-powered SEO content generation for meta titles, descriptions, and tags.', icon: Search },
    { id: 'advancedAnalytics', name: 'Advanced Analytics', description: 'Get deeper insights into your shop visitors and sales performance.', icon: Store },
    { id: 'promotionsPlus', name: 'Promotions Plus', description: 'Increase the number of promotional blocks you can display on your shop page.', icon: Store },
  ],
  generative: [
    { id: 'aiImageGenerator', name: 'AI Designer', description: 'Generate logos, banners, and product images from a text prompt.', icon: Sparkles },
    { id: 'aiVideoGenerator', name: 'AI Video Ads', description: 'Create stunning video advertisements for your products automatically.', icon: Video },
  ],
  api: [
    { id: 'aiFreightMatcher', name: 'AI Freight Matcher', description: 'Monthly access to the AI-powered freight matching tool.', icon: Code },
    { id: 'analyticsDashboard', name: 'Analytics Dashboard', description: 'Monthly access to the platform-wide analytics and trends dashboard.', icon: Code },
    { id: 'apiAccessPerCall', name: 'API Access', description: 'Pay-per-call access to the TransConnect API for custom integrations.', icon: Code, per: 'call' },
  ]
}

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
                                    <CardTitle>AI Freight Matcher Tool</CardTitle>
                                    <CardDescription>Enter your details to find matching loads instantly. This tool is available with the AI Freight Matcher subscription.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FreightMatcher />
                                </CardContent>
                            </Card>
                        </div>
                        
                        <div>
                             <h2 className="text-2xl md:text-3xl font-bold font-headline mb-8 text-center">Generative AI Suite</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                                {techOfferings.generative.map(item => (
                                    <TechCard key={item.id} {...item} price={pricing?.[item.id]} />
                                ))}
                             </div>
                        </div>

                        <div>
                             <h2 className="text-2xl md:text-3xl font-bold font-headline mb-8 text-center">Shop Enhancements</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {techOfferings.shop.map(item => (
                                    <TechCard key={item.id} {...item} price={pricing?.[item.id]} />
                                ))}
                             </div>
                        </div>
                        
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold font-headline mb-8 text-center">API & Data Services</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {techOfferings.api.filter(item => item.id !== 'aiFreightMatcher').map(item => (
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
