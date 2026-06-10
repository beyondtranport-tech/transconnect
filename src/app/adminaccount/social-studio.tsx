'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Facebook, Sparkles, Loader2, Copy, Send, Link as LinkIcon, Share2, ExternalLink, ImageIcon, ArrowRight, Zap, BookOpen, MessageSquare, Video, Film, Wand2 } from 'lucide-react';
import { generateSocialCopy, type SocialCopyOutput } from '@/ai/flows/social-copy-flow';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getClientSideAuthToken } from '@/firebase';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

// Media Generation Components
import ImageGeneratorCard from "@/app/backend/image-generator-card";
import VideoGeneratorCard from "@/app/backend/video-generator-card";
import IconGeneratorCard from "@/app/backend/icon-generator-card";

const libraryTemplates = [
    {
        id: 'empty_miles',
        headline: 'Stop Burning Money on Empty Miles',
        body: "Running empty is a tax on your fleet. We've built an AI Freight Matcher that finds loads for your empty legs while you're still on the road.\n\nJoin the Western Cape community of hauliers today.",
        hashtags: ['#LogisticsFlow', '#SATrucking', '#Efficiency'],
        imagePrompt: 'A cinematic high-angle shot of a white superlink truck driving on the N1 at sunrise, clean minimalist style.'
    },
    {
        id: 'capital_growth',
        headline: 'The Bank Said No. We Say Yes.',
        body: "Standard lenders don't understand the transport business. We do. Access flexible asset finance and working capital tailored for hauliers with a proven track record.",
        hashtags: ['#FleetFinance', '#Growth', '#TransConnect'],
        imagePrompt: 'A close up on a professional handshake between two business owners in a boardroom with a truck blurred in the background.'
    },
    {
        id: 'supplier_deals',
        headline: 'Bulk Tire & Parts Discounts',
        body: "Strength in numbers. By joining Logistics Flow, you tap into the collective buying power of over 500 fleets to secure deep discounts from major national suppliers.",
        hashtags: ['#CostReduction', '#FleetCare', '#Community'],
        imagePrompt: 'A stack of professional commercial truck tires in a clean warehouse environment with bright studio lighting.'
    }
];

/**
 * SOCIAL ENGAGEMENT WIZARD
 * Multi-tab launcher for finalizing social campaigns with integrated media tools.
 */
function SocialEngageDialog({ open, onOpenChange, post, campaignName }: { open: boolean, onOpenChange: (o: boolean) => void, post: any, campaignName: string }) {
    const [activeTab, setActiveTab] = useState('copy');
    const [isLogging, setIsLogging] = useState(false);
    const { toast } = useToast();

    const derived = useMemo(() => {
        if (!post) return { trackingLink: '', fullPostBody: '', sanitizedRef: '' };
        
        const sanitizedRef = campaignName.replace(/\s/g, '_').toUpperCase() || 'GENERAL';
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studio--ecosystem-hub.us-central1.hosted.app';
        const trackingLink = `${baseUrl}/join?ref=FB_${sanitizedRef}`;
        
        // Handle both template body and AI generated body
        const postBody = post.body || post.text || '';
        const fullPostBody = `${postBody}\n\nJoin the community here: ${trackingLink}\n\n${(post.hashtags || []).join(' ')}`;
        
        return { trackingLink, fullPostBody, sanitizedRef };
    }, [post, campaignName]);

    if (!post) return null;
    const { trackingLink, fullPostBody, sanitizedRef } = derived;

    const handleLogAndLaunch = async () => {
        setIsLogging(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");

            await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'logAudit', 
                    payload: { 
                        action: 'social_campaign_launch', 
                        details: `Launched post "${post.headline}" for group: ${campaignName}`,
                        metadata: { campaignName, trackingRef: `FB_${sanitizedRef}` }
                    } 
                }),
            });

            await navigator.clipboard.writeText(fullPostBody);
            toast({ title: "Copied & Logged", description: "Opening Facebook... Paste your content to post." });
            
            const launchUrl = campaignName.startsWith('http') ? campaignName : 'https://www.facebook.com/groups/feed/';
            window.open(launchUrl, '_blank');
            onOpenChange(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: e.message });
        } finally {
            setIsLogging(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b bg-muted/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-2xl font-black flex items-center gap-2">
                                <Facebook className="h-7 w-7 text-blue-600" />
                                Social Engagement Wizard
                            </DialogTitle>
                            <DialogDescription className="mt-1">Campaign Targeting: <strong>{campaignName}</strong></DialogDescription>
                        </div>
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 font-bold gap-2" onClick={handleLogAndLaunch} disabled={isLogging}>
                            {isLogging ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ExternalLink className="mr-2 h-4 w-4" />}
                            Log, Copy & Launch
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Multi-Tab Sidebar */}
                    <div className="w-64 border-r bg-muted/10 p-4 space-y-1">
                        {[
                            { id: 'copy', label: '1. Refine Copy', icon: MessageSquare },
                            { id: 'media', label: '2. Generate Media', icon: Sparkles },
                            { id: 'tracking', label: '3. Tracking & Links', icon: LinkIcon }
                        ].map((tab) => (
                            <Button
                                key={tab.id}
                                variant={activeTab === tab.id ? "secondary" : "ghost"}
                                className="w-full justify-start gap-3 h-11"
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </Button>
                        ))}
                    </div>

                    {/* Integrated Workspace Content */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
                        <div className="max-w-[800px] mx-auto space-y-8">
                            {activeTab === 'copy' && (
                                <Card>
                                    <CardHeader><CardTitle>Finalize Ad Copy</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="p-6 bg-slate-50 rounded-xl border-2 border-dashed border-primary/20 text-sm leading-relaxed whitespace-pre-wrap font-sans italic">
                                            {post.body || post.text}
                                            <p className="mt-4 text-blue-600 font-bold underline">{trackingLink}</p>
                                        </div>
                                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-3">
                                            <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                                            <p className="text-[11px] text-amber-800">Your unique tracking link is automatically generated based on the Facebook group name to track acquisition success.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {activeTab === 'media' && (
                                <div className="space-y-6">
                                    <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Sparkles className="h-5 w-5 text-primary" />
                                            <h4 className="font-bold uppercase text-[10px] tracking-widest">AI Media Command</h4>
                                        </div>
                                        <p className="text-sm italic font-mono opacity-90 border-l-2 border-primary/50 pl-4 mb-4">{post.imagePrompt}</p>
                                        <p className="text-xs text-slate-400">Use the tools below to generate visual assets using this command.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <ImageGeneratorCard />
                                        <VideoGeneratorCard />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tracking' && (
                                <Card>
                                    <CardHeader><CardTitle>Acquisition Persistence</CardTitle></CardHeader>
                                    <CardContent className="text-center py-12 space-y-4">
                                        <div className="bg-primary/10 p-5 rounded-full w-fit mx-auto">
                                            <LinkIcon className="h-10 w-10 text-primary" />
                                        </div>
                                        <h4 className="text-2xl font-bold">Automatic Referrer Logic</h4>
                                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">This campaign is tagged with ID <span className="font-mono font-bold text-foreground">FB_{sanitizedRef}</span>. When leads sign up using this link, they are automatically categorized as coming from the <span className="font-bold">{campaignName}</span> campaign.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function SocialStudio() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [aiResults, setAiResults] = useState<SocialCopyOutput | null>(null);
    const [campaignName, setCampaignName] = useState('');
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    
    // Structured AI Input
    const [params, setParams] = useState({
        topic: '',
        criticalPoints: '',
        audience: 'transporters' as const,
        tone: 'community_casual' as const,
    });

    const handleGenerate = async () => {
        if (!campaignName.trim()) {
            toast({ variant: 'destructive', title: "Group Name Required", description: "Enter the Facebook group name to enable tracking." });
            return;
        }
        if (!params.topic || !params.criticalPoints) {
            toast({ variant: 'destructive', title: "Details Required", description: "Enter a topic and critical points for the AI." });
            return;
        }

        setIsLoading(true);
        try {
            const result = await generateSocialCopy(params);
            setAiResults(result);
            toast({ title: "Custom Copy variations ready." });
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Generation Failed", description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <SocialEngageDialog 
                open={!!selectedPost} 
                onOpenChange={(o) => !o && setSelectedPost(null)} 
                post={selectedPost} 
                campaignName={campaignName} 
            />

            <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-xl"><Facebook className="h-8 w-8 text-blue-600" /></div>
                <div>
                    <h1 className="text-3xl font-black font-headline">Facebook Growth Studio</h1>
                    <p className="text-muted-foreground">Strategic ad copy and tracking link generator for industry groups.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Control Panel */}
                <div className="space-y-6">
                    <Card className="shadow-lg border-primary/10">
                        <CardHeader className="bg-muted/30 border-b">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Zap className="h-3.5 w-3.5 text-primary fill-primary"/> Campaign Config
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Target Facebook Group Name</Label>
                                <Input placeholder="e.g. Western Cape Truckers..." value={campaignName} onChange={e => setCampaignName(e.target.value)} />
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <Label className="text-xs font-black uppercase tracking-widest text-primary">AI Ad Creator</Label>
                                <div className="space-y-2">
                                    <Label className="text-xs">Strategic Topic</Label>
                                    <Input placeholder="e.g. Empty miles reduction" value={params.topic} onChange={e => setParams({...params, topic: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Critical Points (one per line)</Label>
                                    <Textarea 
                                        placeholder="e.g. AI load matching&#10;50% deadhead reduction&#10;Verified shippers only" 
                                        value={params.criticalPoints}
                                        onChange={e => setParams({...params, criticalPoints: e.target.value})}
                                    />
                                </div>
                                <Button className="w-full h-12 font-bold gap-2" onClick={handleGenerate} disabled={isLoading}>
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4" />}
                                    Generate Custom Ad Copy
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Content Library & Results */}
                <div className="lg:col-span-2 space-y-10">
                    {/* 1. Template Library */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary"/> Pre-written Library</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {libraryTemplates.map(template => (
                                <Card key={template.id} className="hover:border-primary transition-colors cursor-pointer group shadow-md" onClick={() => setSelectedPost(template)}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold group-hover:text-primary transition-colors">{template.headline}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs text-muted-foreground line-clamp-3 italic">"{template.body}"</p>
                                    </CardContent>
                                    <CardFooter className="pt-0 justify-end">
                                        <Button variant="ghost" size="sm" className="text-[10px] uppercase font-black tracking-widest h-7">Select <ArrowRight className="ml-1 h-3 w-3"/></Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* 2. AI Generated Results */}
                    {aiResults && (
                        <div className="space-y-4">
                             <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/> AI Generations</h3>
                             <div className="space-y-4">
                                {aiResults.posts.map((post, i) => (
                                    <Card key={i} className="border-none shadow-xl border-l-4 border-l-primary overflow-hidden">
                                        <CardHeader>
                                            <CardTitle className="text-xl font-black">{post.headline}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-sm text-muted-foreground italic leading-relaxed">
                                            "{post.body.slice(0, 200)}..."
                                        </CardContent>
                                        <CardFooter className="bg-muted/10 border-t p-4 flex justify-end">
                                            <Button className="font-bold gap-2" onClick={() => setSelectedPost(post)}>
                                                Engage & Launch Wizard <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
