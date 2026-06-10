
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
    Facebook, Linkedin, Instagram, Music, Sparkles, Loader2, Copy, ExternalLink, 
    ShieldCheck, Zap, Truck, Landmark, Users, Handshake, Gift, Star, Link as LinkIcon,
    Building, Award, DollarSign, Rocket, Search, Info, BarChart3, MessageSquare, 
    FileText, Video, ImageIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { generateSocialCopy } from '@/ai/flows/social-copy-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getClientSideAuthToken } from '@/firebase';
import { Textarea } from '@/components/ui/textarea';

// Media Generation Components
import ImageGeneratorCard from "@/app/backend/image-generator-card";
import VideoGeneratorCard from "@/app/backend/video-generator-card";

type Platform = 'facebook' | 'linkedin' | 'instagram' | 'tiktok';

const platformConfig: Record<Platform, { label: string, icon: any, color: string, targetLabel: string, defaultDest: string }> = {
    facebook: { label: 'Facebook', icon: Facebook, color: 'text-blue-600', targetLabel: 'Target Group URL', defaultDest: 'https://facebook.com/groups/feed/' },
    linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'text-blue-800', targetLabel: 'Target Community/Profile URL', defaultDest: 'https://linkedin.com/feed/' },
    instagram: { label: 'Instagram', icon: Instagram, color: 'text-pink-600', targetLabel: 'Target Profile URL', defaultDest: 'https://instagram.com/' },
    tiktok: { label: 'TikTok', icon: Music, color: 'text-black', targetLabel: 'Target Trend/User URL', defaultDest: 'https://tiktok.com/' },
};

/**
 * Funnel-based social templates
 */
const socialTemplates = (platform: Platform) => {
    const platformName = platformConfig[platform].label;
    
    return {
        'app-launch': {
            group: 'Foundation',
            label: 'Official App Launch',
            icon: Rocket,
            headline: `🚀 Revolutionary: The Launch of Logistics Flow on ${platformName}`,
            body: "It's finally here. A groundbreaking digital ecosystem built specifically for the South African transport industry. No more fragmented systems or information gaps. We've built an innovative platform designed for you—the haulier, the supplier, the professional.\n\nBe among the first to experience the future of logistics. It's new. It's groundbreaking. It's built for you.\n\nClick the link below to access the app for free.",
            imagePrompt: 'A high-tech cinematic shot of a glowing digital network grid superimposed over a fleet of trucks at dawn, representing innovation and groundbreaking technology.'
        },
        'social-connection': {
            group: 'Foundation',
            label: 'Social Connection',
            icon: ShieldCheck,
            headline: `🤝 Join the Logistics Flow Community on ${platformName}`,
            body: `Stay ahead of the curve. Follow our ${platformName} profile to get real-time load matching alerts, exclusive parts discounts, and industrial growth strategies delivered to your feed.\n\nBuilding the future of South African logistics, one connection at a time.\n\nClick the link below to access the app for free.`,
            imagePrompt: 'A cinematic high-detail close up of professional logistics operators using tablets in front of a modern truck fleet, morning sun.'
        },
        'value-costs': {
            group: 'Value',
            label: 'Reduce Costs',
            icon: BarChart3,
            headline: '📉 Slash Your Operating Costs',
            body: "High maintenance and fuel costs are a constant tax on your profit. By joining our community, you tap into collective buying power for tires, parts, and fuel. Why pay premium prices when we can negotiate as a syndicate?\n\nFollow us for more updates on group deals.\n\nClick the link below to access the app for free.",
            imagePrompt: 'Rows of heavy commercial truck tires stacked neatly in a modern warehouse, industrial lighting.'
        },
        'value-funding-registry': {
            group: 'Value',
            label: 'Funder Registry',
            icon: Building,
            headline: '🏦 Access 85+ Specialized Funders',
            body: "One application. 85+ Potential Funders. We've mapped the entire niche lending landscape in SA to bring the best asset finance and working capital deals directly to your dashboard.\n\nFollow us for more updates.\n\nClick the link below to access the app for free.",
            imagePrompt: 'A sleek modern bank building exterior in Sandton, morning light, professional and clean.'
        },
        'revenue-membership': {
            group: 'Revenue',
            label: 'Membership Comms',
            icon: Users,
            headline: '📈 Build a Recurring Annuity',
            body: "Refer a member, earn a commission. Every single month. When your network signs up for a paid plan, you earn a percentage of their fee for as long as they remain active. Build your own monthly income engine.\n\nFollow us for more updates.\n\nClick the link below to access the app for free.",
            imagePrompt: 'A calendar showing recurring monthly payments with a green growth arrow.'
        },
        'howto-matcher': {
            group: 'Education',
            label: 'Freight Matcher',
            icon: Search,
            headline: '📍 How-To: Eliminate Empty Miles',
            body: "Our AI Freight Matcher is a game-changer. Simply enter your origin and destination, and let our intelligence engine find the highest-paying loads for your return leg.\n\nFollow us for more updates.\n\nClick the link below to access the app for free.",
            imagePrompt: 'A map of South Africa with blinking nodes being connected by an AI intelligence line.'
        }
    };
};

export default function SocialStudio({ platform = 'facebook' }: { platform?: Platform }) {
    const { toast } = useToast();
    const config = platformConfig[platform];
    const templates = socialTemplates(platform);
    
    const [activeTab, setActiveTab] = useState<string>('app-launch');
    const [campaignName, setCampaignName] = useState('');
    const [groupUrl, setGroupUrl] = useState('');
    const [pageUrl, setPageUrl] = useState(`https://${platform}.com/LogisticsFlow`);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLogging, setIsLogging] = useState(false);

    const [editedContent, setEditedContent] = useState<Record<string, string>>({});
    const [creatorParams, setCreatorParams] = useState({ topic: '', criticalPoints: '' });
    const [aiResult, setAiResult] = useState<any>(null);

    const activePost = activeTab === 'creator' ? aiResult : (templates as any)[activeTab];

    const derived = useMemo(() => {
        if (!activePost) return { trackingLink: '', fullPostBody: '' };
        
        const sanitizedRef = campaignName.replace(/\s/g, '_').toUpperCase() || 'GENERAL';
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studio--ecosystem-hub.us-central1.hosted.app';
        const trackingLink = `${baseUrl}/join?ref=${platform.toUpperCase()}_${sanitizedRef}`;
        
        const currentBody = editedContent[activeTab] || activePost.body || activePost.text || '';
        const fullPostBody = `${currentBody}\n\n👉 Join the Community: ${trackingLink}\n\n🔗 Follow us for Updates: ${pageUrl}\n\n#LogisticsFlow #Efficiency #${config.label}`;
        
        return { trackingLink, fullPostBody };
    }, [activePost, campaignName, pageUrl, editedContent, activeTab, platform, config.label]);

    const handleLogAndLaunch = async () => {
        const textToCopy = derived.fullPostBody;
        try {
            await navigator.clipboard.writeText(textToCopy);
            toast({ title: "Content Copied!", description: `Opening ${config.label}... Paste your post there.` });
        } catch (err) {
            toast({ variant: 'destructive', title: "Copy Failed", description: "Please manually copy the text." });
        }

        const destination = groupUrl.trim() || config.defaultDest;
        window.open(destination, '_blank');

        setIsLogging(true);
        try {
            const token = await getClientSideAuthToken();
            if (token) {
                await fetch('/api/admin', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        action: 'logAudit', 
                        payload: { 
                            action: 'social_launch', 
                            details: `Launched ${platform} post "${activeTab}" for: ${campaignName}`,
                            metadata: { campaignName, groupUrl, tab: activeTab, platform }
                        } 
                    }),
                });
            }
        } catch (e) {
            console.warn("Audit logging failed after launch.", e);
        } finally {
            setIsLogging(false);
        }
    };

    const handleGenerateCustom = async () => {
        if (!creatorParams.topic || !creatorParams.criticalPoints) {
            toast({ variant: 'destructive', title: "Details Required", description: "Please enter a topic and points." });
            return;
        }
        setIsGenerating(true);
        try {
            const result = await generateSocialCopy({
                topic: creatorParams.topic,
                criticalPoints: creatorParams.criticalPoints,
                audience: 'transporters',
                tone: 'community_casual'
            });
            if (result.posts && result.posts.length > 0) {
                setAiResult(result.posts[0]);
                toast({ title: "AI Copy Ready" });
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Generation Failed", description: e.message });
        } finally {
            setIsGenerating(false);
        }
    };

    const copyImagePrompt = () => {
        if (!activePost?.imagePrompt) return;
        navigator.clipboard.writeText(activePost.imagePrompt);
        toast({ title: "Prompt Copied!", description: "Paste it into the AI Designer below." });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-muted p-3 rounded-xl">
                        {React.createElement(config.icon, { className: cn("h-8 w-8", config.color) })}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black font-headline">{config.label} Engagement Wizard</h1>
                        <p className="text-muted-foreground">Strategic growth tools for {config.label}.</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 bg-muted/50 p-2 rounded-lg border">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground px-2">Tracking Label</Label>
                        <Input placeholder="e.g. Cape Hauliers" value={campaignName} onChange={e => setCampaignName(e.target.value)} className="h-8 w-48 bg-white border-none shadow-none text-xs font-bold" />
                    </div>
                    <Separator orientation="vertical" className="hidden md:block h-10 mx-2" />
                    <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground px-2">{config.targetLabel}</Label>
                        <Input placeholder="URL for direct launch..." value={groupUrl} onChange={e => setGroupUrl(e.target.value)} className="h-8 w-64 bg-white border-none shadow-none text-xs font-mono" />
                    </div>
                </div>
            </div>

            <Card className="flex flex-col h-[75vh] overflow-hidden p-0 shadow-2xl">
                <div className="flex-1 flex overflow-hidden">
                    <div className="w-64 border-r bg-muted/10 p-4 space-y-4 overflow-y-auto">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 mb-2 block">Funnel Templates</Label>
                            {Object.entries(templates).map(([id, template]: [string, any]) => (
                                <Button
                                    key={id}
                                    variant={activeTab === id ? "secondary" : "ghost"}
                                    className={cn("w-full justify-start gap-3 h-10 px-2", activeTab === id && "bg-white shadow-sm ring-1 ring-primary/20")}
                                    onClick={() => setActiveTab(id)}
                                >
                                    {React.createElement(template.icon, { className: "h-4 w-4 text-primary" })}
                                    <span className="truncate text-xs font-medium">{template.label}</span>
                                </Button>
                            ))}
                        </div>
                        <Separator />
                        <Button
                            variant={activeTab === 'creator' ? "secondary" : "ghost"}
                            className={cn("w-full justify-start gap-3 h-11", activeTab === 'creator' && "bg-white shadow-sm ring-1 ring-amber-500/20")}
                            onClick={() => setActiveTab('creator')}
                        >
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span className="text-xs font-bold">AI Post Creator</span>
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
                        <div className="max-w-[800px] mx-auto space-y-8">
                             <div className="bg-white p-3 rounded-lg border flex items-center justify-between text-xs">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">My Official {config.label} Profile/Page URL</Label>
                                <Input value={pageUrl} onChange={e => setPageUrl(e.target.value)} className="h-7 w-64 border-none shadow-none text-right font-mono" />
                            </div>

                            {activeTab === 'creator' && (
                                <Card className="border-amber-200 bg-amber-50/20">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-500" /> AI Creative Assistant</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2"><Label>Topic</Label><Input placeholder="e.g. Improving fleet utilization" value={creatorParams.topic} onChange={e => setCreatorParams({...creatorParams, topic: e.target.value})} /></div>
                                        <div className="space-y-2"><Label>Critical Points</Label><Textarea placeholder="Point 1&#10;Point 2..." value={creatorParams.criticalPoints} onChange={e => setCreatorParams({...creatorParams, criticalPoints: e.target.value})} /></div>
                                        <Button className="w-full font-bold bg-amber-600" onClick={handleGenerateCustom} disabled={isGenerating}>{isGenerating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4" />} Generate Copy</Button>
                                    </CardContent>
                                </Card>
                            )}

                            {activePost && (
                                <>
                                    <Card className="border-none shadow-xl border-l-4 border-l-primary">
                                        <CardHeader>
                                            <div className="flex justify-between items-center">
                                                <CardTitle className="text-xl font-black">{activePost.headline}</CardTitle>
                                                {activeTab.startsWith('howto') && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Video Content Ready</Badge>}
                                            </div>
                                            <CardDescription>Review and finalize your {config.label} post.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-0 border-t">
                                            <Textarea 
                                                value={editedContent[activeTab] || activePost.body || activePost.text || ''}
                                                onChange={e => setEditedContent({...editedContent, [activeTab]: e.target.value})}
                                                className="min-h-[200px] border-none focus-visible:ring-0 p-6 italic font-sans"
                                            />
                                            <div className="p-6 pt-0 space-y-2">
                                                 <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2"><LinkIcon className="h-3 w-3"/> Campaign Link</span>
                                                    <code className="text-[10px] font-bold text-blue-800">{derived.trackingLink}</code>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="bg-muted/10 border-t flex justify-end p-4">
                                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 font-black uppercase text-xs gap-2" onClick={handleLogAndLaunch}>
                                                {isLogging ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ExternalLink className="mr-2 h-4 w-4" />}
                                                Log & Launch to {config.label}
                                            </Button>
                                        </CardFooter>
                                    </Card>

                                    <div className="space-y-6">
                                        <div className="bg-slate-900 text-white p-6 rounded-xl border-l-4 border-l-amber-500">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-bold uppercase text-[10px] tracking-widest text-amber-500">Visual Command</h4>
                                                <Button variant="outline" size="sm" className="h-7 text-[9px] uppercase bg-white/10" onClick={copyImagePrompt}><Copy className="mr-1 h-3 w-3" /> Copy Prompt</Button>
                                            </div>
                                            <p className="text-sm italic font-mono opacity-90 border-l-2 border-primary/50 pl-4 mb-4">{activePost.imagePrompt}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
