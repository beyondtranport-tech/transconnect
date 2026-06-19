'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { copyHtmlToClipboard } from '@/lib/utils';

// Content components located in content/ sub-folder
import DigitalHandshake from './content/DigitalHandshake';
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
  audience: "partners" | "isa" | "transporters" | "suppliers" | "investors" | "developers" | "drivers" | "finance";
  onEngageSuccess?: () => void;
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

export function EngageDialog({ open, onOpenChange, partner, audience, onEngageSuccess }: EngageDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('digital-handshake');
  const [isProcessing, setIsProcessing] = useState(false);

  const audienceLabel = useMemo(() => {
    if (audience === 'isa') return 'ISA Agent';
    if (audience === 'suppliers') return 'Supplier';
    if (audience === 'transporters') return partner?.entryType || 'Transporter';
    if (audience === 'drivers') return 'Professional Driver';
    if (audience === 'finance') return 'Finance Partner';
    return audience.slice(0, -1).charAt(0).toUpperCase() + audience.slice(1, -1);
  }, [audience, partner]);

  const Offer = useMemo(() => {
    if (audience === 'investors' || audience === 'finance') return InvestorOffer;
    if (audience === 'developers') return DeveloperOffer;
    if (audience === 'suppliers') return SupplierOffer;
    if (audience === 'transporters') return TransporterOffer;
    return PartnerOffer;
  }, [audience]);

  const Emails = useMemo(() => {
    if (audience === 'investors' || audience === 'finance') return InvestorEmails;
    if (audience === 'developers') return DeveloperEmails;
    if (audience === 'suppliers') return SupplierEmails;
    if (audience === 'transporters') return TransporterEmails;
    return PartnerEmails;
  }, [audience]);

  const getSubject = () => {
      const company = partner?.companyName || 'your business';
      const label = activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return `Logistics Flow: ${label} for ${company}`;
  }

  const handleLogCopyAndLaunch = async () => {
    if (!partner) return;

    const contentId = `engage-content-wrapper-${activeTab}`;
    const contentElement = document.getElementById(contentId);

    if (!contentElement) {
        toast({ variant: 'destructive', title: "Content Error", description: "Could not find content tab." });
        return;
    }

    setIsProcessing(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Auth failed.");
        
        const subjectLabel = activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        // 1. Log communication
        await performAdminAction(token, 'logCommunication', {
            partnerId: partner.id,
            type: 'Email',
            subject: subjectLabel,
            notes: `System generated engagement for ${partner.firstName} (${partner.entryType || 'General'}).`,
        });

        // 2. Prepare HTML for clipboard
        const contentClone = contentElement.cloneNode(true) as HTMLElement;
        const origin = window.location.origin;
        
        const images = contentClone.querySelectorAll('img');
        images.forEach(img => {
            const src = img.getAttribute('src');
            if (src?.startsWith('/')) img.src = `${origin}${src}`;
        });

        const wrappedHtml = `<div style="font-family: Calibri, sans-serif; font-size: 12pt; color: #000000; line-height: 1.2; text-align: left;">${contentClone.innerHTML}</div>`;

        // 3. Copy HTML
        const success = await copyHtmlToClipboard(wrappedHtml);
        if (!success) throw new Error("Clipboard failed.");

        toast({ title: "Content Ready", description: "Interaction logged and formatted HTML copied to clipboard." });

        // 4. Launch Client
        const mailtoUrl = `mailto:${partner.email}?subject=${encodeURIComponent(getSubject())}`;
        window.location.href = mailtoUrl;
        
        if (onEngageSuccess) onEngageSuccess();
        onOpenChange(false);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Engagement Failed', description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };

  if (!partner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 text-left">
            <DialogHeader className="p-6 border-b bg-muted/50 text-left">
                <div className="flex justify-between items-start">
                    <div className="text-left">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Send className="h-6 w-6 text-primary" />
                            Engagement: {partner.firstName} {partner.lastName}
                        </DialogTitle>
                        <DialogDescription className="mt-1">
                            {audienceLabel} • {partner.companyName || 'N/A'}
                        </DialogDescription>
                    </div>
                    <Button size="lg" onClick={handleLogCopyAndLaunch} disabled={isProcessing || !partner.email}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ExternalLink className="mr-2 h-4 w-4" />}
                        Log, Copy & Open Email
                    </Button>
                </div>
            </DialogHeader>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-64 border-r bg-muted/20 p-4 space-y-2 text-left">
                    {[
                        { id: 'digital-handshake', label: 'Digital Handshake' },
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
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 p-8 text-left">
                    <div id={`engage-content-wrapper-${activeTab}`} className="bg-white p-8 rounded-lg shadow-sm border mx-auto max-w-[800px] text-left">
                        {activeTab === 'digital-handshake' && <DigitalHandshake partner={partner} />}
                        {activeTab === 'company-profile' && <CompanyProfile audience={audience} partner={partner} />}
                        {activeTab === 'tech-architecture' && <TechArchitecture partner={partner} />}
                        {activeTab === 'revenue-model' && <RevenueModel partner={partner} />}
                        {activeTab === 'offer' && <Offer partner={partner} />}
                        {activeTab === 'pitch' && <PitchDeck partner={partner} />}
                        {activeTab === 'framework' && <Framework partner={partner} />}
                        {activeTab === 'emails' && <Emails partner={partner} />}
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
  );
}
