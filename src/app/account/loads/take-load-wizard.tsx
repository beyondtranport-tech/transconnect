'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, ShieldCheck, Truck, Users, Lock, CheckCircle, Info, Landmark, MapPin, AlertTriangle, UserPlus, Database } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, getClientSideAuthToken } from '@/firebase';
import { doc, collection, query, where, serverTimestamp, setDoc } from 'firebase/firestore';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

interface TakeLoadWizardProps {
    load: any;
    onComplete: () => void;
    onCancel: () => void;
}

export function TakeLoadWizard({ load, onComplete, onCancel }: TakeLoadWizardProps) {
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    
    const [isLoading, setIsLoading] = useState(false);

    // 1. INTELLIGENCE AUDIT
    const isIntelligenceMember = user?.companyData?.membershipId && user.companyData.membershipId !== 'free';

    // 2. FLEET COMPLIANCE AUDIT
    const fleetQuery = useMemoFirebase(() => {
        if (!firestore || !user?.companyId) return null;
        return query(collection(firestore, `companies/${user.companyId}/facilities`), where('status', '==', 'active'));
    }, [firestore, user?.companyId]);
    const { data: fleet, isLoading: isFleetLoading } = useCollection(fleetQuery);

    const hasRequiredAsset = useMemo(() => {
        if (!fleet) return false;
        return fleet.length > 0; 
    }, [fleet]);

    // 3. DRIVER AUDIT
    const staffQuery = useMemoFirebase(() => {
        if (!firestore || !user?.companyId) return null;
        return query(collection(firestore, `companies/${user.companyId}/staff`), where('status', '==', 'confirmed'));
    }, [firestore, user?.companyId]);
    const { data: staff, isLoading: isStaffLoading } = useCollection(staffQuery);

    const hasConfirmedDriver = useMemo(() => {
        if (!staff) return false;
        return staff.some(s => ['logistics', 'operations', 'driver'].includes(s.role?.toLowerCase()));
    }, [staff]);

    const handleAcceptLoad = async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;

            const loadRef = doc(firestore, `companies/${load.brokerId}/loadBoard/loads/${load.id}`);
            await setDoc(loadRef, {
                status: 'assigned',
                takerId: user!.companyId,
                updatedAt: serverTimestamp()
            }, { merge: true });

            toast({ title: "Load Secured", description: "Compliance verified. Proceed to dispatch." });
            onComplete();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Acceptance Failed", description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    if (isFleetLoading || isStaffLoading) {
        return (
            <div className="py-32 text-center flex flex-col items-center gap-4">
                <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Performing Registry Audit...</p>
            </div>
        );
    }

    return (
        <Card className="max-w-4xl mx-auto shadow-2xl border-none text-left overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-10 text-left relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ShieldCheck className="h-32 w-32" />
                </div>
                <CardTitle className="text-3xl font-black font-headline flex items-center gap-3 text-white text-left">
                    <ShieldCheck className="h-10 w-10 text-primary" />
                    Registry Compliance Audit
                </CardTitle>
                <CardDescription className="text-slate-400 text-lg mt-2 text-left">
                    Verifying haulier node for: <strong>{load.origin}</strong> to <strong>{load.destination}</strong>
                </CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-10 bg-white text-foreground">
                
                {/* REQUIREMENT 1: TIER */}
                <div className={cn("p-8 rounded-3xl border-2 transition-all shadow-sm", !isIntelligenceMember ? "border-amber-200 bg-amber-50" : "border-green-100 bg-green-50")}>
                    <div className="flex justify-between items-start text-left">
                        <div className="text-left space-y-1">
                            <h3 className="font-black text-xl flex items-center gap-2 text-foreground">
                                <Landmark className="h-6 w-6 text-primary" />
                                1. Intelligence Activation
                            </h3>
                            <p className="text-sm text-muted-foreground">Only authorized Intelligence Tiers can engage in commercial handshakes.</p>
                        </div>
                        {isIntelligenceMember ? <CheckCircle className="h-8 w-8 text-green-600" /> : <Lock className="h-8 w-8 text-amber-600" />}
                    </div>
                    {!isIntelligenceMember && (
                        <div className="mt-8 p-6 bg-white rounded-2xl border border-amber-200 space-y-4 shadow-inner">
                            <p className="text-sm font-medium text-amber-800 leading-relaxed text-left">
                                You are viewing a load with a payout of **{formatCurrency(load.haulierPayout)}**. To accept this and start earning, activate your **Loads Intelligence** node for R75/mo.
                            </p>
                            <Button asChild size="lg" className="w-full bg-amber-600 hover:bg-amber-700 font-bold h-14">
                                <Link href="/checkout/loads_intelligence">Unlock Earning Power <ArrowRight className="ml-2 h-4 w-4"/></Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* REQUIREMENT 2: FLEET */}
                <div className={cn("p-8 rounded-3xl border-2 transition-all shadow-sm", !hasRequiredAsset ? "border-destructive/20 bg-destructive/5" : "border-green-100 bg-green-50")}>
                    <div className="flex justify-between items-start text-left">
                        <div className="text-left space-y-1">
                            <h3 className="font-black text-xl flex items-center gap-2 text-foreground">
                                <Truck className="h-6 w-6 text-primary" />
                                2. Verified Fleet Asset (RC1)
                            </h3>
                            <p className="text-sm text-muted-foreground">Required Equipment: {load.requiredEquipment?.join(', ')}</p>
                        </div>
                        {hasRequiredAsset ? <CheckCircle className="h-8 w-8 text-green-600" /> : <AlertTriangle className="h-8 w-8 text-destructive" />}
                    </div>
                    {!hasRequiredAsset && (
                        <div className="mt-6 p-6 bg-white rounded-2xl border border-destructive/20 space-y-4 shadow-inner text-left">
                            <Alert variant="destructive" className="border-none p-0 bg-transparent">
                                <Database className="h-4 w-4" />
                                <AlertTitle className="font-bold">Missing Forensic Evidence</AlertTitle>
                                <AlertDescription className="text-xs mt-1">
                                    You have not registered any verified RC1 assets in your registry node. We cannot authorize a haulier without proof of capacity.
                                </AlertDescription>
                            </Alert>
                            <Button asChild variant="outline" size="lg" className="w-full border-destructive/20 text-destructive font-bold h-12">
                                <Link href="/contribute">Register Verified Fleet Data</Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* REQUIREMENT 3: DRIVER */}
                <div className={cn("p-8 rounded-3xl border-2 transition-all shadow-sm", !hasConfirmedDriver ? "border-destructive/20 bg-destructive/5" : "border-green-100 bg-green-50")}>
                    <div className="flex justify-between items-start text-left">
                        <div className="text-left space-y-1">
                            <h3 className="font-black text-xl flex items-center gap-2 text-foreground">
                                <Users className="h-6 w-6 text-primary" />
                                3. Professional Driver Onboarding
                            </h3>
                            <p className="text-sm text-muted-foreground">Every digital handshake requires an assigned, vetted professional node.</p>
                        </div>
                        {hasConfirmedDriver ? <CheckCircle className="h-8 w-8 text-green-600" /> : <AlertTriangle className="h-8 w-8 text-destructive" />}
                    </div>
                    {!hasConfirmedDriver && (
                        <div className="mt-6 p-6 bg-white rounded-2xl border border-destructive/20 space-y-4 shadow-inner text-left">
                            <p className="text-sm text-destructive font-black uppercase tracking-widest text-left">Workforce Gap Detected</p>
                            <p className="text-xs text-muted-foreground leading-relaxed text-left">
                                You must onboard your drivers and upload their professional permits (PrDP) to establish workforce compliance.
                            </p>
                            <Button asChild variant="outline" size="lg" className="w-full border-destructive/20 text-destructive font-bold h-12">
                                <Link href="/account?view=staff">Register & Verify Workforce</Link>
                            </Button>
                        </div>
                    )}
                </div>

            </CardContent>
            <CardFooter className="p-10 bg-slate-50 border-t flex flex-col md:flex-row justify-between items-center gap-6">
                <Button variant="ghost" onClick={onCancel} className="font-bold text-muted-foreground">Cancel Transaction</Button>
                <Button 
                    onClick={handleAcceptLoad} 
                    disabled={!isIntelligenceMember || !hasRequiredAsset || !hasConfirmedDriver || isLoading}
                    className="h-16 px-16 text-lg font-black uppercase tracking-tight shadow-2xl bg-primary hover:bg-primary/90 text-white"
                >
                    {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : "Authorize Load Handshake"}
                </Button>
            </CardFooter>
        </Card>
    );
}
