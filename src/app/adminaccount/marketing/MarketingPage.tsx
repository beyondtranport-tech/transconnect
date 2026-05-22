'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, Loader2, ClipboardCopy } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { copyHtmlToClipboard } from '@/lib/utils';
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
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
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

export default function MarketingPage({ audience }: MarketingPageProps) {
  const config = audienceConfig[audience];
  const { Offer, Emails, Management } = config;
  const [activeTab, setActiveTab] = useState('company-profile');
  const { toast } = useToast();
  
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);

  const fetchPartners = useCallback(async () => {
    setIsLoadingPartners(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) return;
        const result = await performAdminAction(token, 'getPartnersByType', { type: audience === 'isa' ? 'isa' : audience.slice(0, -1) });
        setPartners(result.data || []);
    } catch (e: any) {
        toast({ variant: 'destructive', title: `Could not load partners`, description: e.message });
    } finally {
        setIsLoadingPartners(false);
    }
  }, [audience, toast]);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const handleLogAndCopy = async (logData: any) => {
    try {
        const contentId = `tab-content-${activeTab}`;
        const contentElement = document.getElementById(contentId);
        if (!contentElement) throw new Error("Content not found.");

        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Not authenticated.");

        await performAdminAction(token, 'logCommunication', {
            partnerId: logData.partnerId,
            type: logData.communicationType,
            subject: logData.subject,
            notes: logData.notes,
        });

        // Use safe utility instead of manual ClipboardItem
        const success = await copyHtmlToClipboard(contentElement.innerHTML);
        if (!success) throw new Error("Copy failed.");

        toast({ title: 'Logged and Copied!', description: 'Interaction recorded. Content ready for paste.' });
        setIsLogDialogOpen(false);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
    }
  };

  return (
    <div className="space-y-6">
        <LogAndCopyDialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen} partners={partners} isLoadingPartners={isLoadingPartners} activeTabLabel={activeTab} onLogAndCopy={handleLogAndCopy} audienceTitle={config.title} />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-lg"><BookOpen className="h-6 w-6 text-primary" /></div>
                <div>
                    <h1 className="text-2xl font-bold">Marketing Library: {config.title}</h1>
                    <p className="text-muted-foreground">Manage leads and browse engagement materials.</p>
                </div>
            </div>
            <Button variant="outline" onClick={() => setIsLogDialogOpen(true)} disabled={isLoadingPartners || partners.length === 0}>
                <ClipboardCopy className="mr-2 h-4 w-4" /> Log & Copy Content
            </Button>
        </div>

        <Tabs defaultValue="management" className="w-full" onValueChange={setActiveTab}>
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
                <TabsContent value="management"><div id="tab-content-management"><Management /></div></TabsContent>
                <TabsContent value="company-profile"><div id="tab-content-company-profile"><CompanyProfile audience={audience} /></div></TabsContent>
                <TabsContent value="tech-architecture"><div id="tab-content-tech-architecture"><TechArchitecture /></div></TabsContent>
                <TabsContent value="revenue-model"><div id="tab-content-revenue-model"><RevenueModel /></div></TabsContent>
                <TabsContent value="offer"><div id="tab-content-offer"><Offer /></div></TabsContent>
                <TabsContent value="pitch"><div id="tab-content-pitch"><PitchDeck /></div></TabsContent>
                <TabsContent value="framework"><div id="tab-content-framework"><Framework /></div></TabsContent>
                <TabsContent value="emails"><div id="tab-content-emails"><Emails /></div></TabsContent>
            </div>
        </Tabs>
    </div>
  );
}
