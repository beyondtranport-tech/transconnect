'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
    Facebook, Sparkles, Loader2, Copy, Send, Link as LinkIcon, 
    MessageSquare, Video, Info, BarChart3, HelpCircle, 
    ExternalLink, ImageIcon, Wand2, ShieldCheck, Zap, BookOpen 
} from 'lucide-react';
import { generateSocialCopy } from '@/ai/flows/social-copy-flow';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getClientSideAuthToken } from '@/firebase';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

// Media Generation Components
import ImageGeneratorCard from "@/app/backend/image-generator-card";
import VideoGeneratorCard from "@/app/backend/video-generator-card";

/**
 * SOCIAL TEMPLATE LIBRARY
 * The raw content for the wizard tabs.
 */
const socialTemplates = {
    'handshake': {
        label: '0. Digital Handshake',
        icon: ShieldCheck,
        headline: '🤝 Establishing a Trusted Connection',
        body: "For too long, the transport industry has been held back by fragmentation. We are breaking the constraint.\n\nWe're inviting professional hauliers to establish a 'Digital Handshake' with our ecosystem. Get matched with verified loads and access community-negotiated parts discounts instantly.",
        imagePrompt: 'A cinematic high-detail close up of a professional handshake between a haulier and a logistics manager, background shows a clean white truck at sunset.'
    },
    'intro': {
        label: '1. Intro & Value',
        icon: Zap,
        headline: '🚀 Stop Burning Money on Empty Miles',
        body: "Running empty legs is a silent tax on your business. Logistics Flow is a digital branch for your fleet that finds matching freight for your return trips in real-time.\n\nJoin the Western Cape community of professional operators today.",
        imagePrompt: 'A wide cinematic shot of a white superlink truck driving on an open South African highway, bright morning light.'
    },
    'explainer': {
        label: '2. The Explainer',
        icon: BookOpen,
        headline: '📦 How the Data Economy Works for You',
        body: "We use forensic discovery and collective data to negotiate group discounts that no single fleet could achieve alone. When you join, you aren't just a member—you're part of a buying syndicate that lowers the cost of tires, fuel, and parts for everyone.",
        imagePrompt: 'An organized warehouse aisle with stacks of commercial truck tires and high-end engine parts, clean studio lighting.'
    },
    'revenue': {
        label: '3. Revenue Model',
        icon: BarChart3,
        headline: '💰 Monetize Your Industry Network',
        body: "Your industry relationships are your biggest asset. With our 'Actions Plan', you earn recurring commission on every member you refer and every transaction they make in our Malls.\n\nTurn your contacts into a passive revenue engine.",
        imagePrompt: 'A sleek digital dashboard on a tablet showing growing revenue graphs and South African Rand symbols, professional style.'
    },
    'polls': {
        label: '4. Polls & Engagement',
        icon: HelpCircle,
        headline: '📊 Community Feedback Poll',
        body: "QUESTION: What is your biggest operating constraint this month?\n\nA) Tire & Maintenance Costs\nB) Empty Miles / Finding Loads\nC) Access to Working Capital\nD) Recruitment & Driver Training\n\nComment below to help us negotiate better deals for the community!",
        imagePrompt: 'A professional minimalist graphic of a bar chart with icons representing trucks and money, high-contrast colors.'
    }
};

/**
 * SOCIAL GROWTH STUDIO
 * A professional workspace for coordinating Facebook group expansion.
 */
export default function SocialStudio() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<keyof typeof socialTemplates | 'creator'>('handshake');
    const [campaignName, setCampaignName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLogging, setIsLogging] = useState(false);

    // Editable content state
    const [editedContent, setEditedContent] = useState<Record<string, string>>({});
    
    // AI Creator state
    const [creatorParams, setCreatorParams] = useState({ topic: '', criticalPoints: '' });
    const [aiResult, setAiResult] = useState<any>(null);

    const activePost = activeTab === 'creator' ? aiResult : socialTemplates[activeTab];

    const derived = useMemo(() => {
        if (!activePost) return { trackingLink: '', fullPostBody: '' };
        
        const sanitizedRef = campaignName.replace(/\s/g, '_').toUpperCase() || 'GENERAL';
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studio--ecosystem-hub.us-central1.hosted.app';
        const trackingLink = `${baseUrl}/join?ref=FB_${sanitizedRef}`;
        
        const currentBody = editedContent[activeTab] || activePost.body || '';
        const fullPostBody = `${currentBody}\n\nJoin the community here: ${trackingLink}\n\n#LogisticsFlow #SATrucking #Efficiency`;
        
        return { trackingLink, fullPostBody };
    }, [activePost, campaignName, editedContent, activeTab]);

    const handleContentChange = (val: string) => {
        setEditedContent(prev => ({ ...prev, [activeTab]: val }));
    };

    const handleGenerateCustom = async () => {
        if (!creatorParams.topic || !creatorParams.criticalPoints) {
            toast({ variant: 'destructive', title: "Details Required", description: "Please enter a topic and points." });
            return;
        }
        setIsGenerating(true);
        try {
            const result = await generateSocialCopy({
                ...creatorParams,
                audience: 'transporters',
                tone: 'community_casual'
            });
            if (result.posts && result.posts.length > 0) {
                setAiResult(result.posts[0]);
                toast({ title: "Custom Copy Ready" });
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Generation Failed", description: e.message });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLogAndLaunch = async () => {
        setIsLogging(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");

            // Log the launch event in the platform audit trail
            await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'logAudit', 
                    payload: { 
                        action: 'social_launch', 
                        details: `Launched post "${activeTab}" for group: ${campaignName}`,
                        metadata: { campaignName, tab: activeTab }
                    } 
                }),
            });

            await navigator.clipboard.writeText(derived.fullPostBody);
            toast({ title: "Content Copied & Logged", description: "Opening Facebook... Paste your content to post." });
            
            window.open('https://www.facebook.com/groups/feed/', '_blank');
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: e.message });
        } finally {
            setIsLogging(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-xl"><Facebook className="h-8 w-8 text-blue-600" /></div>
                    <div>
                        <h1 className="text-2xl font-black font-headline">Social Engagement Wizard</h1>
                        <p className="text-muted-foreground">Expansion and acquisition engine for industry Facebook groups.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg border">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground px-2">Target Group</Label>
                    <Input 
                        placeholder="e.g. N3 Transporters" 
                        value={campaignName} 
                        onChange={e => setCampaignName(e.target.value)}
                        className="h-8 w-48 bg-white border-none shadow-none text-xs font-bold"
                    />
                </div>
            </div>

            <Card className="flex flex-col h-[75vh] overflow-hidden p-0">
                <div className="flex-1 flex overflow-hidden">
                    {/* SIDEBAR NAVIGATION */}
                    <div className="w-64 border-r bg-muted/10 p-4 space-y-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 mb-2 block">Post Sequences</Label>
                        {Object.entries(socialTemplates).map(([id, template]) => (
                            <Button
                                key={id}
                                variant={activeTab === id ? "secondary" : "ghost"}
                                className={cn("w-full justify-start gap-3 h-11", activeTab === id && "bg-white shadow-sm ring-1 ring-primary/20")}
                                onClick={() => setActiveTab(id as any)}
                            >
                                <template.icon className="h-4 w-4 text-primary" />
                                <span className="truncate">{template.label}</span>
                            </Button>
                        ))}
                        <Separator className="my-4" />
                        <Button
                            variant={activeTab === 'creator' ? "secondary" : "ghost"}
                            className="w-full justify-start gap-3 h-11"
                            onClick={() => setActiveTab('creator')}
                        >
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            AI Post Creator
                        </Button>
                    </div>

                    {/* MAIN CONTENT WORKSPACE */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
                        <div className="max-w-[800px] mx-auto space-y-8">
                            {activeTab === 'creator' ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Sparkles className="h-5 w-5 text-amber-500" />
                                            AI Prompt Template
                                        </CardTitle>
                                        <CardDescription>Enter details to generate a high-engagement post from scratch.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Topic</Label>
                                            <Input placeholder="e.g. Reducing tire wear" value={creatorParams.topic} onChange={e => setCreatorParams({...creatorParams, topic: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Critical Points (One per line)</Label>
                                            <Textarea 
                                                placeholder="e.g. Alignment checks&#10;Group buying savings&#10;Verified supplier network" 
                                                value={creatorParams.criticalPoints}
                                                onChange={e => setCreatorParams({...creatorParams, criticalPoints: e.target.value})}
                                            />
                                        </div>
                                        <Button className="w-full font-bold gap-2" onClick={handleGenerateCustom} disabled={isGenerating}>
                                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4" />}
                                            Generate AI Post
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : null}

                            {activePost && (
                                <>
                                    {/* CONTENT PREVIEW & EDIT */}
                                    <Card className="border-none shadow-xl border-l-4 border-l-primary">
                                        <CardHeader className="bg-white">
                                            <CardTitle className="text-xl font-black">{activePost.headline}</CardTitle>
                                            <CardDescription>Edit the template below to personalize your message.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-0 border-t">
                                            <Textarea 
                                                value={editedContent[activeTab] || activePost.body || activePost.text || ''}
                                                onChange={e => handleContentChange(e.target.value)}
                                                className="min-h-[250px] border-none focus-visible:ring-0 text-sm leading-relaxed p-6 italic font-sans"
                                                placeholder="Your post content..."
                                            />
                                            <div className="p-6 pt-0 space-y-4">
                                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2"><LinkIcon className="h-3 w-3"/> Tracking Link</span>
                                                    <code className="text-[10px] font-bold text-blue-800">{derived.trackingLink}</code>
                                                </div>
                                                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-3">
                                                    <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                                                    <p className="text-[11px] text-amber-800">Your unique tracking ID (FB_{campaignName.replace(/\s/g, '_').toUpperCase() || 'GENERAL'}) will be automatically appended when you click 'Log & Copy'.</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="bg-muted/10 p-4 border-t flex justify-end">
                                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 font-bold gap-2" onClick={handleLogAndLaunch} disabled={isLogging}>
                                                {isLogging ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ExternalLink className="mr-2 h-4 w-4" />}
                                                Log, Copy & Launch to Facebook
                                            </Button>
                                        </CardFooter>
                                    </Card>

                                    {/* INTEGRATED MEDIA TOOLS */}
                                    <div className="space-y-6">
                                        <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border-l-4 border-l-amber-500">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Sparkles className="h-5 w-5 text-amber-500" />
                                                <h4 className="font-bold uppercase text-[10px] tracking-widest">AI Media Command for this Post</h4>
                                            </div>
                                            <p className="text-sm italic font-mono opacity-90 border-l-2 border-primary/50 pl-4 mb-4">{activePost.imagePrompt}</p>
                                            <p className="text-xs text-slate-400">Use the integrated generators below to create matching visuals for your campaign.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <ImageGeneratorCard />
                                            <VideoGeneratorCard />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
