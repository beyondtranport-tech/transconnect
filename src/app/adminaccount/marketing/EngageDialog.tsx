'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Mail, MessageSquare, UserCheck, CheckCircle, Link as LinkIcon, Send, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { copyHtmlToClipboard } from '@/lib/utils';

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

  const getSubject = () => {
      const company = partner?.companyName || 'your business';
      switch(activeTab) {
          case 'company-profile': return `Logistics Flow: Company Profile for ${company}`;
          case 'tech-architecture': return `Digital Ecosystem: Tech Architecture for ${company}`;
          case 'revenue-model': return `Growth Opportunity: Revenue Model for ${company}`;
          case 'offer': return `Strategic Offer for ${company}`;
          case 'pitch': return `The Logistics Flow Pitch for ${company}`;
          case 'framework': return `Partnership Framework for ${company}`;
          default: return `Engagement from Logistics Flow`;
      }
  }

  const handleLogCopyAndLaunch = async () => {
    if (!partner) return;

    const contentId = `engage-content-wrapper-${activeTab}`;
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
            notes: `Personalized rich-HTML engagement content generated and copied for ${partner.firstName}. Email client launched.`,
        });

        // 2. Prepare HTML for clipboard with INLINE STYLES for email compatibility
        const contentClone = contentElement.cloneNode(true) as HTMLElement;
        
        // Convert tailwind utility classes to inline styles for Outlook/Gmail compatibility
        const applyInlineStyles = (el: HTMLElement) => {
            if (!el.classList) return;
            const hasClass = (cls: string) => el.classList.contains(cls);
            let style = el.getAttribute('style') || '';

            if (hasClass('border')) style += 'border: 1px solid #e2e8f0;';
            if (hasClass('rounded-xl')) style += 'border-radius: 0.75rem;';
            if (hasClass('rounded-lg')) style += 'border-radius: 0.5rem;';
            if (hasClass('rounded-md')) style += 'border-radius: 0.375rem;';
            if (hasClass('bg-white')) style += 'background-color: #ffffff;';
            if (hasClass('bg-slate-50')) style += 'background-color: #f8fafc;';
            if (hasClass('bg-muted/50')) style += 'background-color: #f1f5f9;';
            if (hasClass('bg-primary/5')) style += 'background-color: #f0fdf4;';
            if (hasClass('bg-primary/10')) style += 'background-color: #dcfce7;';
            if (hasClass('p-4')) style += 'padding: 1rem;';
            if (hasClass('p-6')) style += 'padding: 1.5rem;';
            if (hasClass('p-8')) style += 'padding: 2rem;';
            if (hasClass('mb-4')) style += 'margin-bottom: 1rem;';
            if (hasClass('mt-4')) style += 'margin-top: 1rem;';
            if (hasClass('text-primary')) style += 'color: #228B22;';
            if (hasClass('text-muted-foreground')) style += 'color: #64748b;';
            if (hasClass('font-bold')) style += 'font-weight: 700;';
            if (hasClass('font-semibold')) style += 'font-weight: 600;';
            if (hasClass('text-lg')) style += 'font-size: 1.125rem;';
            if (hasClass('text-xl')) style += 'font-size: 1.25rem;';
            if (hasClass('text-2xl')) style += 'font-size: 1.5rem;';
            if (hasClass('shadow-sm')) style += 'box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);';

            if (style) el.setAttribute('style', style);
            Array.from(el.children).forEach(child => applyInlineStyles(child as HTMLElement));
        };

        applyInlineStyles(contentClone);

        const images = contentClone.querySelectorAll('img');
        const origin = window.location.origin.includes('localhost') ? 'https://studio--ecosystem-hub.us-central1.hosted.app' : window.location.origin;
        images.forEach(img => {
            const src = img.getAttribute('src');
            if (src?.startsWith('/')) {
                img.src = `${origin}${src}`;
            } else if (src?.startsWith('http://localhost')) {
                img.src = src.replace('http://localhost:3000', origin);
            }
        });

        const trackingPixel = document.createElement('img');
        trackingPixel.src = `${origin}/api/trackEmailOpen/${partner.id}`;
        trackingPixel.width = 1;
        trackingPixel.height = 1;
        trackingPixel.style.display = 'none';
        contentClone.appendChild(trackingPixel);

        // 3. Copy using the safe utility to avoid "Illegal constructor"
        const success = await copyHtmlToClipboard(contentClone.innerHTML);

        if (!success) throw new Error("Could not copy content to clipboard.");

        // 4. Launch Email Client (mailto)
        const mailtoUrl = `mailto:${partner.email}?subject=${encodeURIComponent(getSubject())}`;
        window.location.href = mailtoUrl;

        toast({ title: 'Ready to Send!', description: `Rich HTML copied to clipboard. Simply press Paste (Ctrl+V) in your email.` });
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

          const baseUrl = window.location.origin.includes('localhost') ? 'https://studio--ecosystem-hub.us-central1.hosted.app' : window.location.origin;
          const signupUrl = `${baseUrl}/join?ref=${partner.id}&firstName=${encodeURIComponent(partner.firstName)}&lastName=${encodeURIComponent(partner.lastName)}&email=${encodeURIComponent(partner.email || '')}`;
          
          const text = `Good day ${partner.firstName},\n\nI wanted to share this opportunity with you from Logistics Flow. You can review the details and join our network here: ${signupUrl}`;
          
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

  const EmailWrapper = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontFamily: 'sans-serif', color: '#1e293b', lineHeight: '1.6', maxWidth: '800px', margin: '0 auto' }}>
        <p style={{ marginBottom: '16px' }}>Good day {partner.firstName},</p>
        <p style={{ marginBottom: '16px' }}>We write to introduce our company to you.</p>
        <p style={{ marginBottom: '24px' }}>
            Simplyfi Flow is a finance company specializing in funding for the transport sector. 
            I'm reaching out on behalf of our sister company Logistics Flow. 
            Logistics Flow, a digital ecosystem for the transport industry connecting funding, suppliers and transporters into one ecosystem. 
            Accordingly, we have digitised a logistics ecosystem to create a continuous flow of commerce, capital, and opportunity.
        </p>
        <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '32px', marginTop: '32px' }}>
            {children}
        </div>
        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #f1f5f9', fontSize: '14px', color: '#64748b' }}>
            <p style={{ fontWeight: 'bold', margin: '0' }}>Regards,</p>
            <p style={{ margin: '0' }}>{user?.displayName || 'The TransConnect Team'}</p>
            <p style={{ margin: '0' }}>Logistics Flow & Simplyfi Flow</p>
        </div>
    </div>
  );

  if (!partner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-6 border-b bg-muted/50">
                <div className="flex justify-between items-start">
                    <div className="space-y-3">
                        <div>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <Send className="h-6 w-6 text-primary" />
                                Initiate Engagement: {partner.firstName} {partner.lastName}
                            </DialogTitle>
                            <DialogDescription className="mt-1">
                                {audienceLabel} from {partner.companyName || 'N/A'}
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-md border border-primary/20">
                                <Mail className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">{partner.email || 'No Email Registered'}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-md border border-primary/20">
                                <LinkIcon className="h-4 w-4 text-primary" />
                                <span className="text-sm font-mono">{partner.id}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <Button variant="outline" size="lg" onClick={handleWhatsAppCopy} disabled={isProcessing}>
                            <MessageSquare className="mr-2 h-5 w-5 text-green-600" />
                            Copy WhatsApp
                        </Button>
                        <Button size="lg" onClick={handleLogCopyAndLaunch} disabled={isProcessing || !partner.email}>
                            {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <ExternalLink className="mr-2 h-5 w-5" />}
                            Log, Copy & Open Email
                        </Button>
                    </div>
                </div>
            </DialogHeader>

            <div className="flex-1 flex overflow-hidden">
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
                </div>

                <Card className="flex-1 rounded-none border-0 shadow-none overflow-y-auto bg-slate-50">
                    <CardContent className="p-8">
                        <div id={`engage-content-wrapper-${activeTab}`} className="bg-white p-8 rounded-lg shadow-sm border mx-auto max-w-[800px]">
                            <EmailWrapper>
                                {activeTab === 'company-profile' && <CompanyProfile audience={audience} partner={partner} />}
                                {activeTab === 'tech-architecture' && <TechArchitecture partner={partner} />}
                                {activeTab === 'revenue-model' && <RevenueModel partner={partner} />}
                                {activeTab === 'offer' && <Offer partner={partner} />}
                                {activeTab === 'pitch' && <PitchDeck partner={partner} />}
                                {activeTab === 'framework' && <Framework partner={partner} />}
                                {activeTab === 'emails' && <Emails partner={partner} />}
                            </EmailWrapper>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="p-4 border-t bg-muted/30 flex justify-between items-center text-xs text-muted-foreground px-6">
                <div className="italic">
                    Drafting Subject: {getSubject()}
                </div>
            </div>
        </DialogContent>
    </Dialog>
  );
}
