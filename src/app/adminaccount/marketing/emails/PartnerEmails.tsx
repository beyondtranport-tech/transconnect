'use client';

import { Card, CardContent, CardDescription, CardHeader, CardFooter } from '@/components/ui/card';
import { Mail, UserCheck, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from 'react';
import { useUser } from '@/firebase';

const EmailTemplate = ({ subject, content, partner, referralLink }: { subject: string, content: string, partner: any, referralLink: string }) => {
    const personalizedContent = React.useMemo(() => {
        let text = content;
        const name = partner?.firstName || '[Partner Name]';
        const company = partner?.companyName || '[Your Company]';
        
        text = text.replace(/\[Partner Name\]/g, name);
        text = text.replace(/\[Name\]/g, name);
        text = text.replace(/\[Lead Name\]/g, name);
        text = text.replace(/\[Your Company\]/g, company);
        text = text.replace(/\[Referral Link\]/g, referralLink);
        text = text.replace(/\[Sign-up Link\]/g, referralLink);
        text = text.replace(/\[Opt-in Link\]/g, `${window.location.origin}/opt-in/${partner?.id || 'TEST'}`);

        return text;
    }, [content, partner, referralLink]);

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Email Subject</CardTitle>
                        <CardDescription className="font-medium text-foreground select-all">{subject}</CardDescription>
                    </div>
                    {partner && (
                         <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-green-200">
                            <UserCheck className="h-3.5 w-3.5" /> Personalized for {partner.firstName}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <div className="p-6 bg-white border rounded-md whitespace-pre-wrap font-sans text-sm shadow-inner min-h-[300px]">
                    {personalizedContent.trim()}
                </div>
            </CardContent>
            {partner && (
                <CardFooter className="px-0 pt-4 border-t mt-4">
                    <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1"><LinkIcon className="h-3 w-3"/> Referral ID: <span className="font-mono text-primary font-bold">{partner.id}</span></span>
                        </div>
                        <span className="italic">Copy HTML via the main toolbar to include hidden tracking.</span>
                    </div>
                </CardFooter>
            )}
        </Card>
    );
};

const templates = {
    consent: {
        subject: "Confirming Your Logistics Flow Network Participation",
        content: `
Hi [Partner Name],

I'm reaching out from Logistics Flow. We're currently expanding our network of strategic partners, and we'd love to have [Your Company] involved.

Before we can send you specific opportunities or platform updates, we need to ensure we are fully compliant with your privacy preferences.

Please take 30 seconds to review our terms and provide your formal marketing consent here:
[Opt-in Link]

Why opt-in?
- Receive matching partnership alerts.
- Access community-negotiated benefits.
- Participate in our revenue-sharing model.

We respect your privacy and will never spam you. You can manage your preferences at any time.

Best regards,

The Logistics Flow Team
        `
    },
    intro: {
        subject: "Partnership Opportunity with Logistics Flow",
        content: `
Dear [Partner Name],

I hope this email finds you well.

My name is [Your Name], and I'm reaching out from Logistics Flow. We've developed a comprehensive digital ecosystem specifically for the transport industry, designed to solve the key challenges transporters face every day: accessing capital, finding work, and reducing operational costs.

Would you be open to a brief chat next week to explore how a partnership could be mutually beneficial for [Your Company]?

Best regards,

[Your Name]
        `
    },
    proposal: {
        subject: "Following Up: The Logistics Flow Partnership Proposal",
        content: `
Dear [Partner Name],

Following up on our brief chat, here is a bit more detail on what a partnership with Logistics Flow entails.

What is Logistics Flow?

An all-in-one platform that brings together:
- A Funding Division: Flexible finance solutions where traditional banks often can't.
- A Network of Malls: Specialized marketplaces for parts, vehicles, and services with group-negotiated discounts.
- A Value-Added Marketplace: We provide essential third-party products, like the Mahala Hub for drivers, which offers benefits and rewards.
- Powerful Tech Tools: Including an AI-powered system to match available trucks with freight loads.

This is a true business partnership where your earnings grow with your network's activity.

I would be delighted to schedule a more detailed call to walk you through the platform and the commission structure.

Best regards,

[Your Name]
        `
    },
    invitation: {
        subject: "Invite Your Network to Join You on Logistics Flow",
        content: `
Hi [Partner Name],

The transport industry thrives on relationships. You already have a network of transporters, suppliers, and contacts that you've built over years. Logistics Flow provides the tools to turn those relationships into a powerful, automated revenue engine.

Your unique referral link is ready: [Referral Link]

Ready to leverage your most valuable asset?

Best regards,

[Your Name]
        `
    }
};

const tabs = [
    { value: "consent", label: "0. POPI Consent", icon: ShieldCheck },
    { value: "intro", label: "1. Intro" },
    { value: "proposal", label: "2. Proposal" },
    { value: "invitation", label: "3. Invite Link" },
];


export default function PartnerEmails({ partner }: { partner?: any }) {
    const { user } = useUser();
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studio--ecosystem-hub.us-central1.hosted.app';
    
    const referralLink = React.useMemo(() => {
        if (!partner) return `${baseUrl}/join`;
        return `${baseUrl}/join?ref=${partner.id}&firstName=${encodeURIComponent(partner.firstName)}&lastName=${encodeURIComponent(partner.lastName)}&email=${encodeURIComponent(partner.email)}`;
    }, [partner, baseUrl]);

    return (
        <div className="space-y-6">
            <Tabs defaultValue="consent" className="w-full">
                <TabsList className="h-auto flex-wrap justify-start bg-muted/30">
                   {tabs.map(tab => {
                       const Icon = tab.icon;
                       return (
                           <TabsTrigger key={tab.value} value={tab.value} className="text-xs gap-2">
                               {Icon && <Icon className="h-3 w-3" />}
                               {tab.label}
                           </TabsTrigger>
                       );
                   })}
                </TabsList>
                {Object.entries(templates).map(([key, t]) => (
                    <TabsContent key={key} value={key} className="mt-6">
                        <EmailTemplate 
                            subject={t.subject} 
                            content={t.content.replace(/\[Your Name\]/g, user?.displayName || 'TransConnect Team')} 
                            partner={partner} 
                            referralLink={referralLink}
                        />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
