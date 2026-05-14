'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { useState } from 'react';

// Content components
import CompanyProfile from './content/CompanyProfile';
import TechArchitecture from './content/TechArchitecture';
import RevenueModel from './content/RevenueModel';
import PitchDeck from './content/PitchDeck';
import Framework from './content/Framework';

// Offers
import PartnerOffer from './offers/PartnerOffer';
import InvestorOffer from './offers/InvestorOffer';
import DeveloperOffer from './offers/DeveloperOffer';
import SupplierOffer from './offers/SupplierOffer';
import TransporterOffer from './offers/TransporterOffer';

// Emails
import PartnerEmails from './emails/PartnerEmails';
import SupplierEmails from './emails/SupplierEmails';
import TransporterEmails from './emails/TransporterEmails';
import InvestorEmails from './emails/InvestorEmails';
import DeveloperEmails from './emails/DeveloperEmails';

// Management
import PartnerManagement from './partner-management';
import ISAManagement from './isa-management';
import InvestorManagement from './investor-management';
import DeveloperManagement from './developer-management';
import SupplierManagement from './supplier-management';
import TransporterManagement from './transporter-management';

const audienceConfig = {
    partners: { title: 'Strategic Partners', Offer: PartnerOffer, Emails: PartnerEmails, Management: PartnerManagement },
    isa: { title: 'ISA Agents', Offer: PartnerOffer, Emails: PartnerEmails, Management: ISAManagement },
    suppliers: { title: 'Suppliers', Offer: SupplierOffer, Emails: SupplierEmails, Management: SupplierManagement },
    transporters: { title: 'Transporters', Offer: TransporterOffer, Emails: TransporterEmails, Management: TransporterManagement },
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                    <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Marketing Library: {config.title}</h1>
                    <p className="text-muted-foreground">Manage leads and browse engagement materials.</p>
                </div>
            </div>
        </div>

        <Tabs defaultValue="management" className="w-full">
            <TabsList className="h-auto flex-wrap justify-start bg-muted p-1">
                <TabsTrigger value="management">Management & CRM</TabsTrigger>
                <TabsTrigger value="company-profile">Profile</TabsTrigger>
                <TabsTrigger value="tech-architecture">Tech</TabsTrigger>
                <TabsTrigger value="revenue-model">Revenue</TabsTrigger>
                <TabsTrigger value="offer">The Offer</TabsTrigger>
                <TabsTrigger value="pitch">The Pitch</TabsTrigger>
                <TabsTrigger value="framework">Framework</TabsTrigger>
                <TabsTrigger value="emails">Emails</TabsTrigger>
            </TabsList>

            <div className="mt-6">
                <TabsContent value="management" className="m-0">
                    <Management />
                </TabsContent>
                <TabsContent value="company-profile" className="m-0">
                    <CompanyProfile audience={audience} />
                </TabsContent>
                <TabsContent value="tech-architecture" className="m-0">
                    <TechArchitecture />
                </TabsContent>
                <TabsContent value="revenue-model" className="m-0">
                    <RevenueModel />
                </TabsContent>
                <TabsContent value="offer" className="m-0">
                    <Offer />
                </TabsContent>
                <TabsContent value="pitch" className="m-0">
                    <PitchDeck />
                </TabsContent>
                <TabsContent value="framework" className="m-0">
                    <Framework />
                </TabsContent>
                <TabsContent value="emails" className="m-0">
                    <Emails />
                </TabsContent>
            </div>
        </Tabs>
    </div>
  );
}