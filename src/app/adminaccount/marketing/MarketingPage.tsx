
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

// Management components
const PartnerManagement = dynamic(() => import('@/app/adminaccount/partner-management'), { loading: () => <Loader2 className="animate-spin" /> });
const ISAManagement = dynamic(() => import('@/app/adminaccount/isa-management'), { loading: () => <Loader2 className="animate-spin" /> });
const InvestorManagement = dynamic(() => import('@/app/adminaccount/investor-management'), { loading: () => <Loader2 className="animate-spin" /> });
const DeveloperManagement = dynamic(() => import('@/app/adminaccount/developer-management'), { loading: () => <Loader2 className="animate-spin" /> });


const audienceConfig = {
    partners: { title: 'Strategic Partners', Offer: PartnerOffer, Emails: PartnerEmails, Management: PartnerManagement },
    isa: { title: 'ISA Agents', Offer: PartnerOffer, Emails: PartnerEmails, Management: ISAManagement },
    suppliers: { title: 'Suppliers', Offer: SupplierOffer, Emails: SupplierEmails, Management: null },
    transporters: { title: 'Transporters', Offer: TransporterOffer, Emails: TransporterEmails, Management: null },
    investors: { title: 'Investors', Offer: InvestorOffer, Emails: InvestorEmails, Management: InvestorManagement },
    developers: { title: 'Developers', Offer: DeveloperOffer, Emails: DeveloperEmails, Management: DeveloperManagement },
};

interface MarketingPageProps {
  audience: keyof typeof audienceConfig;
}

export default function MarketingPage({ audience }: MarketingPageProps) {
  const config = audienceConfig[audience];
  const { Offer, Emails, Management } = config;

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Marketing & Pitch Library: {config.title}</h1>
            <p className="text-muted-foreground">Tailored content and email sequences for engaging with {config.title.toLowerCase()}.</p>
        </div>
        <Tabs defaultValue="management" className="w-full">
            <TabsList className="h-auto flex-wrap justify-start">
                <TabsTrigger value="management">Partner Management</TabsTrigger>
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
                    <TabsContent value="management">
                        {Management ? <Management /> : (
                            <div className="text-center py-10">
                                <p className="text-muted-foreground">Partner management for this audience type is not applicable or handled elsewhere.</p>
                            </div>
                        )}
                    </TabsContent>
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
