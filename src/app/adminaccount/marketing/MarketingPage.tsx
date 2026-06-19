'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, Loader2, ClipboardCopy, SearchCode, Target, Users, LayoutDashboard, Send, Sparkles, Landmark, DollarSign, Download, MessageSquare } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { copyHtmlToClipboard, cn, downloadDataAsCSV } from '@/lib/utils';
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
import { Textarea } from '@/components/ui/textarea';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

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
import FinanceManagement from './finance-management';
import DriverManagement from './driver-management';

import SupplierPitch from '@/app/adminaccount/supplier-pitch';
import DiscoveryEngine from './discovery-engine';
import FinanceDiscoveryEngine from './finance-discovery';
import InvestorDiscoveryEngine from './investor-discovery';
import TransporterDiscoveryEngine from './transporter-discovery';
import DriverDiscoveryEngine from './driver-discovery';

const audienceConfig = {
    partners: { title: 'Strategic Partners', icon: Users, Offer: PartnerOffer, Emails: PartnerEmails, Management: PartnerManagement },
    isa: { title: 'ISA Agents', icon: Target, Offer: PartnerOffer, Emails: PartnerEmails, Management: ISAManagement },
    suppliers: { title: 'Suppliers', icon: SearchCode, Offer: SupplierOffer, Emails: SupplierEmails, Management: SupplierManagement, Pitch: SupplierPitch, Discovery: DiscoveryEngine },
    transporters: { title: 'Transporters', icon: Send, Offer: TransporterOffer, Emails: TransporterEmails, Management: TransporterManagement, Discovery: TransporterDiscoveryEngine },
    finance: { title: 'Finance Companies', icon: Landmark, Offer: InvestorOffer, Emails: InvestorEmails, Management: FinanceManagement, Discovery: FinanceDiscoveryEngine },
    drivers: { title: 'Drivers', icon: Users, Offer: PartnerOffer, Emails: PartnerEmails, Management: DriverManagement, Discovery: DriverDiscoveryEngine },
    investors: { title: 'App Launch Investors', icon: DollarSign, Offer: InvestorOffer, Emails: InvestorEmails, Management: InvestorManagement, Discovery: InvestorDiscoveryEngine },
    developers: { title: 'Developers', icon: LayoutDashboard, Offer: DeveloperOffer, Emails: DeveloperEmails, Management: DeveloperManagement },
};

interface MarketingPageProps {
  audience: keyof typeof audienceConfig;
}

async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
        cache: 'no-store'
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}

const logSchema = z.object({
  partnerId: z.string().min(1, "Please select a partner."),
  communicationType: z.string().min(1, "Please select a type."),
  notes: z.string().optional(),
});
type LogFormValues = z.infer<typeof logSchema>;

function LogAndCopyDialog({ open, onOpenChange, partners, isLoadingPartners, activeTabLabel, onLogAndCopy, audienceTitle }: any) {
    const form = useForm<LogFormValues>({ resolver: zodResolver(logSchema) });
    const [isLogging, setIsLogging] = useState(false);

    const singularAudience = useMemo(() => {
        if (!audienceTitle) return 'Partner';
        if (audienceTitle === 'Suppliers') return 'Supplier';
        if (audienceTitle === 'Transporters') return 'Transporter';
        return audienceTitle.endsWith('s') ? audienceTitle.slice(0, -1) : audienceTitle;
    }, [audienceTitle]);

    const handleSubmit = async (values: LogFormValues) => {
        setIsLogging(true);
        try {
            await onLogAndCopy({ ...values, subject: activeTabLabel });
        } catch (e) {
            // error handled by parent
        } finally {
            setIsLogging(false);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log and Copy Content</DialogTitle>
                    <DialogDescription>Select a partner to log this communication against before copying.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4 text-left">
                        <FormField control={form.control} name="partnerId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Log against {singularAudience}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger disabled={isLoadingPartners}><SelectValue placeholder={isLoadingPartners ? "Loading..." : `Select a ${singularAudience.toLowerCase()}...`} /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {partners.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.companyName || 'N/A'})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="communicationType" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Communication Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a type..." /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Email">Email</SelectItem>
                                        <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                        <SelectItem value="Call">Call</SelectItem>
                                        <SelectItem value="Meeting">Meeting</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Add details..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <DialogFooter><Button type="submit" disabled={isLogging}>{isLogging && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Log & Copy</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

function MarketingPageContent({ audience }: MarketingPageProps) {
  const config = audienceConfig[audience] as any;
  const { Offer, Emails, Management } = config;
  const Pitch = config.Pitch;
  const Discovery = config.Discovery;
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const subview = searchParams.get('subview');
  const initialTab = subview || (Management ? 'management' : 'company-profile');
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const { toast } = useToast();
  
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);

  // Sync tab with URL
  useEffect(() => {
    if (subview && subview !== activeTab) {
        setActiveTab(subview);
    }
  }, [subview, activeTab]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    const params = new URLSearchParams(searchParams.toString());
    params.set('subview', val);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const fetchPartners = useCallback(async () => {
    setIsLoadingPartners(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) return;
        const result = await performAdminAction(token, 'getPartnersByType', { 
            type: audience === 'isa' ? 'isa' : (audience === 'finance' ? 'finance' : (audience === 'drivers' ? 'driver' : audience.slice(0, -1)))
        });
        setPartners(result.data || []);
    } catch (e: any) {
        console.warn("Silent failure in logging fetch", e);
    } finally {
        setIsLoadingPartners(false);
    }
  }, [audience]);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const handleExport = () => {
      if (partners.length === 0) {
          toast({ variant: 'destructive', title: "No Data", description: "The registry is empty or not loaded." });
          return;
      }
      const filename = `logistics-flow-${audience}-backup-${new Date().toISOString().split('T')[0]}.csv`;
      downloadDataAsCSV(partners, filename);
      toast({ title: "Backup Exported", description: `${partners.length} records saved to CSV.` });
  };

  const handleLogAndCopy = async (logData: any) => {
    try {
        const contentId = `tab-content-${activeTab}`;
        const contentElement = document.getElementById(contentId);
        if (!contentElement) throw new Error("Content not found.");

        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Not authenticated.");

        const subjectLabel = activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        await performAdminAction(token, 'logCommunication', {
            partnerId: logData.partnerId,
            type: logData.communicationType,
            subject: subjectLabel,
            notes: logData.notes,
        });

        // Wrap in Calibri styling for consistent executive memo look in email clients
        const wrappedHtml = `<div style="font-family: Calibri, sans-serif; font-size: 12pt; color: #000000; line-height: 1.2; text-align: left;">${contentElement.innerHTML}</div>`;
        const success = await copyHtmlToClipboard(wrappedHtml);
        if (!success) throw new Error("Copy failed.");

        toast({ title: 'Logged and Covied!', description: 'Interaction recorded. Content ready for paste into your email client.' });
        setIsLogDialogOpen(false);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
    }
  };

  const isContentTab = ['company-profile', 'tech-architecture', 'revenue-model', 'offer', 'pitch', 'framework', 'emails'].includes(activeTab);

  return (
    <div className="space-y-6 text-left">
        <LogAndCopyDialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen} partners={partners} isLoadingPartners={isLoadingPartners} activeTabLabel={activeTab} onLogAndCopy={handleLogAndCopy} audienceTitle={config.title} />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">{config.icon && <config.icon className="h-6 w-6 text-primary" />}</div>
                <div className="text-left">
                    <h1 className="text-2xl font-bold">Marketing Library: {config.title}</h1>
                    <p className="text-muted-foreground">Manage forensic records and browse engagement materials.</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExport} disabled={isLoadingPartners}>
                    <Download className="mr-2 h-4 w-4" /> Backup (CSV)
                </Button>
                {Discovery && (
                    <Button variant="outline" onClick={() => handleTabChange('discovery')} className={cn(activeTab === 'discovery' && "bg-primary text-white hover:bg-primary/90")}>
                        <Sparkles className="mr-2 h-4 w-4" /> Discovery Engine
                    </Button>
                )}
                {isContentTab && (
                    <Button variant="outline" onClick={() => setIsLogDialogOpen(true)} disabled={isLoadingPartners || (partners.length === 0 && !!Management)}>
                        <ClipboardCopy className="mr-2 h-4 w-4" /> Log & Copy Content
                    </Button>
                )}
            </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="h-auto flex-wrap justify-start bg-muted p-1">
                {Management && <TabsTrigger value="management">CRM & Pipeline</TabsTrigger>}
                {Discovery && <TabsTrigger value="discovery" className="gap-2"><Sparkles className="h-3.5 w-3.5"/>Discovery (AI)</TabsTrigger>}
                {Pitch && <TabsTrigger value="pitch-generator">Pitch Library</TabsTrigger>}
                <TabsTrigger value="company-profile">Profile</TabsTrigger>
                <TabsTrigger value="tech-architecture">Tech</TabsTrigger>
                <TabsTrigger value="revenue-model">Revenue</TabsTrigger>
                <TabsTrigger value="offer">The Offer</TabsTrigger>
                <TabsTrigger value="pitch">The Pitch</TabsTrigger>
                <TabsTrigger value="framework">The Framework</TabsTrigger>
                <TabsTrigger value="emails">Emails</TabsTrigger>
            </TabsList>

            <div className="mt-6">
                <TabsContent value="management"><div id="tab-content-management">{Management && <Management />}</div></TabsContent>
                {Discovery && <TabsContent value="discovery"><div id="tab-content-discovery"><Discovery /></div></TabsContent>}
                {Pitch && <TabsContent value="pitch-generator"><div id="tab-content-pitch-generator"><Pitch /></div></TabsContent>}
                <TabsContent value="company-profile"><div id="tab-content-company-profile"><CompanyProfile partner={null} audience={audience} /></div></TabsContent>
                <TabsContent value="tech-architecture"><div id="tab-content-tech-architecture"><TechArchitecture partner={null} /></div></TabsContent>
                <TabsContent value="revenue-model"><div id="tab-content-revenue-model"><RevenueModel partner={null} /></div></TabsContent>
                <TabsContent value="offer"><div id="tab-content-offer"><Offer partner={null} /></div></TabsContent>
                <TabsContent value="pitch"><div id="tab-content-pitch"><PitchDeck partner={null} /></div></TabsContent>
                <TabsContent value="framework"><div id="tab-content-framework"><Framework partner={null} /></div></TabsContent>
                <TabsContent value="emails"><div id="tab-content-emails"><Emails partner={null} /></div></TabsContent>
            </div>
        </Tabs>
    </div>
  );
}

export default function MarketingPage({ audience }: MarketingPageProps) {
    return (
        <Suspense fallback={<Loader2 className="animate-spin h-10 w-10 text-primary mx-auto my-20"/>}>
            <MarketingPageContent audience={audience} />
        </Suspense>
    )
}