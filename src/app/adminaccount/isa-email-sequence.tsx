
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
        subject: "ISA Partnership Opportunity with Logistics Flow",
        content: `
Dear [Agent Name],

I hope this email finds you well.

My name is [Your Name], and I'm reaching out from Logistics Flow. We've developed a comprehensive digital ecosystem specifically for the transport industry, designed to solve the key challenges transporters face every day: accessing capital, finding work, and reducing operational costs.

As an Independent Sales Agent (ISA), you can leverage your network to earn significant recurring revenue.

Would you be open to a brief chat next week to explore how this partnership could be mutually beneficial?

Best regards,

[Your Name]
        `
    },
    proposal: {
        subject: "Following Up: The Logistics Flow ISA Proposal",
        content: `
Dear [Agent Name],

Following up on our brief chat, here is a bit more detail on what an ISA partnership with Logistics Flow entails.

What is Logistics Flow?

An all-in-one platform that brings together:
- A Funding Division: Flexible finance solutions where traditional banks often can't.
- A Network of Malls: Specialized marketplaces for parts, vehicles, and services with group-negotiated discounts.
- A Value-Added Marketplace: We provide essential third-party products, like driver benefit programs.
- Powerful Tech Tools: Including an AI-powered system to match available trucks with freight loads.

What we want from an ISA:
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
        subject: "How the Logistics Flow ISA Revenue Model Works",
        content: `
Dear [Agent Name],

Thanks for your interest. Here’s a simple explanation of how our ISA partnership model creates value for you:

1. Recurring Subscription Revenue:
You earn a [X%] share of all membership fees from every member you refer. It's a recurring annuity for as long as they remain a member.

2. Transactional Commission:
Your earnings grow as your network uses the platform.
- Finance Mall: When a member from your network finances a truck, you get a [Y%] share of our origination fee.
- Supplier Mall: When your network buys parts, you get a [Z%] share of our commission.
- Marketplace Products: You get a [W%] share of our commission on every value-added product sold to your network.

This multi-stream approach ensures your income grows exponentially as your network's activity on our platform increases.

Let me know if you have any questions.

Best regards,

[Your Name]
        `
    }
};

const emailTabs = [
    { value: "intro", label: "1. Intro" },
    { value: "proposal", label: "2. Proposal" },
    { value: "revenue", label: "3. Revenue" },
];


export default function ISAEmailSequence() {
    return (
        <div className="space-y-8">
            <CardHeader className="px-0">
                <div className="flex items-center gap-4">
                    <Mail className="h-8 w-8 text-primary"/>
                    <div>
                        <CardTitle>ISA Outreach Email Sequence</CardTitle>
                        <CardDescription>
                            Use these templates to introduce, propose, and explain the Logistics Flow ISA partnership opportunity.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <Tabs defaultValue="intro" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                   {emailTabs.map(tab => (
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
            </Tabs>
        </div>
    );
}
