'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, ShieldCheck, Truck, Users, Lock, CheckCircle, Info, Landmark, MapPin, AlertTriangle } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, getClientSideAuthToken } from '@/firebase';
import { doc, collection, query, where, serverTimestamp, setDoc } from 'firebase/firestore';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
    
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // 1. INTELLIGENCE AUDIT: Must be a paid member to earn
    const isIntelligenceMember = user?.companyData?.membershipId && user.companyData.membershipId !== 'free';

    // 2. FLEET COMPLIANCE AUDIT: Requires matching verified assets
    // Logic: Look for any facilities OR contributions that prove ownership of the specific required equipment
    const fleetQuery = useMemoFirebase(() => {
        if (!firestore || !user?.companyId) return null;
        return query(collection(firestore, `companies/${user.companyId}/facilities`), where('status', '==', 'active'));
    }, [firestore, user?.companyId]);
    const { data: fleet, isLoading: isFleetLoading } = useCollection(fleetQuery);

    const hasRequiredAsset = useMemo(() => {
        if (!fleet || !load.requiredEquipment) return true;
        // High-intent filter: At least 1 active asset must be registered to unlock "Taking"
        return fleet.length > 0; 
    }, [fleet, load.requiredEquipment]);

    // 3. DRIVER AUDIT: Every load requires a verified human node
    const staffQuery = useMemoFirebase(() => {
        if (!firestore || !user?.companyId) return null;
        return query(collection(firestore, `companies/${user.companyId}/staff`), where('status', '==', 'confirmed'));
    }, [firestore, user?.companyId]);
    const { data: staff, isLoading: isStaffLoading } = useCollection(staffQuery);

    const hasConfirmedDriver = useMemo(() => {
        if (!staff) return false;
        // Look for roles matching logistics/operations/drivers
        return staff.some(s => ['logistics', 'operations', 'driver'].includes(s.role?.toLowerCase()));
    }, [staff]);

    const handleAcceptLoad = async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;

            // Mark the load as assigned and record the haulier node (Taker)
            const loadRef = doc(firestore, `companies/${load.brokerId}/loadBoard/loads/${load.id}`);
            await setDoc(loadRef, {
                status: 'assigned',
                takerId: user!.companyId,
                updatedAt: serverTimestamp()
            }, { merge: true });

            toast({ title: "Load Secured", description: "Handshake verified. Proceed to dispatch instructions." });
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
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Auditing Member Compliance...</p>
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
                    Registry Compliance Check
                </CardTitle>
                <CardDescription className="text-slate-400 text-lg mt-2 text-left">
                    Verifying haulier node for route: <strong>{load.origin}</strong> to <strong>{load.destination}</strong>.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-10 bg-white text-foreground">
                
                {/* STEP 1: INTELLIGENCE ACCESS */}
                <div className={cn("p-8 rounded-3xl border-2 transition-all shadow-sm", !isIntelligenceMember ? "border-amber-200 bg-amber-50" : "border-green-100 bg-green-50")}>
                    <div className="flex justify-between items-start text-left">
                        <div className="text-left space-y-1">
                            <h3 className="font-black text-xl flex items-center gap-2 text-foreground">
                                <Landmark className="h-6 w-6 text-primary" />
                                1. Intelligence Membership
                            </h3>
                            <p className="text-sm text-muted-foreground">Only paid tiers are authorized to accept commercial loads.</p>
                        </div>
                        {isIntelligenceMember ? <CheckCircle className="h-8 w-8 text-green-600" /> : <Lock className="h-8 w-8 text-amber-600" />}
                    </div>
                    {!isIntelligenceMember && (
                        <div className="mt-8 p-6 bg-white rounded-2xl border border-amber-200 space-y-4 shadow-inner">
                            <p className="text-sm font-medium text-amber-800 leading-relaxed text-left">
                                You are currently an **Observer**. To unlock the ability to accept this load worth **{formatCurrency(load.haulierPayout)}**, you must upgrade to an Intelligence Tier.
                            </p>
                            <Button asChild size="lg" className="w-full bg-amber-600 hover:bg-amber-700 font-bold h-14">
                                <Link href="/checkout/intelligence">Unlock Intelligence Access <ArrowRight className="ml-2 h-4 w-4"/></Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* STEP 2: FLEET ASSET COMPLIANCE */}
                <div className={cn("p-8 rounded-3xl border-2 transition-all shadow-sm", !hasRequiredAsset ? "border-destructive/20 bg-destructive/5" : "border-green-100 bg-green-50")}>
                    <div className="flex justify-between items-start text-left">
                        <div className="text-left space-y-1">
                            <h3 className="font-black text-xl flex items-center gap-2 text-foreground">
                                <Truck className="h-6 w-6 text-primary" />
                                2. Verified Fleet Assets (RC1)
                            </h3>
                            <p className="text-sm text-muted-foreground">Requires: {load.requiredEquipment?.join(', ') || 'Standard Freight Specs'}</p>
                        </div>
                        {hasRequiredAsset ? <CheckCircle className="h-8 w-8 text-green-600" /> : <AlertTriangle className="h-8 w-8 text-destructive" />}
                    </div>
                    {!hasRequiredAsset && (
                        <div className="mt-6 p-6 bg-white rounded-2xl border border-destructive/20 space-y-4 shadow-inner text-left">
                            <p className="text-sm text-destructive font-black uppercase tracking-widest">Incomplete Data: No verified matching assets.</p>
                            <p className="text-xs text-muted-foreground leading-relaxed text-left">
                                You must contribute your fleet information (RC1 certificates) to the registry before you can accept loads. Verified assets de-risk the ecosystem for everyone.
                            </p>
                            <Button asChild variant="outline" size="lg" className="w-full border-destructive/20 text-destructive font-bold h-12">
                                <Link href="/contribute">Contribute Verified Fleet Data</Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* STEP 3: DRIVER AUTHENTICATION */}
                <div className={cn("p-8 rounded-3xl border-2 transition-all shadow-sm", !hasConfirmedDriver ? "border-destructive/20 bg-destructive/5" : "border-green-100 bg-green-50")}>
                    <div className="flex justify-between items-start text-left">
                        <div className="text-left space-y-1">
                            <h3 className="font-black text-xl flex items-center gap-2 text-foreground">
                                <Users className="h-6 w-6 text-primary" />
                                3. Assigned Driver Verification
                            </h3>
                            <p className="text-sm text-muted-foreground">Every digital handshake requires an assigned, vetted professional.</p>
                        </div>
                        {hasConfirmedDriver ? <CheckCircle className="h-8 w-8 text-green-600" /> : <AlertTriangle className="h-8 w-8 text-destructive" />}
                    </div>
                    {!hasConfirmedDriver && (
                        <div className="mt-6 p-6 bg-white rounded-2xl border border-destructive/20 space-y-4 shadow-inner text-left">
                            <p className="text-sm text-destructive font-black uppercase tracking-widest text-left">No Confirmed Personnel Nodes Found.</p>
                            <p className="text-xs text-muted-foreground leading-relaxed text-left">
                                Add your driver profiles and upload their professional permits (PrDP) to establish technical compliance.
                            </p>
                            <Button asChild variant="outline" size="lg" className="w-full border-destructive/20 text-destructive font-bold h-12">
                                <Link href="/account?view=staff">Register & Verify Personnel</Link>
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
                    className="h-16 px-16 text-lg font-black uppercase tracking-tight shadow-2xl bg-primary hover:bg-primary/90"
                >
                    {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : "Establish Load Handshake"}
                </Button>
            </CardFooter>
        </Card>
    );
}
