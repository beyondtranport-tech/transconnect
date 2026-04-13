
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { Loader2, ClipboardCopy } from 'lucide-react';
import CompanyProfile from './content/CompanyProfile';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Content components
const TechArchitecture = dynamic(() => import('./content/TechArchitecture'), { loading: () => <Loader2 className="animate-spin" /> });
const RevenueModel = dynamic(() => import('./content/RevenueModel'), { loading: () => <Loader2 className="animate-spin" /> });
const PitchDeck = dynamic(() => import('./content/PitchDeck'), { loading: () => <Loader2 className="animate-spin" /> });
const Framework = dynamic(() => import('./content/Framework'), { loading: () => <Loader2 className="animate-spin" /> });

// Audience-specific components
const PartnerOffer = dynamic(() => import('./offers/PartnerOffer'), { loading: () => <Loader2 className="animate-spin" /> });
const NetworkOffer = dynamic(() => import('@/app/account/network-offer'), { loading: () => <Loader2 className="animate-spin" /> });
const InvestorOffer = dynamic(() => import('./offers/InvestorOffer'), { loading: () => <Loader2 className="animate-spin" /> });
const DeveloperOffer = dynamic(() => import('./offers/DeveloperOffer'), { loading: () => <Loader2 className="animate-spin" /> });
const SupplierOffer = dynamic(() => import('./offers/SupplierOffer'), { loading: () => <Loader2 className="animate-spin" /> });
const TransporterOffer = dynamic(() => import('./offers/TransporterOffer'), { loading: () => <Loader2 className="animate-spin" /> });

const PartnerEmails = dynamic(() => import('./emails/PartnerEmails'), { loading: () => <Loader2 className="animate-spin" /> });
const SupplierEmails = dynamic(() => import('./emails/SupplierEmails'), { loading: () => <Loader2 className="animate-spin" /> });
const TransporterEmails = dynamic(() => import('./emails/TransporterEmails'), { loading: () => <Loader2 className="animate-spin" /> });
const InvestorEmails = dynamic(() => import('./emails/InvestorEmails'), { loading: () => <Loader2 className="animate-spin" /> });
const DeveloperEmails = dynamic(() => import('./emails/DeveloperEmails'), { loading: () => <Loader2 className="animate-spin" /> });

// Management components
const PartnerManagement = dynamic(() => import('./partner-management'), { loading: () => <Loader2 className="animate-spin" /> });
const ISAManagement = dynamic(() => import('./isa-management'), { loading: () => <Loader2 className="animate-spin" /> });
const InvestorManagement = dynamic(() => import('./investor-management'), { loading: () => <Loader2 className="animate-spin" /> });
const DeveloperManagement = dynamic(() => import('./developer-management'), { loading: () => <Loader2 className="animate-spin" /> });


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
  const [activeTab, setActiveTab] = useState('company-profile');
  const { toast } = useToast();

  const handleCopyContent = async () => {
    const contentId = `tab-content-${activeTab}`;
    const contentElement = document.getElementById(contentId);

    if (contentElement) {
      try {
        // 1. Clone the node to avoid modifying the live DOM
        const contentClone = contentElement.cloneNode(true) as HTMLElement;

        // 2. Ensure all image sources are absolute URLs
        const images = contentClone.querySelectorAll('img');
        images.forEach(img => {
          // The 'src' property of an HTMLImageElement returns the absolute URL
          img.setAttribute('src', img.src);
        });
        
        // 3. Create the blob with the modified HTML
        const blob = new Blob([contentClone.innerHTML], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({ 'text/html': blob });
        await navigator.clipboard.write([clipboardItem]);

        toast({
          title: 'Content Copied!',
          description: `The content for the "${activeTab.replace(/-/g, ' ')}" tab has been copied. Note: Images may be blocked by the recipient's email client.`,
        });
      } catch (err) {
        console.error('Failed to copy content: ', err);
        toast({
          variant: 'destructive',
          title: 'Copy Failed',
          description: 'Your browser may not support this feature, or there was an error.',
        });
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Content not found',
        description: 'Could not find the content for the active tab.',
      });
    }
  };


  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Marketing & Pitch Library: {config.title}</h1>
            <p className="text-muted-foreground">Tailored content and email sequences for engaging with {config.title.toLowerCase()}.</p>
        </div>
        <Tabs defaultValue="company-profile" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="h-auto flex-wrap justify-start">
                <TabsTrigger value="company-profile">Company Profile</TabsTrigger>
                <TabsTrigger value="tech-architecture">Tech Architecture</TabsTrigger>
                <TabsTrigger value="revenue-model">Revenue Model</TabsTrigger>
                <TabsTrigger value="offer">The Offer</TabsTrigger>
                <TabsTrigger value="pitch">The Pitch</TabsTrigger>
                <TabsTrigger value="framework">The Framework</TabsTrigger>
                <TabsTrigger value="emails">Emails</TabsTrigger>
                {Management && <TabsTrigger value="management">Partner Management</TabsTrigger>}
            </TabsList>

            <Card className="mt-4">
                <CardHeader className="flex flex-row items-center justify-end border-b">
                    <Button variant="outline" onClick={handleCopyContent}>
                        <ClipboardCopy className="mr-2 h-4 w-4" />
                        Copy Content for Email
                    </Button>
                </CardHeader>
                <CardContent className="p-6">
                    <div id="tab-content-company-profile">
                      <TabsContent value="company-profile"><CompanyProfile audience={audience} /></TabsContent>
                    </div>
                    <div id="tab-content-tech-architecture">
                      <TabsContent value="tech-architecture"><TechArchitecture /></TabsContent>
                    </div>
                    <div id="tab-content-revenue-model">
                      <TabsContent value="revenue-model"><RevenueModel /></TabsContent>
                    </div>
                    <div id="tab-content-offer">
                      <TabsContent value="offer"><Offer /></TabsContent>
                    </div>
                    <div id="tab-content-pitch">
                      <TabsContent value="pitch"><PitchDeck /></TabsContent>
                    </div>
                    <div id="tab-content-framework">
                      <TabsContent value="framework"><Framework /></TabsContent>
                    </div>
                    <div id="tab-content-emails">
                      <TabsContent value="emails"><Emails /></TabsContent>
                    </div>
                    {Management && (
                        <div id="tab-content-management">
                          <TabsContent value="management">
                              <Management />
                          </TabsContent>
                        </div>
                    )}
                </CardContent>
            </Card>
        </Tabs>
    </div>
  );
}
