'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCopy, Mail, UserCheck, ShieldCheck, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase';

const EmailTemplate = ({ subject, content, partner, referralLink }: { subject: string, content: string, partner: any, referralLink: string }) => {
    const personalizedContent = React.useMemo(() => {
        let text = content;
        // Smart First Name extraction
        const name = partner?.firstName || (partner?.contactPerson ? partner.contactPerson.split(' ')[0] : 'Partner');
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
        <Card className="border-none shadow-none bg-transparent text-left">
            <CardHeader className="px-0 text-left">
                <div className="flex items-center justify-between text-left text-foreground">
                    <div className="text-left">
                        <CardTitle className="text-lg text-left text-foreground">Email Subject</CardTitle>
                        <CardDescription className="font-medium text-foreground select-all text-left">{subject}</CardDescription>
                    </div>
                    {partner && (
                         <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-green-200">
                            <UserCheck className="h-3.5 w-3.5" /> Personalized for {partner.firstName || partner.contactPerson?.split(' ')[0]}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="px-0 text-left text-foreground">
                <div className="p-6 bg-white border rounded-md whitespace-pre-wrap font-sans text-sm shadow-inner min-h-[300px] text-left text-foreground">
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
        subject: "The Digital Handshake: Optimized Transport Capacity",
        content: `
Hi [Name],

Inefficiency is a silent tax on your transport business. Logistics Flow is a unified digital ecosystem designed to break the constraints of high operating costs and empty miles.

[SEE THE PLATFORM IN MOTION - 60S BRIEFING]
https://www.youtube.com/watch?v=dQw4w9WgXcQ

Before we can send you matching freight loads or group discount offers for your [Your Company] fleet, we require a formal "Digital Handshake."

Please take 30 seconds to establish the connection here:
[Opt-in Link]

By establishing this handshake, you unlock:
- Capacity Intelligence: Proactive AI alerts for loads that match your empty leg routes.
- Funder Visibility: Start building a digital track record for asset finance.
- Forensic Savings: Access community-negotiated parts and tire discounts.

Best regards,

The Logistics Flow Team
        `
    },
    efficiency: {
        subject: `Operating Efficiency: The Intelligence Tier for [Your Company]`,
        content: `
Hi [Name],

How much do empty miles cost [Your Company] each month?

For just R100/mo, our Intelligence Membership provides you with the tools to map the entire industrial landscape. Identify freight providers, find specialized suppliers, and connect directly with funders who understood the trucking sector.

Join the intelligence flow: [Sign-up Link]

Best regards,

[Your Name]
        `
    }
});

const tabs = [
    { value: "handshake", label: "0. Digital Handshake", icon: ShieldCheck },
    { value: "efficiency", label: "1. Efficiency Pitch", icon: Zap },
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
        <div className="space-y-8 text-left">
            <Tabs defaultValue="handshake" className="w-full text-left">
                <TabsList className="h-auto flex-wrap justify-start bg-muted/30 text-left text-foreground">
                   {tabs.map(tab => (
                       <TabsTrigger key={tab.value} value={tab.value} className="gap-2 text-xs">
                           {tab.icon && <tab.icon className="h-3 w-3" />}
                           {tab.label}
                       </TabsTrigger>
                   ))}
                </TabsList>
                {Object.entries(templates).map(([key, t]) => (
                    <TabsContent key={key} value={key} className="mt-6 text-left text-foreground">
                        <EmailTemplate 
                            subject={t.subject.replace(/\[Your Company\]/g, partner?.companyName || 'your business')} 
                            content={t.content.replace(/\[Your Name\]/g, user?.displayName || 'Logistics Flow Team')} 
                            partner={partner} 
                            referralLink={referralLink}
                        />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
