'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Send, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { copyHtmlToClipboard, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  partners: any[]; // Array for wizard mode
  initialIndex?: number;
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

export function EngageDialog({ open, onOpenChange, partners, initialIndex = 0, audience, onEngageSuccess }: EngageDialogProps) {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [activeTab, setActiveTab] = useState('digital-handshake');
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync currentIndex with initialIndex when the dialog opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

  const currentPartner = useMemo(() => {
    if (!partners || partners.length === 0) return null;
    return partners[currentIndex] || partners[0];
  }, [partners, currentIndex]);

  const audienceLabel = useMemo(() => {
    if (audience === 'isa') return 'ISA Agent';
    if (audience === 'suppliers') return 'Supplier';
    if (audience === 'transporters') return currentPartner?.industrial_category || 'Transporter';
    if (audience === 'drivers') return 'Professional Driver';
    if (audience === 'finance') return 'Finance Partner';
    return audience.slice(0, -1).charAt(0).toUpperCase() + audience.slice(1, -1);
  }, [audience, currentPartner]);

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
      const company = currentPartner?.companyName || 'your business';
      const label = activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return `Logistics Flow: ${label} for ${company}`;
  }

  const handleLogCopyAndLaunch = async () => {
    if (!currentPartner) return;

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
            partnerId: currentPartner.id,
            type: 'Email',
            subject: subjectLabel,
            notes: `System generated engagement for ${currentPartner.firstName || ''} (${currentPartner.industrial_category || 'General'}).`,
            collection: (!currentPartner.type || currentPartner.type === 'lead') ? 'leads' : 'partners'
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
        const mailtoUrl = `mailto:${currentPartner.email}?subject=${encodeURIComponent(getSubject())}`;
        window.location.href = mailtoUrl;
        
        if (onEngageSuccess) onEngageSuccess();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Engagement Failed', description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const nextRecord = () => {
    if (currentIndex < partners.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevRecord = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (!currentPartner) return null;

  const partnerDisplayName = currentPartner.companyName || currentPartner.contactPerson || `${currentPartner.firstName || ''} ${currentPartner.lastName || ''}`.trim() || 'Partner';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 text-left overflow-hidden">
            <DialogHeader className="p-6 border-b bg-muted/50 text-left">
                <div className="flex justify-between items-center">
                    <div className="text-left text-foreground space-y-1">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Send className="h-6 w-6 text-primary" />
                            Engagement Wizard: {partnerDisplayName}
                        </DialogTitle>
                        <div className="flex items-center gap-2 text-sm">
                           <Badge variant="secondary" className="uppercase font-black text-[10px] tracking-widest">{audienceLabel}</Badge>
                           <span className="text-muted-foreground">•</span>
                           <span className="text-muted-foreground font-medium">{currentPartner.email || 'No email recorded'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {partners.length > 1 && (
                            <div className="flex items-center bg-background border rounded-lg p-1 mr-4 shadow-sm">
                                <Button variant="ghost" size="icon" onClick={prevRecord} disabled={currentIndex === 0}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="px-3 text-xs font-black uppercase tracking-tighter tabular-nums">
                                    {currentIndex + 1} / {partners.length}
                                </div>
                                <Button variant="ghost" size="icon" onClick={nextRecord} disabled={currentIndex === partners.length - 1}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <Button size="lg" className="h-12 px-8 font-bold gap-2 shadow-lg" onClick={handleLogCopyAndLaunch} disabled={isProcessing || !currentPartner.email}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ExternalLink className="mr-2 h-4 w-4" />}
                            Log, Copy & Open Email
                        </Button>
                    </div>
                </div>
            </DialogHeader>

            <div className="flex-1 flex overflow-hidden text-left text-foreground">
                <div className="w-64 border-r bg-muted/20 p-4 space-y-4 overflow-y-auto text-left">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 mb-2 block">Step 1: Selection</label>
                        {[
                            { id: 'digital-handshake', label: '0. Digital Handshake' },
                            { id: 'company-profile', label: '1. Company Profile' },
                            { id: 'tech-architecture', label: '2. Tech Architecture' },
                            { id: 'revenue-model', label: '3. Revenue Model' },
                            { id: 'offer', label: '4. The Offer' },
                            { id: 'pitch', label: '5. The Pitch' },
                            { id: 'framework', label: '6. The Framework' },
                            { id: 'emails', label: 'Reference: Emails' },
                        ].map((tab) => (
                            <Button
                                key={tab.id}
                                variant={activeTab === tab.id ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start font-medium text-left text-xs h-10 px-3",
                                    activeTab === tab.id && "bg-white shadow-sm ring-1 ring-primary/20"
                                )}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </Button>
                        ))}
                    </div>

                    {partners.length > 1 && (
                         <div className="pt-4 space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 mb-2 block">Step 2: Batch Queue</label>
                            <ScrollArea className="h-64 pr-2">
                                <div className="space-y-1">
                                    {partners.map((p, idx) => (
                                        <Button
                                            key={p.id}
                                            variant="ghost"
                                            className={cn(
                                                "w-full justify-start text-[10px] h-8 px-2 truncate",
                                                currentIndex === idx ? "bg-primary/10 text-primary font-bold" : "opacity-60"
                                            )}
                                            onClick={() => setCurrentIndex(idx)}
                                        >
                                            {currentIndex === idx ? <CheckCircle2 className="h-3 w-3 mr-1.5 shrink-0" /> : <div className="w-3 h-3 mr-1.5 rounded-full border shrink-0" />}
                                            {p.companyName || p.contactPerson || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Partner'}
                                        </Button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 p-8 text-left">
                    <div id={`engage-content-wrapper-${activeTab}`} className="bg-white p-12 rounded-lg shadow-sm border mx-auto max-w-[850px] text-left text-foreground min-h-full">
                        {activeTab === 'digital-handshake' && <DigitalHandshake partner={currentPartner} audience={audience} />}
                        {activeTab === 'company-profile' && <CompanyProfile audience={audience} partner={currentPartner} />}
                        {activeTab === 'tech-architecture' && <TechArchitecture partner={currentPartner} />}
                        {activeTab === 'revenue-model' && <RevenueModel partner={currentPartner} />}
                        {activeTab === 'offer' && <Offer partner={currentPartner} />}
                        {activeTab === 'pitch' && <PitchDeck partner={currentPartner} />}
                        {activeTab === 'framework' && <Framework partner={currentPartner} />}
                        {activeTab === 'emails' && <Emails partner={currentPartner} />}
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
  );
}
