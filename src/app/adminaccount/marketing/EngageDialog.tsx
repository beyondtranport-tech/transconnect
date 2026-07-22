'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Zap, Send, ShieldCheck, MessageCircle, Smartphone, Info, ChevronRight, ChevronLeft, Target, Ban, Filter, MousePointer2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { copyHtmlToClipboard, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Content components
import DigitalHandshake from './content/DigitalHandshake';
import CompanyProfile from './content/CompanyProfile';
import TechArchitecture from './content/TechArchitecture';
import RevenueModel from './content/RevenueModel';
import PitchDeck from './content/PitchDeck';
import Framework from './content/Framework';
import SalesIntelligence from './content/SalesIntelligence';

// Tactical modules
import TheWedge from './content/TheWedge';
import TheSignal from './content/TheSignal';
import TheEliteFilter from './content/TheEliteFilter';
import TheBreakUp from './content/TheBreakUp';

// Offers
import PartnerOffer from './offers/PartnerOffer';
import InvestorOffer from './offers/InvestorOffer';
import DeveloperOffer from './offers/DeveloperOffer';
import SupplierOffer from './offers/SupplierOffer';
import TransporterOffer from './offers/TransporterOffer';
import AssociateOffer from './offers/AssociateOffer';

interface EngageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partners: any[]; 
  initialIndex?: number;
  audience: string;
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
    if (!response.ok || !result.success) throw new Error(result.error || `API Error for action: ${action}`);
    return result;
}

function resolveContact(partner: any) {
    if (!partner) return { name: 'Partner', email: '', mobile: '', whatsapp: '' };

    const clean = (val: any) => {
        if (!val) return '';
        const v = String(val).trim();
        const low = v.toLowerCase();
        const forbidden = ['n/a', 'null', 'none', 'locked', 'undefined', '[locked]', 'no email', 'no phone', 'pending'];
        if (!v || forbidden.some(f => low === f) || low.includes('locked@')) return '';
        return v;
    };

    const searchObj = (obj: any, keys: string[]): string => {
        if (!obj || typeof obj !== 'object') return '';
        for (const k of keys) if (obj[k]) { const c = clean(obj[k]); if (c) return c; }
        return '';
    };

    const emailKeys = ['email', 'email_address', 'contact_email', 'mail'];
    const phoneKeys = ['mobile', 'whatsapp', 'phone', 'cell'];

    const name = clean(partner.marketingManager?.name || partner.ceo?.name || partner.contactPerson || partner.firstName || partner.companyName || 'Partner');
    const email = searchObj(partner.marketingManager, emailKeys) || searchObj(partner.ceo, emailKeys) || searchObj(partner, emailKeys) || clean(partner.email);
    const mobile = searchObj(partner.marketingManager, phoneKeys) || searchObj(partner.ceo, phoneKeys) || searchObj(partner, phoneKeys) || clean(partner.mobile || partner.phone);
    const whatsapp = clean(partner.whatsapp) || mobile;

    return { name, email, mobile, whatsapp };
}

export function EngageDialog({ open, onOpenChange, partners, initialIndex = 0, audience, onEngageSuccess }: EngageDialogProps) {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [activeTab, setActiveTab] = useState('digital-handshake');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);

  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  const currentPartner = useMemo(() => {
    if (!partners || partners.length === 0) return null;
    return partners[currentIndex] || partners[0];
  }, [partners, currentIndex]);

  const contact = useMemo(() => resolveContact(currentPartner), [currentPartner]);
  const hasEmail = contact.email.length > 3; 
  const hasPhone = contact.whatsapp.length > 5;

  const normalizedAudience = useMemo(() => {
      let aud = (audience || 'partner').toLowerCase();
      if (aud.endsWith('s')) aud = aud.slice(0, -1);
      return aud;
  }, [audience]);

  const targetCollection = useMemo(() => {
      if (!currentPartner) return 'partners';
      return (currentPartner.source === 'Lead' || !currentPartner.type || currentPartner.type === 'lead') ? 'leads' : 'partners';
  }, [currentPartner]);

  const getSubject = () => {
      const company = currentPartner?.companyName || 'your business';
      let label = activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return `Logistics Flow: ${label} for ${company}`;
  }

  const handleLogAndLaunch = async (channel: 'outlook' | 'whatsapp') => {
    if (!currentPartner) return;
    const contentId = `engage-content-wrapper-${activeTab}`;
    const contentElement = document.getElementById(contentId);
    if (!contentElement) return;

    setIsProcessing(true);
    try {
        const token = (await getClientSideAuthToken()) || '';
        if (!token) throw new Error("Authentication failed.");
        
        await performAdminAction(token, 'logCommunication', {
            partnerId: currentPartner.id,
            type: channel === 'whatsapp' ? 'WhatsApp' : 'Email',
            subject: activeTab.split('-').join(' ').toUpperCase(),
            notes: `Manual engagement launched via ${channel}.`,
            collection: targetCollection
        });

        if (channel === 'whatsapp') {
            const rawText = contentElement.innerText || contentElement.textContent || '';
            const cleanNumber = contact.whatsapp.replace(/\s/g, '').replace(/^\+/, '').replace(/^0/, '27');
            window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(rawText)}`, '_blank');
        } else {
            const wrappedHtml = `<div style="font-family: Calibri, sans-serif; font-size: 12pt;">${contentElement.innerHTML}</div>`;
            await copyHtmlToClipboard(wrappedHtml);
            window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(getSubject())}`;
        }
        
        if (onEngageSuccess) onEngageSuccess();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleAutomatedDispatch = async () => {
    if (!currentPartner) return;
    setIsDispatching(true);
    try {
        const token = (await getClientSideAuthToken()) || '';
        if (!token) throw new Error("Session expired.");
        
        const contentId = `engage-content-wrapper-${activeTab}`;
        const contentElement = document.getElementById(contentId);
        if (!contentElement) throw new Error("Content not found.");

        await performAdminAction(token, 'dispatchEngagement', {
            partnerId: currentPartner.id,
            email: contact.email,
            subject: getSubject(),
            html: contentElement.innerHTML,
            collection: targetCollection
        });

        toast({ title: "Dispatch Successful" });
        if (onEngageSuccess) onEngageSuccess();
        
        if (partners.length > 1 && currentIndex < partners.length - 1) {
            setTimeout(() => setCurrentIndex(prev => prev + 1), 800);
        } else {
            setTimeout(() => onOpenChange(false), 1500);
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Dispatch Failed", description: e.message });
    } finally {
        setIsDispatching(false);
    }
  };

  if (!currentPartner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 text-left overflow-hidden text-foreground">
            <DialogHeader className="p-6 border-b bg-muted/50">
                <div className="flex justify-between items-center text-foreground">
                    <div className="text-left space-y-1">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Send className="h-6 w-6 text-primary" />
                            Engagement Hub: {contact.name}
                        </DialogTitle>
                        <div className="flex items-center gap-3 text-sm text-foreground text-left">
                           <Badge variant="secondary" className="uppercase font-black text-[10px] tracking-widest">{normalizedAudience}</Badge>
                           <div className="flex items-center gap-2 text-muted-foreground">
                               <Mail className={cn("h-3.5 w-3.5", hasEmail && "text-blue-600")} />
                               <span className={cn("font-medium", !hasEmail && "text-destructive italic")}>{contact.email || 'Address Missing'}</span>
                           </div>
                           <div className="flex items-center gap-2 text-muted-foreground border-l pl-3">
                               <Smartphone className={cn("h-3.5 w-3.5", hasPhone && "text-green-600")} />
                               <span className={cn("font-bold", hasPhone && "text-green-600")}>{contact.whatsapp || 'Number Missing'}</span>
                           </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="font-bold border-green-200 text-green-600 hover:bg-green-50" onClick={() => handleLogAndLaunch('whatsapp')} disabled={isProcessing || !hasPhone}>
                            <Smartphone className="mr-2 h-4 w-4" /> WhatsApp
                        </Button>
                        <Button variant="outline" className="font-bold border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => handleLogAndLaunch('outlook')} disabled={isProcessing || !hasEmail}>
                            <Mail className="mr-2 h-4 w-4" /> Outlook
                        </Button>
                        <Button className="font-bold shadow-lg text-white" onClick={handleAutomatedDispatch} disabled={isDispatching || !hasEmail}>
                            {isDispatching ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4" />} Automated Dispatch
                        </Button>
                    </div>
                </div>
            </DialogHeader>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-64 border-r bg-muted/10 p-4 space-y-4 overflow-y-auto">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 mb-2 block">Standard Narrative</Label>
                        {[
                            { id: 'digital-handshake', label: '0. Digital Handshake' },
                            { id: 'company-profile', label: '1. Company Profile' },
                            { id: 'tech-architecture', label: '2. Tech Architecture' },
                            { id: 'revenue-model', label: '3. Revenue Model' },
                            { id: 'offer', label: '4. The Offer' },
                            { id: 'pitch', label: '5. The Pitch' },
                            { id: 'framework', label: '6. The Framework' },
                            { id: 'sales-intelligence', label: '7. Sales Intelligence' },
                        ].map((tab) => (
                            <Button
                                key={tab.id}
                                variant={activeTab === tab.id ? "secondary" : "ghost"}
                                className={cn("w-full justify-start text-xs h-10 px-3", activeTab === tab.id && "bg-white shadow-sm")}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </Button>
                        ))}
                    </div>

                    <Separator />

                    <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary px-2 mb-2 block flex items-center gap-2">
                            <Zap className="h-3 w-3" /> Tactical Sequences
                        </Label>
                        {[
                            { id: 'the-wedge', label: 'The Wedge (Gap)', icon: Target },
                            { id: 'the-signal', label: 'The Signal (Interest)', icon: MousePointer2 },
                            { id: 'the-elite-filter', label: 'The Elite Filter', icon: Filter },
                            { id: 'the-break-up', label: 'The Break-Up', icon: Ban },
                        ].map((tab) => (
                            <Button
                                key={tab.id}
                                variant={activeTab === tab.id ? "secondary" : "ghost"}
                                className={cn("w-full justify-start text-xs h-10 px-3 transition-all", activeTab === tab.id && "bg-white shadow-sm ring-1 ring-primary/20")}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <tab.icon className="h-3.5 w-3.5 mr-2 text-primary" />
                                {tab.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
                    <div id={`engage-content-wrapper-${activeTab}`} className="bg-white p-10 rounded-lg shadow-sm border min-h-full">
                        <Suspense fallback={<Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />}>
                            {activeTab === 'digital-handshake' && <DigitalHandshake partner={currentPartner} audience={normalizedAudience} />}
                            {activeTab === 'company-profile' && <CompanyProfile audience={normalizedAudience} partner={currentPartner} />}
                            {activeTab === 'tech-architecture' && <TechArchitecture partner={currentPartner} />}
                            {activeTab === 'revenue-model' && <RevenueModel partner={currentPartner} />}
                            {activeTab === 'offer' && (
                                normalizedAudience === 'supplier' ? <SupplierOffer /> :
                                normalizedAudience === 'transporter' ? <TransporterOffer /> :
                                <PartnerOffer />
                            )}
                            {activeTab === 'pitch' && <PitchDeck partner={currentPartner} />}
                            {activeTab === 'framework' && <Framework partner={currentPartner} />}
                            {activeTab === 'sales-intelligence' && <SalesIntelligence partner={currentPartner} />}
                            
                            {/* Tactical Renderers */}
                            {activeTab === 'the-wedge' && <TheWedge partner={currentPartner} audience={normalizedAudience} />}
                            {activeTab === 'the-signal' && <TheSignal partner={currentPartner} />}
                            {activeTab === 'the-elite-filter' && <TheEliteFilter partner={currentPartner} />}
                            {activeTab === 'the-break-up' && <TheBreakUp partner={currentPartner} />}
                        </Suspense>
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
  );
}

