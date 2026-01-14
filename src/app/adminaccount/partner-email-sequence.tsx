
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCopy, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from 'react';

const EmailTemplate = ({ subject, content }: { subject: string, content: string }) => {
    const { toast } = useToast();

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text.trim());
        toast({
            title: "Copied to Clipboard!",
            description: "You can now paste the content into your email client.",
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Email Template</CardTitle>
                <CardDescription>Subject: {subject}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="p-4 bg-muted/50 border rounded-md whitespace-pre-wrap font-mono text-sm max-h-96 overflow-y-auto">
                    {content.trim()}
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={() => handleCopyToClipboard(content)}>
                    <ClipboardCopy className="mr-2 h-4 w-4" />
                    Copy Email Content
                </Button>
            </CardFooter>
        </Card>
    );
};

const templates = {
    intro: {
        subject: "Partnership Opportunity with TransConnect",
        content: `
Dear [Partner Name],

I hope this email finds you well.

My name is [Your Name], and I'm reaching out from TransConnect. We've developed a comprehensive digital ecosystem specifically for the transport industry, designed to solve the key challenges transporters face every day: accessing capital, finding work, and reducing operational costs.

Would you be open to a brief chat next week to explore how a partnership could be mutually beneficial?

Best regards,

[Your Name]
        `
    },
    proposal: {
        subject: "Following Up: The TransConnect Partnership Proposal",
        content: `
Dear [Partner Name],

Following up on our brief chat, here is a bit more detail on what a partnership with TransConnect entails.

What is TransConnect?

An all-in-one platform that brings together:
- A Funding Division: Flexible finance solutions where traditional banks often can't.
- A Network of Malls: Specialized marketplaces for parts, vehicles, and services with group-negotiated discounts.
- A Value-Added Marketplace: We provide essential third-party products, like the Mahala Hub for drivers, which offers benefits and rewards.
- Powerful Tech Tools: Including an AI-powered system to match available trucks with freight loads.

What we want from a partner:
- To introduce TransConnect to your network of transporters and suppliers.
- To act as an ambassador for our mission to empower transport businesses.

What we will give you in return:
- A Free Lifetime Premium Membership.
- A Recurring Revenue Stream: Earn a significant, recurring commission on all membership and subscription fees from every member you bring into the network.
- Transactional Revenue Share: Earn a share of the revenue TransConnect generates from your network's activity across our Finance and Supplier Malls.

This is a true business partnership where your earnings grow with your network's activity.

I would be delighted to schedule a more detailed call to walk you through the platform and the commission structure.

Best regards,

[Your Name]
        `
    },
    revenue: {
        subject: "How the TransConnect Partnership Revenue Works",
        content: `
Dear [Partner Name],

Thanks for your interest. Here’s a simple explanation of how our partnership model creates value for you:

1. Recurring Subscription Revenue:
You earn a [X%] share of all membership fees from every member you refer. It's a recurring annuity for as long as they remain a member.

2. Transactional Commission:
Your earnings grow as your network uses the platform.
- Finance Mall: When a member from your network finances a truck, you get a [Y%] share of our origination fee.
- Supplier Mall: When your network buys parts, you get a [Z%] share of our commission.
- Marketplace Products: You get a [W%] share of our commission on every value-added product (like RAF Assist or Mahala Hub subscriptions) sold to your network.

This multi-stream approach ensures your income grows exponentially as your network's activity on our platform increases.

Let me know if you have any questions.

Best regards,

[Your Name]
        `
    },
    explanation: {
        subject: "Your Network is Your Asset - Here's Why",
        content: `
Hi [Partner Name],

Let's talk about the core of this partnership: your network.

The transport industry thrives on relationships. You already have a network of transporters, suppliers, and contacts that you've built over years. TransConnect provides the tools to turn those relationships into a powerful, automated revenue engine.

Think about it:
- Who do you buy parts from?
- Who do you subcontract loads to?
- Who asks you for advice on financing?

Every one of these interactions is an opportunity. By introducing them to TransConnect—where they can get better pricing, find more work, or access capital—you are not only helping them, but you are also building your own business within our ecosystem.

Our platform handles the tracking, the transactions, and the payouts. Your job is to do what you already do best: connect people and solve problems. We just provide the framework for you to get paid for it.

Ready to leverage your most valuable asset?

Best regards,

[Your Name]
        `
    },
    howTo: {
        subject: "Getting Started as a TransConnect Partner",
        content: `
Dear [Partner Name],

Great to have you on board! Here’s how we get you started:

Step 1: We Empower You
We will provide you with your lifetime premium membership, a unique referral code, and access to your personal Partner Dashboard. This is where you'll track sign-ups, activity, and earnings in real-time.

Step 2: You Activate Your Network
You introduce TransConnect to your community. Your pitch is simple: invite them to join an ecosystem that saves them money, helps them find work, and gives them access to better financing. We can even equip you with a limited-time "First Year Free" offer to make signing up irresistible for your network.

Step 3: You Earn Automatically
Every time a member from your network pays a subscription, completes a transaction, or buys a product, your share is automatically calculated and credited to your wallet. It's a transparent, seamless process designed for your success.

We are here to support you every step of the way.

Best regards,

[Your Name]
        `
    }
};

const tabs = [
    { value: "intro", label: "1. Intro" },
    { value: "proposal", label: "2. Proposal" },
    { value: "revenue", label: "3. Revenue" },
    { value: "explanation", label: "4. Explanation" },
    { value: "howTo", label: "5. How To" },
];


export default function PartnerEmailSequence() {
    return (
        <div className="space-y-8">
            <CardHeader className="px-0">
                <div className="flex items-center gap-4">
                    <Mail className="h-8 w-8 text-primary"/>
                    <div>
                        <CardTitle>Partner Outreach Email Sequence</CardTitle>
                        <CardDescription>
                            Use these templates to introduce, propose, and explain the TransConnect partnership opportunity.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <Tabs defaultValue="intro" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                   {tabs.map(tab => (
                       <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                   ))}
                </TabsList>
                <TabsContent value="intro">
                    <EmailTemplate subject={templates.intro.subject} content={templates.intro.content} />
                </TabsContent>
                <TabsContent value="proposal">
                     <EmailTemplate subject={templates.proposal.subject} content={templates.proposal.content} />
                </TabsContent>
                <TabsContent value="revenue">
                     <EmailTemplate subject={templates.revenue.subject} content={templates.revenue.content} />
                </TabsContent>
                <TabsContent value="explanation">
                     <EmailTemplate subject={templates.explanation.subject} content={templates.explanation.content} />
                </TabsContent>
                 <TabsContent value="howTo">
                     <EmailTemplate subject={templates.howTo.subject} content={templates.howTo.content} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
