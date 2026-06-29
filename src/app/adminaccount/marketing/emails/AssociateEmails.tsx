'use client';

import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { UserCheck, ShieldCheck, Zap, Share2, Video } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from 'react';
import { useUser } from '@/firebase';

const EmailTemplate = ({ subject, content, partner, referralLink }: { subject: string, content: string, partner: any, referralLink: string }) => {
    const personalizedContent = React.useMemo(() => {
        let text = content;
        const name = partner?.firstName || (partner?.contactPerson ? partner.contactPerson.split(' ')[0] : 'Creator');
        
        text = text.replace(/\[Associate Name\]/g, name);
        text = text.replace(/\[Referral Link\]/g, referralLink);
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
                    Empower your creative audience with 4K AI industrial tools.
                </CardFooter>
            )}
        </Card>
    );
};

const templates = {
    intro: {
        subject: "Partnership Opportunity: Monetize Your Logistics Audience",
        content: `
Hi [Associate Name],

The South African transport industry is undergoing a digital shift, and we want to equip your audience with the tools to lead it.

Logistics Flow is a Data-as-a-Service ecosystem built to optimize industrial capacity. We are launching an exclusive **Digital Associate** program for high-impact creators and marketers.

Why partner with us?
1. **Free AI Content Studio:** Get unlimited access to our 4K video and image generators to produce professional industrial content for your channels.
2. **Recurring Revenue:** Earn a lifetime annuity from every member you refer. We pay recurring commissions on memberships and transactional splits on Mall activity.
3. **Ecosystem Influence:** Position yourself at the center of the industrial digitalization trend.

We provide the tech and the tracking; you own the relationship.

Establish your creative standing here:
[Opt-in Link]

Best regards,

The Logistics Flow Team
        `
    },
    tools: {
        subject: "Unlock Your AI Creative Studio: 4K Industrial Assets",
        content: `
Hi [Associate Name],

Content is the new currency in logistics. 

As a Logistics Flow Associate, you bypass the cost of high-end production. Our dashboard features a dedicated **AI Marketing Studio** that allows you to generate cinematic truck sequences and professional brand design from simple text prompts.

Every asset you generate is ready for broadcast and includes your unique tracking node automatically. 

Start building your recurring revenue stream today: [Opt-in Link]

Best regards,

[Your Name]
        `
    }
};

const tabs = [
    { value: "intro", label: "0. Recruitment Pitch", icon: Share2 },
    { value: "tools", label: "1. Creative Tech Pitch", icon: Video },
];


export default function AssociateEmails({ partner }: { partner?: any }) {
    const { user } = useUser();
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studio--ecosystem-hub.us-central1.hosted.app';

    const referralLink = React.useMemo(() => {
        if (!partner) return `${baseUrl}/join`;
        return `${baseUrl}/join?ref=${partner.id}&role=associate`;
    }, [partner, baseUrl]);

    return (
        <div className="space-y-6 text-left">
            <Tabs defaultValue="intro" className="w-full text-left">
                <TabsList className="h-auto flex-wrap justify-start bg-muted/30 text-left">
                   {tabs.map(tab => (
                       <TabsTrigger key={tab.value} value={tab.value} className="text-xs gap-2">
                           <tab.icon className="h-3 w-3" />
                           {tab.label}
                       </TabsTrigger>
                   ))}
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
