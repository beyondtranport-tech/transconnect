'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Zap, ChevronLeft, ChevronRight, Send, ShieldCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { copyHtmlToClipboard, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Content components
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
import AssociateOffer from './offers/AssociateOffer';

// Emails
import PartnerEmails from './emails/PartnerEmails';
import SupplierEmails from './emails/SupplierEmails';
import TransporterEmails from './emails/TransporterEmails';
import InvestorEmails from './emails/InvestorEmails';
import DeveloperEmails from './emails/DeveloperEmails';
import AssociateEmails from './emails/AssociateEmails';

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
    if (!response.ok || !result.success) throw new Error(result.error || `API Error: ${action}`);
    return result;
}

export function EngageDialog({ open, onOpenChange, partners, initialIndex = 0, audience, onEngageSuccess }: EngageDialogProps) {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [activeTab, setActiveTab] = useState('digital-handshake');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [handshakeVersion, setHandshakeVersion] = useState('v1');

  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  const currentPartner = useMemo(() => {
    if (!partners || partners.length === 0) return null;
    return partners[currentIndex] || partners[0];
  }, [partners, currentIndex]);

  const currentEmail = useMemo(() => {
      if (!currentPartner) return '';
      return currentPartner.email || 
             currentPartner.email_address || 
             currentPartner.emailAddress || 
             currentPartner.contact_email || 
             '';
  }, [currentPartner]);

  const normalizedAudience = useMemo(() => {
      let aud = audience.toLowerCase();
      if (aud.endsWith('s')) aud = aud.slice(0, -1);
      return aud;
  }, [audience]);

  const audienceLabel = useMemo(() => {
    if (normalizedAudience === 'isa') return 'ISA Agent';
    if (normalizedAudience === 'supplier') return 'Supplier';
    if (normalizedAudience === 'transporter') return currentPartner?.industrial_category || 'Transporter';
    if (normalizedAudience === 'driver') return 'Professional Driver';
    if (normalizedAudience === 'finance') return 'Finance Partner';
    if (normalizedAudience === 'associate') return 'Associate';
    return audience.charAt(0).toUpperCase() + audience.slice(1);
  }, [normalizedAudience, currentPartner, audience]);

  const Offer = useMemo(() => {
    if (normalizedAudience === 'investor' || normalizedAudience === 'finance') return InvestorOffer;
    if (normalizedAudience === 'developer') return DeveloperOffer;
    if (normalizedAudience === 'supplier') return SupplierOffer;
    if (normalizedAudience === 'transporter') return TransporterOffer;
    if (normalizedAudience === 'associate') return AssociateOffer;
    return PartnerOffer;
  }, [normalizedAudience]);

  const Emails = useMemo(() => {
    if (normalizedAudience === 'investor' || normalizedAudience === 'finance') return InvestorEmails;
    if (normalizedAudience === 'developer') return DeveloperEmails;
    if (normalizedAudience === 'supplier') return SupplierEmails;
    if (normalizedAudience === 'transporter') return TransporterEmails;
    if (normalizedAudience === 'associate') return AssociateEmails;
    return PartnerEmails;
  }, [normalizedAudience]);

  const getSubject = () => {
      const company = currentPartner?.companyName || currentPartner?.company_name || 'your business';
      let label = activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (activeTab === 'digital-handshake') label = `Digital Handshake (${handshakeVersion.toUpperCase()})`;
      return `Logistics Flow: ${label} for ${company}`;
  }

  const handleLogCopyAndLaunch = async (channel: 'outlook' | 'gmail') => {
    if (!currentPartner) return;
    const contentId = `engage-content-wrapper-${activeTab}`;
    const contentElement = document.getElementById(contentId);
    if (!contentElement) return;

    setIsProcessing(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Auth failed.");
        
        let subjectLabel = activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (activeTab === 'digital-handshake') subjectLabel = `Handshake ${handshakeVersion.toUpperCase()}`;

        await performAdminAction(token, 'logCommunication', {
            partnerId: currentPartner.id,
            type: channel === 'outlook' ? 'Outlook' : 'Gmail',
            subject: subjectLabel,
            notes: `Manual engagement launched via ${channel}.`,
            collection: (!currentPartner.type || currentPartner.type === 'lead') ? 'leads' : 'partners'
        });

        const wrappedHtml = `<div style="font-family: Calibri, sans-serif; font-size: 12pt; color: #000000; line-height: 1.2; text-align: left;">${contentElement.innerHTML}</div>`;
        await copyHtmlToClipboard(wrappedHtml);
        toast({ title: "Content Ready", description: `Interaction logged. Opening ${channel}...` });

        if (channel === 'outlook') {
            window.location.href = `mailto:${currentEmail}?subject=${encodeURIComponent(getSubject())}`;
        } else {
            window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${currentEmail}&su=${encodeURIComponent(getSubject())}`, '_blank');
        }
        if (onEngageSuccess) onEngageSuccess();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Engagement Failed', description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleAutomatedDispatch = async () => {
    if (!currentEmail) return;
    setIsDispatching(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Auth failed.");

        const contentId = `engage-content-wrapper-${activeTab}`;
        const contentElement = document.getElementById(contentId);
        if (!contentElement) throw new Error("Content not found.");

        await performAdminAction(token, 'dispatchEngagement', {
            partnerId: currentPartner.id,
            email: currentEmail,
            subject: getSubject(),
            html: contentElement.innerHTML,
            audience
        });

        toast({ title: "Dispatch Successful" });
        if (onEngageSuccess) onEngageSuccess();
        if (partners.length > 1 && currentIndex < partners.length - 1) setTimeout(nextRecord, 500);
        else setTimeout(() => onOpenChange(false), 1000);
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Dispatch Failed", description: e.message });
    } finally {
        setIsDispatching(false);
    }
  };

  const nextRecord = () => currentIndex < partners.length - 1 && setCurrentIndex(prev => prev + 1);
  const prevRecord = () => currentIndex > 0 && setCurrentIndex(prev => prev - 1);

  if (!currentPartner) return null;

  const partnerDisplayName = currentPartner.companyName || currentPartner.company_name || currentPartner.contactPerson || `${currentPartner.firstName || ''} ${currentPartner.lastName || ''}`.trim() || 'Partner';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 text-left overflow-hidden text-foreground">
            <DialogHeader className="p-6 border-b bg-muted/50">
                <div className="flex justify-between items-center text-left">
                    <div className="text-left space-y-1">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-left text-foreground">
                            <Send className="h-6 w-6 text-primary" />
                            Engagement Wizard: {partnerDisplayName}
                        </DialogTitle>
                        <div className="flex items-center gap-2 text-sm text-left">
                           <Badge variant="secondary" className="uppercase font-black text-[10px] tracking-widest">{audienceLabel}</Badge>
                           <span className="text-muted-foreground">•</span>
                           <span className={cn("font-medium", !currentEmail ? "text-destructive" : "text-muted-foreground")}>{currentEmail || 'No email recorded'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-left">
                        {partners.length > 1 && (
                            <div className="flex items-center bg-background border rounded-lg p-1 mr-4 shadow-sm">
                                <Button variant="ghost" size="icon" onClick={prevRecord} disabled={currentIndex === 0}><ChevronLeft className="h-4 w-4" /></Button>
                                <div className="px-3 text-xs font-black uppercase tracking-tighter tabular-nums">{currentIndex + 1} / {partners.length}</div>
                                <Button variant="ghost" size="icon" onClick={nextRecord} disabled={currentIndex === partners.length - 1}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        )}
                        <div className="flex gap-2 text-white">
                             <Button variant="outline" size="lg" className="h-12 px-4 font-bold gap-2 shadow-sm border-blue-200 hover:bg-blue-50 text-blue-600" onClick={() => handleLogCopyAndLaunch('outlook')} disabled={isProcessing || isDispatching || !currentEmail}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Mail className="mr-2 h-4 w-4 text-blue-600" />} Outlook
                            </Button>
                            <Button size="lg" className="h-12 px-8 font-bold gap-2 shadow-lg bg-primary hover:bg-primary/90 text-white" onClick={handleAutomatedDispatch} disabled={isDispatching || isProcessing || !currentEmail}>
                                {isDispatching ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4" />} Automated Dispatch
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogHeader>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-64 border-r bg-muted/10 p-4 space-y-4 overflow-y-auto text-left">
                    <Alert className="bg-amber-50 py-3 border-amber-200 shadow-sm text-left text-foreground">
                        <ShieldAlert className="h-4 w-4 text-amber-600" />
                        <div className="ml-2 text-left">
                            <AlertTitle className="text-[10px] font-black uppercase tracking-widest text-amber-800">Anti-Spam Shield</AlertTitle>
                            <AlertDescription className="text-[9px] text-amber-700 leading-tight mt-1">Use **Automated Dispatch** to route mail through SendGrid API. This bypasses local blocks.</AlertDescription>
                        </div>
                    </Alert>

                    <div className="space-y-1 text-left text-foreground">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 mb-2 block">Step 1: Selection</label>
                        {[
                            { id: 'digital-handshake', label: '0. Digital Handshake' },
                            { id: 'company-profile', label: '1. Company Profile' },
                            { id: 'tech-architecture', label: '2. Tech Architecture' },
                            { id: 'revenue-model', label: '3. Revenue Model' },
                            { id: 'offer', label: '4. The Offer' },
                            { id: 'pitch', label: '5. The Pitch' },
                            { id: 'framework', label: '6. The Framework' },
                        ].map((tab) => (
                            <Button
                                key={tab.id}
                                variant={activeTab === tab.id ? "secondary" : "ghost"}
                                className={cn("w-full justify-start font-medium text-left text-xs h-10 px-3", activeTab === tab.id && "bg-white shadow-sm ring-1 ring-primary/20")}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 p-8 text-left text-foreground">
                    <div className="max-w-[850px] mx-auto space-y-8 text-left text-foreground">
                        {activeTab === 'digital-handshake' && (
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between mb-4 shadow-sm text-left">
                                <div className="flex items-center gap-3 text-left">
                                    <div className="bg-amber-100 p-2 rounded-lg"><Zap className="h-5 w-5 text-amber-600" /></div>
                                    <div className="text-left text-foreground text-foreground">
                                        <p className="text-sm font-bold text-amber-900">Pattern Randomization</p>
                                        <p className="text-[10px] text-amber-700 leading-none mt-1">Deterministically unique text per partner.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-left text-foreground">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-amber-800">Version</Label>
                                    <Select value={handshakeVersion} onValueChange={setHandshakeVersion}>
                                        <SelectTrigger className="w-[200px] h-9 bg-white border-amber-200"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="v1">V1: Standard (Low Friction)</SelectItem>
                                            <SelectItem value="v2">V2: Market Access</SelectItem>
                                            <SelectItem value="v3">V3: Financial Security</SelectItem>
                                            <SelectItem value="v4">V4: Technical Power</SelectItem>
                                            <SelectItem value="v5">V5: Ecosystem Partner (Max)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <div id={`engage-content-wrapper-${activeTab}`} className="bg-white p-12 rounded-lg shadow-sm border text-left min-h-full text-foreground">
                            {activeTab === 'digital-handshake' && <DigitalHandshake partner={currentPartner} audience={normalizedAudience} version={handshakeVersion} />}
                            {activeTab === 'company-profile' && <CompanyProfile audience={normalizedAudience} partner={currentPartner} />}
                            {activeTab === 'tech-architecture' && <TechArchitecture partner={currentPartner} />}
                            {activeTab === 'revenue-model' && <RevenueModel partner={currentPartner} />}
                            {activeTab === 'offer' && <Offer partner={currentPartner} />}
                            {activeTab === 'pitch' && <PitchDeck partner={currentPartner} />}
                            {activeTab === 'framework' && <Framework partner={currentPartner} />}
                        </div>
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
  );
}
