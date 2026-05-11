'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, ClipboardCopy } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
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
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

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

const logSchema = z.object({
  partnerId: z.string().min(1, "Please select a partner."),
  communicationType: z.string().min(1, "Please select a type."),
  notes: z.string().optional(),
  createFollowUp: z.boolean().default(false),
  followUpDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

type LogFormValues = z.infer<typeof logSchema>;

async function fetchAdmins(token: string) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'listAllUsers' }),
    });
    const result = await response.json();
    return result.success ? result.data : [];
}

function LogAndCopyDialog({ open, onOpenChange, partners, isLoadingPartners, activeTabLabel, onLogAndCopy, audienceTitle }: any) {
    const { user } = useUser();
    const [admins, setAdmins] = useState<any[]>([]);
    const form = useForm<LogFormValues>({
        resolver: zodResolver(logSchema),
        defaultValues: { createFollowUp: false, assigneeId: user?.uid }
    });

    const [isLogging, setIsLogging] = useState(false);
    const createFollowUp = form.watch('createFollowUp');

    useEffect(() => {
        if (open) {
            getClientSideAuthToken().then(token => {
                if (token) fetchAdmins(token).then(setAdmins);
            });
        }
    }, [open]);

    const singularAudience = useMemo(() => {
        if (!audienceTitle) return 'Partner';
        if (audienceTitle === 'Suppliers') return 'Supplier';
        if (audienceTitle === 'Transporters') return 'Transporter';
        if (audienceTitle.endsWith('s')) {
            return audienceTitle.slice(0, -1);
        }
        return audienceTitle;
    }, [audienceTitle]);

    const handleSubmit = async (values: LogFormValues) => {
        setIsLogging(true);
        try {
            const followUpTask = values.createFollowUp && values.followUpDate ? {
                dueDate: values.followUpDate,
                assigneeId: values.assigneeId || user?.uid,
                title: `Follow up: ${activeTabLabel}`,
                description: `Automatically created after sharing ${activeTabLabel} content.`
            } : undefined;

            await onLogAndCopy({
                ...values,
                subject: activeTabLabel,
                followUpTask
            });
        } catch (e) {
            // Error handled in parent
        } finally {
            setIsLogging(false);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Log & Copy Content</DialogTitle>
                    <DialogDescription>
                        Select a {singularAudience.toLowerCase()} to log this outreach and optionally set a follow-up task.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                        <FormField control={form.control} name="partnerId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Target {singularAudience}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger disabled={isLoadingPartners}>
                                        <SelectValue placeholder={isLoadingPartners ? "Loading..." : `Select a ${singularAudience.toLowerCase()}...`} />
                                    </SelectTrigger></FormControl>
                                    <SelectContent>
                                        {partners.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.companyName || 'N/A'})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="communicationType" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Outreach Method</FormLabel>
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
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Outreach Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Details about the interaction..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <Separator />
                        
                        <FormField control={form.control} name="createFollowUp" render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <FormLabel className="cursor-pointer font-semibold">Schedule Follow-up Task?</FormLabel>
                            </FormItem>
                        )} />

                        {createFollowUp && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <FormField control={form.control} name="followUpDate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Follow-up Date</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="assigneeId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assign Task To</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select staff..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {admins.map(admin => <SelectItem key={admin.uid} value={admin.uid}>{admin.displayName || admin.email}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        )}

                         <DialogFooter className="pt-6">
                            <Button type="submit" disabled={isLogging} className="w-full">
                                {isLogging ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ClipboardCopy className="mr-2 h-4 w-4" />}
                                Log Outreach & Copy Content
                            </Button>
                        </DialogFooter>
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

  const fetchPartnersForLogging = useCallback(async () => {
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
        toast({ variant: 'destructive', title: `Could not load partners for logging`, description: e.message });
    } finally {
        setIsLoadingPartners(false);
    }
  }, [audience, toast]);

  useEffect(() => {
    fetchPartnersForLogging();
  }, [fetchPartnersForLogging]);


  const handleCopyContent = async () => {
    const contentId = `tab-content-${activeTab}`;
    const contentElement = document.getElementById(contentId);

    if (contentElement) {
      try {
        const contentClone = contentElement.cloneNode(true) as HTMLElement;
        const images = contentClone.querySelectorAll('img');
        images.forEach(img => {
            if (img.src.startsWith('/')) {
                img.src = `${window.location.origin}${img.src}`;
            }
        });
        
        const blob = new Blob([contentClone.innerHTML], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({ 'text/html': blob });
        await navigator.clipboard.write([clipboardItem]);
        
      } catch (err) {
        console.error('Failed to copy content: ', err);
        throw new Error('Your browser may not support this feature.');
      }
    } else {
      throw new Error(`Could not find the content for the active tab.`);
    }
  };

  const handleLogAndCopy = async (logData: {partnerId: string, communicationType: string, subject: string, notes?: string, followUpTask?: any}) => {
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        
        await performAdminAction(token, 'logCommunication', {
            partnerId: logData.partnerId,
            type: logData.communicationType,
            subject: logData.subject,
            notes: logData.notes,
            followUpTask: logData.followUpTask
        });

        await handleCopyContent();

        toast({ title: 'Logged and Copied!', description: 'Outreach has been recorded and follow-up scheduled.' });
        setIsLogDialogOpen(false);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
    }
  };

  return (
    <>
        <LogAndCopyDialog 
            open={isLogDialogOpen}
            onOpenChange={setIsLogDialogOpen}
            partners={partners}
            isLoadingPartners={isLoadingPartners}
            activeTabLabel={activeTab}
            onLogAndCopy={handleLogAndCopy}
            audienceTitle={config.title}
        />
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
                    <TabsTrigger value="management">Management</TabsTrigger>
                </TabsList>

                <Card className="mt-4">
                    <CardHeader className="flex flex-row items-center justify-end border-b">
                        <Button variant="outline" onClick={() => setIsLogDialogOpen(true)} disabled={isLoadingPartners || partners.length === 0}>
                            {isLoadingPartners ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <ClipboardCopy className="mr-2 h-4 w-4" />
                            )}
                            Log & Copy Content
                        </Button>
                    </CardHeader>
                    <CardContent className="p-6">
                        <TabsContent value="company-profile">
                            <div id="tab-content-company-profile"><CompanyProfile audience={audience} /></div>
                        </TabsContent>
                        <TabsContent value="tech-architecture">
                            <div id="tab-content-tech-architecture"><TechArchitecture /></div>
                        </TabsContent>
                        <TabsContent value="revenue-model">
                            <div id="tab-content-revenue-model"><RevenueModel /></div>
                        </TabsContent>
                        <TabsContent value="offer">
                            <div id="tab-content-offer"><Offer /></div>
                        </TabsContent>
                        <TabsContent value="pitch">
                            <div id="tab-content-pitch"><PitchDeck /></div>
                        </TabsContent>
                        <TabsContent value="framework">
                            <div id="tab-content-framework"><Framework /></div>
                        </TabsContent>
                        <TabsContent value="emails">
                            <div id="tab-content-emails"><Emails /></div>
                        </TabsContent>
                        <TabsContent value="management">
                            <div id="tab-content-management"><Management /></div>
                        </TabsContent>
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    </>
  );
}
