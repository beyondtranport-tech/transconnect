'use client';

import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { UserCheck, ShieldCheck, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase';

const EmailTemplate = ({ subject, content, partner, referralLink }: { subject: string, content: string, partner: any, referralLink: string }) => {
    const personalizedContent = React.useMemo(() => {
        let text = content;
        // Smart First Name extraction
        const name = partner?.firstName || (partner?.contactPerson ? partner.contactPerson.split(' ')[0] : 'Supplier');
        const company = partner?.companyName || '[Your Company]';
        
        text = text.replace(/\[Supplier Name\]/g, name);
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
                <div className="flex items-center justify-between text-left">
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
                    Establish the handshake to secure your direct line to 5,400+ transport decision makers.
                </CardFooter>
            )}
        </Card>
    );
};

const getTemplates = (supplierType: string) => ({
    handshake: {
        subject: `The Digital Handshake: Direct Sales Channel for ${supplierType}`,
        content: `
Hi [Supplier Name],

Fragmented industrial maps lead to inefficient sales cycles. Logistics Flow exists to break this constraint. We have cataloged the national transport grid and currently host over 5,400+ verified transport companies in our community.

We want to open this base directly to [Your Company] as a preferred supply partner. 

Crucially, we have solved the payment bottleneck: we provide direct funding to these transporters specifically to increase their capacity to purchase from our vetted suppliers. You get paid in full, upfront, while they get the equipment they need to scale.

Before we can deliver high-intent RFQs to your dashboard or invite you to publish your digital branch, we require a formal "Digital Handshake."

Establish your standing here:
[Opt-in Link]

Why establish the connection?
- Direct Market Access: Sell to 5,400+ fleet owners actively searching for ${supplierType}.
- Embedded Finance: We fund the buyers so they can spend more with you.
- Forensic Targeting: We match your specialized inventory with the exact equipment declared by our members.

Best regards,

The Logistics Flow Team
        `
    },
    velocity: {
        subject: `Sales Velocity: Unlock the Forensic Haulier Registry`,
        content: `
Hi [Supplier Name],

Stop cold-calling switchboards. Logistics Flow gives you a direct line to the people who sign the checks in the transport sector.

Our "Intelligence Access" tier provides verified mobile numbers and professional e-mails for thousands of haulier decision-makers. Filter by region, vehicle type, and fleet capacity to find your next major account instantly.

Launch your sales velocity engine here for R100/mo: [Sign-up Link]

Best regards,

[Your Name]
        `
    }
});

const tabs = [
    { value: "handshake", label: "0. Digital Handshake", icon: ShieldCheck },
    { value: "velocity", label: "1. Sales Velocity Pitch", icon: Zap },
];


export default function SupplierEmails({ partner }: { partner?: any }) {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const supplierType = searchParams.get('type') || 'Industrial';
    const templates = getTemplates(supplierType);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studio--ecosystem-hub.us-central1.hosted.app';

    const referralLink = React.useMemo(() => {
        if (!partner) return `${baseUrl}/join`;
        return `${baseUrl}/join?ref=${partner.id}&role=vendor&type=${encodeURIComponent(supplierType)}`;
    }, [partner, baseUrl, supplierType]);

    return (
        <div className="space-y-6 text-left">
            <Tabs defaultValue="handshake" className="w-full text-left">
                <TabsList className="h-auto flex-wrap justify-start bg-muted/30 text-left">
                   {tabs.map(tab => {
                       const Icon = tab.icon;
                       return (
                           <TabsTrigger key={tab.value} value={tab.value} className="text-xs gap-2">
                               {Icon && <Icon className="h-3 w-3" />}
                               {tab.label}
                           </TabsTrigger>
                       );
                   })}
                </TabsList>
                {Object.entries(templates).map(([key, t]) => (
                    <TabsContent key={key} value={key} className="mt-6 text-left">
                        <EmailTemplate 
                            subject={t.subject} 
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
