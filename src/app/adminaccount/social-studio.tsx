
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Facebook, Sparkles, Loader2, Copy, Send, Link as LinkIcon, ShieldCheck, Zap, Share2, ExternalLink, Image as ImageIcon, ClipboardCheck, History, Info } from 'lucide-react';
import { generateSocialCopy, type SocialCopyOutput } from '@/ai/flows/social-copy-flow';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getClientSideAuthToken } from '@/firebase';
import Link from 'next/link';

/**
 * SOCIAL ENGAGEMENT WIZARD
 * Patterned after the Partner EngageDialog to provide a consistent admin workflow.
 */
function SocialEngageDialog({ open, onOpenChange, post, campaignName }: { open: boolean, onOpenChange: (o: boolean) => void, post: any, campaignName: string }) {
    const [activeTab, setActiveTab] = useState('copy');
    const [isLogging, setIsLogging] = useState(false);
    const { toast } = useToast();

    // Derived values with robust guard to prevent null access errors
    const derived = useMemo(() => {
        if (!post) return { trackingLink: '', fullPostBody: '' };
        const baseUrl = 'https://studio--ecosystem-hub.us-central1.hosted.app';
        const trackingLink = `${baseUrl}/join?ref=FB_${campaignName.replace(/\s/g, '_').toUpperCase() || 'GENERAL'}`;
        const fullPostBody = `${post.body}\n\nJoin here: ${trackingLink}\n\n${(post.hashtags || []).join(' ')}`;
        return { trackingLink, fullPostBody };
    }, [post, campaignName]);

    if (!post) return null;

    const { trackingLink, fullPostBody } = derived;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: `${label} Copied!` });
    };

    const handleLogAndLaunch = async () => {
        setIsLogging(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");

            // Log the campaign launch event
            await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'logAudit', 
                    payload: { 
                        action: 'social_campaign_launch', 
                        details: `Launched "${post.headline}" to Facebook Group: ${campaignName}`,
                        metadata: { campaignName, trackingLink }
                    } 
                }),
            });

            await navigator.clipboard.writeText(fullPostBody);
            toast({ title: "Content Logged & Copied", description: "You are being redirected to Facebook." });
            
            // Launch Facebook in new tab
            window.open('https://www.facebook.com/groups/feed/', '_blank');
            onOpenChange(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Log Failed", description: e.message });
        } finally {
            setIsLogging(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 border-b bg-muted/30">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <Facebook className="h-6 w-6 text-blue-600" />
                                Launch Social Campaign
                            </DialogTitle>
                            <DialogDescription>Targeting: {campaignName || 'General Outreach'}</DialogDescription>
                        </div>
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 gap-2 shadow-lg" onClick={handleLogAndLaunch} disabled={isLogging}>
                            {isLogging ? <Loader2 className="h-4 w-4 animate-spin"/> : <ExternalLink className="h-4 w-4" />}
                            Log & Post to Facebook
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Navigation Sidebar */}
                    <div className="w-56 border-r bg-muted/10 p-4 space-y-1">
                        <Button 
                            variant={activeTab === 'copy' ? "secondary" : "ghost"} 
                            className="w-full justify-start gap-2 text-xs font-bold uppercase tracking-wider"
                            onClick={() => setActiveTab('copy')}
                        >
                            <Share2 className="h-4 w-4" /> 1. Ad Copy
                        </Button>
                        <Button 
                            variant={activeTab === 'asset' ? "secondary" : "ghost"} 
                            className="w-full justify-start gap-2 text-xs font-bold uppercase tracking-wider"
                            onClick={() => setActiveTab('asset')}
                        >
                            <ImageIcon className="h-4 w-4" /> 2. Visual Prompt
                        </Button>
                        <Button 
                            variant={activeTab === 'history' ? "secondary" : "ghost"} 
                            className="w-full justify-start gap-2 text-xs font-bold uppercase tracking-wider"
                            onClick={() => setActiveTab('history')}
                        >
                            <History className="h-4 w-4" /> 3. Link Status
                        </Button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-[700px] mx-auto">
                            {activeTab === 'copy' && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Post Headline</Label>
                                        <h3 className="text-xl font-bold text-foreground">{post.headline}</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Body Content</Label>
                                        <div className="p-4 bg-muted/30 rounded-lg text-sm leading-relaxed whitespace-pre-wrap border">
                                            {post.body}
                                            <p className="mt-4 text-blue-600 font-bold">{trackingLink}</p>
                                            <p className="mt-2 text-muted-foreground">{(post.hashtags || []).join(' ')}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="w-full" onClick={() => copyToClipboard(fullPostBody, 'Full Post')}>
                                        <Copy className="mr-2 h-4 w-4" /> Copy Full Text for Facebook
                                    </Button>
                                </div>
                            )}

                            {activeTab === 'asset' && (
                                <div className="space-y-6">
                                    <div className="p-4 bg-slate-900 text-slate-100 rounded-xl border-l-4 border-l-primary">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Sparkles className="h-5 w-5 text-primary" />
                                            <h4 className="font-bold">Visual Production Command</h4>
                                        </div>
                                        <p className="text-sm italic font-mono leading-relaxed opacity-90 mb-6">{post.imagePrompt}</p>
                                        <div className="flex gap-2">
                                            <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/10" onClick={() => copyToClipboard(post.imagePrompt, 'Prompt')}>
                                                <Copy className="mr-2 h-3.5 w-3.5"/> Copy Prompt
                                            </Button>
                                            <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
                                                <Link href="/adminaccount?view=branding-studio">Launch Image Generator</Link>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 border rounded-lg bg-amber-50">
                                        <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-amber-900">Production Tip</p>
                                            <p className="text-xs text-amber-800">Generate your image first in the Branding Studio, then return here to launch your post.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="text-center py-12 space-y-4">
                                    <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto">
                                        <LinkIcon className="h-10 w-10 text-primary" />
                                    </div>
                                    <h4 className="font-bold">Campaign Tracking Active</h4>
                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                        The link <code className="text-primary font-bold">FB_{campaignName.toUpperCase()}</code> is ready. Every member who signs up via this link will be tracked in your master registry.
                                    </p>
                                    <div className="pt-4">
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 py-1 px-4">
                                            Monitoring Status: READY
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
        setIsLoading(true);
        try {
            const result = await generateSocialCopy(params);
            setResults(result);
            toast({ title: "Social Variations Generated" });
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
                        <CardDescription>Generate and track high-conversion posts for industry groups.</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Control Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="shadow-lg border-primary/10">
                        <CardHeader className="bg-muted/30 border-b py-4">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Zap className="h-3 w-3 text-primary fill-primary"/> 1. Define Campaign
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Facebook Group / Campaign Name</Label>
                                <Input 
                                    placeholder="e.g. SA Truckers Hub" 
                                    value={campaignName} 
                                    onChange={e => setCampaignName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Target Group Audience</Label>
                                <Select value={params.audience} onValueChange={(v: any) => setParams({...params, audience: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="transporters">Fleet Owners / Transporters</SelectItem>
                                        <SelectItem value="drivers">Professional Drivers</SelectItem>
                                        <SelectItem value="suppliers">Spare Parts Suppliers</SelectItem>
                                        <SelectItem value="investors">Venture Capital / Investors</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Core Message Hook</Label>
                                <Select value={params.topic} onValueChange={(v: any) => setParams({...params, topic: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="empty_miles">Empty Miles & Load Matching</SelectItem>
                                        <SelectItem value="parts_discounts">High Cost of Spares</SelectItem>
                                        <SelectItem value="capital">Access to Asset Finance</SelectItem>
                                        <SelectItem value="community_growth">Building the Industry Grid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full mt-4 h-12 font-black uppercase tracking-tight" onClick={handleGenerate} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                                Generate Ad Variations
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="p-6 bg-slate-950 rounded-2xl text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <LinkIcon className="h-24 w-24" />
                        </div>
                        <h4 className="font-black uppercase tracking-widest text-[10px] text-primary mb-2">Tracking Technology</h4>
                        <p className="text-xl font-bold leading-tight">Every variation includes a unique tracking ID.</p>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">When you launch a post via the wizard, we automatically monitor signups and attribute them to your specific campaign.</p>
                    </div>
                </div>

                {/* Variations Feed */}
                <div className="lg:col-span-2 space-y-6">
                    {results ? results.posts.map((post, i) => (
                        <Card key={i} className="border-none shadow-xl group overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all">
                            <div className="bg-muted/50 p-4 border-b flex justify-between items-center">
                                <Badge variant="secondary" className="font-black uppercase text-[10px]">Variation #{i+1}</Badge>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                                    <ShieldCheck className="h-3 w-3 text-green-500" /> Quota Protected
                                </div>
                            </div>
                            <CardHeader>
                                <CardTitle className="text-2xl font-black font-headline tracking-tight group-hover:text-primary transition-colors">{post.headline}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-6 bg-slate-50 rounded-xl text-sm leading-relaxed border italic">
                                    "{post.body.slice(0, 200)}..."
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/10 border-t p-4 flex justify-end">
                                <Button className="h-12 px-8 font-black uppercase tracking-tight gap-2" onClick={() => setSelectedPost(post)}>
                                    Engage & Launch Wizard <ArrowRight className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    )) : (
                        <div className="h-full min-h-[500px] border-4 border-dashed rounded-3xl flex flex-col items-center justify-center text-muted-foreground p-12 text-center bg-muted/5">
                            <div className="bg-white p-6 rounded-full shadow-lg mb-6 border">
                                <Facebook className="h-16 w-16 text-blue-600/20" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-400 mb-2">Ready for Group Outreach</h3>
                            <p className="max-w-xs text-sm leading-relaxed">Define your target group parameters on the left to generate high-conversion ad content.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
