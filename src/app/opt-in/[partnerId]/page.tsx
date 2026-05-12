
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, CheckCircle, Loader2, AlertCircle, Scale, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function OptInPage() {
    const params = useParams();
    const router = useRouter();
    const partnerId = params.partnerId as string;
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [completed, setCompleted] = useState(false);

    const partnerRef = useMemoFirebase(() => {
        if (!firestore || !partnerId) return null;
        return doc(firestore, 'partners', partnerId);
    }, [firestore, partnerId]);

    const { data: partner, isLoading } = useDoc(partnerRef);

    const handleAccept = async () => {
        if (!partnerRef) return;
        setIsProcessing(true);
        try {
            await updateDoc(partnerRef, {
                consentStatus: 'accepted',
                consentDate: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            toast({ title: "Consent Recorded", description: "Thank you for confirming your preferences." });
            setCompleted(true);
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: "Could not record consent. Please try again later." });
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
                <Card className="max-w-md w-full text-center border-green-500 bg-green-50/50">
                    <CardHeader>
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <CardTitle>Thank You, {partner?.firstName}!</CardTitle>
                        <CardDescription>Your marketing consent and agreement to our terms has been securely recorded.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">You can now expect to receive valuable updates and opportunities from Logistics Flow.</p>
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
            <Card className="max-w-lg w-full">
                <CardHeader className="text-center border-b pb-6">
                    <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Confirm Your Preferences</CardTitle>
                    <CardDescription>Hi {partner?.firstName}, please review and accept our communication standards to continue.</CardDescription>
                </CardHeader>
                <CardContent className="py-8 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-muted p-2 rounded-md"><FileText className="h-5 w-5 text-muted-foreground"/></div>
                        <div>
                            <h4 className="font-semibold text-sm">Marketing Consent</h4>
                            <p className="text-xs text-muted-foreground mt-1">I agree to receive electronic communications from Logistics Flow regarding new opportunities, network growth, and industry news.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="bg-muted p-2 rounded-md"><Scale className="h-5 w-5 text-muted-foreground"/></div>
                        <div>
                            <h4 className="font-semibold text-sm">POPI & Privacy Act Compliance</h4>
                            <p className="text-xs text-muted-foreground mt-1">I acknowledge that my personal information will be handled securely and in accordance with the Protection of Personal Information Act (POPI) as outlined in the privacy policy.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="bg-muted p-2 rounded-md"><ShieldCheck className="h-5 w-5 text-muted-foreground"/></div>
                        <div>
                            <h4 className="font-semibold text-sm">Terms & Conditions</h4>
                            <p className="text-xs text-muted-foreground mt-1">I have read and agree to the general platform terms and conditions for network participants.</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-4 border-t pt-6">
                    <Button className="w-full" size="lg" onClick={handleAccept} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        I Accept & Opt-In
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground">By clicking above, you provide your digital signature of consent for {partner?.companyName || 'your business'}.</p>
                </CardFooter>
            </Card>
        </div>
    );
}
