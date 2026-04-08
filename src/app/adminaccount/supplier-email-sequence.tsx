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

const getTemplates = (supplierType: string) => ({
    intro: {
        subject: `Partnership Opportunity: Reaching the Transport Sector`,
        content: `
Dear [Supplier Name],

I hope this email finds you well.

My name is [Your Name], and I'm reaching out from Logistics Flow. We've developed a digital ecosystem for the transport industry, and we're actively looking for high-quality ${supplierType} suppliers to partner with.

Our platform connects suppliers like you directly to a captive audience of transport operators who are actively looking for your products.

Would you be open to a brief chat next week to explore how we can drive new business your way?

Best regards,

[Your Name]
        `
    },
    proposal: {
        subject: `Proposal: Become a Valued Supplier on Logistics Flow`,
        content: `
Dear [Supplier Name],

Following up on our conversation, here’s how Logistics Flow can become a powerful new sales channel for your ${supplierType} business.

What We Offer:
- A Digital Storefront: A professional, easy-to-manage online shop within our Supplier Mall.
- Targeted Customer Base: Direct access to hundreds of transporters and fleet owners who need your products.
- Increased Visibility: Feature your brand and products prominently within our ecosystem.
- Data Insights: Understand purchasing trends within the transport sector.

Becoming a supplier is simple. You'll gain a direct line to your target market, reduce customer acquisition costs, and grow your sales.

I would be happy to schedule a demo to walk you through the platform.

Best regards,

[Your Name]
        `
    },
});

const tabs = [
    { value: "intro", label: "1. Intro" },
    { value: "proposal", label: "2. Proposal" },
];

export default function SupplierEmailSequence() {
    const searchParams = useSearchParams();
    const supplierType = searchParams.get('type') || 'General';
    const templates = getTemplates(supplierType);

    return (
        <div className="space-y-8">
            <CardHeader className="px-0">
                <div className="flex items-center gap-4">
                    <Mail className="h-8 w-8 text-primary"/>
                    <div>
                        <CardTitle>Supplier Engagement Sequence: {supplierType}</CardTitle>
                        <CardDescription>
                            Use these templates to engage with potential {supplierType} suppliers.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <Tabs defaultValue="intro" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
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
            </Tabs>
        </div>
    );
}
