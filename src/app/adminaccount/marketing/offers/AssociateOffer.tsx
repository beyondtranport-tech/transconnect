'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Sparkles, Video, Share2, DollarSign, TrendingUp, Zap, CheckCircle, BarChart3 } from "lucide-react";
import React from "react";
import { formatCurrency } from '@/lib/utils';

export default function AssociateOffer() {
    return (
        <div className="space-y-8 text-left text-foreground">
            <div className="text-left">
                <h1 className="text-3xl font-bold font-headline">The Digital Associate Offer</h1>
                <p className="text-lg text-muted-foreground mt-2">
                    Monetize your audience and influence. Use our advanced AI studio to create content and earn recurring revenue from the logistics ecosystem.
                </p>
            </div>

            <Card className="border-primary border-2 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        The Core Value: Creative Power
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg leading-relaxed">
                        As a Digital Associate, you gain <strong className="text-primary">Free Lifetime Access</strong> to our AI Content Studio. Generate 4K industrial videos, high-fidelity marketing images, and conversion-optimized copy instantly. We provide the tools; you provide the reach.
                    </p>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8 text-left">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-6 w-6 text-primary" />
                            Revenue Stream #1: Recurring Commission
                        </CardTitle>
                        <CardDescription>Earn a monthly annuity from your network.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow">
                        <p className="text-sm">Earn up to <strong className="text-primary">30% commission</strong> on every monthly membership fee paid by users who join through your unique node. This is passive, recurring income for the lifetime of their membership.</p>
                        <div className="p-4 bg-muted/30 rounded-xl border border-dashed text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Earning Potential</p>
                            <p className="text-sm font-bold">Refer 100 members @ R500/mo = <span className="text-green-600">R15,000 Monthly Passive Income</span></p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-6 w-6 text-primary" />
                            Revenue Stream #2: Transactional Splits
                        </CardTitle>
                        <CardDescription>Participate in ecosystem commerce.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow">
                        <p className="text-sm">Your earnings scale with your network's activity. When your members buy tires, parts, or access finance through our Malls, you receive a share of the platform commission.</p>
                        <ul className="text-xs space-y-2">
                            <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-600" /> Share in Finance Mall origination fees.</li>
                            <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-600" /> Share in Supplier Mall transaction fees.</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Video className="h-6 w-6 text-primary" />
                        Built-in Content Production
                    </CardTitle>
                    <CardDescription>Professional marketing assets at your fingertips.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        No expensive cameras or editing suites required. Our integrated AI Studio allows you to generate cinematic industrial footage and social-ready visual assets optimized for Facebook, LinkedIn, and TikTok. 
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 border rounded-lg text-center bg-slate-50">
                            <Video className="h-5 w-5 mx-auto mb-1 opacity-50" />
                            <p className="text-[10px] font-bold uppercase">4K Video</p>
                        </div>
                        <div className="p-3 border rounded-lg text-center bg-slate-50">
                            <Sparkles className="h-5 w-5 mx-auto mb-1 opacity-50" />
                            <p className="text-[10px] font-bold uppercase">AI Design</p>
                        </div>
                        <div className="p-3 border rounded-lg text-center bg-slate-50">
                            <BarChart3 className="h-5 w-5 mx-auto mb-1 opacity-50" />
                            <p className="text-[10px] font-bold uppercase">Tracking</p>
                        </div>
                        <div className="p-3 border rounded-lg text-center bg-slate-50">
                            <Zap className="h-5 w-5 mx-auto mb-1 opacity-50" />
                            <p className="text-[10px] font-bold uppercase">Auto-Ads</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/10 border-t p-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                        <ShieldCheck className="h-4 w-4" /> Fully tracked nodes for guaranteed commission integrity.
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
