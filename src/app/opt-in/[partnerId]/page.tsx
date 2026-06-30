'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, CheckCircle, Loader2, AlertCircle, Scale, FileText, Lock, Mail, Info, ArrowRight, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function OptInPage() {
    const params = useParams();
    const partnerId = params.partnerId as string;
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [showFullTerms, setShowFullTerms] = useState(false);

    // Consent items
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
        const signupUrl = `/join?email=${encodeURIComponent(partner?.email || '')}&firstName=${encodeURIComponent(partner?.firstName || '')}&lastName=${encodeURIComponent(partner?.lastName || '')}&ref=${partnerId}`;
        
        return (
            <div className="flex justify-center items-center min-h-screen p-4 bg-muted/10 text-left">
                <Card className="max-w-md w-full text-center border-green-500 bg-green-50/50 shadow-2xl overflow-hidden">
                    <CardHeader className="bg-white border-b pb-6">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <CardTitle className="text-2xl font-black">Handshake Established</CardTitle>
                        <CardDescription>Thank you, {partner?.firstName}. Your standing is confirmed.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6 text-left">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            A formal record of your consent for <strong>{partner?.companyName || 'your business'}</strong> has been logged. You are now authorized to complete your professional profile.
                        </p>
                        <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-green-700 flex items-center gap-2">
                                <Zap className="h-3 w-3 fill-current"/> Immediate Next Step
                            </p>
                            <p className="text-sm font-medium text-foreground">
                                Set up your secure dashboard to access the forensic registry and matching engine.
                            </p>
                            <Button asChild size="lg" className="w-full h-12 font-black uppercase text-xs tracking-widest shadow-lg">
                                <Link href={signupUrl}>Complete Profile <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-center border-t py-4 bg-slate-50">
                        <Button variant="ghost" className="text-[10px] uppercase font-bold text-muted-foreground" asChild>
                            <a href="/">Return to Logistics Flow</a>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen p-4 bg-slate-50 text-left">
            <Card className="max-w-xl w-full shadow-2xl border-primary/10 overflow-hidden">
                <CardHeader className="text-center border-b pb-6 bg-slate-900 text-white">
                    <div className="bg-primary/20 p-3 rounded-full w-fit mx-auto mb-4">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-headline font-black uppercase tracking-tight">Industrial Handshake</CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                        Establishing a compliant foundation for <strong>{partner?.companyName || 'your business'}</strong>.
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="py-8 space-y-8 bg-white text-left">
                    <div className="space-y-6">
                        {/* 1. Marketing Consent */}
                        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors bg-white">
                            <input 
                                type="checkbox"
                                id="marketing-check" 
                                className="mt-1.5 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                checked={marketingConsent}
                                onChange={(e) => setMarketingConsent(e.target.checked)}
                            />
                            <div className="flex-1 space-y-1">
                                <Label htmlFor="marketing-check" className="text-sm font-bold flex items-center gap-2 cursor-pointer text-foreground">
                                    <Mail className="h-4 w-4 text-primary"/> Communication Opt-In
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    I agree to receive load matches, group savings alerts, and technical platform updates.
                                </p>
                            </div>
                        </div>

                        {/* 2. POPI Consent */}
                        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors bg-white">
                            <input 
                                type="checkbox"
                                id="popi-check" 
                                className="mt-1.5 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                checked={popiConsent}
                                onChange={(e) => setPopiConsent(e.target.checked)}
                            />
                            <div className="flex-1 space-y-1">
                                <Label htmlFor="popi-check" className="text-sm font-bold flex items-center gap-2 cursor-pointer text-foreground">
                                    <Lock className="h-4 w-4 text-primary"/> Data Handling Compliance (POPI)
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    I authorize the secure processing of my business details for the purpose of ecosystem matching.
                                </p>
                            </div>
                        </div>

                        {/* 3. Platform Terms */}
                        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors bg-white">
                            <input 
                                type="checkbox"
                                id="terms-check" 
                                className="mt-1.5 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                checked={termsConsent}
                                onChange={(e) => setTermsConsent(e.target.checked)}
                            />
                            <div className="flex-1 space-y-1">
                                <Label htmlFor="terms-check" className="text-sm font-bold flex items-center gap-2 cursor-pointer text-foreground">
                                    <FileText className="h-4 w-4 text-primary"/> Master Service Terms
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    I have reviewed and accept the master terms of engagement for the community ecosystem.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Scale className="h-3 w-3" />
                                Privacy Disclosure
                            </h4>
                            <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-bold uppercase text-primary" onClick={() => setShowFullTerms(!showFullTerms)}>
                                {showFullTerms ? 'Hide Details' : 'Read Full Text'}
                            </Button>
                        </div>
                        
                        <ScrollArea className={cn("transition-all duration-300", showFullTerms ? "h-48" : "h-0 overflow-hidden")}>
                            <div className="text-[11px] space-y-3 text-muted-foreground leading-relaxed pr-4 pb-4">
                                <p><strong>1. Data Minimization:</strong> We only collect data required to facilitate matches.</p>
                                <p><strong>2. Security:</strong> Your data is stored on encrypted, path-secured Firestore nodes.</p>
                                <p><strong>3. Control:</strong> You can withdraw consent and request record deletion at any time via support.</p>
                            </div>
                        </ScrollArea>
                        {!showFullTerms && <p className="text-[10px] text-muted-foreground italic">Establishing this handshake secures your standing in the communication pipeline.</p>}
                    </div>
                </CardContent>

                <CardFooter className="flex-col gap-4 border-t pt-6 bg-slate-50/50 rounded-b-xl">
                    <Button 
                        className="w-full h-14 text-lg font-black uppercase tracking-tight shadow-lg" 
                        size="lg" 
                        onClick={() => handleAction('accepted')} 
                        disabled={isProcessing || !canAccept}
                    >
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                        Secure Handshake
                    </Button>
                    <div className="flex items-center justify-between w-full">
                        <Button variant="ghost" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => handleAction('declined')} disabled={isProcessing}>
                            I decline participation
                        </Button>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                            <Info className="h-3 w-3"/> POPI SECURE SESSION
                        </p>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}