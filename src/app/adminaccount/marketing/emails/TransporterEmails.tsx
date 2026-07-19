'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCopy, Mail, UserCheck, ShieldCheck, Zap, Truck, Landmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase';

const EmailTemplate = ({ subject, content, partner, referralLink }: { subject: string, content: string, partner: any, referralLink: string }) => {
    const personalizedContent = React.useMemo(() => {
        let text = content;
        const name = partner?.firstName || (partner?.contactPerson ? partner.contactPerson.split(' ')[0] : 'Partner');
        const company = partner?.companyName || '[Your Company]';
        
        text = text.replace(/\[Partner Name\]/g, name);
        text = text.replace(/\[Name\]/g, name);
        text = text.replace(/\[Lead Name\]/g, name);
        text = text.replace(/\[Your Company\]/g, company);
        text = text.replace(/\[Referral Link\]/g, referralLink);
        text = text.replace(/\[Sign-up Link\]/g, referralLink);
        text = text.replace(/\[Opt-in Link\]/g, `https://studio--ecosystem-hub.us-central1.hosted.app/opt-in/${partner?.id || 'TEST'}`);

        return text;
    }, [content, partner, referralLink]);

    return (
        <Card className="border-none shadow-none bg-transparent text-left text-foreground">
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
                <div className="p-6 bg-white border rounded-md whitespace-pre-wrap font-sans text-sm shadow-inner min-h-[300px] text-left text-foreground leading-relaxed">
                    {personalizedContent.trim()}
                </div>
            </CardContent>
             {partner && (
                <CardFooter className="px-0 pt-4 border-t mt-4 text-xs text-muted-foreground italic text-center">
                    Buy better and get funded. Registration is free.
                </CardFooter>
            )}
        </Card>
    );
};

const getTemplates = (transporterType: string) => ({
    handshake: {
        subject: "Sourcing & Savings: Claim Your Free Transporter Node",
        content: `
Hi [Name],

Inefficiency is a silent tax on your transport business. Logistics Flow is a unified digital ecosystem designed to break the constraints of high operating costs for fleets like [Your Company].

Registration is 100% free. We give you the map to the industry:
1. **Find Better Suppliers:** Connect with thousands of verified parts and service providers instantly.
2. **Buy at Discounts:** Tap into community-negotiated "syndicate" pricing for tires and spares.
3. **Get Funded to Scale:** Access our direct finance path for asset acquisition and working capital.

Please take 30 seconds to establish your free standing here:
[Opt-in Link]

Best regards,

The Logistics Flow Team
        `
    },
    efficiency: {
        subject: `Slash [Your Company] Costs: Free Registry & Growth Capital`,
        content: `
Hi [Name],

How much do empty miles and high spares costs impact [Your Company] each month?

Registration for Logistics Flow is free. Our platform provides you with the forensic haulier registry to identify freight providers, find specialized discounted suppliers, and connect directly with funders who actually understand the trucking sector.

Join for free and start saving: [Sign-up Link]

Best regards,

[Your Name]
        `
    }
});

const tabs = [
    { value: "handshake", label: "0. Growth & Savings Pitch", icon: Truck },
    { value: "efficiency", label: "1. Capital Access", icon: Landmark },
];

export default function TransporterEmails({ partner }: { partner?: any }) {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const transporterType = searchParams.get('type') || 'Logistics';
    const templates = getTemplates(transporterType);
    const baseUrl = 'https://studio--ecosystem-hub.us-central1.hosted.app';

    const referralLink = React.useMemo(() => {
        if (!partner) return `${baseUrl}/join`;
        return `${baseUrl}/join?ref=${partner.id}&role=transporter`;
    }, [partner, baseUrl]);

    return (
        <div className="space-y-8 text-left text-foreground">
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
