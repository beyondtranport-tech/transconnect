'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { Loader2, ClipboardCopy, Database, SearchCode, Sparkles } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getClientSideAuthToken } from '@/firebase';
import { copyHtmlToClipboard } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

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
const PartnerManagement = dynamic(() => import('@/app/adminaccount/marketing/partner-management'), { loading: () => <Loader2 className="animate-spin" /> });
const ISAManagement = dynamic(() => import('@/app/adminaccount/marketing/isa-management'), { loading: () => <Loader2 className="animate-spin" /> });
const InvestorManagement = dynamic(() => import('@/app/adminaccount/marketing/investor-management'), { loading: () => <Loader2 className="animate-spin" /> });
const DeveloperManagement = dynamic(() => import('@/app/adminaccount/marketing/developer-management'), { loading: () => <Loader2 className="animate-spin" /> });
const SupplierManagement = dynamic(() => import('@/app/adminaccount/marketing/supplier-management'), { loading: () => <Loader2 className="animate-spin" /> });
const TransporterManagement = dynamic(() => import('@/app/adminaccount/marketing/transporter-management'), { loading: () => <Loader2 className="animate-spin" /> });
const AssociateManagement = dynamic(() => import('@/app/adminaccount/marketing/associate-management'), { loading: () => <Loader2 className="animate-spin" /> });
const DriverManagement = dynamic(() => import('@/app/adminaccount/marketing/driver-management'), { loading: () => <Loader2 className="animate-spin" /> });
const FinanceManagement = dynamic(() => import('@/app/adminaccount/marketing/finance-management'), { loading: () => <Loader2 className="animate-spin" /> });

const audienceConfig: Record<string, any> = {
    partners: { title: 'Strategic Partners', Offer: PartnerOffer, Emails: PartnerEmails, Management: PartnerManagement },
    isa: { title: 'ISA Agents', Offer: PartnerOffer, Emails: PartnerEmails, Management: ISAManagement },
    suppliers: { title: 'Suppliers', Offer: SupplierOffer, Emails: SupplierEmails, Management: SupplierManagement, Discovery: DiscoveryEngine },
    transporters: { title: 'Transporters', Offer: TransporterOffer, Emails: TransporterEmails, Management: TransporterManagement, Discovery: TransporterDiscovery },
    investors: { title: 'Investors', Offer: InvestorOffer, Emails: InvestorEmails, Management: InvestorManagement },
    developers: { title: 'Developers', Offer: DeveloperOffer, Emails: DeveloperEmails, Management: DeveloperManagement },
    associates: { title: 'Digital Associates', Offer: AssociateOffer, Emails: PartnerEmails, Management: AssociateManagement, Discovery: AssociateDiscovery },
    drivers: { title: 'Workforce', Offer: PartnerOffer, Emails: PartnerEmails, Management: DriverManagement, Discovery: DriverDiscovery },
    finance: { title: 'Finance Mall', Offer: InvestorOffer, Emails: InvestorEmails, Management: FinanceManagement, Discovery: FinanceDiscovery },
    warehouse: { title: 'Warehouse Mall', Offer: PartnerOffer, Emails: PartnerEmails, Management: PartnerManagement, Discovery: WarehouseDiscovery },
    distribution: { title: 'Distribution Mall', Offer: PartnerOffer, Emails: PartnerEmails, Management: PartnerManagement, Discovery: DistributionDiscovery },
    loads: { title: 'Loads Mall', Offer: PartnerOffer, Emails: PartnerEmails, Management: PartnerManagement, Discovery: LoadsDiscovery },
    'buy-sell': { title: 'Buy & Sell Mall', Offer: PartnerOffer, Emails: PartnerEmails, Management: PartnerManagement, Discovery: BuySellDiscovery },
};

interface MarketingPageProps {
  audience: string;
}

async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}

export default function MarketingPage({ audience }: MarketingPageProps) {
  const config = audienceConfig[audience];
  const [activeTab, setActiveTab] = useState('company-profile');
  const { toast } = useToast();
  
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);

  const fetchPartnersForLogging = useCallback(async () => {
    setIsLoadingPartners(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Not authenticated");

        let apiType = 'partner';
        if (audience === 'isa') apiType = 'isa';
        else if (audience === 'investors') apiType = 'investor';
        else if (audience === 'developers') apiType = 'developer';
        else if (audience === 'suppliers') apiType = 'supplier';
        else if (audience === 'transporters') apiType = 'transporter';
        else if (audience === 'associates') apiType = 'associate';
        else if (audience === 'drivers') apiType = 'driver';
        else if (audience === 'finance') apiType = 'finance';
        
        const result = await performAdminAction(token, 'getPartnersByType', { type: apiType });
        setPartners(result.data || []);
        
    } catch (e: any) {
        console.warn(`Could not load partners for logging: ${e.message}`);
    } finally {
        setIsLoadingPartners(false);
    }
  }, [audience]);

  useEffect(() => {
    fetchPartnersForLogging();
  }, [fetchPartnersForLogging]);

  if (!config) return <div className="p-12 text-center italic">Audience configuration for "{audience}" not found.</div>;

  const { Offer, Emails, Management, Discovery } = config;

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
                            <Management />
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