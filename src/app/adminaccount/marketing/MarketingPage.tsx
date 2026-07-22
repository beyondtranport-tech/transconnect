'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { Loader2, Database, Sparkles, Send, Mail, Download, Upload, RotateCcw, Search, ChevronDown, Zap, Target, MousePointer2, Filter, Ban } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { downloadDataAsCSV, cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

// Content components
const CompanyProfile = dynamic(() => import('@/app/adminaccount/marketing/content/CompanyProfile'), { loading: () => <Loader2 className="animate-spin" /> });
const TechArchitecture = dynamic(() => import('@/app/adminaccount/marketing/content/TechArchitecture'), { loading: () => <Loader2 className="animate-spin" /> });
const RevenueModel = dynamic(() => import('@/app/adminaccount/marketing/content/RevenueModel'), { loading: () => <Loader2 className="animate-spin" /> });
const PitchDeck = dynamic(() => import('@/app/adminaccount/marketing/content/PitchDeck'), { loading: () => <Loader2 className="animate-spin" /> });
const Framework = dynamic(() => import('@/app/adminaccount/marketing/content/Framework'), { loading: () => <Loader2 className="animate-spin" /> });
const SalesIntelligence = dynamic(() => import('@/app/adminaccount/marketing/content/SalesIntelligence'), { loading: () => <Loader2 className="animate-spin" /> });

// Tactical
const TheWedge = dynamic(() => import('@/app/adminaccount/marketing/content/TheWedge'), { loading: () => <Loader2 className="animate-spin" /> });
const TheSignal = dynamic(() => import('@/app/adminaccount/marketing/content/TheSignal'), { loading: () => <Loader2 className="animate-spin" /> });
const TheEliteFilter = dynamic(() => import('@/app/adminaccount/marketing/content/TheEliteFilter'), { loading: () => <Loader2 className="animate-spin" /> });
const TheBreakUp = dynamic(() => import('@/app/adminaccount/marketing/content/TheBreakUp'), { loading: () => <Loader2 className="animate-spin" /> });

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

// High-Fidelity Unified Management
import PartnerManagement from '@/app/adminaccount/marketing/partner-management';
import ForensicBridge from '@/app/adminaccount/marketing/ForensicBridge';
import AudienceOversightTable from '@/app/adminaccount/marketing/AudienceOversightTable';

const audienceConfig: Record<string, any> = {
    partners: { title: 'Strategic Partners', Offer: PartnerOffer, Emails: PartnerEmails, type: 'partner' },
    isa: { title: 'ISA Agents', Offer: PartnerOffer, Emails: PartnerEmails, type: 'isa' },
    suppliers: { title: 'Suppliers', Offer: SupplierOffer, Emails: SupplierEmails, Discovery: DiscoveryEngine, type: 'supplier' },
    transporters: { title: 'Transporters', Offer: TransporterOffer, Emails: TransporterEmails, Discovery: TransporterDiscovery, type: 'transporter' },
    investors: { title: 'Investors', Offer: InvestorOffer, Emails: InvestorEmails, type: 'investor' },
    developers: { title: 'Developers', Offer: DeveloperOffer, Emails: DeveloperEmails, type: 'developer' },
    associates: { title: 'Digital Associates', Offer: AssociateOffer, Emails: PartnerEmails, Discovery: AssociateDiscovery, type: 'associate' },
    drivers: { title: 'Workforce', Offer: PartnerOffer, Emails: PartnerEmails, Discovery: DriverDiscovery, type: 'driver' },
    finance: { title: 'Finance Mall', Offer: InvestorOffer, Emails: InvestorEmails, Discovery: FinanceDiscovery, type: 'finance' },
    warehouse: { title: 'Warehouse Mall', Offer: PartnerOffer, Emails: PartnerEmails, Discovery: WarehouseDiscovery, type: 'warehouse' },
    distribution: { title: 'Distribution Mall', Offer: PartnerOffer, Emails: PartnerEmails, Discovery: DistributionDiscovery, type: 'distributor' },
    loads: { title: 'Loads Mall', Offer: PartnerOffer, Emails: PartnerEmails, Discovery: LoadsDiscovery, type: 'loads' },
    'buy-sell': { title: 'Buy & Sell Mall', Offer: PartnerOffer, Emails: PartnerEmails, Discovery: BuySellDiscovery, type: 'buy-sell' },
};

interface MarketingPageProps {
  audience: string;
}

export default function MarketingPage({ audience }: MarketingPageProps) {
  const config = audienceConfig[audience];
  const [activeTab, setActiveTab] = useState('management');
  const { toast } = useToast();
  
  if (!config) return <div className="p-12 text-center italic text-muted-foreground">Audience configuration for "{audience}" not found.</div>;

  const { type } = config;

  return (
    <div className="space-y-6 text-left text-foreground">
        <div className="text-left">
            <h1 className="text-3xl font-black font-headline text-foreground">{config.title} Command Hub</h1>
            <p className="text-muted-foreground">Manage your dataset, bridge gaps with AI, and oversee industrial engagement.</p>
        </div>

        <Tabs value={activeTab} className="w-full text-left" onValueChange={setActiveTab}>
            <TabsList className="h-auto flex-wrap justify-start bg-muted/50 p-1 text-foreground">
                <TabsTrigger value="management" className="gap-2 px-4 py-2 font-bold uppercase tracking-widest text-[10px]">
                    <Database className="h-3.5 w-3.5" /> Registry (CRM)
                </TabsTrigger>
                {config.Discovery && (
                    <TabsTrigger value="discovery" className="gap-2 px-4 py-2 font-bold uppercase tracking-widest text-[10px]">
                        <Sparkles className="h-3.5 w-3.5" /> Discovery (AI)
                    </TabsTrigger>
                )}
                <TabsTrigger value="bridge" className="gap-2 px-4 py-2 font-bold uppercase tracking-widest text-[10px] text-primary">
                    <Zap className="h-3.5 w-3.5" /> Forensic Bridge
                </TabsTrigger>
                <TabsTrigger value="oversight" className="gap-2 px-4 py-2 font-bold uppercase tracking-widest text-[10px]">
                    <Search className="h-3.5 w-3.5" /> Oversight
                </TabsTrigger>
                <Separator orientation="vertical" className="mx-2 h-6" />
                
                <TabsTrigger value="the-wedge" className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-600 flex items-center gap-1.5"><Target className="h-3 w-3" /> Wedge</TabsTrigger>
                <TabsTrigger value="the-signal" className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5"><MousePointer2 className="h-3 w-3" /> Signal</TabsTrigger>
                <TabsTrigger value="the-elite-filter" className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"><Filter className="h-3 w-3" /> Filter</TabsTrigger>
                <TabsTrigger value="the-break-up" className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"><Ban className="h-3 w-3" /> Breakup</TabsTrigger>
                
                <Separator orientation="vertical" className="mx-2 h-6" />
                <TabsTrigger value="company-profile" className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest">Profile</TabsTrigger>
                <TabsTrigger value="tech-architecture" className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest">Tech</TabsTrigger>
                <TabsTrigger value="revenue-model" className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest">Revenue</TabsTrigger>
                <TabsTrigger value="sales-intelligence" className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary">Intelligence</TabsTrigger>
                <TabsTrigger value="offer" className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest">Offer</TabsTrigger>
                <TabsTrigger value="pitch" className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest">Pitch</TabsTrigger>
                <TabsTrigger value="framework" className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest">Framework</TabsTrigger>
                <TabsTrigger value="emails" className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest">Emails</TabsTrigger>
            </TabsList>

            <div className="mt-6 text-left">
                <TabsContent value="management">
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 text-left">
                        <PartnerManagement type={type} />
                    </div>
                </TabsContent>

                {config.Discovery && (
                    <TabsContent value="discovery">
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 text-left">
                            <config.Discovery />
                        </div>
                    </TabsContent>
                )}

                <TabsContent value="bridge">
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 text-left">
                        <ForensicBridge audience={audience} />
                    </div>
                </TabsContent>

                <TabsContent value="oversight">
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 text-left">
                        <AudienceOversightTable audience={audience} />
                    </div>
                </TabsContent>

                {/* Tactical Content */}
                <TabsContent value="the-wedge"><Card className="border-none shadow-xl"><CardContent className="p-8"><TheWedge audience={audience} /></CardContent></Card></TabsContent>
                <TabsContent value="the-signal"><Card className="border-none shadow-xl"><CardContent className="p-8"><TheSignal /></CardContent></Card></TabsContent>
                <TabsContent value="the-elite-filter"><Card className="border-none shadow-xl"><CardContent className="p-8"><TheEliteFilter /></CardContent></Card></TabsContent>
                <TabsContent value="the-break-up"><Card className="border-none shadow-xl"><CardContent className="p-8"><TheBreakUp /></CardContent></Card></TabsContent>

                {/* Standard Content */}
                <TabsContent value="company-profile"><Card className="border-none shadow-xl"><CardContent className="p-8"><CompanyProfile audience={audience} /></CardContent></Card></TabsContent>
                <TabsContent value="tech-architecture"><Card className="border-none shadow-xl"><CardContent className="p-8"><TechArchitecture /></CardContent></Card></TabsContent>
                <TabsContent value="revenue-model"><Card className="border-none shadow-xl"><CardContent className="p-8"><RevenueModel /></CardContent></Card></TabsContent>
                <TabsContent value="sales-intelligence"><Card className="border-none shadow-xl"><CardContent className="p-8"><SalesIntelligence /></CardContent></Card></TabsContent>
                <TabsContent value="offer"><Card className="border-none shadow-xl"><CardContent className="p-8"><config.Offer /></CardContent></Card></TabsContent>
                <TabsContent value="pitch"><Card className="border-none shadow-xl"><CardContent className="p-8"><PitchDeck /></CardContent></Card></TabsContent>
                <TabsContent value="framework"><Card className="border-none shadow-xl"><CardContent className="p-8"><Framework /></CardContent></Card></TabsContent>
                <TabsContent value="emails"><Card className="border-none shadow-xl"><CardContent className="p-8"><config.Emails /></CardContent></Card></TabsContent>
            </div>
        </Tabs>
    </div>
  );
}

