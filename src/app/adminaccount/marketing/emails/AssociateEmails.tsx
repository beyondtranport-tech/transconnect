
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { UserCheck, ShieldCheck, Zap, Share2, Video, MousePointer2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from 'react';
import { useUser } from '@/firebase';

const EmailTemplate = ({ subject, content, partner, referralLink }: { subject: string, content: string, partner: any, referralLink: string }) => {
    const personalizedContent = React.useMemo(() => {
        let text = content;
        
        // RESILIENT NAME EXTRACTION
        const name = partner?.firstName || 
                     partner?.contactPerson?.split(' ')[0] || 
                     partner?.contact_person?.split(' ')[0] || 
                     'Creator';
        
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
                            <UserCheck className="h-3.5 w-3.5" /> Personalized for {partner.firstName || partner.contactPerson?.split(' ')[0] || partner.contact_person?.split(' ')[0]}
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
                <CardFooter className="px-0 pt-4 border-t mt-4 text-xs text-muted-foreground italic text-left">
                    Empower your creative audience with 4K AI industrial tools.
                </CardFooter>
            )}
        </Card>
    );
};

const templates = {
    intro: {
        subject: "Monetize Your Audience: Unlock the 4K AI Logistics Studio",
        content: `
Hi [Associate Name],

The South African transport industry is shifting to the digital grid, and your audience is the most valuable asset in this transition.

We are inviting you to join Logistics Flow as an **Authorized Digital Associate**. Unlike standard memberships, your access to the platform is **100% Free**.

Why establish a handshake with us?
1. **Free AI Content Studio:** Get unrestricted access to our 4K video and image generators. Produce professional cinematic industrial content for your channels for free.
2. **Yield-Based Earnings:** We don't just pay for sales. We pay for the "Flow." Track every click you generate and earn a direct commission on every "Handshake" (registration) you facilitate.
3. **Automated Tracking:** Use our **Social Studio** to generate your own tracking links and watch your engagement yield in real-time.

We provide the technical engine; you drive the audience flow.

Establish your creative standing and unlock the Studio here:
[Opt-in Link]

Best regards,

The Logistics Flow Team
        `
    },
    yield: {
        subject: "How it Pays: Clicks, Handshakes, and Recurring Annuity",
        content: `
Hi [Associate Name],

Let's talk about the revenue model. As a Digital Associate, you are an owner of the flow.

How you earn:
- **Click Dividend:** We track every unique lead that lands on the platform via your content.
- **Handshake Bounty:** Earn R100 for every business that establishes their free digital node through your referral.
- **Recurring Annuity:** Earn a 30% share of every monthly membership fee paid by your network for the lifetime of their account.

By using our **AI Studio**, you can create high-converting visuals that drive this flow at zero production cost to you.

Establish your node and start building your annuity: [Opt-in Link]

Best regards,

[Your Name]
        `
    }
};

const tabs = [
    { value: "intro", label: "0. Creative Tech Pitch", icon: Video },
    { value: "yield", label: "1. Revenue & Yield Pitch", icon: MousePointer2 },
];


export default function AssociateEmails({ partner }: { partner?: any }) {
    const { user } = useUser();
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studio--ecosystem-hub.us-central1.hosted.app';

    const referralLink = React.useMemo(() => {
        if (!partner) return `${baseUrl}/join`;
        return `${baseUrl}/join?ref=${partner.id}&role=associate`;
    }, [partner, baseUrl]);

    return (
        <div className="space-y-6 text-left text-foreground text-foreground">
            <Tabs defaultValue="intro" className="w-full text-left">
                <TabsList className="h-auto flex-wrap justify-start bg-muted/30 text-left text-foreground">
                   {tabs.map(tab => (
                       <TabsTrigger key={tab.value} value={tab.value} className="text-xs gap-2">
                           <tab.icon className="h-3 w-3" />
                           {tab.label}
                       </TabsTrigger>
                   ))}
                </TabsList>
                {Object.entries(templates).map(([key, t]) => (
                    <TabsContent key={key} value={key} className="mt-6 text-left text-foreground">
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
