'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ClipboardCopy, UserCheck, AlertCircle, Filter } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getClientSideAuthToken, useUser } from '@/firebase';

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

type ApiPartnerType = 'partner' | 'isa' | 'investor' | 'developer' | 'supplier' | 'transporter';

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
  const { Offer, Emails, Management } = config;
  const [activeTab, setActiveTab] = useState('company-profile');
  const { toast } = useToast();
  const { user } = useUser();
  
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('none');
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);
  const [emailOnly, setEmailOnly] = useState(true);

  const filteredPartners = useMemo(() => {
    if (!emailOnly) return partners;
    return partners.filter(p => p.email && p.email.trim() !== '');
  }, [partners, emailOnly]);

  const selectedPartner = useMemo(() => 
    partners.find(p => p.id === selectedPartnerId), 
  [partners, selectedPartnerId]);

  const fetchPartners = useCallback(async () => {
    setIsLoadingPartners(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Not authenticated");

        let apiType: ApiPartnerType = 'partner';
        if (audience === 'isa') apiType = 'isa';
        else if (audience === 'investors') apiType = 'investor';
        else if (audience === 'developers') apiType = 'developer';
        else if (audience === 'suppliers') apiType = 'supplier';
        else if (audience === 'transporters') apiType = 'transporter';
        
        const result = await performAdminAction(token, 'getPartnersByType', { type: apiType });
        setPartners(result.data || []);
    } catch (e: any) {
        toast({ variant: 'destructive', title: `Could not load partners`, description: e.message });
    } finally {
        setIsLoadingPartners(false);
    }
  }, [audience, toast]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleLogAndCopy = async () => {
    if (!selectedPartner) {
        toast({ variant: 'destructive', title: "Select a Recipient", description: "You must select a partner to enable personalization and tracking." });
        return;
    }

    const contentId = `tab-content-${activeTab}`;
    const contentElement = document.getElementById(contentId);

    if (!contentElement) {
        toast({ variant: 'destructive', title: "Content Error", description: "Could not find the content to copy." });
        return;
    }

    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        
        // 1. Log the outreach in CRM
        await performAdminAction(token, 'logCommunication', {
            partnerId: selectedPartner.id,
            type: 'Email',
            subject: activeTab,
            notes: `Auto-generated and copied for ${selectedPartner.firstName}.`,
        });

        // 2. Prepare HTML for clipboard
        const contentClone = contentElement.cloneNode(true) as HTMLElement;
        
        // Ensure all relative image URLs are absolute
        const images = contentClone.querySelectorAll('img');
        images.forEach(img => {
            if (img.src.startsWith('/')) {
                img.src = `${window.location.origin}${img.src}`;
            }
        });

        // 3. Append Tracking Pixel
        const trackingPixel = document.createElement('img');
        trackingPixel.src = `${window.location.origin}/api/trackEmailOpen/${selectedPartner.id}`;
        trackingPixel.width = 1;
        trackingPixel.height = 1;
        trackingPixel.style.display = 'none';
        contentClone.appendChild(trackingPixel);

        // 4. Copy to Clipboard
        const blob = new Blob([contentClone.innerHTML], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({ 'text/html': blob });
        await navigator.clipboard.write([clipboardItem]);

        toast({ title: 'Logged & Copied!', description: `Content for ${selectedPartner.firstName} is ready to paste into your email client.` });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold">Marketing & Pitch Library: {config.title}</h1>
                <p className="text-muted-foreground">Automated outreach with tracking for {config.title.toLowerCase()}.</p>
            </div>
            
            <Card className="w-full md:w-[450px] border-primary bg-primary/5">
                <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            Target Recipient
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                            <Switch 
                                id="email-only" 
                                checked={emailOnly} 
                                onCheckedChange={setEmailOnly}
                            />
                            <Label htmlFor="email-only" className="text-xs cursor-pointer">Email Only</Label>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                        <SelectTrigger disabled={isLoadingPartners}>
                            <SelectValue placeholder={isLoadingPartners ? "Loading..." : "Select partner to automate..."} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Generic (No Tracking)</SelectItem>
                            {filteredPartners.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.firstName} {p.lastName} {p.companyName ? `(${p.companyName})` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
        </div>

        <Tabs defaultValue="company-profile" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="h-auto flex-wrap justify-start bg-muted p-1">
                <TabsTrigger value="company-profile">Profile</TabsTrigger>
                <TabsTrigger value="tech-architecture">Tech</TabsTrigger>
                <TabsTrigger value="revenue-model">Revenue</TabsTrigger>
                <TabsTrigger value="offer">The Offer</TabsTrigger>
                <TabsTrigger value="pitch">The Pitch</TabsTrigger>
                <TabsTrigger value="framework">Framework</TabsTrigger>
                <TabsTrigger value="emails">Emails</TabsTrigger>
                <TabsTrigger value="management">Management</TabsTrigger>
            </TabsList>

            <Card className="mt-4">
                <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
                    <div>
                        <CardTitle className="text-lg">Content Preview</CardTitle>
                        <CardDescription>
                            {selectedPartner 
                                ? `Automating content for ${selectedPartner.firstName}...` 
                                : "Select a recipient above to enable personalization and tracking."}
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {!selectedPartner && activeTab !== 'management' && (
                             <div className="flex items-center gap-2 text-xs text-destructive font-medium px-3 py-1 bg-destructive/10 rounded-md border border-destructive/20 animate-pulse">
                                <AlertCircle className="h-3 w-3" />
                                Selection Required
                            </div>
                        )}
                        <Button 
                            variant={selectedPartner ? "default" : "outline"}
                            onClick={handleLogAndCopy} 
                            disabled={!selectedPartner || activeTab === 'management'}
                        >
                            <ClipboardCopy className="mr-2 h-4 w-4" />
                            Log & Copy HTML
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-6">
                        <TabsContent value="company-profile" className="m-0">
                            <div id="tab-content-company-profile"><CompanyProfile audience={audience} partner={selectedPartner} /></div>
                        </TabsContent>
                        <TabsContent value="tech-architecture" className="m-0">
                            <div id="tab-content-tech-architecture"><TechArchitecture partner={selectedPartner} /></div>
                        </TabsContent>
                        <TabsContent value="revenue-model" className="m-0">
                            <div id="tab-content-revenue-model"><RevenueModel partner={selectedPartner} /></div>
                        </TabsContent>
                        <TabsContent value="offer" className="m-0">
                            <div id="tab-content-offer"><Offer partner={selectedPartner} /></div>
                        </TabsContent>
                        <TabsContent value="pitch" className="m-0">
                            <div id="tab-content-pitch"><PitchDeck partner={selectedPartner} /></div>
                        </TabsContent>
                        <TabsContent value="framework" className="m-0">
                            <div id="tab-content-framework"><Framework partner={selectedPartner} /></div>
                        </TabsContent>
                        <TabsContent value="emails" className="m-0">
                            <div id="tab-content-emails"><Emails partner={selectedPartner} /></div>
                        </TabsContent>
                        <TabsContent value="management" className="m-0">
                            <Management />
                        </TabsContent>
                    </div>
                </CardContent>
            </Card>
        </Tabs>
    </div>
  );
}
