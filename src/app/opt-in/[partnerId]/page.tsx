
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, CheckCircle, Loader2, AlertCircle, Scale, FileText, Info, Lock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function OptInPage() {
    const params = useParams();
    const partnerId = params.partnerId as string;
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [showFullTerms, setShowFullTerms] = useState(false);

    const partnerRef = useMemoFirebase(() => {
        if (!firestore || !partnerId) return null;
        return doc(firestore, 'partners', partnerId);
    }, [firestore, partnerId]);

    const { data: partner, isLoading } = useDoc(partnerRef);

    const handleAction = async (status: 'accepted' | 'declined') => {
        setIsProcessing(true);
        try {
            const response = await fetch('/api/recordConsent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partnerId, status }),
            });
            
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error);

            toast({ title: status === 'accepted' ? "Consent Recorded" : "Preferences Saved" });
            setCompleted(true);
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: e.message || "Could not record consent." });
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (!partner && !isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen p-4">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <CardTitle>Invalid Link</CardTitle>
                        <CardDescription>This consent link appears to be invalid or has expired.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full" asChild><a href="/">Go to Home</a></Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="flex justify-center items-center min-h-screen p-4">
                <Card className="max-w-md w-full text-center border-green-500 bg-green-50/50 shadow-2xl">
                    <CardHeader>
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <CardTitle>Thank You, {partner?.firstName}!</CardTitle>
                        <CardDescription>Your preferences have been securely recorded.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Your partnership status has been updated in our ecosystem. You can now expect to receive valuable opportunities from Logistics Flow.</p>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" asChild><a href="/">Visit Our Website</a></Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen p-4 bg-muted/30">
            <Card className="max-w-2xl w-full shadow-xl">
                <CardHeader className="text-center border-b pb-6">
                    <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-headline">Confirm Your Participation</CardTitle>
                    <CardDescription>Hi {partner?.firstName}, please review our POPI & Privacy standards to establish a compliant connection with {partner?.companyName || 'your business'}.</CardDescription>
                </CardHeader>
                <CardContent className="py-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-primary/5 p-2 rounded-md"><FileText className="h-5 w-5 text-primary"/></div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-foreground">Marketing & Match Consent</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    I agree to receive electronic communications regarding matched freight loads, community-negotiated discounts, and platform updates.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-primary/5 p-2 rounded-md"><Lock className="h-5 w-5 text-primary"/></div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-foreground">POPI Compliance (Privacy)</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    I acknowledge that my personal and business information will be handled in accordance with the Protection of Personal Information Act (POPI).
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg border space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Scale className="h-3.5 w-3.5" />
                                POPI Agreement Summary
                            </h4>
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase" onClick={() => setShowFullTerms(!showFullTerms)}>
                                {showFullTerms ? 'Hide Full Terms' : 'Read Full Terms'}
                            </Button>
                        </div>
                        
                        <ScrollArea className={cn("transition-all", showFullTerms ? "h-64" : "h-20")}>
                            <div className="text-xs space-y-4 text-muted-foreground leading-relaxed pr-4">
                                <section>
                                    <p className="font-bold text-foreground">1. Purpose of Data Collection</p>
                                    <p>Logistics Flow collects business identity and contact information solely for the purpose of facilitating commerce, unlocking capital solutions, and negotiating group-based discounts with vetted suppliers.</p>
                                </section>
                                <section>
                                    <p className="font-bold text-foreground">2. Third-Party Access</p>
                                    <p>Your individual identifiable data is never sold. We only share specific data with financiers or suppliers upon your explicit request for a quote or application.</p>
                                </section>
                                <section>
                                    <p className="font-bold text-foreground">3. Your Rights</p>
                                    <p>As a data subject, you have the right to request access to, correction of, or deletion of your personal data at any time by contacting our compliance officer at privacy@logisticsflow.co.za.</p>
                                </section>
                                <section>
                                    <p className="font-bold text-foreground">4. Data Security</p>
                                    <p>We utilize enterprise-grade encryption and secure Google Cloud infrastructure to ensure that your data is protected from unauthorized access or breaches.</p>
                                </section>
                                <section>
                                    <p className="font-bold text-foreground">5. Direct Marketing</p>
                                    <p>By clicking "I Accept", you are opting in to receive targeted business communications. You may unsubscribe or update your preferences at any time.</p>
                                </section>
                            </div>
                        </ScrollArea>
                    </div>

                    {!showFullTerms && (
                        <div className="text-center">
                            <Button variant="link" size="sm" onClick={() => setShowFullTerms(true)} className="text-primary text-xs">
                                <Eye className="mr-2 h-3.5 w-3.5"/> View full POPI Disclosure & Terms
                            </Button>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex-col gap-4 border-t pt-6 bg-muted/10">
                    <Button className="w-full py-6 text-lg font-bold" size="lg" onClick={() => handleAction('accepted')} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <CheckCircle className="mr-2 h-5 w-5" />}
                        I Accept & Establish Connection
                    </Button>
                    <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-destructive" onClick={() => handleAction('declined')} disabled={isProcessing}>
                        I decline all communications
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground italic px-6">
                        By clicking "I Accept", you provide your electronic signature of consent for the processing of business data as outlined above.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
