
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { Loader2, Database, Sparkles } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';

// Content components
const CompanyProfile = dynamic(() => import('@/app/adminaccount/marketing/content/CompanyProfile'), { loading: () => <Loader2 className="animate-spin" /> });
const TechArchitecture = dynamic(() => import('@/app/adminaccount/marketing/content/TechArchitecture'), { loading: () => <Loader2 className="animate-spin" /> });
const RevenueModel = dynamic(() => import('@/app/adminaccount/marketing/content/RevenueModel'), { loading: () => <Loader2 className="animate-spin" /> });
const PitchDeck = dynamic(() => import('@/app/adminaccount/marketing/content/PitchDeck'), { loading: () => <Loader2 className="animate-spin" /> });
const Framework = dynamic(() => import('@/app/adminaccount/marketing/content/Framework'), { loading: () => <Loader2 className="animate-spin" /> });

// Offers
const PartnerOffer = dynamic(() => import('@/app/adminaccount/marketing/offers/PartnerOffer'), { loading: () => <Loader2 className="animate-spin" /> });
const InvestorOffer = dynamic(() => import('@/app/adminaccount/marketing/offers/InvestorOffer'), { loading: () => <Loader2 className="animate-spin" /> });
const DeveloperOffer = dynamic(() => import('@/app/adminaccount/marketing/offers/DeveloperOffer'), { loading: () => <Loader2 className="animate-spin" /> });
const SupplierOffer = dynamic(() => import('@/app/adminaccount/marketing/offers/SupplierOffer'), { loading: () => <Loader2 className="animate-spin" /> });
const TransporterOffer = dynamic(() => import('@/app/adminaccount/marketing/offers/TransporterOffer'), { loading: () => <Loader2 className="animate-spin" /> });
const AssociateOffer = dynamic(() => import('@/app/adminaccount/marketing/offers/AssociateOffer'), { loading: () => <Loader2 className="animate-spin" /> });

// Emails
const PartnerEmails = dynamic(() => import('@/app/adminaccount/marketing/emails/PartnerEmails'), { loading: () => <Loader2 className="animate-spin" /> });
const SupplierEmails = dynamic(() => import('@/app/adminaccount/marketing/emails/SupplierEmails'), { loading: () => <Loader2 className="animate-spin" /> });
const TransporterEmails = dynamic(() => import('@/app/adminaccount/marketing/emails/TransporterEmails'), { loading: () => <Loader2 className="animate-spin" /> });
const InvestorEmails = dynamic(() => import('@/app/adminaccount/marketing/emails/InvestorEmails'), { loading: () => <Loader2 className="animate-spin" /> });
const DeveloperEmails = dynamic(() => import('@/app/adminaccount/marketing/emails/DeveloperEmails'), { loading: () => <Loader2 className="animate-spin" /> });

// Discovery Engines
const DiscoveryEngine = dynamic(() => import('@/app/adminaccount/marketing/discovery-engine'), { loading: () => <Loader2 className="animate-spin" /> });
const TransporterDiscovery = dynamic(() => import('@/app/adminaccount/marketing/transporter-discovery'), { loading: () => <Loader2 className="animate-spin" /> });
const FinanceDiscovery = dynamic(() => import('@/app/adminaccount/marketing/finance-discovery'), { loading: () => <Loader2 className="animate-spin" /> });
const DriverDiscovery = dynamic(() => import('@/app/adminaccount/marketing/driver-discovery'), { loading: () => <Loader2 className="animate-spin" /> });
const AssociateDiscovery = dynamic(() => import('@/app/adminaccount/marketing/associate-discovery'), { loading: () => <Loader2 className="animate-spin" /> });
const WarehouseDiscovery = dynamic(() => import('@/app/adminaccount/marketing/warehouse-discovery'), { loading: () => <Loader2 className="animate-spin" /> });
const DistributionDiscovery = dynamic(() => import('@/app/adminaccount/marketing/distribution-discovery'), { loading: () => <Loader2 className="animate-spin" /> });
const LoadsDiscovery = dynamic(() => import('@/app/adminaccount/marketing/loads-discovery'), { loading: () => <Loader2 className="animate-spin" /> });
const BuySellDiscovery = dynamic(() => import('@/app/adminaccount/marketing/buy-sell-discovery'), { loading: () => <Loader2 className="animate-spin" /> });

// Management (CRM)
import PartnerManagement from '@/app/adminaccount/marketing/partner-management';

const audienceConfig: Record<string, any> = {
    partners: { title: 'Strategic Partners', Offer: PartnerOffer, Emails: PartnerEmails, Management: PartnerManagement, type: 'partner' },
    isa: { title: 'ISA Agents', Offer: PartnerOffer, Emails: PartnerEmails, Management: PartnerManagement, type: 'isa' },
    suppliers: { title: 'Suppliers', Offer: SupplierOffer, Emails: SupplierEmails, Management: PartnerManagement, Discovery: DiscoveryEngine, type: 'supplier' },
    transporters: { title: 'Transporters', Offer: TransporterOffer, Emails: TransporterEmails, Management: PartnerManagement, Discovery: TransporterDiscovery, type: 'transporter' },
    investors: { title: 'Investors', Offer: InvestorOffer, Emails: InvestorEmails, Management: PartnerManagement, type: 'investor' },
    developers: { title: 'Developers', Offer: DeveloperOffer, Emails: DeveloperEmails, Management: PartnerManagement, type: 'developer' },
    associates: { title: 'Digital Associates', Offer: AssociateOffer, Emails: PartnerEmails, Management: PartnerManagement, Discovery: AssociateDiscovery, type: 'associate' },
    drivers: { title: 'Workforce', Offer: PartnerOffer, Emails: PartnerEmails, Management: PartnerManagement, Discovery: DriverDiscovery, type: 'driver' },
    finance: { title: 'Finance Mall', Offer: InvestorOffer, Emails: InvestorEmails, Management: PartnerManagement, Discovery: FinanceDiscovery, type: 'finance' },
    warehouse: { title: 'Warehouse Mall', Offer: PartnerOffer, Emails: PartnerEmails, Management: PartnerManagement, Discovery: WarehouseDiscovery, type: 'warehouse' },
    distribution: { title: 'Distribution Mall', Offer: PartnerOffer, Emails: PartnerEmails, Management: PartnerManagement, Discovery: DistributionDiscovery, type: 'distributor' },
    loads: { title: 'Loads Mall', Offer: PartnerOffer, Emails: PartnerEmails, Management: PartnerManagement, Discovery: LoadsDiscovery, type: 'loads' },
    'buy-sell': { title: 'Buy & Sell Mall', Offer: PartnerOffer, Emails: PartnerEmails, Management: PartnerManagement, Discovery: BuySellDiscovery, type: 'buy-sell' },
};

interface MarketingPageProps {
  audience: string;
}

export default function MarketingPage({ audience }: MarketingPageProps) {
  const config = audienceConfig[audience];
  const [activeTab, setActiveTab] = useState('company-profile');
  const { toast } = useToast();
  
  if (!config) return <div className="p-12 text-center italic">Audience configuration for "{audience}" not found.</div>;

  const { Offer, Emails, Management, Discovery, type } = config;

  return (
    <div className="space-y-6 text-left">
        <div className="text-left">
            <h1 className="text-3xl font-black font-headline text-left">{config.title} Command Hub</h1>
            <p className="text-muted-foreground text-left">Build your dataset, discover new participants, and manage engagement.</p>
        </div>

        <Tabs defaultValue="company-profile" className="w-full text-left" onValueChange={setActiveTab}>
            <TabsList className="h-auto flex-wrap justify-start bg-muted/50 p-1 text-left">
                <TabsTrigger value="company-profile">Profile</TabsTrigger>
                <TabsTrigger value="tech-architecture">Tech</TabsTrigger>
                <TabsTrigger value="revenue-model">Revenue</TabsTrigger>
                <TabsTrigger value="offer">Offer</TabsTrigger>
                <TabsTrigger value="pitch">Pitch</TabsTrigger>
                <TabsTrigger value="framework">Framework</TabsTrigger>
                <TabsTrigger value="emails">Emails</TabsTrigger>
                {Management && <TabsTrigger value="management" className="gap-2"><Database className="h-3.5 w-3.5" /> Registry (CRM)</TabsTrigger>}
                {Discovery && <TabsTrigger value="discovery" className="gap-2"><Sparkles className="h-3.5 w-3.5" /> Discovery (AI)</TabsTrigger>}
            </TabsList>

            <div className="mt-6 text-left">
                <TabsContent value="company-profile"><Card className="border-none shadow-xl"><CardContent className="p-8 text-left"><CompanyProfile audience={audience} /></CardContent></Card></TabsContent>
                <TabsContent value="tech-architecture"><Card className="border-none shadow-xl"><CardContent className="p-8 text-left"><TechArchitecture /></CardContent></Card></TabsContent>
                <TabsContent value="revenue-model"><Card className="border-none shadow-xl"><CardContent className="p-8 text-left"><RevenueModel /></CardContent></Card></TabsContent>
                <TabsContent value="offer"><Card className="border-none shadow-xl"><CardContent className="p-8 text-left"><Offer /></CardContent></Card></TabsContent>
                <TabsContent value="pitch"><Card className="border-none shadow-xl"><CardContent className="p-8 text-left"><PitchDeck /></CardContent></Card></TabsContent>
                <TabsContent value="framework"><Card className="border-none shadow-xl"><CardContent className="p-8 text-left"><Framework /></CardContent></Card></TabsContent>
                <TabsContent value="emails"><Card className="border-none shadow-xl"><CardContent className="p-8 text-left"><Emails /></CardContent></Card></TabsContent>
                
                {Management && (
                    <TabsContent value="management">
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 text-left">
                            <Management type={type} />
                        </div>
                    </TabsContent>
                )}

                {Discovery && (
                    <TabsContent value="discovery">
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 text-left">
                            <Discovery />
                        </div>
                    </TabsContent>
                )}
            </div>
        </Tabs>
    </div>
  );
}
