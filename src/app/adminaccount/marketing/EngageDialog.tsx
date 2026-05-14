'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ClipboardCopy, Mail, MessageSquare, UserCheck, AlertCircle, Info, Link as LinkIcon, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';

// Shared components
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

interface EngageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: any;
  audience: "partners" | "isa" | "transporters" | "suppliers" | "investors" | "developers";
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

export function EngageDialog({ open, onOpenChange, partner, audience }: EngageDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('company-profile');
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useUser();

  const audienceLabel = useMemo(() => {
    if (audience === 'isa') return 'ISA Agent';
    if (audience === 'suppliers') return 'Supplier';
    if (audience === 'transporters') return 'Transporter';
    return audience.slice(0, -1).charAt(0).toUpperCase() + audience.slice(1, -1);
  }, [audience]);

  const Offer = useMemo(() => {
    if (audience === 'investors') return InvestorOffer;
    if (audience === 'developers') return DeveloperOffer;
    if (audience === 'suppliers') return SupplierOffer;
    if (audience === 'transporters') return TransporterOffer;
    return PartnerOffer;
  }, [audience]);

  const Emails = useMemo(() => {
    if (audience === 'investors') return InvestorEmails;
    if (audience === 'developers') return DeveloperEmails;
    if (audience === 'suppliers') return SupplierEmails;
    if (audience === 'transporters') return TransporterEmails;
    return PartnerEmails;
  }, [audience]);

  const handleLogAndCopy = async () => {
    if (!partner) return;

    const contentId = `engage-content-${activeTab}`;
    const contentElement = document.getElementById(contentId);

    if (!contentElement) {
        toast({ variant: 'destructive', title: "Content Error", description: "Could not find the content to copy." });
        return;
    }

    setIsProcessing(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        
        // 1. Log the outreach in CRM
        await performAdminAction(token, 'logCommunication', {
            partnerId: partner.id,
            type: 'Email',
            subject: activeTab,
            notes: `Personalized engagement content generated and copied for ${partner.firstName}.`,
        });

        // 2. Prepare HTML for clipboard
        const contentClone = contentElement.cloneNode(true) as HTMLElement;
        const images = contentClone.querySelectorAll('img');
        images.forEach(img => {
            if (img.src.startsWith('/')) {
                img.src = `${window.location.origin}${img.src}`;
            }
        });

        // 3. Append Tracking Pixel
        const trackingPixel = document.createElement('img');
        trackingPixel.src = `${window.location.origin}/api/trackEmailOpen/${partner.id}`;
        trackingPixel.width = 1;
        trackingPixel.height = 1;
        trackingPixel.style.display = 'none';
        contentClone.appendChild(trackingPixel);

        // 4. Copy to Clipboard
        const blob = new Blob([contentClone.innerHTML], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({ 'text/html': blob });
        await navigator.clipboard.write([clipboardItem]);

        toast({ title: 'Logged & Copied!', description: `HTML content for ${partner.firstName} is ready to paste into your email client.` });
        onOpenChange(false);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleWhatsAppCopy = async () => {
      if (!partner) return;
      setIsProcessing(true);
      try {
          const token = await getClientSideAuthToken();
          if (!token) throw new Error("Auth failed.");

          const baseUrl = window.location.origin;
          const signupUrl = `${baseUrl}/join?ref=${partner.id}&firstName=${encodeURIComponent(partner.firstName)}&lastName=${encodeURIComponent(partner.lastName)}&email=${encodeURIComponent(partner.email || '')}`;
          
          const text = `Hi ${partner.firstName}, I wanted to share this opportunity with you from Logistics Flow. You can review the details and join our network here: ${signupUrl}`;
          
          await performAdminAction(token, 'logCommunication', {
              partnerId: partner.id,
              type: 'WhatsApp',
              subject: 'WhatsApp Invitation',
              notes: 'Engagement link sent via WhatsApp text copy.',
          });

          await navigator.clipboard.writeText(text);
          toast({ title: 'WhatsApp Text Copied!', description: 'You can now paste this message into WhatsApp.' });
          onOpenChange(false);
      } catch (e: any) {
          toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
      } finally {
          setIsProcessing(false);
      }
  }

  if (!partner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-6 border-b bg-muted/50">
                <div className="flex justify-between items-start">
                    <div>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Send className="h-6 w-6 text-primary" />
                            Initiate Engagement: {partner.firstName} {partner.lastName}
                        </DialogTitle>
                        <DialogDescription className="mt-1">
                            {audienceLabel} from {partner.companyName || 'N/A'} • {partner.email || 'No Email'}
                        </DialogDescription>
                    </div>
                    <div className="flex gap-2">
                         <Button variant="outline" size="sm" onClick={handleWhatsAppCopy} disabled={isProcessing}>
                            <MessageSquare className="mr-2 h-4 w-4 text-green-600" />
                            WhatsApp Text
                        </Button>
                        <Button size="sm" onClick={handleLogAndCopy} disabled={isProcessing || !partner.email}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Mail className="mr-2 h-4 w-4" />}
                            Log & Copy Email HTML
                        </Button>
                    </div>
                </div>
            </DialogHeader>

            <div className="flex-1 flex overflow-hidden">
                {/* Navigation Sidebar */}
                <div className="w-64 border-r bg-muted/20 p-4 space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 mb-4">Choose Document</h4>
                    {[
                        { id: 'company-profile', label: 'Company Profile' },
                        { id: 'tech-architecture', label: 'Tech Architecture' },
                        { id: 'revenue-model', label: 'Revenue Model' },
                        { id: 'offer', label: 'The Offer' },
                        { id: 'pitch', label: 'The Pitch' },
                        { id: 'framework', label: 'The Framework' },
                        { id: 'emails', label: 'Email Templates' },
                    ].map((tab) => (
                        <Button
                            key={tab.id}
                            variant={activeTab === tab.id ? "secondary" : "ghost"}
                            className="w-full justify-start font-medium"
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </Button>
                    ))}
                    
                    <div className="mt-10 p-4 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="flex items-center gap-2 text-xs font-bold text-primary mb-2">
                            <UserCheck className="h-3 w-3" /> PERSONALIZED
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Content is automatically personalized with {partner.firstName}'s details and unique referral tracking.
                        </p>
                    </div>
                </div>

                {/* Content Preview */}
                <Card className="flex-1 rounded-none border-0 shadow-none overflow-y-auto">
                    <CardContent className="p-8">
                         {activeTab === 'company-profile' && <div id="engage-content-company-profile"><CompanyProfile audience={audience} partner={partner} /></div>}
                         {activeTab === 'tech-architecture' && <div id="engage-content-tech-architecture"><TechArchitecture partner={partner} /></div>}
                         {activeTab === 'revenue-model' && <div id="engage-content-revenue-model"><RevenueModel partner={partner} /></div>}
                         {activeTab === 'offer' && <div id="engage-content-offer"><Offer partner={partner} /></div>}
                         {activeTab === 'pitch' && <div id="engage-content-pitch"><PitchDeck partner={partner} /></div>}
                         {activeTab === 'framework' && <div id="engage-content-framework"><Framework partner={partner} /></div>}
                         {activeTab === 'emails' && <div id="engage-content-emails"><Emails partner={partner} /></div>}
                    </CardContent>
                </Card>
            </div>
            
            <div className="p-4 border-t bg-muted/30 flex justify-between items-center text-xs text-muted-foreground px-6">
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-500"/> Tracking pixel included</span>
                    <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-500"/> Dynamic referral link</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                    <LinkIcon className="h-3 w-3" /> REF_ID: {partner.id}
                </div>
            </div>
        </DialogContent>
    </Dialog>
  );
}