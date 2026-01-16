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
        subject: "Investment Opportunity: Tech Platform for the SA Transport Sector",
        content: `
Dear [Investor Name],

My name is [Your Name], founder of TransConnect. With 25 years of experience in transport finance, we are launching a tech platform to solve the core challenges of fragmentation and funding access in South Africa's logistics sector.

We've built an ecosystem that integrates finance, a supplier marketplace, and powerful data tools to increase efficiency and profitability for transporters.

I would appreciate the opportunity to briefly share our vision and the significant market opportunity we are addressing. Would you be available for a 15-minute call next week?

Best regards,

[Your Name]
        `
    },
    problemSolution: {
        subject: "Re: TransConnect - Solving the R1 Trillion Transport Sector's Pain Points",
        content: `
Dear [Investor Name],

Following up on my previous email, I wanted to highlight the specific problem we solve. The transport industry is fragmented, leading to major inefficiencies:

- **Funding Access:** Traditional banks don't understand the unique cash flow needs, rejecting viable businesses.
- **Operational Costs:** Individual operators lack the collective buying power to get discounts on parts, tires, and services.
- **Wasted Capacity:** Empty trucks on return journeys ("deadhead miles") severely impact profitability.

TransConnect solves this with an integrated ecosystem:
- **Finance Mall:** Connects pre-vetted borrowers with a network of niche lenders, banks, and grant providers.
- **Supplier Mall:** Aggregates demand to negotiate bulk discounts, passing savings to members.
- **Tech Division:** Our AI Freight Matcher fills empty trucks, turning a cost into a revenue opportunity.

We're not just another app; we're building the digital backbone for a massive, underserved industry. I would be happy to provide a more detailed walkthrough.

Best regards,

[Your Name]
        `
    },
    traction: {
        subject: "Re: TransConnect - Our Go-To-Market Strategy & Traction",
        content: `
Dear [Investor Name],

A key question for any platform is user acquisition. We have secured a powerful, low-cost path to our first 1,000 members through strategic partnerships.

Our pending agreements give us direct access to:
- **SA Auction Online:** A database of 40,000 transport companies.
- **SATL:** A national network of freight forwarders and their relationships with shippers.
- **Ludic Financial Services:** A captive audience of insured transporters needing our services.
- **CTS Trailers:** A channel to reach new asset buyers at the point of sale.

These partnerships provide a clear, defensible go-to-market strategy that bypasses expensive traditional marketing and validates the industry's need for our solution.

This isn't just an idea; it's a validated business plan with a clear path to scale.

Best regards,

[Your Name]
        `
    },
    ask: {
        subject: "Re: TransConnect - The Investment Opportunity",
        content: `
Dear [Investor Name],

To capitalize on the momentum from our strategic partnerships, we are seeking R500,000 in seed funding.

This investment will be used to:
1.  **Scale Operations:** Onboard our founding ISA (Independent Sales Agent) partners to accelerate user acquisition.
2.  **Go Live:** Finalize platform deployment and infrastructure for our launch.
3.  **Enhance Technology:** Continue development of our AI and data-driven tools.

Our model projects a positive net position within the first year, driven by recurring membership fees and transaction-based commissions. This is an opportunity to get in on the ground floor of a platform set to become essential infrastructure for the South African transport sector.

I have attached our detailed pitch deck and would be eager to discuss our financial model with you.

Best regards,

[Your Name]
        `
    },
    followUp: {
        subject: "Following Up on TransConnect",
        content: `
Dear [Investor Name],

I hope you're having a productive week.

I wanted to briefly follow up on my previous emails regarding the investment opportunity with TransConnect. We are making significant progress with our go-to-market partners and are on track to fundamentally improve how the transport industry operates.

If you have 15 minutes next week, I would be grateful for the chance to answer any questions you might have.

Best regards,

[Your Name]
        `
    }
};

const tabs = [
    { value: "intro", label: "1. Intro" },
    { value: "problemSolution", label: "2. Problem" },
    { value: "traction", label: "3. Traction" },
    { value: "ask", label: "4. The Ask" },
    { value: "followUp", label: "5. Follow-Up" },
];


export default function InvestorEmailSequence() {
    return (
        <div className="space-y-8">
            <CardHeader className="px-0">
                <div className="flex items-center gap-4">
                    <Mail className="h-8 w-8 text-primary"/>
                    <div>
                        <CardTitle>Investor Outreach Email Sequence</CardTitle>
                        <CardDescription>
                            Use these templates to introduce, propose, and explain the TransConnect investment opportunity.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <Tabs defaultValue="intro" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                   {tabs.map(tab => (
                       <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                   ))}
                </TabsList>
                <TabsContent value="intro">
                    <EmailTemplate subject={templates.intro.subject} content={templates.intro.content} />
                </TabsContent>
                <TabsContent value="problemSolution">
                     <EmailTemplate subject={templates.problemSolution.subject} content={templates.problemSolution.content} />
                </TabsContent>
                <TabsContent value="traction">
                     <EmailTemplate subject={templates.traction.subject} content={templates.traction.content} />
                </TabsContent>
                <TabsContent value="ask">
                     <EmailTemplate subject={templates.ask.subject} content={templates.ask.content} />
                </TabsContent>
                 <TabsContent value="followUp">
                     <EmailTemplate subject={templates.followUp.subject} content={templates.followUp.content} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
