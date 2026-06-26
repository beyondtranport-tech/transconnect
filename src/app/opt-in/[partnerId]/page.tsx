
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, CheckCircle, Loader2, AlertCircle, Scale, FileText, Lock, Mail, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
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

    // Using basic state for the three consent items
    const [marketingConsent, setMarketingConsent] = useState(false);
    const [popiConsent, setPopiConsent] = useState(false);
    const [termsConsent, setTermsConsent] = useState(false);

    const partnerRef = useMemoFirebase(() => {
        if (!firestore || !partnerId) return null;
        return doc(firestore, 'partners', partnerId);
    }, [firestore, partnerId]);

    const { data: partner, isLoading } = useDoc(partnerRef);

    /**
     * FORENSIC PING: Log that the lead has landed on the app.
     */
    useEffect(() => {
        if (partnerId) {
            fetch(`/api/trackEmailOpen/${partnerId}?source=app`)
                .catch(err => console.warn("Forensic ping failed", err));
        }
    }, [partnerId]);

    // Logic: All three boxes must be checked to enable the established handshake
    const canAccept = useMemo(() => {
        return marketingConsent && popiConsent && termsConsent;
    }, [marketingConsent, popiConsent, termsConsent]);

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
            if (!response.ok || !result.success) throw new Error(result.error || "Failed to record consent.");

            toast({ title: status === 'accepted' ? "Handshake Established" : "Preferences Saved" });
            setCompleted(true);
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: e.message || "Could not record consent." });
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-muted/10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
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
                        <CardTitle>Handshake Established!</CardTitle>
                        <CardDescription>Thank you, {partner?.firstName}. Your participation is confirmed.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            A record of your consent for <strong>{partner?.companyName || 'your business'}</strong> has been logged on our secure ledger. You have been added to our priority communication pipeline and will receive verified load and finance opportunities shortly.
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
        <div className="flex justify-center items-center min-h-screen p-4 bg-slate-50">
            <Card className="max-w-xl w-full shadow-2xl border-primary/10">
                <CardHeader className="text-center border-b pb-6 bg-white rounded-t-xl">
                    <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-headline font-bold">The Digital Handshake</CardTitle>
                    <CardDescription className="text-sm">
                        Establishing a compliant foundation for <strong>{partner?.companyName || 'your business'}</strong>.
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="py-8 space-y-8 bg-white">
                    <div className="space-y-6 text-left">
                        {/* 1. Marketing Consent */}
                        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors bg-white">
                            <input 
                                type="checkbox"
                                id="marketing-check" 
                                className="mt-1.5 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={marketingConsent}
                                onChange={(e) => setMarketingConsent(e.target.checked)}
                            />
                            <div className="flex-1 space-y-1">
                                <Label htmlFor="marketing-check" className="text-sm font-bold flex items-center gap-2 cursor-pointer text-foreground">
                                    <Mail className="h-4 w-4 text-primary"/> Marketing & Match Consent
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    I agree to receive electronic communications regarding load matches, group discounts, and priority platform updates.
                                </p>
                            </div>
                        </div>

                        {/* 2. POPI Consent */}
                        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors bg-white">
                            <input 
                                type="checkbox"
                                id="popi-check" 
                                className="mt-1.5 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={popiConsent}
                                onChange={(e) => setPopiConsent(e.target.checked)}
                            />
                            <div className="flex-1 space-y-1">
                                <Label htmlFor="popi-check" className="text-sm font-bold flex items-center gap-2 cursor-pointer text-foreground">
                                    <Lock className="h-4 w-4 text-primary"/> POPI Act Compliance
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    I acknowledge that my business and personal information will be handled securely and solely to facilitate ecosystem matching.
                                </p>
                            </div>
                        </div>

                        {/* 3. Platform Terms */}
                        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors bg-white">
                            <input 
                                type="checkbox"
                                id="terms-check" 
                                className="mt-1.5 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={termsConsent}
                                onChange={(e) => setTermsConsent(e.target.checked)}
                            />
                            <div className="flex-1 space-y-1">
                                <Label htmlFor="terms-check" className="text-sm font-bold flex items-center gap-2 cursor-pointer text-foreground">
                                    <FileText className="h-4 w-4 text-primary"/> Platform Master Terms
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    I have reviewed and agree to the general terms and conditions for network participants.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Scale className="h-3 w-3" />
                                Privacy Disclosure Summary
                            </h4>
                            <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-bold uppercase text-primary" onClick={() => setShowFullTerms(!showFullTerms)}>
                                {showFullTerms ? 'Hide Details' : 'Read Full Disclosure'}
                            </Button>
                        </div>
                        
                        <ScrollArea className={cn("transition-all duration-300", showFullTerms ? "h-64" : "h-0 overflow-hidden")}>
                            <div className="text-xs space-y-4 text-muted-foreground leading-relaxed pr-4 pb-4">
                                <p><strong>1. Data Collection:</strong> We collect business identity, fleet, and contact data to identify commercial synergies.</p>
                                <p><strong>2. Processing Logic:</strong> Your data is used by our AI to match you with load providers, lenders, and discounted suppliers.</p>
                                <p><strong>3. Zero-Sale Policy:</strong> We do not sell your personal data to third-party marketing lists. Access is only provided to partners you specifically request quotes from.</p>
                                <p><strong>4. Security:</strong> All data is stored in encrypted Firestore repositories with strict path-based security rules.</p>
                            </div>
                        </ScrollArea>
                        {!showFullTerms && <p className="text-[10px] text-muted-foreground italic">Establishing this handshake confirms your standing in our secure communication pipeline.</p>}
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
                        Establish Handshake & Opt-In
                    </Button>
                    <div className="flex items-center justify-between w-full">
                        <Button variant="ghost" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => handleAction('declined')} disabled={isProcessing}>
                            I decline participation
                        </Button>
                        <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                            <Info className="h-3 w-3"/> POPI Compliant Session
                        </p>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
