
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCopy, Mail, ShieldCheck } from 'lucide-react';
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
    consent: {
        subject: `[ACTION REQUIRED] - Confirming Your Logistics Flow Network Participation`,
        content: `
Hi [Name],

I'm reaching out from Logistics Flow. We're currently expanding our network of transport professionals in the ${transporterType} sector, and we'd love to have you involved.

Before we can send you specific opportunities, group discount offers, or load matching data, we need to ensure we are fully compliant with your privacy preferences.

Please take 30 seconds to review our terms and provide your formal marketing consent here:
[Opt-in Link]

Why opt-in?
- Gain access to community-negotiated parts and tire discounts.
- Receive matching freight load alerts via our AI engine.
- Build a digital profile to unlock easier asset financing.

We respect your privacy and will never spam you. You can manage your preferences at any time.

Best regards,

The Logistics Flow Team
        `
    },
    intro: {
        subject: `A New Way to Reduce Costs for Your ${transporterType} Business`,
        content: `
Hi [Name],

I'm reaching out from Logistics Flow with a simple proposition to help reduce your daily operating costs by leveraging the power of our community network.

To do this effectively, we need your help. By contributing data about your fleet, suppliers, and common routes, you directly empower us to negotiate significant group discounts on your behalf.

Here’s how you stay in control:
1.  **Your Secure Portal:** All information you share is housed securely in your private member portal.
2.  **Targeted Engagement:** Your data is used for one purpose only: to initiate engagement with your suppliers to show demand and negotiate deals.
3.  **Transparency:** Monitor the engagement process and see value being created in real-time.

Take control and join for free: [Sign-up Link]

Best regards,

[Your Name]
        `
    },
    proposal: {
        subject: `How Logistics Flow Helps You Find More Work`,
        content: `
Hi [Name],

Following up on my last email, I wanted to focus on how Logistics Flow directly helps you find more work and reduce empty miles.

Our platform includes:
- **AI Freight Matcher:** Our intelligent system connects your available trucks with suitable loads.
- **Subcontracting Mall:** Find and collaborate with other members who need reliable transporters.
- **A Trusted Network:** All members are part of the same ecosystem, making it easier to build relationships.

Join for free and see the opportunities: [Sign-up Link]

Best regards,

[Your Name]
        `
    },
    revenue: {
        subject: `Save Money, Access Capital`,
        content: `
Hi [Name],

Beyond finding work, Logistics Flow is designed to improve your bottom line.

Here's how:
- **Save on Costs:** Access group-negotiated discounts on parts, tires, and services.
- **Access to Capital:** Your platform activity builds a credible operational history, making you a more attractive candidate for our network of funders.

Get started for free today: [Sign-up Link]

Best regards,

[Your Name]
        `
    },
    howTo: {
        subject: `Getting Started with Logistics Flow is Easy`,
        content: `
Hi [Name],

Ready to join? Getting started takes less than 5 minutes.

1.  **Click this link:** [Sign-up Link]
2.  **Fill out your details:** Create your free account.
3.  **Explore your dashboard:** Once you're in, start building your company profile and explore the malls.

If you have any questions, just reply to this email.

Best regards,

[Your Name]
        `
    }
});

const tabs = [
    { value: "consent", label: "0. CONSENT (POPI)", icon: ShieldCheck },
    { value: "intro", label: "1. Intro" },
    { value: "proposal", label: "2. Find Work" },
    { value: "revenue", label: "3. Save Money" },
    { value: "howTo", label: "4. How To" },
];


export default function TransporterEmails() {
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
                            Use the Consent template for your first outreach to satisfy POPI requirements.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <Tabs defaultValue="consent" className="w-full">
                <TabsList className="h-auto flex-wrap justify-start">
                   {tabs.map(tab => (
                       <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                           {tab.icon && <tab.icon className="h-3.5 w-3.5" />}
                           {tab.label}
                       </TabsTrigger>
                   ))}
                </TabsList>
                <TabsContent value="consent">
                    <EmailTemplate subject={templates.consent.subject} content={templates.consent.content} />
                </TabsContent>
                <TabsContent value="intro">
                    <EmailTemplate subject={templates.intro.subject} content={templates.intro.content} />
                </TabsContent>
                <TabsContent value="proposal">
                     <EmailTemplate subject={templates.proposal.subject} content={templates.proposal.content} />
                </TabsContent>
                 <TabsContent value="revenue">
                    <EmailTemplate subject={templates.revenue.subject} content={templates.revenue.content} />
                </TabsContent>
                 <TabsContent value="howTo">
                    <EmailTemplate subject={templates.howTo.subject} content={templates.howTo.content} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
