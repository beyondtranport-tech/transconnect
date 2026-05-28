
'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, CheckCircle, Loader2, AlertCircle, Scale, FileText, Lock, Mail, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function OptInPage() {
    const params = useParams();
    const partnerId = params.partnerId as string;
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [showFullTerms, setShowFullTerms] = useState(false);

    // Explicit Consent States
    const [consentMarketing, setConsentMarketing] = useState(false);
    const [consentPopi, setConsentPopi] = useState(false);
    const [consentTerms, setConsentTerms] = useState(false);

    const partnerRef = useMemoFirebase(() => {
        if (!firestore || !partnerId) return null;
        return doc(firestore, 'partners', partnerId);
    }, [firestore, partnerId]);

    const { data: partner, isLoading } = useDoc(partnerRef);

    const canAccept = useMemo(() => {
        return consentMarketing && consentPopi && consentTerms;
    }, [consentMarketing, consentPopi, consentTerms]);

    const handleAction = async (status: 'accepted' | 'declined') => {
        if (status === 'accepted' && !canAccept) return;

        setIsProcessing(true);
        try {
            const response = await fetch('/api/recordConsent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    partnerId, 
                    status,
                    details: status === 'accepted' ? { marketing: true, popi: true, terms: true } : null
                }),
            });
            
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error);

            toast({ title: status === 'accepted' ? "Handshake Established" : "Preferences Saved" });
            setCompleted(true);
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: e.message || "Could not record consent." });
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen bg-muted/10"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (!partner && !isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen p-4 bg-muted/10">
                <Card className="max-w-md w-full text-center shadow-xl">
                    <CardHeader>
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <CardTitle>Link Expired or Invalid</CardTitle>
                        <CardDescription>This secure consent link is no longer active.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full" asChild><a href="/">Visit Homepage</a></Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="flex justify-center items-center min-h-screen p-4 bg-muted/10">
                <Card className="max-w-md w-full text-center border-green-500 bg-green-50/50 shadow-2xl">
                    <CardHeader>
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <CardTitle>Handshake Complete!</CardTitle>
                        <CardDescription>Thank you, {partner?.firstName}. Your participation is confirmed.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            A record of your consent for <strong>{partner?.companyName}</strong> has been logged on our secure ledger. You are now officially part of the Logistics Flow ecosystem and will receive matched opportunities shortly.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" asChild><a href="/">Explore Our Website</a></Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen p-4 bg-muted/30">
            <Card className="max-w-xl w-full shadow-2xl border-primary/10">
                <CardHeader className="text-center border-b pb-6 bg-white rounded-t-xl">
                    <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-headline font-bold">The Digital Handshake</CardTitle>
                    <CardDescription className="text-sm">
                        Establishing a compliant partnership between <strong>Logistics Flow</strong> and <strong>{partner?.companyName || 'your business'}</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="py-8 space-y-8 bg-white">
                    <div className="space-y-6">
                        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                            <Checkbox 
                                id="marketing-check" 
                                className="mt-1 h-5 w-5"
                                checked={consentMarketing}
                                onCheckedChange={(val) => setConsentMarketing(!!val)}
                            />
                            <div className="flex-1 space-y-1">
                                <Label htmlFor="marketing-check" className="text-sm font-bold flex items-center gap-2 cursor-pointer">
                                    <Mail className="h-4 w-4 text-primary"/> Marketing & Match Consent
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    I agree to receive electronic communications regarding matched freight loads, community-negotiated discounts, and platform updates for my business.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                            <Checkbox 
                                id="popi-check" 
                                className="mt-1 h-5 w-5"
                                checked={consentPopi}
                                onCheckedChange={(val) => setConsentPopi(!!val)}
                            />
                            <div className="flex-1 space-y-1">
                                <Label htmlFor="popi-check" className="text-sm font-bold flex items-center gap-2 cursor-pointer">
                                    <Lock className="h-4 w-4 text-primary"/> POPI & Privacy Compliance
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    I acknowledge that my personal and business information will be handled securely in accordance with the Protection of Personal Information Act (POPI).
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                            <Checkbox 
                                id="terms-check" 
                                className="mt-1 h-5 w-5"
                                checked={consentTerms}
                                onCheckedChange={(val) => setConsentTerms(!!val)}
                            />
                            <div className="flex-1 space-y-1">
                                <Label htmlFor="terms-check" className="text-sm font-bold flex items-center gap-2 cursor-pointer">
                                    <FileText className="h-4 w-4 text-primary"/> General Platform Terms
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    I have read and agree to the platform standards for network participants and strategic partners.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Scale className="h-3 w-3" />
                                Legal Disclosure Summary
                            </h4>
                            <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-bold uppercase text-primary" onClick={() => setShowFullTerms(!showFullTerms)}>
                                {showFullTerms ? 'Hide Terms' : 'Read Full Terms'}
                            </Button>
                        </div>
                        
                        <ScrollArea className={cn("transition-all duration-300", showFullTerms ? "h-64" : "h-0 overflow-hidden")}>
                            <div className="text-xs space-y-4 text-muted-foreground leading-relaxed pr-4 pb-4">
                                <p><strong>1. Data Purpose:</strong> Information is collected solely to facilitate commerce, unlock capital solutions, and negotiate group-based discounts with vetted suppliers.</p>
                                <p><strong>2. Third-Party Access:</strong> Your individual identifiable data is never sold. It is only shared with financiers or suppliers upon your explicit request for a quote.</p>
                                <p><strong>3. Security:</strong> We utilize enterprise-grade encryption and secure infrastructure to ensure your business data is protected.</p>
                                <p><strong>4. Withdrawal:</strong> You may withdraw your consent at any time by contacting our compliance officer at privacy@logisticsflow.co.za.</p>
                            </div>
                        </ScrollArea>
                        {!showFullTerms && <p className="text-[10px] text-muted-foreground italic">Click "Read Full Terms" for detailed POPI and data security disclosures.</p>}
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-4 border-t pt-6 bg-slate-50/50 rounded-b-xl">
                    <Button 
                        className="w-full py-7 text-lg font-black uppercase tracking-tight shadow-lg" 
                        size="lg" 
                        onClick={() => handleAction('accepted')} 
                        disabled={isProcessing || !canAccept}
                    >
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                        Accept & Establish Connection
                    </Button>
                    <div className="flex items-center justify-between w-full">
                        <Button variant="ghost" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => handleAction('declined')} disabled={isProcessing}>
                            I decline participation
                        </Button>
                        <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                            <Info className="h-3 w-3"/> Secure, encrypted session
                        </p>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
