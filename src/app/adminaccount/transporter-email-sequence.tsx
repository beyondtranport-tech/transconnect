
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCopy, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from 'react';
import { useSearchParams } from 'next/navigation';

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

const getTemplates = (transporterType: string) => ({
    intro: {
        subject: `A New Way to Reduce Costs for Your ${transporterType} Business`,
        content: `
Hi [Transporter Name],

I'm reaching out from Logistics Flow with a simple proposition to help reduce your daily operating costs.

We're building a network to leverage the collective buying power of transporters like you. To do this effectively, we need your help. By contributing anonymous data about your fleet, your common routes, and the suppliers you already use, you give us the leverage to negotiate significant group discounts on your behalf.

The process is simple:
1. Join Logistics Flow for free and create your digital branch.
2. Use our secure "Contribution Hub" to share details about your fleet and suppliers.
3. As we onboard these suppliers with new group discounts, the savings are passed directly back to you through our Supplier Mall.

This is a community-driven approach to cost-saving. Your knowledge is the key.

Ready to start saving? Join for free: [Sign-up Link]

Best regards,

[Your Name]
        `
    },
    proposal: {
        subject: `How Logistics Flow Helps You Find More Work`,
        content: `
Hi [Transporter Name],

Following up on my last email, I wanted to focus on how Logistics Flow directly helps you find more work and reduce empty miles.

Our platform includes:
- **AI Freight Matcher:** Our intelligent system connects your available trucks with suitable loads, optimizing for your routes and vehicle types.
- **Subcontracting Mall:** Find and collaborate with other members who need reliable transporters for their loads.
- **A Trusted Network:** All members are part of the same ecosystem, making it easier to build relationships and secure work.

By putting your business on Logistics Flow, you become visible to a wide network of shippers and brokers actively looking for professional transport services.

Join for free and see the opportunities for yourself: [Sign-up Link]

Best regards,

[Your Name]
        `
    },
    revenue: {
        subject: `Save Money, Access Capital`,
        content: `
Hi [Transporter Name],

Beyond finding work, Logistics Flow is designed to improve your bottom line.

Here's how:
- **Save on Costs:** Through our Supplier Mall, you gain access to group-negotiated discounts on parts, tires, and services. Our community's collective buying power means lower costs for you.
- **Access to Capital:** Your activity on the platform—completing loads, paying suppliers—builds a credible operational history. This data-driven profile makes you a much more attractive candidate for our network of funders who understand the transport industry.

We help you keep more money in your pocket and provide the keys to unlock the capital you need to grow your fleet.

Get started for free today: [Sign-up Link]

Best regards,

[Your Name]
        `
    },
    explanation: {
        subject: `Your Digital Branch for the Modern Transport Economy`,
        content: `
Hi [Transporter Name],

In today's world, a digital presence is essential. A free Logistics Flow account is more than just a listing—it's your digital branch.

This includes:
- **Your Company Profile:** A central place to manage your business information.
- **Your Fleet Showcase:** List your trucks and trailers to show your capabilities.
- **Your Transaction History:** Every action builds your reputation within the ecosystem.

This digital footprint becomes your most powerful asset when applying for finance or bidding on new contracts. It's proof of your professionalism and reliability.

Take the first step and build your free digital branch today: [Sign-up Link]

Best regards,

[Your Name]
        `
    },
    howTo: {
        subject: `Getting Started with Logistics Flow is Easy`,
        content: `
Hi [Transporter Name],

Ready to join? Getting started takes less than 5 minutes.

1.  **Click this link:** [Sign-up Link]
2.  **Fill out your details:** Create your free account.
3.  **Explore your dashboard:** Once you're in, you can start building your company profile, explore the malls, and see how the platform works.

There's no cost and no obligation. It's the first step towards operating more efficiently and connecting with more opportunities.

If you have any questions, just reply to this email.

Best regards,

[Your Name]
        `
    }
});

const tabs = [
    { value: "intro", label: "1. Intro" },
    { value: "proposal", label: "2. Find Work" },
    { value: "revenue", label: "3. Save Money" },
    { value: "explanation", label: "4. Digital Branch" },
    { value: "howTo", label: "5. How To" },
];


export default function TransporterEmailSequence() {
    const searchParams = useSearchParams();
    const transporterType = searchParams.get('type') || 'General';
    const templates = getTemplates(transporterType);

    return (
        <div className="space-y-8">
            <CardHeader className="px-0">
                <div className="flex items-center gap-4">
                    <Mail className="h-8 w-8 text-primary"/>
                    <div>
                        <CardTitle>Transporter Engagement Sequence: {transporterType}</CardTitle>
                        <CardDescription>
                            Use these templates to engage with potential members. Replace [Sign-up Link] with a generic or tracked link.
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
