'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const CompanyProfile = dynamic(() => import('@/app/adminaccount/marketing/content/CompanyProfile'), { loading: () => <Loader2 className="animate-spin" /> });
const TechArchitecture = dynamic(() => import('@/app/adminaccount/marketing/content/TechArchitecture'), { loading: () => <Loader2 className="animate-spin" /> });
const RevenueModel = dynamic(() => import('@/app/adminaccount/marketing/content/RevenueModel'), { loading: () => <Loader2 className="animate-spin" /> });
const PitchDeck = dynamic(() => import('@/app/adminaccount/marketing/content/PitchDeck'), { loading: () => <Loader2 className="animate-spin" /> });
const Framework = dynamic(() => import('@/app/adminaccount/marketing/content/Framework'), { loading: () => <Loader2 className="animate-spin" /> });

// Audience-specific components
const PartnerOffer = dynamic(() => import('@/app/adminaccount/marketing/offers/PartnerOffer'), { loading: () => <Loader2 className="animate-spin" /> });
const NetworkOffer = dynamic(() => import('@/app/adminaccount/marketing/offers/NetworkOffer'), { loading: () => <Loader2 className="animate-spin" /> });
const InvestorOffer = dynamic(() => import('@/app/adminaccount/marketing/offers/InvestorOffer'), { loading: () => <Loader2 className="animate-spin" /> });
const DeveloperOffer = dynamic(() => import('@/app/adminaccount/marketing/offers/DeveloperOffer'), { loading: () => <Loader2 className="animate-spin" /> });
const SupplierOffer = dynamic(() => import('@/app/adminaccount/marketing/offers/SupplierOffer'), { loading: () => <Loader2 className="animate-spin" /> });
const TransporterOffer = dynamic(() => import('@/app/adminaccount/marketing/offers/TransporterOffer'), { loading: () => <Loader2 className="animate-spin" /> });

const PartnerEmails = dynamic(() => import('@/app/adminaccount/marketing/emails/PartnerEmails'), { loading: () => <Loader2 className="animate-spin" /> });
const SupplierEmails = dynamic(() => import('@/app/adminaccount/supplier-email-sequence'), { loading: () => <Loader2 className="animate-spin" /> });
const TransporterEmails = dynamic(() => import('@/app/adminaccount/transporter-email-sequence'), { loading: () => <Loader2 className="animate-spin" /> });
const InvestorEmails = dynamic(() => import('@/app/adminaccount/marketing/emails/InvestorEmails'), { loading: () => <Loader2 className="animate-spin" /> });
const DeveloperEmails = dynamic(() => import('@/app/adminaccount/marketing/emails/DeveloperEmails'), { loading: () => <Loader2 className="animate-spin" /> });


const audienceConfig = {
    partners: { title: 'Strategic Partner', Offer: PartnerOffer, Emails: PartnerEmails },
    isa: { title: 'ISA Agent', Offer: PartnerOffer, Emails: PartnerEmails }, // Reusing partner offer/emails for ISA
    suppliers: { title: 'Supplier', Offer: SupplierOffer, Emails: SupplierEmails },
    transporters: { title: 'Transporter', Offer: TransporterOffer, Emails: TransporterEmails },
    investors: { title: 'Investor', Offer: InvestorOffer, Emails: InvestorEmails },
    developers: { title: 'Developer', Offer: DeveloperOffer, Emails: DeveloperEmails },
};

interface MarketingPageProps {
  audience: keyof typeof audienceConfig;
}

export default function MarketingPage({ audience }: MarketingPageProps) {
  const config = audienceConfig[audience];
  const { Offer, Emails } = config;

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Marketing & Pitch Library: {config.title}s</h1>
            <p className="text-muted-foreground">Tailored content and email sequences for engaging with {config.title.toLowerCase()}s.</p>
        </div>
        <Tabs defaultValue="offer" className="w-full">
            <TabsList className="h-auto flex-wrap justify-start">
                <TabsTrigger value="company-profile">Company Profile</TabsTrigger>
                <TabsTrigger value="tech-architecture">Tech Architecture</TabsTrigger>
                <TabsTrigger value="revenue-model">Revenue Model</TabsTrigger>
                <TabsTrigger value="offer">The Offer</TabsTrigger>
                <TabsTrigger value="pitch">The Pitch</TabsTrigger>
                <TabsTrigger value="framework">The Framework</TabsTrigger>
                <TabsTrigger value="emails">Emails</TabsTrigger>
            </TabsList>

            <Card className="mt-4">
                <CardContent className="p-6">
                    <TabsContent value="company-profile"><CompanyProfile /></TabsContent>
                    <TabsContent value="tech-architecture"><TechArchitecture /></TabsContent>
                    <TabsContent value="revenue-model"><RevenueModel /></TabsContent>
                    <TabsContent value="offer"><Offer /></TabsContent>
                    <TabsContent value="pitch"><PitchDeck /></TabsContent>
                    <TabsContent value="framework"><Framework /></TabsContent>
                    <TabsContent value="emails"><Emails /></TabsContent>
                </CardContent>
            </Card>
        </Tabs>
    </div>
  );
}
