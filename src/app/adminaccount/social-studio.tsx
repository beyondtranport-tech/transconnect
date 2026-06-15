'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
    Facebook, Linkedin, Instagram, Music, Sparkles, Loader2, Copy, ExternalLink, 
    ShieldCheck, Search, BarChart3, ImageIcon, Video, Rocket, Link as LinkIcon, Users, Info
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

const platformConfig: Record<string, { label: string, icon: any, color: string, targetLabel: string, defaultDest: string, defaultPage: string }> = {
    facebook: { label: 'Facebook', icon: Facebook, color: 'text-blue-600', targetLabel: 'Target Group URL', defaultDest: 'https://facebook.com/groups/feed/', defaultPage: 'https://facebook.com/LogisticsFlow' },
    linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'text-blue-800', targetLabel: 'Target Community URL', defaultDest: 'https://linkedin.com/feed/', defaultPage: 'https://www.linkedin.com/company/127864195' },
    instagram: { label: 'Instagram', icon: Instagram, color: 'text-pink-600', targetLabel: 'Target Profile URL', defaultDest: 'https://instagram.com/', defaultPage: 'https://instagram.com/LogisticsFlow' },
    tiktok: { label: 'TikTok', icon: Music, color: 'text-black', targetLabel: 'Target Trend URL', defaultDest: 'https://tiktok.com/', defaultPage: 'https://tiktok.com/@LogisticsFlow' },
};

const socialTemplates = (platform: string) => {
    const config = platformConfig[platform] || platformConfig['facebook'];
    const platformName = config.label;
    
    return {
        'app-launch': {
            group: 'Foundation',
            label: 'Official App Launch',
            icon: Rocket,
            headline: `🚀 Revolutionary: The Launch of Logistics Flow on ${platformName}`,
            body: "It's finally here. A groundbreaking digital ecosystem built specifically for the South African transport industry. No more fragmented systems or information gaps. We've built an innovative platform designed for you—the haulier, the supplier, the professional.\n\nBe among the first to experience the future of logistics. It's new. It's groundbreaking. It's built for you.\n\nClick the link below to access the app for free.",
            imagePrompt: 'A high-tech cinematic shot of a glowing digital network grid superimposed over a fleet of trucks at dawn, representing innovation and groundbreaking technology. Ultra-realistic, 8k.',
            videoPrompt: 'A 5-second dynamic cinematic sweep of a logistics hub. Starting with a close-up of a digital tablet showing a pulsing network map, then pulling back to reveal a fleet of trucks starting their engines and driving out of a modern warehouse as a digital grid glows on the asphalt.'
        },
        'social-connection': {
            group: 'Foundation',
            label: 'Social Connection',
            icon: ShieldCheck,
            headline: `🤝 Join the Logistics Flow Community on ${platformName}`,
            body: `Stay ahead of the curve. Follow our ${platformName} profile to get real-time load matching alerts, exclusive parts discounts, and industrial growth strategies delivered to your feed.\n\nBuilding the future of South African logistics, one connection at a time.\n\nClick the link below to access the app for free.`,
            imagePrompt: 'A cinematic high-detail close up of professional logistics operators using tablets in front of a modern truck fleet, morning sun.',
            videoPrompt: 'A slow motion shot of two transport owners shaking hands in an industrial setting, with a modern truck blurred in the background. The scene transitions to a high-speed montage of the Logistics Flow dashboard showing matching results.'
        },
        'value-costs': {
            group: 'Value',
            label: 'Reduce Costs',
            icon: BarChart3,
            headline: '📉 Slash Your Operating Costs',
            body: "High maintenance and fuel costs are a constant tax on your profit. By joining our community, you tap into collective buying power for tires, parts, and fuel. Why pay premium prices when we can negotiate as a syndicate?\n\nFollow us for more updates on group deals.\n\nClick the link below to access the app for free.",
            imagePrompt: 'Rows of heavy commercial truck tires stacked neatly in a modern warehouse, industrial lighting.',
            videoPrompt: 'A high-speed time-lapse of a truck being fitted with new tires in a clean, modern workshop. Floating digital tags show prices dropping as a "Community Syndicate" discount is applied.'
        },
        'revenue-membership': {
            group: 'Revenue',
            label: 'Membership Comms',
            icon: Users,
            headline: '📈 Build a Recurring Annuity',
            body: "Refer a member, earn a commission. Every single month. When your network signs up for a paid plan, you earn a percentage of their fee for as long as they remain active. Build your own monthly income engine.\n\nFollow us for more updates on group deals.\n\nClick the link below to access the app for free.",
            imagePrompt: 'A calendar showing recurring monthly payments with a green growth arrow.',
            videoPrompt: 'A clean 3D animation showing a "Member" icon joining the network, which triggers a "Commission" coin to flow into a digital wallet. The cycle repeats and scales up as more icons join.'
        }
    };
};

export default function SocialStudio({ platform = 'facebook' }: { platform?: Platform }) {
    const { toast } = useToast();
    const config = platformConfig[platform] || platformConfig['facebook'];
    const templates = socialTemplates(platform);
    
    const [activeTab, setActiveTab] = useState<string>('app-launch');
    const [campaignName, setCampaignName] = useState('');
    const [groupUrl, setGroupUrl] = useState('');
    const [pageUrl, setPageUrl] = useState(config.defaultPage);
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

    const handleCopyPrompt = (promptType: 'image' | 'video') => {
        const prompt = promptType === 'image' ? activePost?.imagePrompt : activePost?.videoPrompt;
        if (!prompt) return;
        navigator.clipboard.writeText(prompt);
        toast({ title: `${promptType === 'image' ? 'Image' : 'Video'} Prompt Copied!`, description: "Paste it into the AI Designer tool below." });
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
                setAiResult({
                    ...result.posts[0],
                    videoPrompt: `A cinematic video interpretation of the topic: ${creatorParams.topic}. Focus on movement, professional logistics, and growth.`
                });
                toast({ title: "AI Copy Ready" });
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Generation Failed", description: e.message });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6 text-left">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
                <div className="flex items-center gap-4 text-left">
                    <div className="bg-muted p-3 rounded-xl">
                        {React.createElement(config.icon, { className: cn("h-8 w-8", config.color) })}
                    </div>
                    <div className="text-left">
                        <h1 className="text-2xl font-black font-headline">{config.label} Studio</h1>
                        <p className="text-muted-foreground text-sm">Strategic expansion suite for {config.label}.</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border-2 border-primary/10 shadow-sm text-left max-w-4xl">
                    <div className="flex-1 min-w-[250px] space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                                <LinkIcon className="h-3 w-3"/> Tracking Label
                            </Label>
                             <Info className="h-3 w-3 text-muted-foreground" title="Enter a unique name for this campaign (e.g. 'July Promo') to track conversions in your dashboard." />
                        </div>
                        <Input 
                            placeholder="e.g. Foundation Post" 
                            value={campaignName} 
                            onChange={e => setCampaignName(e.target.value)} 
                            className="h-10 bg-slate-50 border-none shadow-none text-xs font-bold" 
                        />
                        <p className="text-[9px] text-muted-foreground italic">Appended to your join-links for conversion tracking.</p>
                    </div>

                    <Separator orientation="vertical" className="hidden lg:block h-12 mx-2" />

                    <div className="flex-1 min-w-[300px] space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                                <ExternalLink className="h-3 w-3"/> {config.targetLabel}
                            </Label>
                            <Info className="h-3 w-3 text-muted-foreground" title="Paste the URL of the specific Facebook Group, LinkedIn Page, or TikTok Trend you are targeting." />
                        </div>
                        <Input 
                            placeholder="URL to target destination..." 
                            value={groupUrl} 
                            onChange={e => setGroupUrl(e.target.value)} 
                            className="h-10 bg-slate-50 border-none shadow-none text-xs font-mono" 
                        />
                        <p className="text-[9px] text-muted-foreground italic">The platform destination that will open when you click launch.</p>
                    </div>
                </div>
            </div>

            <Card className="flex flex-col h-[75vh] overflow-hidden p-0 shadow-2xl border-none">
                <div className="flex-1 flex overflow-hidden">
                    <div className="w-64 border-r bg-muted/10 p-4 space-y-4 overflow-y-auto">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 mb-2 block text-left">Funnel Templates</Label>
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
                            className={cn("w-full justify-start gap-3 h-11 px-2", activeTab === 'creator' && "bg-white shadow-sm ring-1 ring-amber-500/20")}
                            onClick={() => setActiveTab('creator')}
                        >
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span className="text-xs font-bold">AI Post Creator</span>
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
                        <div className="max-w-[800px] mx-auto space-y-8">
                             <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-2 text-left">
                                <div className="flex items-center justify-between text-xs text-left">
                                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest text-left flex items-center gap-2">
                                        <Search className="h-3 w-3"/> Community Follow Link: {config.label}
                                    </Label>
                                    <Input value={pageUrl} onChange={e => setPageUrl(e.target.value)} className="h-8 w-[400px] border-none shadow-none text-right font-mono bg-slate-50" />
                                </div>
                                <p className="text-[9px] text-muted-foreground italic px-1">Ensure this links to your official {config.label} profile to drive permanent followers.</p>
                            </div>

                            {activeTab === 'creator' && (
                                <Card className="border-amber-200 bg-amber-50/20 text-left">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2 text-left"><Sparkles className="h-5 w-5 text-amber-500" /> AI Creative Assistant</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 text-left">
                                        <div className="space-y-2 text-left"><Label>Topic</Label><Input placeholder="e.g. Scaling a small fleet" value={creatorParams.topic} onChange={e => setCreatorParams({...creatorParams, topic: e.target.value})} /></div>
                                        <div className="space-y-2 text-left"><Label>Critical Points</Label><Textarea placeholder="Point 1&#10;Point 2..." value={creatorParams.criticalPoints} onChange={e => setCreatorParams({...creatorParams, criticalPoints: e.target.value})} /></div>
                                        <Button className="w-full font-bold bg-amber-600" onClick={handleGenerateCustom} disabled={isGenerating}>
                                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />} Generate Copy
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {activePost && (
                                <>
                                    <Card className="border-none shadow-xl border-l-4 border-l-primary text-left bg-white">
                                        <CardHeader>
                                            <CardTitle className="text-xl font-black">{activePost.headline}</CardTitle>
                                            <CardDescription>Finalize your {config.label} post structure.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-0 border-t text-left">
                                            <Textarea 
                                                value={editedContent[activeTab] || activePost.body || activePost.text || ''}
                                                onChange={e => setEditedContent({...editedContent, [activeTab]: e.target.value})}
                                                className="min-h-[250px] border-none focus-visible:ring-0 p-8 italic font-sans leading-relaxed text-sm text-left bg-transparent"
                                            />
                                            <div className="p-8 pt-0 space-y-4 text-left">
                                                 <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between text-left">
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.1em] flex items-center gap-2 text-left">
                                                            <LinkIcon className="h-3 w-3"/> Join Link (Tracked)
                                                        </span>
                                                        <code className="text-[10px] font-bold text-blue-800 block mt-1">{derived.trackingLink}</code>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase" onClick={() => { navigator.clipboard.writeText(derived.trackingLink); toast({ title: "Link Copied" }); }}>Copy Link</Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="bg-muted/10 border-t flex justify-end p-6">
                                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 font-black uppercase text-xs gap-3 shadow-lg h-14 px-8" onClick={handleLogAndLaunch}>
                                                <ExternalLink className="h-5 w-5" />
                                                Log interaction & Launch {config.label}
                                            </Button>
                                        </CardFooter>
                                    </Card>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                        <div className="bg-slate-900 text-white p-6 rounded-xl border-l-4 border-l-primary text-left shadow-xl">
                                            <div className="flex items-center justify-between mb-4 text-left">
                                                <h4 className="font-bold uppercase text-[10px] tracking-widest text-primary flex items-center gap-2 text-left"><ImageIcon className="h-3 w-3"/> AI Image Command</h4>
                                                <Button variant="outline" size="sm" className="h-7 text-[9px] uppercase bg-white/10 border-white/20" onClick={() => handleCopyPrompt('image')}><Copy className="mr-1 h-3 w-3" /> Copy Prompt</Button>
                                            </div>
                                            <p className="text-xs italic font-mono opacity-80 border-l border-white/20 pl-4 text-left leading-relaxed">{activePost.imagePrompt}</p>
                                        </div>
                                        <div className="bg-slate-900 text-white p-6 rounded-xl border-l-4 border-l-amber-500 text-left shadow-xl">
                                            <div className="flex items-center justify-between mb-4 text-left">
                                                <h4 className="font-bold uppercase text-[10px] tracking-widest text-amber-500 flex items-center gap-2 text-left"><Video className="h-3 w-3"/> AI Video Command</h4>
                                                <Button variant="outline" size="sm" className="h-7 text-[9px] uppercase bg-white/10 border-white/20" onClick={() => handleCopyPrompt('video')}><Copy className="mr-1 h-3 w-3" /> Copy Prompt</Button>
                                            </div>
                                            <p className="text-xs italic font-mono opacity-80 border-l border-amber-500/20 pl-4 text-left leading-relaxed">{activePost.videoPrompt || 'A slow cinematic 4k video of the subject moving towards the camera.'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left pt-4">
                                        <ImageGeneratorCard />
                                        <VideoGeneratorCard />
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
