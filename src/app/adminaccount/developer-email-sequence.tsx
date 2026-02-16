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
        subject: "Invitation to Build on the Future of Logistics Tech",
        content: `
Dear [Developer Name],

I hope this email finds you well.

My name is [Your Name], and I'm reaching out from Logistics Flow. We've developed a comprehensive digital ecosystem for the transport industry, and we're now opening our platform to third-party developers.

We believe your skills could bring incredible value to our growing network of transport companies. We are building a powerful set of APIs to enable integrations and new app development.

Would you be open to a brief chat next week to explore this opportunity?

Best regards,

[Your Name]
        `
    },
    proposal: {
        subject: "The Logistics Flow Developer Platform",
        content: `
Dear [Developer Name],

Following up on our brief chat, here is more detail on the developer opportunity with Logistics Flow.

What We Offer:
- A rich dataset from a captive audience of transport operators.
- A suite of APIs for accessing logistics data, user profiles, and platform services.
- A marketplace to sell your apps and integrations directly to our user base.
- A revenue-sharing model on all paid applications.

What We're Looking For:
- Integrations with accounting software (e.g., Sage, Xero).
- Custom dashboard widgets and analytics tools.
- Innovative mobile apps for drivers and fleet managers.

This is a ground-floor opportunity to build on a platform set to modernize a critical industry.

Best regards,

[Your Name]
        `
    },
};

const emailTabs = [
    { value: "intro", label: "1. Initial Outreach" },
    { value: "proposal", label: "2. The Proposal" },
];


export default function DeveloperEmailSequence() {
    return (
        <div className="space-y-8">
            <CardHeader className="px-0">
                <div className="flex items-center gap-4"><Mail className="h-8 w-8 text-primary"/><div><CardTitle>Developer Outreach Email Sequence</CardTitle><CardDescription>Use these templates to engage with potential developer partners.</CardDescription></div></div>
            </CardHeader>
            <Tabs defaultValue="intro" className="w-full">
                <TabsList className="grid w-full grid-cols-2">{emailTabs.map(tab => (<TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>))}</TabsList>
                <TabsContent value="intro"><EmailTemplate subject={templates.intro.subject} content={templates.intro.content} /></TabsContent>
                <TabsContent value="proposal"><EmailTemplate subject={templates.proposal.subject} content={templates.proposal.content} /></TabsContent>
            </Tabs>
        </div>
    );
}
