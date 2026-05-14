'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCopy, Mail, UserCheck, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from 'react';
import { useUser } from '@/firebase';

const EmailTemplate = ({ subject, content, partner, referralLink }: { subject: string, content: string, partner: any, referralLink: string }) => {
    const { toast } = useToast();
    
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

What we want from a partner:
- To introduce Logistics Flow to your network of transporters and suppliers.
- To act as an ambassador for our mission to empower transport businesses.

What we will give you in return:
- A Free Lifetime Premium Membership.
- A Recurring Revenue Stream: Earn a significant, recurring commission on all membership and subscription fees from every member you bring into the network.
- Transactional Revenue Share: Earn a share of the revenue Logistics Flow generates from your network's activity across our Finance and Supplier Malls.

This is a true business partnership where your earnings grow with your network's activity.

I would be delighted to schedule a more detailed call to walk you through the platform and the commission structure.

Best regards,

[Your Name]
        `
    },
    revenue: {
        subject: "How the Logistics Flow Partnership Revenue Works",
        content: `
Dear [Partner Name],

Thanks for your interest. Here’s a simple explanation of how our partnership model creates value for you:

1. Recurring Subscription Revenue:
You earn a percentage share of all membership fees from every member you refer. It's a recurring annuity for as long as they remain a member.

2. Transactional Commission:
Your earnings grow as your network uses the platform.
- Finance Mall: When a member from your network finances a truck, you get a share of our origination fee.
- Supplier Mall: When your network buys parts, you get a share of our commission.
- Marketplace Products: You get a share of our commission on every value-added product (like RAF Assist or Mahala Hub subscriptions) sold to your network.

This multi-stream approach ensures your income grows exponentially as your network's activity on our platform increases.

Let me know if you have any questions.

Best regards,

[Your Name]
        `
    },
    invitation: {
        subject: "Invite Your Network to Join You on Logistics Flow",
        content: `
Hi [Partner Name],

The transport industry thrives on relationships. You already have a network of transporters, suppliers, and contacts that you've built over years. Logistics Flow provides the tools to turn those relationships into a powerful, automated revenue engine.

Think about it:
- Who do you buy parts from?
- Who do you subcontract loads to?
- Who asks you for advice on financing?

Every one of these interactions is an opportunity. By introducing them to Logistics Flow—where they can get better pricing, find more work, or access capital—you are not only helping them, but you are also building your own business within our ecosystem.

Your unique referral link is ready: [Referral Link]

Our platform handles the tracking, the transactions, and the payouts. Your job is to do what you already do best: connect people and solve problems. We just provide the framework for you to get paid for it.

Ready to leverage your most valuable asset?

Best regards,

[Your Name]
        `
    }
};

const tabs = [
    { value: "intro", label: "1. Intro" },
    { value: "proposal", label: "2. Proposal" },
    { value: "revenue", label: "3. Revenue" },
    { value: "invitation", label: "4. Invite Link" },
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
            <div className="bg-muted/50 p-4 rounded-lg flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <p className="text-sm">These templates are configured to dynamically merge recipient data when you copy them using the <strong>Log & Copy</strong> button.</p>
            </div>
            
            <Tabs defaultValue="intro" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-muted/30">
                   {tabs.map(tab => (
                       <TabsTrigger key={tab.value} value={tab.value} className="text-xs">{tab.label}</TabsTrigger>
                   ))}
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
