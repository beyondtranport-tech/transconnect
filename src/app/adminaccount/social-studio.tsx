'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Facebook, Sparkles, Loader2, Copy, Send, Link as LinkIcon, ShieldCheck, Zap, Share2 } from 'lucide-react';
import { generateSocialCopy, type SocialCopyOutput } from '@/ai/flows/social-copy-flow';

export default function SocialStudio() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<SocialCopyOutput | null>(null);
    const [campaignName, setCampaignName] = useState('');
    
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
            toast({ title: "Social Copy Ready", description: "AI has generated 3 variations for your post." });
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Generation Failed", description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    const baseUrl = 'https://studio--ecosystem-hub.us-central1.hosted.app';
    const trackingLink = `${baseUrl}/join?ref=FB_${campaignName.replace(/\s/g, '_').toUpperCase() || 'GENERAL'}`;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!" });
    };

    return (
        <div className="space-y-8">
            <CardHeader className="px-0">
                <div className="flex items-center gap-4">
                    <Facebook className="h-8 w-8 text-blue-600" />
                    <div>
                        <CardTitle>Facebook Growth Studio</CardTitle>
                        <CardDescription>Generate high-conversion posts and smart tracking links for industry groups.</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Inputs */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest">1. Target Audience</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Group Audience</Label>
                                <Select value={params.audience} onValueChange={(v: any) => setParams({...params, audience: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="transporters">Fleet Owners / Transporters</SelectItem>
                                        <SelectItem value="drivers">Professional Drivers</SelectItem>
                                        <SelectItem value="suppliers">Spare Parts Suppliers</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Core Pain Point</Label>
                                <Select value={params.topic} onValueChange={(v: any) => setParams({...params, topic: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="empty_miles">Empty Miles & Deadhead</SelectItem>
                                        <SelectItem value="parts_discounts">High Cost of Spares</SelectItem>
                                        <SelectItem value="capital">Access to Asset Finance</SelectItem>
                                        <SelectItem value="community_growth">Building the SA Network</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full mt-4 bg-primary" onClick={handleGenerate} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                                Generate AI Post
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50/30">
                        <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-blue-700 flex items-center gap-2"><LinkIcon className="h-4 w-4"/> Tracking Link Builder</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Facebook Group Name</Label>
                                <Input 
                                    placeholder="e.g. SA Truckers Association" 
                                    value={campaignName} 
                                    onChange={e => setCampaignName(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                            <div className="p-3 bg-white border rounded-lg">
                                <p className="text-[10px] font-mono break-all text-blue-600">{trackingLink}</p>
                            </div>
                            <Button variant="outline" size="sm" className="w-full bg-white" onClick={() => copyToClipboard(trackingLink)}>
                                <Copy className="mr-2 h-3 w-3"/> Copy Tracking Link
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Results */}
                <div className="lg:col-span-2 space-y-6">
                    {results ? results.posts.map((post, i) => (
                        <Card key={i} className="border-l-4 border-l-blue-600">
                            <CardHeader className="pb-2">
                                <Badge variant="outline" className="w-fit text-[10px] uppercase font-bold text-blue-600 mb-2">Option #{i+1}</Badge>
                                <CardTitle className="text-lg">{post.headline}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-muted/50 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                                    {post.body}
                                    <p className="mt-4 text-blue-600 font-bold">{trackingLink}</p>
                                    <p className="mt-2 text-muted-foreground">{post.hashtags.join(' ')}</p>
                                </div>
                                <div className="p-3 border rounded-lg bg-slate-900 text-slate-300">
                                    <p className="text-[10px] font-black uppercase text-primary mb-1 flex items-center gap-1.5"><Share2 className="h-3 w-3"/> Visual Production Prompt</p>
                                    <p className="text-[10px] italic font-mono">{post.imagePrompt}</p>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-end gap-2 border-t pt-4">
                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`${post.body}\n\n${trackingLink}\n\n${post.hashtags.join(' ')}`)}>
                                    <Copy className="mr-2 h-3 w-3"/> Copy Body
                                </Button>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                    <Facebook className="mr-2 h-3 w-3" /> Go to Facebook
                                </Button>
                            </CardFooter>
                        </Card>
                    )) : (
                        <div className="h-[400px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
                            <Facebook className="h-12 w-12 mb-4 opacity-10" />
                            <h3 className="text-xl font-black mb-2">Ready for Outreach</h3>
                            <p className="text-sm max-w-xs">Select your target group criteria on the left to generate posts that actually convert.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
