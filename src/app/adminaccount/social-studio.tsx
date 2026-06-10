'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Facebook, Sparkles, Loader2, Copy, Send, Link as LinkIcon, ShieldCheck, Zap, Share2, ExternalLink, Image as ImageIcon, ClipboardCheck, History, Info, ArrowRight } from 'lucide-react';
import { generateSocialCopy, type SocialCopyOutput } from '@/ai/flows/social-copy-flow';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getClientSideAuthToken } from '@/firebase';
import Link from 'next/link';

/**
 * SOCIAL ENGAGEMENT WIZARD
 * Handles the finalization, tracking, and launching of social media posts.
 */
function SocialEngageDialog({ open, onOpenChange, post, campaignName }: { open: boolean, onOpenChange: (o: boolean) => void, post: any, campaignName: string }) {
    const [activeTab, setActiveTab] = useState('copy');
    const [isLogging, setIsLogging] = useState(false);
    const { toast } = useToast();

    // Guard against crashes by memoizing derivation and providing fallbacks
    const derived = useMemo(() => {
        if (!post || !post.body) return { trackingLink: '', fullPostBody: '', sanitizedRef: '' };
        
        // Extract group name if a URL was pasted, otherwise sanitize the name
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
            if (!token) throw new Error("Authentication failed.");

            // Log the launch to the audit trail
            await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'logAudit', 
                    payload: { 
                        action: 'social_campaign_launch', 
                        details: `Launched post "${post.headline}" to group: ${campaignName}`,
                        metadata: { campaignName, trackingRef: `FB_${sanitizedRef}`, trackingLink }
                    } 
                }),
            });

            await navigator.clipboard.writeText(fullPostBody);
            toast({ title: "Copy & Log Success", description: "Opening Facebook now. Paste your content to post." });
            
            const launchUrl = campaignName.startsWith('http') ? campaignName : 'https://www.facebook.com/groups/feed/';
            window.open(launchUrl, '_blank');
            onOpenChange(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Launch Error", description: e.message });
        } finally {
            setIsLogging(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden text-base">
                <DialogHeader className="p-6 border-b bg-muted/30">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-black font-headline flex items-center gap-2">
                                <Facebook className="h-7 w-7 text-blue-600" />
                                Social Launch Wizard
                            </DialogTitle>
                            <DialogDescription className="font-mono text-xs uppercase tracking-widest text-primary">
                                Tracking ID: FB_{sanitizedRef}
                            </DialogDescription>
                        </div>
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 gap-2 shadow-xl h-12 px-8 font-black uppercase tracking-tight" onClick={handleLogAndLaunch} disabled={isLogging}>
                            {isLogging ? <Loader2 className="h-5 w-5 animate-spin"/> : <ExternalLink className="h-5 w-5" />}
                            Log & Post to Facebook
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    <div className="w-56 border-r bg-muted/10 p-4 space-y-1 shrink-0">
                        <Button variant={activeTab === 'copy' ? "secondary" : "ghost"} className="w-full justify-start gap-3 h-11" onClick={() => setActiveTab('copy')}>
                            <Share2 className="h-4 w-4" /> Finalize Copy
                        </Button>
                        <Button variant={activeTab === 'asset' ? "secondary" : "ghost"} className="w-full justify-start gap-3 h-11" onClick={() => setActiveTab('asset')}>
                            <ImageIcon className="h-4 w-4" /> Visual Identity
                        </Button>
                        <Button variant={activeTab === 'analytics' ? "secondary" : "ghost"} className="w-full justify-start gap-3 h-11" onClick={() => setActiveTab('analytics')}>
                            <LinkIcon className="h-4 w-4" /> Tracking URL
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-[700px] mx-auto">
                            {activeTab === 'copy' && (
                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Ad Headline</Label>
                                        <h3 className="text-2xl font-black font-headline text-foreground">{post.headline}</h3>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Post Body (Pasted to Facebook)</Label>
                                        <div className="p-6 bg-slate-50 rounded-xl text-sm leading-relaxed whitespace-pre-wrap border border-dashed font-sans">
                                            {post.body}
                                            <p className="mt-4 text-blue-600 font-bold underline">{trackingLink}</p>
                                            <p className="mt-2 text-muted-foreground">{(post.hashtags || []).join(' ')}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="w-full h-12 gap-2" onClick={() => copyToClipboard(fullPostBody, 'Full Post')}>
                                        <Copy className="h-4 w-4" /> Copy Full Payload
                                    </Button>
                                </div>
                            )}

                            {activeTab === 'asset' && (
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-900 text-slate-100 rounded-2xl border-l-4 border-l-primary shadow-lg">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Sparkles className="h-5 w-5 text-primary" />
                                            <h4 className="font-black uppercase tracking-widest text-xs">AI Visual Generator Prompt</h4>
                                        </div>
                                        <p className="text-sm italic font-mono leading-relaxed opacity-90 mb-8 border-l border-white/20 pl-4">{post.imagePrompt}</p>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/10 flex-1" onClick={() => copyToClipboard(post.imagePrompt, 'AI Prompt')}>
                                                <Copy className="mr-2 h-4 w-4"/> Copy AI Prompt
                                            </Button>
                                            <Button className="bg-primary hover:bg-primary/90 flex-1" asChild>
                                                <Link href="/adminaccount?view=branding-studio">Launch Studio <ArrowRight className="ml-2 h-4 w-4"/></Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'analytics' && (
                                <div className="text-center py-12 space-y-4">
                                    <div className="bg-primary/10 p-5 rounded-full w-fit mx-auto mb-4">
                                        <LinkIcon className="h-10 w-10 text-primary" />
                                    </div>
                                    <h4 className="text-2xl font-black font-headline">Persistence Monitoring</h4>
                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                        The tracking link for <span className="font-bold text-foreground">{campaignName}</span> is active. 
                                        Any user signing up via this link will be automatically credited to this campaign in your Leads Database.
                                    </p>
                                    <div className="pt-6">
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 py-2 px-6 font-black uppercase tracking-widest text-[10px]">
                                            <ShieldCheck className="h-3 w-3 mr-2" /> Campaign Logic: ACTIVE
                                        </Badge>
                                    </div>
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
            toast({ variant: 'destructive', title: "Group Name Required", description: "Please enter the Facebook group name or URL to enable tracking." });
            return;
        }
        setIsLoading(true);
        try {
            const result = await generateSocialCopy(params);
            setResults(result);
            toast({ title: "Copy Variations Ready", description: "Three high-intent posts have been drafted." });
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
                    <div className="bg-blue-100 p-3 rounded-xl shadow-sm"><Facebook className="h-8 w-8 text-blue-600" /></div>
                    <div>
                        <CardTitle className="text-3xl font-black font-headline">Facebook Growth Studio</CardTitle>
                        <CardDescription>Generate and track hyper-targeted content for large industry groups.</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="shadow-lg border-primary/10 overflow-hidden">
                        <div className="bg-muted/30 border-b py-4 px-6">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Zap className="h-3.5 w-3.5 text-primary fill-primary"/> Ad Campaign Parameters
                            </CardTitle>
                        </div>
                        <CardContent className="space-y-5 pt-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold flex items-center justify-between">
                                    Target Facebook Group / URL
                                    <span className="text-[10px] text-muted-foreground font-normal">Enables Tracking</span>
                                </Label>
                                <Input 
                                    placeholder="e.g. SA Truckers or paste URL..." 
                                    value={campaignName} 
                                    onChange={e => setCampaignName(e.target.value)}
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Primary Audience</Label>
                                <Select value={params.audience} onValueChange={(v: any) => setParams({...params, audience: v})}>
                                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="transporters">Fleet Owners / Transporters</SelectItem>
                                        <SelectItem value="drivers">Professional Drivers</SelectItem>
                                        <SelectItem value="suppliers">Independent Suppliers</SelectItem>
                                        <SelectItem value="investors">Venture Capital / Investors</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Strategic Hook</Label>
                                <Select value={params.topic} onValueChange={(v: any) => setParams({...params, topic: v})}>
                                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="empty_miles">Empty Miles (Efficiency)</SelectItem>
                                        <SelectItem value="parts_discounts">High Cost of Spares</SelectItem>
                                        <SelectItem value="capital">Access to Funding</SelectItem>
                                        <SelectItem value="community_growth">Ecosystem Growth</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full mt-2 h-12 font-black uppercase tracking-tight shadow-md" onClick={handleGenerate} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                                Generate Ad Copy
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {results ? results.posts.map((post, i) => (
                        <Card key={i} className="border-none shadow-xl group overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all">
                            <div className="bg-muted/50 px-6 py-3 border-b flex justify-between items-center">
                                <Badge variant="secondary" className="font-black uppercase text-[10px] h-5">Ad Variation #{i+1}</Badge>
                            </div>
                            <CardHeader className="px-6 pt-6">
                                <CardTitle className="text-2xl font-black font-headline tracking-tight group-hover:text-primary transition-colors">{post.headline}</CardTitle>
                            </CardHeader>
                            <CardContent className="px-6 pb-6">
                                <div className="p-6 bg-slate-50 rounded-xl text-sm leading-relaxed border italic text-muted-foreground">
                                    "{post.body.slice(0, 220)}..."
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/10 border-t p-4 flex justify-end px-6">
                                <Button className="h-11 px-8 font-black uppercase tracking-tight gap-2" onClick={() => setSelectedPost(post)}>
                                    Engage & Launch Wizard <ArrowRight className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    )) : (
                        <div className="h-full min-h-[500px] border-4 border-dashed rounded-[2rem] flex flex-col items-center justify-center text-muted-foreground p-12 text-center bg-muted/5">
                            <h3 className="text-3xl font-black text-slate-300 font-headline mb-2 uppercase tracking-tighter">Social Pipeline Ready</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
