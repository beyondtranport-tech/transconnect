
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvestorManagement from "./investor-management";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import React from 'react';
import { Briefcase, Info, Presentation, Mail, Cpu, AlertCircle, Handshake, CheckCircle, DollarSign, TrendingUp, ShoppingBasket, ClipboardCopy } from 'lucide-react';


// --- ElevatorPitch Content ---
const elevatorPitchSections = [
    {
        icon: <Cpu className="h-8 w-8 text-primary" />,
        title: "What is TransConnect?",
        points: [
            "An integrated digital ecosystem designed specifically for the South African transport industry.",
            "A platform that unifies four core business pillars: Funding, a multi-faceted Mall, a value-added Marketplace, and a powerful Tech division.",
            "A reward-first, loyalty-driven community where member participation and collaboration create a high-value network."
        ]
    },
    {
        icon: <AlertCircle className="h-8 w-8 text-destructive" />,
        title: "The Problem We Solve for Transporters",
        points: [
            "Access to capital is a primary roadblock, as traditional banks often reject viable businesses.",
            "Individual operators lack the collective buying power to secure meaningful discounts on parts, tires, and services.",
            "Profitability is severely impacted by 'deadhead miles'—empty return journeys that represent wasted capacity and revenue.",
            "The industry is highly fragmented, leading to major inefficiencies for small and medium operators."
        ]
    },
    {
        icon: <Handshake className="h-8 w-8 text-primary" />,
        title: "The Investment Opportunity",
        points: [
            "Capitalize on a first-mover advantage in a massive, underserved market with a proven business model.",
            "Invest in a platform with multiple, diversified revenue streams: subscription fees, transaction commissions, and SaaS product sales.",
            "The platform is designed for exponential growth through powerful network effects; as the community grows, its value and revenue potential increase.",
            "Our technology is built to scale, ensuring low marginal costs for each new member added to the ecosystem."
        ]
    },
    {
        icon: <CheckCircle className="h-8 w-8 text-green-500" />,
        title: "Why TransConnect is the Right Investment",
        points: [
            "We have deep industry expertise and a clear understanding of the market's pain points.",
            "Our business model is not just theoretical; it's a practical solution already generating traction.",
            "We are solving fundamental problems in a critical sector of the economy, creating both financial returns and significant social impact."
        ]
    }
];

function ElevatorPitch() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Elevator Pitch: The Investment Case</h1>
                <p className="text-lg text-muted-foreground mt-2">A concise summary of the TransConnect investment opportunity.</p>
            </div>

            {elevatorPitchSections.map(section => (
                <Card key={section.title}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            {section.icon}
                            {section.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                            {section.points.map((point, index) => (
                                <li key={index}>{point}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// --- InvestorOffer Content ---
const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount);
};

function InvestorOffer() {
    const isLoading = false; // For simplicity, as this is now static content

    const exampleMembershipFee = 500;
    const projectedMembersYear1 = 1200;
    const projectedMembersYear3 = 15000;
    const connectAdoptionRate = 0.25;
    const connectAvgFee = 150;
    const mallTransactionValuePerMember = 2000;
    const mallCommissionRate = 0.025;

    const year1_membership_revenue = projectedMembersYear1 * exampleMembershipFee * 12;
    const year1_connect_revenue = projectedMembersYear1 * connectAdoptionRate * connectAvgFee * 12;
    const year1_mall_revenue = projectedMembersYear1 * mallTransactionValuePerMember * mallCommissionRate * 12;
    const year1_total_revenue = year1_membership_revenue + year1_connect_revenue + year1_mall_revenue;
    const year1_net_profit = year1_total_revenue * 0.35;

    const year3_membership_revenue = projectedMembersYear3 * exampleMembershipFee * 12;
    const year3_connect_revenue = projectedMembersYear3 * connectAdoptionRate * connectAvgFee * 12;
    const year3_mall_revenue = projectedMembersYear3 * mallTransactionValuePerMember * mallCommissionRate * 12;
    const year3_total_revenue = year3_membership_revenue + year3_connect_revenue + year3_mall_revenue;
    const year3_net_profit = year3_total_revenue * 0.45;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">The Investment Offer</h1>
                <p className="text-lg text-muted-foreground mt-2">A high-level overview of our financial model and revenue projections.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary"/>Multi-Stream Revenue Model</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <p className="text-muted-foreground">Our platform generates revenue through three primary, diversified streams:</p>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-4 border rounded-lg"><h4 className="font-semibold">1. Membership Subscriptions</h4><p className="text-sm text-muted-foreground mt-1">Recurring revenue from members on paid plans.</p></div>
                        <div className="p-4 border rounded-lg"><h4 className="font-semibold">2. Transaction Commissions</h4><p className="text-sm text-muted-foreground mt-1">A percentage fee on all mall transactions.</p></div>
                        <div className="p-4 border rounded-lg"><h4 className="font-semibold">3. SaaS & Value-Added Services</h4><p className="text-sm text-muted-foreground mt-1">Fees for tech tools and Marketplace products.</p></div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary"/>Financial Projections (Illustrative)</CardTitle>
                     <CardDescription>Based on our sales roadmap and market assumptions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Metric</TableHead><TableHead className="text-right">Year 1 Projection</TableHead><TableHead className="text-right">Year 3 Projection</TableHead></TableRow></TableHeader>
                        <TableBody>
                            <TableRow><TableCell>Total Members</TableCell><TableCell className="text-right font-semibold">{projectedMembersYear1.toLocaleString()}</TableCell><TableCell className="text-right font-semibold">{projectedMembersYear3.toLocaleString()}</TableCell></TableRow>
                            <TableRow><TableCell>Total Annual Revenue</TableCell><TableCell className="text-right font-semibold">{formatCurrency(year1_total_revenue)}</TableCell><TableCell className="text-right font-semibold">{formatCurrency(year3_total_revenue)}</TableCell></TableRow>
                            <TableRow className="bg-primary/5"><TableCell className="font-bold">Projected Net Profit</TableCell><TableCell className="text-right font-bold text-primary text-lg">{formatCurrency(year1_net_profit)}</TableCell><TableCell className="text-right font-bold text-primary text-lg">{formatCurrency(year3_net_profit)}</TableCell></TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter><p className="text-xs text-muted-foreground">Disclaimer: These projections are illustrative and not a guarantee of future performance.</p></CardFooter>
            </Card>
        </div>
    );
}

// --- InvestorEmailSequence Content ---
const EmailTemplate = ({ subject, content }: { subject: string, content: string }) => {
    const { toast } = useToast();
    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text.trim());
        toast({ title: "Copied to Clipboard!", description: "You can now paste the content into your email client." });
    };
    return (
        <Card>
            <CardHeader><CardTitle>Email Template</CardTitle><CardDescription>Subject: {subject}</CardDescription></CardHeader>
            <CardContent><div className="p-4 bg-muted/50 border rounded-md whitespace-pre-wrap font-mono text-sm max-h-96 overflow-y-auto">{content.trim()}</div></CardContent>
            <CardFooter><Button onClick={() => handleCopyToClipboard(content)}><ClipboardCopy className="mr-2 h-4 w-4" /> Copy Email Content</Button></CardFooter>
        </Card>
    );
};

const emailTemplates = {
    intro: {
        subject: "Investment Opportunity in Logistics Tech: TransConnect",
        content: `
Dear [Investor Name],
I hope this email finds you well.
My name is [Your Name], and I'm the founder of TransConnect. We have built a comprehensive digital ecosystem designed to solve the core challenges of the South African transport industry: access to capital, high operational costs, and systemic inefficiencies.
Our platform has multiple revenue streams (subscriptions, transaction fees, SaaS) and is positioned for exponential growth via powerful network effects.
Would you be open to a brief call next week to discuss how TransConnect is set to modernize a critical sector of the economy?
Best regards,
[Your Name]
`
    },
    proposal: {
        subject: "Following Up: The TransConnect Investment Opportunity",
        content: `
Dear [Investor Name],
Following up on our brief chat, here is a bit more detail on the investment opportunity with TransConnect.
The Problem:
The transport sector is fragmented and underserved by traditional finance and technology. This leads to massive inefficiencies, high costs for operators, and missed growth opportunities.
Our Solution:
TransConnect is an all-in-one platform that provides:
- A Funding Division: Connecting transporters with niche lenders.
- A Network of Malls: Leveraging collective buying power for discounts on parts, tires, and services.
- A Value-Added Marketplace: For reselling essential third-party products.
- Powerful Tech Tools: AI-powered freight matching to reduce empty miles.
The Business Model:
We operate on a diversified revenue model including recurring membership fees, transaction commissions from our malls, and SaaS fees for our tech tools. This model is built to scale efficiently.
I would be delighted to schedule a more detailed call to walk you through our platform, financial projections, and our vision for the future of logistics in South Africa.
Best regards,
[Your Name]
`
    },
    financials: {
        subject: "TransConnect: Financial Model & Projections",
        content: `
Dear [Investor Name],
Thank you for your interest. Here’s a high-level overview of our financial model:
1. Recurring Subscription Revenue:
We project to onboard [X number] paying members within the first two years, generating a stable, predictable MRR from tiered membership plans.
2. Transactional Commission:
Our model projects significant revenue from commissions on deals in our Finance Mall and transactions in the Supplier & Buy/Sell Malls. As the network grows, this revenue stream scales exponentially.
3. SaaS Revenue:
Adoption of our premium tech tools, like the AI Freight Matcher, represents a high-margin SaaS revenue stream.
We have a detailed financial model and pitch deck available for your review. I am confident that once you see the numbers, you will recognize the scale of this opportunity.
Please let me know when you would have 30 minutes for a deeper dive.
Best regards,
[Your Name]
`
    },
};

const emailTabs = [
    { value: "intro", label: "1. Initial Outreach" },
    { value: "proposal", label: "2. The Proposal" },
    { value: "financials", label: "3. Financials" },
];

function InvestorEmailSequence() {
    return (
        <div className="space-y-8">
            <CardHeader className="px-0">
                <div className="flex items-center gap-4"><Mail className="h-8 w-8 text-primary"/><div><CardTitle>Investor Outreach Email Sequence</CardTitle><CardDescription>Use these templates to introduce, propose, and explain the TransConnect investment opportunity.</CardDescription></div></div>
            </CardHeader>
            <Tabs defaultValue="intro" className="w-full">
                <TabsList className="grid w-full grid-cols-3">{emailTabs.map(tab => (<TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>))}</TabsList>
                <TabsContent value="intro"><EmailTemplate subject={emailTemplates.intro.subject} content={emailTemplates.intro.content} /></TabsContent>
                <TabsContent value="proposal"><EmailTemplate subject={emailTemplates.proposal.subject} content={emailTemplates.proposal.content} /></TabsContent>
                <TabsContent value="financials"><EmailTemplate subject={emailTemplates.financials.subject} content={emailTemplates.financials.content} /></TabsContent>
            </Tabs>
        </div>
    );
}

// --- Main Dashboard Component ---

export default function InvestorDashboard() {
  return (
    <Tabs defaultValue="list" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="list"><Briefcase className="mr-2 h-4 w-4" />Investor List</TabsTrigger>
        <TabsTrigger value="pitch"><Info className="mr-2 h-4 w-4" />Elevator Pitch</TabsTrigger>
        <TabsTrigger value="offer"><Presentation className="mr-2 h-4 w-4" />Investor Offer</TabsTrigger>
        <TabsTrigger value="emails"><Mail className="mr-2 h-4 w-4" />Email Sequence</TabsTrigger>
      </TabsList>
      <TabsContent value="list" className="mt-6"><InvestorManagement /></TabsContent>
      <TabsContent value="pitch" className="mt-6"><ElevatorPitch /></TabsContent>
      <TabsContent value="offer" className="mt-6"><InvestorOffer /></TabsContent>
      <TabsContent value="emails" className="mt-6"><InvestorEmailSequence /></TabsContent>
    </Tabs>
  );
}
