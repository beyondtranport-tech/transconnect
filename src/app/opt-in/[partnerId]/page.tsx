'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, CheckCircle, Loader2, AlertCircle, Scale, FileText, Lock, Mail, Info, ArrowRight, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

/**
 * OPT-IN LANDING PAGE (PUBLIC)
 * Authorized via 'allow get: if true' in firestore.rules.
 * Performs dual-registry lookup to resolve partners or leads.
 */
export default function OptInPage() {
    const params = useParams();
    const partnerId = params.partnerId as string;
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [completed, setCompleted] = useState(false);

    const [marketingConsent, setMarketingConsent] = useState(false);
    const [popiConsent, setPopiConsent] = useState(false);
    const [termsConsent, setTermsConsent] = useState(false);

    // DUAL REGISTRY RESOLVER: Ensures high reliability for handshake resolve.
    const partnerRef = useMemoFirebase(() => {
        if (!firestore || !partnerId) return null;
        return doc(firestore, 'partners', partnerId);
    }, [firestore, partnerId]);

    const leadRef = useMemoFirebase(() => {
        if (!firestore || !partnerId) return null;
        return doc(firestore, 'leads', partnerId);
    }, [firestore, partnerId]);

    const { data: partner, isLoading: isPartnerLoading } = useDoc(partnerRef);
    const { data: lead, isLoading: isLeadLoading } = useDoc(leadRef);

    const activeRecord = useMemo(() => partner || lead, [partner, lead]);
    const isLoading = isPartnerLoading && isLeadLoading;

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
                body: JSON.stringify({ partnerId, status }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || "Failed.");
            toast({ title: status === 'accepted' ? "Handshake Established" : "Preferences Saved" });
            setCompleted(true);
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: e.message });
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

    if (!activeRecord && !isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen p-4">
                <Card className="max-w-md w-full text-center border-destructive/20 shadow-xl bg-white">
                    <CardHeader>
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <CardTitle className="text-2xl font-black">Registry Record Not Found</CardTitle>
                        <CardDescription>This specific handshake link is not active in our registry.</CardDescription>
                    </CardHeader>
                    <CardFooter><Button className="w-full font-bold" asChild><a href="/">Visit Homepage</a></Button></CardFooter>
                </Card>
            </div>
        );
    }

    if (completed) {
        const signupUrl = `/join?email=${encodeURIComponent(activeRecord?.email || '')}&firstName=${encodeURIComponent(activeRecord?.firstName || '')}&lastName=${encodeURIComponent(activeRecord?.lastName || '')}&ref=${partnerId}`;
        return (
            <div className="flex justify-center items-center min-h-screen p-4 text-left">
                <Card className="max-w-md w-full text-center border-green-500 bg-green-50 shadow-2xl">
                    <CardHeader><CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" /><CardTitle className="text-2xl font-black">Handshake Established</CardTitle></CardHeader>
                    <CardContent className="p-8 space-y-6 text-left">
                        <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm space-y-3">
                             <p className="text-[10px] font-black uppercase tracking-widest text-green-700 flex items-center gap-2 justify-center">
                                 <Zap className="h-3 w-3 fill-current"/> Immediate Next Step
                             </p>
                             <p className="text-sm font-medium text-foreground text-center leading-relaxed">
                                 Set up your secure dashboard to access the forensic registry and matching engine.
                             </p>
                        </div>
                        <Button asChild size="lg" className="w-full h-14 font-black uppercase shadow-xl"><Link href={signupUrl}>Complete Profile <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen p-4 bg-slate-50 text-left">
            <Card className="max-w-xl w-full shadow-2xl overflow-hidden text-left">
                <CardHeader className="bg-slate-900 text-white p-8">
                    <ShieldCheck className="h-8 w-8 text-primary mx-auto mb-4" />
                    <CardTitle className="text-center font-black uppercase tracking-tight text-left text-white">Industrial Handshake</CardTitle>
                    <CardDescription className="text-center text-slate-400">Establish compliance for <strong>{activeRecord?.companyName || activeRecord?.trading_name}</strong>.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6 bg-white text-left">
                    <div className="space-y-4 text-left">
                        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors text-left">
                            <input type="checkbox" id="m-check" className="mt-1 h-5 w-5 rounded border-gray-300" checked={marketingConsent} onChange={e => setMarketingConsent(e.target.checked)} />
                            <Label htmlFor="m-check" className="text-sm cursor-pointer text-left"><span className="font-bold block">Communication Opt-In</span>Receive matches and group savings alerts.</Label>
                        </div>
                        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors text-left">
                            <input type="checkbox" id="p-check" className="mt-1 h-5 w-5 rounded border-gray-300" checked={popiConsent} onChange={e => setPopiConsent(e.target.checked)} />
                            <Label htmlFor="p-check" className="text-sm cursor-pointer text-left"><span className="font-bold block">POPI Compliance</span>Authorize secure data processing for matching.</Label>
                        </div>
                        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors text-left">
                            <input type="checkbox" id="t-check" className="mt-1 h-5 w-5 rounded border-gray-300" checked={termsConsent} onChange={e => setTermsConsent(e.target.checked)} />
                            <Label htmlFor="t-check" className="text-sm cursor-pointer text-left"><span className="font-bold block">Master Terms</span>Accept the platform terms of engagement.</Label>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 p-8 border-t bg-slate-50">
                    <Button className="w-full h-14 text-lg font-black uppercase shadow-lg" size="lg" onClick={() => handleAction('accepted')} disabled={isProcessing || !canAccept}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />} Secure Handshake
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}