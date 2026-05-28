
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCopy, Mail, UserCheck, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase';

const EmailTemplate = ({ subject, content, partner, referralLink }: { subject: string, content: string, partner: any, referralLink: string }) => {
    const personalizedContent = React.useMemo(() => {
        let text = content;
        const name = partner?.firstName || '[Name]';
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
                <CardFooter className="px-0 pt-4 border-t mt-4 text-xs text-muted-foreground italic text-center">
                    Secure your standing in our communication pipeline by establishing the handshake.
                </CardFooter>
            )}
        </Card>
    );
};

const getTemplates = (transporterType: string) => ({
    handshake: {
        subject: "The Digital Handshake: [Your Company] Transporter Access",
        content: `
Hi [Name],

Inefficiency is a silent tax on your transport business. Logistics Flow is a unified digital ecosystem designed to break the constraints of high operating costs and empty miles. We connect you with a network of vetted suppliers and matching freight opportunities, using collective power to boost your bottom line.

Before we can send you matching freight loads or group discount offers, we require a "Digital Handshake" to establish a compliant, secure connection and ensure we are POPI-compliant.

Please take 30 seconds to establish the connection here:
[Opt-in Link]

By accepting this handshake, you unlock:
- Access to community-negotiated parts and tire discounts.
- AI-matched freight load alerts to reduce empty miles.
- A secure place in our priority communication pipeline.

Best regards,

The Logistics Flow Team
        `
    },
    intro: {
        subject: `Reduce Daily Operating Costs for [Your Company]`,
        content: `
Hi [Name],

I'm reaching out from Logistics Flow with a simple proposition to help reduce your daily operating costs by leveraging the power of our community network.

Take control and join for free: [Sign-up Link]

Best regards,

[Your Name]
        `
    },
    loads: {
        subject: `Find More Work and Reduce Empty Miles`,
        content: `
Hi [Name],

Following up on my last email, I wanted to focus on how Logistics Flow directly helps [Your Company] find more work and reduce empty miles.

Our platform includes:
- **AI Freight Matcher:** Our intelligent system connects your available trucks with suitable loads.
- **Subcontracting Mall:** Find and collaborate with other members who need reliable transporters.

Join for free and see the opportunities: [Sign-up Link]

Best regards,

[Your Name]
        `
    }
});

const tabs = [
    { value: "handshake", label: "0. Digital Handshake", icon: ShieldCheck },
    { value: "intro", label: "1. Cost Savings" },
    { value: "loads", label: "2. Load Matching" },
];


export default function TransporterEmails({ partner }: { partner?: any }) {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const transporterType = searchParams.get('type') || 'Logistics';
    const templates = getTemplates(transporterType);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studio--ecosystem-hub.us-central1.hosted.app';

    const referralLink = React.useMemo(() => {
        if (!partner) return `${baseUrl}/join`;
        return `${baseUrl}/join?ref=${partner.id}&role=transporter`;
    }, [partner, baseUrl]);

    return (
        <div className="space-y-8">
            <Tabs defaultValue="handshake" className="w-full">
                <TabsList className="h-auto flex-wrap justify-start bg-muted/30">
                   {tabs.map(tab => (
                       <TabsTrigger key={tab.value} value={tab.value} className="gap-2 text-xs">
                           {tab.icon && <tab.icon className="h-3 w-3" />}
                           {tab.label}
                       </TabsTrigger>
                   ))}
                </TabsList>
                {Object.entries(templates).map(([key, t]) => (
                    <TabsContent key={key} value={key} className="mt-6">
                        <EmailTemplate 
                            subject={t.subject.replace(/\[Your Company\]/g, partner?.companyName || 'your business')} 
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
