
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
        toast({ title: "Copied to Clipboard!", description: "You can now paste the content into your email client." });
    };
    return (
        <Card>
            <CardHeader><CardTitle>Email Template</CardTitle><CardDescription>Subject: {subject}</CardDescription></CardHeader>
            <CardContent><div className="p-4 bg-muted/50 border rounded-md whitespace-pre-wrap font-mono text-sm max-h-96 overflow-y-auto">{content.trim()}</div></CardContent>
            <CardFooter><Button onClick={() => handleCopyToClipboard(content)}><ClipboardCopy className="mr-2 h-4 w-4" /> Copy Email Content</Button></CardFooter>
        </Card>
    );
};

const templates = {
    intro: {
        subject: "Investment Opportunity in Logistics Tech: Logistics Flow",
        content: `
Dear [Investor Name],

I hope this email finds you well.

My name is [Your Name], and I'm the founder of Logistics Flow. We have built a comprehensive digital ecosystem designed to solve the core challenges of the South African transport industry: access to capital, high operational costs, and systemic inefficiencies.

Our platform has multiple revenue streams (subscriptions, transaction fees, SaaS) and is positioned for exponential growth via powerful network effects.

Would you be open to a brief call next week to discuss how Logistics Flow is set to modernize a critical sector of the economy?

Best regards,

[Your Name]
`
    },
    proposal: {
        subject: "Following Up: The Logistics Flow Investment Opportunity",
        content: `
Dear [Investor Name],

Following up on our brief chat, here is a bit more detail on the investment opportunity with Logistics Flow.

The Problem:
The transport sector is fragmented and underserved by traditional finance and technology. This leads to massive inefficiencies, high costs for operators, and missed growth opportunities.

Our Solution:
Logistics Flow is an all-in-one platform that provides:
- A Funding Division: Connecting transporters with niche lenders.
- A Network of Malls: Leveraging collective buying power for discounts on parts, tires, and services.
- A Value-Added Marketplace: For reselling essential third-party products.
- Powerful Tech Tools: AI-powered freight matching to reduce empty miles.

The Business Model:
We operate on a diversified revenue model including recurring membership fees, transaction commissions from our malls, and SaaS fees for our tech tools. This model is built to scale efficiently.

I would be delighted to schedule a more detailed call to walk you through our platform, financial projections, and our vision for the future of logistics in South Africa.

Best regards,

[Your Name]
`
    },
    financials: {
        subject: "Logistics Flow: Financial Model & Projections",
        content: `
Dear [Investor Name],

Thank you for your interest. Here’s a high-level overview of our financial model:

1. Recurring Subscription Revenue:
We project to onboard [X number] paying members within the first two years, generating a stable, predictable MRR from tiered membership plans.

2. Transactional Commission:
Our model projects significant revenue from commissions on deals in our Finance Mall and transactions in the Supplier & Buy/Sell Malls. As the network grows, this revenue stream scales exponentially.

3. SaaS Revenue:
Adoption of our premium tech tools, like the AI Freight Matcher, represents a high-margin SaaS revenue stream.

We have a detailed financial model and pitch deck available for your review. I am confident that once you see the numbers, you will recognize the scale of this opportunity.

Please let me know when you would have 30 minutes for a deeper dive.

Best regards,

[Your Name]
`
    },
};

const emailTabs = [
    { value: "intro", label: "1. Initial Outreach" },
    { value: "proposal", label: "2. The Proposal" },
    { value: "financials", label: "3. Financials" },
];

export default function InvestorEmailSequence() {
    return (
        <div className="space-y-8">
            <CardHeader className="px-0">
                <div className="flex items-center gap-4"><Mail className="h-8 w-8 text-primary"/><div><CardTitle>Investor Outreach Email Sequence</CardTitle><CardDescription>Use these templates to introduce, propose, and explain the Logistics Flow investment opportunity.</CardDescription></div></div>
            </CardHeader>
            <Tabs defaultValue="intro" className="w-full">
                <TabsList className="grid w-full grid-cols-3">{emailTabs.map(tab => (<TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>))}</TabsList>
                <TabsContent value="intro"><EmailTemplate subject={templates.intro.subject} content={templates.intro.content} /></TabsContent>
                <TabsContent value="proposal"><EmailTemplate subject={templates.proposal.subject} content={templates.proposal.content} /></TabsContent>
                <TabsContent value="financials"><EmailTemplate subject={templates.financials.subject} content={templates.financials.content} /></TabsContent>
            </Tabs>
        </div>
    );
}
