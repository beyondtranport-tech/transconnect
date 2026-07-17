
'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Zap, ChevronLeft, ChevronRight, Send, ShieldCheck, ShieldAlert, CheckCircle2, MessageCircle, Smartphone, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
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

/**
 * UTILITY: HIERARCHICAL CONTACT RESOLVER (Email, Mobile, WhatsApp)
 */
function resolveContact(partner: any) {
    if (!partner) return { name: 'Partner', email: '', mobile: '', whatsapp: '' };

    const isValid = (val: any) => !!val && val !== 'N/A' && val !== 'null' && val !== 'None' && val.length > 5;

    let resolved = { 
        name: 'Partner', 
        email: '', 
        mobile: '', 
        whatsapp: partner.whatsapp || '' 
    };

    // 1. Marketing Manager (Primary)
    if (isValid(partner.marketingManager?.email)) {
        resolved.name = partner.marketingManager.name || 'Partner';
        resolved.email = partner.marketingManager.email;
        resolved.mobile = partner.marketingManager.mobile || partner.mobile || partner.phone || '';
    }
    // 2. CEO (Fallback)
    else if (isValid(partner.ceo?.email)) {
        resolved.name = partner.ceo.name || 'Partner';
        resolved.email = partner.ceo.email;
        resolved.mobile = partner.ceo.mobile || partner.mobile || partner.phone || '';
    }
    // 3. Legacy / General
    else {
        const legacyEmail = partner.email || partner.email_address || partner.contact_email;
        const legacyMobile = partner.mobile || partner.phone || partner.telephone_number || '';
        resolved.name = partner.contactPerson || partner.firstName || 'Partner';
        resolved.email = isValid(legacyEmail) ? legacyEmail : '';
        resolved.mobile = legacyMobile;
    }

    return resolved;
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

  const contact = useMemo(() => resolveContact(currentPartner), [currentPartner]);

  const normalizedAudience = useMemo(() => {
      let aud = audience.toLowerCase();
      if (aud.endsWith('s')) aud = aud.slice(0, -1);
      return aud;
  }, [audience]);

  const targetCollection = useMemo(() => {
      if (!currentPartner) return 'partners';
      return (currentPartner.source === 'Lead' || !currentPartner.type || currentPartner.type === 'lead') ? 'leads' : 'partners';
  }, [currentPartner]);

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
      if (activeTab === 'digital-handshake') label = `Digital Handshake`;
      return `Logistics Flow: ${label} for ${company}`;
  }

  const handleLogCopyAndLaunch = async (channel: 'outlook' | 'gmail' | 'whatsapp') => {
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

        let typeLabel = channel.charAt(0).toUpperCase() + channel.slice(1);

        await performAdminAction(token, 'logCommunication', {
            partnerId: currentPartner.id,
            type: typeLabel,
            subject: subjectLabel,
            notes: `Manual engagement launched via ${typeLabel}.`,
            collection: targetCollection
        });

        if (channel === 'whatsapp') {
            const rawText = contentElement.innerText || contentElement.textContent || '';
            // PRIORITY: Use dedicated whatsapp number if available
            const targetNumber = contact.whatsapp || contact.mobile;
            const cleanNumber = targetNumber.replace(/\s/g, '').replace(/^\+/, '').replace(/^0/, '27');
            const encodedText = encodeURIComponent(rawText);
            const waUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;
            
            toast({ title: "WhatsApp Prepared", description: "Interaction logged. Launching chat..." });
            window.open(waUrl, '_blank');
        } else {
            const wrappedHtml = `<div style="font-family: Calibri, sans-serif; font-size: 12pt; color: #000000; line-height: 1.2; text-align: left;">${contentElement.innerHTML}</div>`;
            await copyHtmlToClipboard(wrappedHtml);
            toast({ title: "Content Ready", description: `Interaction logged. Opening ${typeLabel}...` });

            if (channel === 'outlook') {
                window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(getSubject())}`;
            } else {
                window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${contact.email}&su=${encodeURIComponent(getSubject())}`, '_blank');
            }
        }
        
        if (onEngageSuccess) onEngageSuccess();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Engagement Failed', description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleAutomatedDispatch = async () => {
    if (!contact.email || !currentPartner) return;
    setIsDispatching(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Auth failed.");

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

        toast({ title: "Dispatch Successful", description: "Record updated with outreach tag." });
        if (onEngageSuccess) onEngageSuccess();
        
        if (partners.length > 1 && currentIndex < partners.length - 1) {
            setTimeout(nextRecord, 800);
        } else {
            setTimeout(() => onOpenChange(false), 1500);
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Dispatch Failed", description: e.message });
    } finally {
        setIsDispatching(false);
    }
  };

  const nextRecord = () => currentIndex < partners.length - 1 && setCurrentIndex(prev => prev + 1);
  const prevRecord = () => currentIndex > 0 && setCurrentIndex(prev => prev - 1);

  if (!currentPartner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 text-left overflow-hidden text-foreground">
            <DialogHeader className="p-6 border-b bg-muted/50">
                <div className="flex justify-between items-center text-left">
                    <div className="text-left space-y-1">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-left text-foreground">
                            <Send className="h-6 w-6 text-primary" />
                            Engagement Wizard: {contact.name}
                        </DialogTitle>
                        <div className="flex items-center gap-2 text-sm text-left">
                           <Badge variant="secondary" className="uppercase font-black text-[10px] tracking-widest">{audienceLabel}</Badge>
                           <span className="text-muted-foreground">•</span>
                           <span className={cn("font-medium", !contact.email ? "text-destructive" : "text-muted-foreground")}>{contact.email || 'No email'}</span>
                           <span className="text-muted-foreground mx-1">|</span>
                           <span className={cn("font-medium", !contact.mobile ? "text-destructive" : "text-muted-foreground")}>{contact.mobile || 'No mobile'}</span>
                           {contact.whatsapp && contact.whatsapp !== contact.mobile && (
                               <>
                                   <span className="text-muted-foreground mx-1">|</span>
                                   <span className="font-bold text-green-600 flex items-center gap-1"><Smartphone className="h-3 w-3"/>WhatsApp: {contact.whatsapp}</span>
                               </>
                           )}
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
                        <div className="flex gap-2">
                             <Button variant="outline" size="lg" className="h-12 px-4 font-bold gap-2 shadow-sm border-green-200 hover:bg-green-50 text-green-600" onClick={() => handleLogCopyAndLaunch('whatsapp')} disabled={isProcessing || isDispatching || (!contact.mobile && !contact.whatsapp)}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MessageCircle className="mr-2 h-4 w-4 text-green-600" />} WhatsApp
                            </Button>
                             <Button variant="outline" size="lg" className="h-12 px-4 font-bold gap-2 shadow-sm border-blue-200 hover:bg-blue-50 text-blue-600" onClick={() => handleLogCopyAndLaunch('outlook')} disabled={isProcessing || isDispatching || !contact.email}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Mail className="mr-2 h-4 w-4 text-blue-600" />} Outlook
                            </Button>
                            <Button size="lg" className="h-12 px-8 font-bold gap-2 shadow-lg bg-primary hover:bg-primary/90 text-white" onClick={handleAutomatedDispatch} disabled={isDispatching || isProcessing || !contact.email}>
                                {isDispatching ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4" />} Automated Dispatch
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogHeader>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-64 border-r bg-muted/10 p-4 space-y-4 overflow-y-auto text-left">
                    <Alert className="bg-amber-50 py-3 border-amber-200 shadow-sm text-left">
                        <ShieldAlert className="h-4 w-4 text-amber-600" />
                        <div className="ml-2 text-left">
                            <AlertTitle className="text-[10px] font-black uppercase tracking-widest text-amber-800">Dispatch Shield</AlertTitle>
                            <AlertDescription className="text-[9px] text-amber-700 leading-tight mt-1">Use **WhatsApp** for instant decision-maker access or **Automated Dispatch** to bypass spam filters.</AlertDescription>
                        </div>
                    </Alert>

                    <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 mb-2 block">Engagement Content</label>
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

                <div className="flex-1 overflow-y-auto bg-slate-50 p-8 text-left">
                    <div className="max-w-[850px] mx-auto space-y-8 text-left">
                        <div id={`engage-content-wrapper-${activeTab}`} className="bg-white p-12 rounded-lg shadow-sm border text-left min-h-full text-foreground">
                            <Suspense fallback={<div className="flex justify-center py-20 text-center"><Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" /></div>}>
                                {activeTab === 'digital-handshake' && <DigitalHandshake partner={currentPartner} audience={normalizedAudience} version={handshakeVersion} />}
                                {activeTab === 'company-profile' && <CompanyProfile audience={normalizedAudience} partner={currentPartner} />}
                                {activeTab === 'tech-architecture' && <TechArchitecture partner={currentPartner} />}
                                {activeTab === 'revenue-model' && <RevenueModel partner={currentPartner} />}
                                {activeTab === 'offer' && <Offer partner={currentPartner} />}
                                {activeTab === 'pitch' && <PitchDeck partner={currentPartner} />}
                                {activeTab === 'framework' && <Framework partner={currentPartner} />}
                            </Suspense>
                        </div>
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
  );
}
