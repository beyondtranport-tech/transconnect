
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
    Facebook, Sparkles, Loader2, Copy, Send, Link as LinkIcon, 
    MessageSquare, Video, Info, BarChart3, 
    ExternalLink, ImageIcon, ShieldCheck, Zap, 
    Truck, Landmark, Users, Handshake, Gift, Star,
    Building, Award, DollarSign, Wallet, Search, Database, User
} from 'lucide-react';
import { generateSocialCopy } from '@/ai/flows/social-copy-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getClientSideAuthToken } from '@/firebase';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Media Generation Components
import ImageGeneratorCard from "@/app/backend/image-generator-card";
import VideoGeneratorCard from "@/app/backend/video-generator-card";

/**
 * EXPANDED SOCIAL TEMPLATE LIBRARY
 * Updated for target audience engagement.
 */
const socialTemplates = {
    'handshake': {
        group: 'Foundation',
        label: 'Digital Handshake',
        icon: ShieldCheck,
        headline: '🤝 Establishing a Trusted Connection',
        body: "For too long, the transport industry has been held back by fragmentation. We are breaking the constraint.\n\nWe're inviting professional hauliers to establish a 'Digital Handshake' with our ecosystem. Get matched with verified loads and access community-negotiated parts discounts instantly.\n\nClick the link below to access the app for free.",
        imagePrompt: 'A cinematic high-detail close up of a professional handshake between a haulier and a logistics manager, background shows a clean white truck at sunset.'
    },
    'intro': {
        group: 'Value',
        label: 'The Value Prop',
        icon: Zap,
        headline: '🚀 Redefining South African Logistics',
        body: "Logistics Flow is more than a platform—it's a digital branch for your business. We combine the power of community buying with AI-driven efficiency to help you move more with less. No brokers, no middlemen, just direct flow.\n\nClick the link below to access the app for free.",
        imagePrompt: 'A wide cinematic shot of a white superlink truck driving on an open South African highway, bright morning light.'
    },
    'value-costs': {
        group: 'Value',
        label: 'Reduce Costs',
        icon: BarChart3,
        headline: '📉 Slash Your Operating Costs',
        body: "High maintenance and fuel costs are a constant tax on your profit. By joining our community, you tap into collective buying power for tires, parts, and fuel. Why pay premium prices when we can negotiate as a syndicate?\n\nClick the link below to access the app for free.",
        imagePrompt: 'Rows of heavy commercial truck tires stacked neatly in a modern warehouse, industrial lighting.'
    },
    'value-community': {
        group: 'Value',
        label: 'The Community',
        icon: Users,
        headline: '👥 Power in Numbers',
        body: "Transport is a lonely business, but it doesn't have to be. Join a trusted network of 5,000+ verified members. Share data, find subcontracting partners, and grow your standing in the industry through our verified registry.\n\nClick the link below to access the app for free.",
        imagePrompt: 'A diverse group of professional South African transporters shaking hands and talking next to a fleet of trucks.'
    },
    'value-funding-inhouse': {
        group: 'Value',
        label: 'In-house Funding',
        icon: Landmark,
        headline: '💳 Funding Built for Transporters',
        body: "Traditional banks often decline transport businesses because they don't understand the risks. Our in-house funding division, Simplyfi Flow, looks at your real-time performance on our platform to build a credit profile that works.\n\nClick the link below to access the app for free.",
        imagePrompt: 'A digital tablet showing an approved loan application with a truck icon and green checkmark.'
    },
    'value-funding-registry': {
        group: 'Value',
        label: 'Funder Registry',
        icon: Building,
        headline: '🏦 Access 85+ Specialized Funders',
        body: "One application. 85+ Potential Funders. We've mapped the entire niche lending landscape in SA to bring the best asset finance and working capital deals directly to your dashboard.\n\nClick the link below to access the app for free.",
        imagePrompt: 'A sleek modern bank building exterior in Sandton, morning light, professional and clean.'
    },
    'value-loyalty': {
        group: 'Value',
        label: 'Grow Loyalty',
        icon: Award,
        headline: '⭐ Rise Through the Tiers',
        body: "Every action you take in our ecosystem earns you points. Move from Bronze to Gold to unlock deeper discounts, lower commission rates, and priority access to premium loads.\n\nClick the link below to access the app for free.",
        imagePrompt: 'A gold, silver, and bronze medal set against a background of logistics data graphs.'
    },
    'value-rewards': {
        group: 'Value',
        label: 'Earn Rewards',
        icon: Gift,
        headline: '🎁 Turn Activity into Assets',
        body: "Earn points for listing products, contributing data, or referring friends. Redeem your rewards for fuel vouchers, service discounts, or exclusive marketplace gear.\n\nClick the link below to access the app for free.",
        imagePrompt: 'A professional fuel voucher card being handed over at a filling station, clean and sharp focus.'
    },
    'revenue-rewards': {
        group: 'Revenue',
        label: 'In-house Rewards',
        icon: Star,
        headline: '✨ Get Paid to Participate',
        body: "Our 'Actions Plan' turns your daily tasks into revenue. Uploading your fleet details or listing a route isn't just admin—it's an earning event. Start building your points balance today.\n\nClick the link below to access the app for free.",
        imagePrompt: 'A digital wallet on a smartphone screen showing points being added with a star animation.'
    },
    'revenue-discounts': {
        group: 'Revenue',
        label: 'Supplier Discounts',
        icon: Handshake,
        headline: '🤝 Shared Savings is Earned Income',
        body: "A Rand saved on maintenance is a Rand added to your profit. We share the negotiated savings from our supplier network directly with our members. It's the easiest way to improve your margin.\n\nClick the link below to access the app for free.",
        imagePrompt: 'A side-by-side comparison chart showing standard prices vs community discounted prices for truck parts.'
    },
    'revenue-membership': {
        group: 'Revenue',
        label: 'Membership Comms',
        icon: Users,
        headline: '📈 Build a Recurring Annuity',
        body: "Refer a member, earn a commission. Every single month. When your network signs up for a paid plan, you earn a percentage of their fee for as long as they remain active. Build your own monthly income engine.\n\nClick the link below to access the app for free.",
        imagePrompt: 'A calendar showing recurring monthly payments with a green growth arrow.'
    },
    'revenue-transactions': {
        group: 'Revenue',
        label: 'Transaction Comms',
        icon: DollarSign,
        headline: '💸 Earn from Every Deal',
        body: "Your network is your asset. When your referrals buy tires, parts, or secure funding through our Malls, you get a share of the platform's commission. Their success is literally your profit.\n\nClick the link below to access the app for free.",
        imagePrompt: 'A high-speed montage of various commercial transactions happening on a digital map of South Africa.'
    },
    'howto-profile': {
        group: 'Education',
        label: 'Create Profile',
        icon: User,
        headline: '🛠️ How-To: Build Your Digital Branch',
        body: "Setting up your shop or service profile takes less than 10 minutes. Watch our short guide on using the Wizard to upload your branding and products to the national network.\n\nClick the link below to access the app for free.",
        imagePrompt: 'A screen recording showing a clean, easy-to-use business profile setup wizard.'
    },
    'howto-matcher': {
        group: 'Education',
        label: 'Freight Matcher',
        icon: Search,
        headline: '📍 How-To: Eliminate Empty Miles',
        body: "Our AI Freight Matcher is a game-changer. Simply enter your origin and destination, and let our intelligence engine find the highest-paying loads for your return leg. Watch how it works.\n\nClick the link below to access the app for free.",
        imagePrompt: 'A map of South Africa with blinking nodes being connected by an AI intelligence line.'
    },
    'howto-wallet': {
        group: 'Education',
        label: 'Use the Wallet',
        icon: Wallet,
        headline: '💳 How-To: Manage Your Funds',
        body: "The Logistics Flow Wallet is your central clearing house. Get paid for sales, pay for services, and request payouts to your bank account with one click. Simple, secure, and transparent.\n\nClick the link below to access the app for free.",
        imagePrompt: 'A professional dashboard view of a business wallet with clear credit and ledger sheets.'
    },
    'howto-contribute': {
        group: 'Education',
        label: 'Contribute Data',
        icon: Database,
        headline: '📊 How-To: The Power of Data',
        body: "Why contribute your fleet or supplier data? Because data is the currency of negotiation. Watch how sharing anonymous details helps us secure lower prices for your business.\n\nClick the link below to access the app for free.",
        imagePrompt: 'Abstract visualization of data points flowing into a central hub and turning into a large shield representing collective power.'
    }
};

export default function SocialStudio() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<keyof typeof socialTemplates | 'creator'>('handshake');
    const [campaignName, setCampaignName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLogging, setIsLogging] = useState(false);

    const [editedContent, setEditedContent] = useState<Record<string, string>>({});
    const [creatorParams, setCreatorParams] = useState({ topic: '', criticalPoints: '' });
    const [aiResult, setAiResult] = useState<any>(null);

    const activePost = activeTab === 'creator' ? aiResult : socialTemplates[activeTab as keyof typeof socialTemplates];

    const derived = useMemo(() => {
        if (!activePost) return { trackingLink: '', fullPostBody: '' };
        
        const sanitizedRef = campaignName.replace(/\s/g, '_').toUpperCase() || 'GENERAL';
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studio--ecosystem-hub.us-central1.hosted.app';
        const trackingLink = `${baseUrl}/join?ref=FB_${sanitizedRef}`;
        
        const currentBody = editedContent[activeTab] || activePost.body || activePost.text || '';
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

    const copyImagePrompt = () => {
        if (!activePost?.imagePrompt) return;
        navigator.clipboard.writeText(activePost.imagePrompt);
        toast({ title: "Prompt Copied!", description: "Paste it into the AI Designer below." });
    };

    const renderSidebarGroup = (groupName: string) => {
        const groupActions = Object.entries(socialTemplates).filter(([_, t]) => t.group === groupName);
        if (groupActions.length === 0) return null;

        return (
            <div key={groupName} className="mb-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 mb-2 block">{groupName}</Label>
                <div className="space-y-1">
                    {groupActions.map(([id, template]) => (
                        <Button
                            key={id}
                            variant={activeTab === id ? "secondary" : "ghost"}
                            className={cn("w-full justify-start gap-3 h-10 px-2", activeTab === id && "bg-white shadow-sm ring-1 ring-primary/20")}
                            onClick={() => setActiveTab(id as any)}
                        >
                            {React.createElement(template.icon, { className: "h-4 w-4 text-primary" })}
                            <span className="truncate text-xs font-medium">{template.label}</span>
                        </Button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-xl"><Facebook className="h-8 w-8 text-blue-600" /></div>
                    <div>
                        <h1 className="text-2xl font-black font-headline">Social Engagement Wizard</h1>
                        <p className="text-muted-foreground">Strategic expansion for industry Facebook groups.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg border">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground px-2">Target Group</Label>
                    <Input 
                        placeholder="e.g. Western Cape Transporters" 
                        value={campaignName} 
                        onChange={e => setCampaignName(e.target.value)}
                        className="h-8 w-48 bg-white border-none shadow-none text-xs font-bold"
                    />
                </div>
            </div>

            <Card className="flex flex-col h-[78vh] overflow-hidden p-0 shadow-2xl">
                <div className="flex-1 flex overflow-hidden">
                    <div className="w-64 border-r bg-muted/10 p-4 space-y-1 overflow-y-auto">
                        {renderSidebarGroup('Foundation')}
                        {renderSidebarGroup('Value')}
                        {renderSidebarGroup('Revenue')}
                        {renderSidebarGroup('Education')}
                        
                        <Separator className="my-4" />
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
                            {activeTab === 'creator' ? (
                                <Card className="border-amber-200 bg-amber-50/20">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Sparkles className="h-5 w-5 text-amber-500" />
                                            AI Prompt Template
                                        </CardTitle>
                                        <CardDescription>Enter your topic and critical points to generate a specialized industry post.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Topic</Label>
                                            <Input placeholder="e.g. Managing maintenance debt" value={creatorParams.topic} onChange={e => setCreatorParams({...creatorParams, topic: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Critical Points (One per line)</Label>
                                            <Textarea 
                                                placeholder="e.g. Collective buying power&#10;Verified supplier access&#10;Maintenance tracking tools" 
                                                value={creatorParams.criticalPoints}
                                                onChange={e => setCreatorParams({...creatorParams, criticalPoints: e.target.value})}
                                            />
                                        </div>
                                        <Button className="w-full font-bold gap-2 bg-amber-600 hover:bg-amber-700" onClick={handleGenerateCustom} disabled={isGenerating}>
                                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4" />}
                                            Generate AI Post
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : null}

                            {activePost ? (
                                <>
                                    <Card className="border-none shadow-xl border-l-4 border-l-primary">
                                        <CardHeader className="bg-white">
                                            <div className="flex justify-between items-center">
                                                <CardTitle className="text-xl font-black">{activePost.headline}</CardTitle>
                                                {activeTab.startsWith('howto') && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Video Accompanied</Badge>}
                                            </div>
                                            <CardDescription>Review and personalization workspace.</CardDescription>
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
                                                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2"><LinkIcon className="h-3 w-3"/> Campaign Link</span>
                                                    <code className="text-[10px] font-bold text-blue-800">{derived.trackingLink}</code>
                                                </div>
                                                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-3">
                                                    <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                                                    <p className="text-[11px] text-amber-800 leading-tight">Your referral ID (FB_{campaignName.replace(/\s/g, '_').toUpperCase() || 'GENERAL'}) will be automatically appended to track conversion performance.</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="bg-muted/10 p-4 border-t flex justify-end">
                                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 font-black uppercase text-xs tracking-widest gap-2" onClick={handleLogAndLaunch} disabled={isLogging}>
                                                {isLogging ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ExternalLink className="mr-2 h-4 w-4" />}
                                                Log & Launch to Facebook
                                            </Button>
                                        </CardFooter>
                                    </Card>

                                    <div className="space-y-6">
                                        <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border-l-4 border-l-amber-500">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="h-5 w-5 text-amber-500" />
                                                    <h4 className="font-bold uppercase text-[10px] tracking-widest">Visual Asset Command</h4>
                                                </div>
                                                <Button variant="outline" size="sm" className="h-7 text-[9px] uppercase font-black bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={copyImagePrompt}>
                                                    <Copy className="mr-1 h-3 w-3" /> Copy Prompt
                                                </Button>
                                            </div>
                                            <p className="text-sm italic font-mono opacity-90 border-l-2 border-primary/50 pl-4 mb-4">{activePost.imagePrompt}</p>
                                            <p className="text-xs text-slate-400">Use the integrated generators below to create matching visuals for this specific template.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <ImageGeneratorCard />
                                            <VideoGeneratorCard />
                                        </div>
                                    </div>
                                </>
                            ) : !isGenerating && activeTab !== 'creator' ? (
                                <div className="text-center py-20">
                                    <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                                    <p className="text-muted-foreground">Select a template from the sidebar to begin.</p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
