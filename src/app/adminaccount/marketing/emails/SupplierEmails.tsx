'use client';

import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { UserCheck, ShieldCheck, Zap, ShoppingCart, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase';

const EmailTemplate = ({ subject, content, partner, referralLink }: { subject: string, content: string, partner: any, referralLink: string }) => {
    const personalizedContent = React.useMemo(() => {
        let text = content;
        const name = partner?.firstName || (partner?.contactPerson ? partner.contactPerson.split(' ')[0] : 'Supplier');
        const company = partner?.companyName || '[Your Company]';
        
        const baseUrl = 'https://studio--ecosystem-hub.us-central1.hosted.app';
        text = text.replace(/\[Supplier Name\]/g, name);
        text = text.replace(/\[Name\]/g, name);
        text = text.replace(/\[Lead Name\]/g, name);
        text = text.replace(/\[Your Company\]/g, company);
        text = text.replace(/\[Referral Link\]/g, referralLink);
        text = text.replace(/\[Sign-up Link\]/g, referralLink);
        text = text.replace(/\[Opt-in Link\]/g, `${baseUrl}/opt-in/${partner?.id || 'TEST'}`);

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
                <div className="p-6 bg-white border rounded-md whitespace-pre-wrap font-sans text-sm shadow-inner min-h-[300px] text-left text-foreground leading-relaxed">
                    {personalizedContent.trim()}
                </div>
            </CardContent>
            {partner && (
                <CardFooter className="px-0 pt-4 border-t mt-4 text-xs text-muted-foreground italic text-center">
                    Sell more, faster. Registration is free.
                </CardFooter>
            )}
        </Card>
    );
};

const getTemplates = (supplierType: string) => ({
    handshake: {
        subject: `Sell More ${supplierType}: Claim Your Free Digital Branch`,
        content: `
Hi [Supplier Name],

The South African transport sector is ready for your products, but manual sales cycles are slow. Logistics Flow is writing to simplify your sales process and find you more customers.

Registration is 100% free. We have mapped the national grid and currently host over 5,400+ verified transport companies in our community—all looking for reliable suppliers like [Your Company].

How we increase your sales volume:
1. **Free Digital Branch:** Publish your product catalogue directly to the haulier registry.
2. **Simplified RFQs:** Receive high-intent enquiries from owners who match your specialization.
3. **Embedded Finance:** We provide direct funding to transporters so they can buy from you. You get paid in full, upfront.

Establish your free standing and start selling more today:
[Opt-in Link]

Best regards,

The Logistics Flow Team
        `
    },
    velocity: {
        subject: `Sales Velocity: Unlock 5,400+ Vetted Haulier Leads for Free`,
        content: `
Hi [Supplier Name],

Stop cold-calling switchboards and find your next major account for free.

Registration for Logistics Flow is free. Our registry gives [Your Company] a direct line to the people who sign the checks in the transport sector. Filter our 5,400+ verified hauliers by region and fleet capacity to find exactly who needs your ${supplierType}.

Launch your sales velocity engine here for free: [Sign-up Link]

Best regards,

[Your Name]
        `
    }
});

const tabs = [
    { value: "handshake", label: "0. Sales Growth Pitch", icon: TrendingUp },
    { value: "velocity", label: "1. Customer Discovery", icon: ShoppingCart },
];

export default function SupplierEmails({ partner }: { partner?: any }) {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const supplierType = searchParams.get('type') || 'Industrial';
    const templates = getTemplates(supplierType);
    const baseUrl = 'https://studio--ecosystem-hub.us-central1.hosted.app';

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
