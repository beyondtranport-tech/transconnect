'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Facebook, Sparkles, Loader2, Copy, Send, Link as LinkIcon, ShieldCheck, Zap, Share2, ExternalLink, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { generateSocialCopy, type SocialCopyOutput } from '@/ai/flows/social-copy-flow';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getClientSideAuthToken } from '@/firebase';
import Link from 'next/link';

/**
 * SOCIAL ENGAGEMENT WIZARD
 * Standardized structure following the Partner Action Menu pattern.
 */
function SocialEngageDialog({ open, onOpenChange, post, campaignName }: { open: boolean, onOpenChange: (o: boolean) => void, post: any, campaignName: string }) {
    const [activeTab, setActiveTab] = useState('copy');
    const [isLogging, setIsLogging] = useState(false);
    const { toast } = useToast();

    const derived = useMemo(() => {
        if (!post || !post.body || !campaignName) return { trackingLink: '', fullPostBody: '', sanitizedRef: '' };
        
        const sanitizedRef = campaignName.includes('facebook.com') 
            ? campaignName.split('/').filter(Boolean).pop()?.toUpperCase() || 'FB_CAMPAIGN'
            : campaignName.replace(/\s/g, '_').toUpperCase() || 'GENERAL';

        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studio--ecosystem-hub.us-central1.hosted.app';
        const trackingLink = `${baseUrl}/join?ref=FB_${sanitizedRef}`;
        const fullPostBody = `${post.body}\n\nJoin the community here: ${trackingLink}\n\n${(post.hashtags || []).join(' ')}`;
        
        return { trackingLink, fullPostBody, sanitizedRef };
    }, [post, campaignName]);

    if (!post) return null;
    const { trackingLink, fullPostBody, sanitizedRef } = derived;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: `${label} Copied!` });
    };

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
                        details: `Launched post "${post.headline}" to group: ${campaignName}`,
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
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b bg-muted/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-2xl font-black flex items-center gap-2">
                                <Facebook className="h-7 w-7 text-blue-600" />
                                Engagement Wizard
                            </DialogTitle>
                            <DialogDescription className="mt-1 font-mono text-[10px] uppercase">Tracking ID: FB_{sanitizedRef}</DialogDescription>
                        </div>
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 font-bold" onClick={handleLogAndLaunch} disabled={isLogging}>
                            {isLogging ? <Loader2 className="h-5 w-5 animate-spin"/> : <ExternalLink className="mr-2 h-4 w-4" />}
                            Log & Post to Facebook
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    <div className="w-56 border-r bg-muted/10 p-4 space-y-1">
                        {[
                            { id: 'copy', label: 'Finalize Copy', icon: Share2 },
                            { id: 'visuals', label: 'AI Visuals', icon: ImageIcon },
                            { id: 'tracking', label: 'Tracking URL', icon: LinkIcon }
                        ].map((tab) => (
                            <Button
                                key={tab.id}
                                variant={activeTab === tab.id ? "secondary" : "ghost"}
                                className="w-full justify-start gap-3"
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </Button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
                        <div className="bg-white p-8 rounded-xl shadow-sm border max-w-[700px] mx-auto">
                            {activeTab === 'copy' && (
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold">{post.headline}</h3>
                                    <div className="p-6 bg-slate-50 rounded-lg text-sm leading-relaxed whitespace-pre-wrap border border-dashed font-sans italic">
                                        {post.body}
                                        <p className="mt-4 text-blue-600 font-bold underline">{trackingLink}</p>
                                        <p className="mt-2 opacity-70">{(post.hashtags || []).join(' ')}</p>
                                    </div>
                                    <Button variant="outline" className="w-full gap-2" onClick={() => copyToClipboard(fullPostBody, 'Full Post')}>
                                        <Copy className="h-4 w-4" /> Copy Full Post Body
                                    </Button>
                                </div>
                            )}

                            {activeTab === 'visuals' && (
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-900 text-white rounded-xl shadow-lg border-l-4 border-l-primary">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Sparkles className="h-5 w-5 text-primary" />
                                            <h4 className="font-bold uppercase text-xs">Visual Design Command</h4>
                                        </div>
                                        <p className="text-sm italic font-mono leading-relaxed opacity-90 mb-8 border-l border-white/20 pl-4">{post.imagePrompt}</p>
                                        <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                                            <Link href="/adminaccount?view=branding-studio">Open Branding Studio <ArrowRight className="ml-2 h-4 w-4"/></Link>
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tracking' && (
                                <div className="text-center py-12 space-y-4">
                                    <div className="bg-primary/10 p-5 rounded-full w-fit mx-auto mb-4">
                                        <LinkIcon className="h-10 w-10 text-primary" />
                                    </div>
                                    <h4 className="text-2xl font-bold">Persistence Monitoring</h4>
                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">The tracking link for <span className="font-bold text-foreground">{campaignName}</span> is active. Every registration through this link is logged as an acquisition.</p>
                                    <Badge variant="outline" className="mt-6 bg-green-50 text-green-700 border-green-200">ACTIVE CAMPAIGN LINK</Badge>
                                </div>
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
    const [results, setResults] = useState<SocialCopyOutput | null>(null);
    const [campaignName, setCampaignName] = useState('');
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    
    const [params, setParams] = useState({
        audience: 'transporters' as const,
        topic: 'empty_miles' as const,
        tone: 'community_casual' as const,
    });

    const handleGenerate = async () => {
        if (!campaignName.trim()) {
            toast({ variant: 'destructive', title: "Group Name Required", description: "Please enter the Facebook group name to enable tracking." });
            return;
        }
        setIsLoading(true);
        try {
            const result = await generateSocialCopy(params);
            setResults(result);
            toast({ title: "Copy variations ready." });
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

            <CardHeader className="px-0">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-xl"><Facebook className="h-8 w-8 text-blue-600" /></div>
                    <div>
                        <CardTitle className="text-3xl font-black font-headline">Facebook Growth Studio</CardTitle>
                        <CardDescription>Generate tracked content for industry groups.</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="shadow-lg border-primary/10">
                        <CardHeader className="bg-muted/30 border-b">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Zap className="h-3.5 w-3.5 text-primary fill-primary"/> Campaign Parameters
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Target Facebook Group / URL</Label>
                                <Input placeholder="e.g. SA Truckers..." value={campaignName} onChange={e => setCampaignName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Primary Audience</Label>
                                <Select value={params.audience} onValueChange={(v: any) => setParams({...params, audience: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="transporters">Fleet Owners</SelectItem>
                                        <SelectItem value="drivers">Drivers</SelectItem>
                                        <SelectItem value="suppliers">Suppliers</SelectItem>
                                        <SelectItem value="investors">Investors</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Strategic Hook</Label>
                                <Select value={params.topic} onValueChange={(v: any) => setParams({...params, topic: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="empty_miles">Efficiency</SelectItem>
                                        <SelectItem value="parts_discounts">High Costs</SelectItem>
                                        <SelectItem value="capital">Capital</SelectItem>
                                        <SelectItem value="community_growth">Ecosystem</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full mt-2 h-12 font-bold uppercase tracking-tight" onClick={handleGenerate} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                                Generate Ad Copy
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {results ? results.posts.map((post, i) => (
                        <Card key={i} className="border-none shadow-xl group overflow-hidden">
                            <CardHeader className="px-6 pt-6">
                                <CardTitle className="text-2xl font-black font-headline tracking-tight group-hover:text-primary transition-colors">{post.headline}</CardTitle>
                            </CardHeader>
                            <CardContent className="px-6 pb-6 italic text-muted-foreground border-l-4 border-l-muted ml-6">
                                "{post.body.slice(0, 180)}..."
                            </CardContent>
                            <CardFooter className="bg-muted/10 border-t p-4 flex justify-end px-6">
                                <Button className="font-bold gap-2" onClick={() => setSelectedPost(post)}>
                                    Engage & Launch Wizard <ArrowRight className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    )) : (
                        <div className="h-full min-h-[400px] border-4 border-dashed rounded-3xl flex flex-col items-center justify-center text-muted-foreground p-12 text-center bg-muted/5">
                            <h3 className="text-2xl font-black font-headline opacity-30 uppercase">Pipeline Ready</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
