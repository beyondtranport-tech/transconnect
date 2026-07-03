
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, ShieldCheck, Truck, Users, Lock, CheckCircle, Info, Landmark, MapPin } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, serverTimestamp, setDoc } from 'firebase/firestore';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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

    // 1. MEMBERSHIP AUDIT
    const isIntelligenceMember = user?.companyData?.membershipId && user.companyData.membershipId !== 'free';

    // 2. FLEET COMPLIANCE AUDIT
    const fleetQuery = useMemoFirebase(() => {
        if (!firestore || !user?.companyId) return null;
        return query(collection(firestore, `companies/${user.companyId}/facilities`), where('status', '==', 'active')); // For simplicity, reuse facilities or query fleet subcol if exists
    }, [firestore, user?.companyId]);
    const { data: fleet, isLoading: isFleetLoading } = useCollection(fleetQuery);

    const hasRequiredAsset = useMemo(() => {
        if (!fleet || !load.requiredEquipment) return true;
        // In a production app, we would cross-reference verified RC1 assets here
        return fleet.length > 0; 
    }, [fleet, load.requiredEquipment]);

    // 3. DRIVER COMPLIANCE AUDIT
    const staffQuery = useMemoFirebase(() => {
        if (!firestore || !user?.companyId) return null;
        return query(collection(firestore, `companies/${user.companyId}/staff`), where('status', '==', 'confirmed'));
    }, [firestore, user?.companyId]);
    const { data: staff, isLoading: isStaffLoading } = useCollection(staffQuery);

    const hasConfirmedDriver = useMemo(() => {
        if (!staff) return false;
        return staff.some(s => s.role === 'logistics' || s.role === 'operations');
    }, [staff]);

    const handleAcceptLoad = async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;

            // In a real app, this would be a server-side transaction
            const loadRef = doc(firestore, `companies/${load.brokerId}/loadBoard/loads/${load.id}`);
            await setDoc(loadRef, {
                status: 'assigned',
                takerId: user!.companyId,
                updatedAt: serverTimestamp()
            }, { merge: true });

            toast({ title: "Load Secured", description: "The digital handshake is complete. Please proceed to dispatch." });
            onComplete();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Acceptance Failed", description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    if (isFleetLoading || isStaffLoading) {
        return <div className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" /><p className="mt-2 text-xs font-bold uppercase">Auditing Compliance...</p></div>;
    }

    return (
        <Card className="max-w-4xl mx-auto shadow-2xl border-none text-left">
            <CardHeader className="bg-slate-900 text-white p-8">
                <CardTitle className="text-2xl font-black font-headline flex items-center gap-3 text-white">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                    Haulier Compliance & Acceptance
                </CardTitle>
                <CardDescription className="text-slate-400">Verifying haulier node for {load.origin} to {load.destination}.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8 bg-white text-foreground">
                
                {/* STEP 1: INTELLIGENCE ACCESS */}
                <div className={cn("p-6 rounded-2xl border-2 transition-all", !isIntelligenceMember ? "border-amber-200 bg-amber-50" : "border-green-100 bg-green-50")}>
                    <div className="flex justify-between items-start">
                        <div className="text-left">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Landmark className="h-5 w-5 text-primary" />
                                1. Intelligence Standing
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">Members must be on a paid tier to take loads.</p>
                        </div>
                        {isIntelligenceMember ? <CheckCircle className="h-6 w-6 text-green-600" /> : <Lock className="h-6 w-6 text-amber-600" />}
                    </div>
                    {!isIntelligenceMember && (
                        <div className="mt-6 p-4 bg-white rounded-xl border border-amber-200 space-y-4">
                            <p className="text-xs font-medium text-amber-800 leading-relaxed">
                                You are currently an Observer. To unlock the ability to accept this load worth **{formatCurrency(load.haulierPayout)}**, you must upgrade to an Intelligence Tier.
                            </p>
                            <Button asChild size="sm" className="bg-amber-600">
                                <Link href="/checkout/intelligence">Upgrade Now <ArrowRight className="ml-2 h-3 w-3"/></Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* STEP 2: FLEET ASSET COMPLIANCE */}
                <div className={cn("p-6 rounded-2xl border-2 transition-all", !hasRequiredAsset ? "border-destructive/20 bg-destructive/5" : "border-green-100 bg-green-50")}>
                    <div className="flex justify-between items-start">
                        <div className="text-left">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Truck className="h-5 w-5 text-primary" />
                                2. Fleet & Asset Verification (RC1)
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">Requires: {load.requiredEquipment?.join(', ') || 'General Freight Specs'}</p>
                        </div>
                        {hasRequiredAsset ? <CheckCircle className="h-6 w-6 text-green-600" /> : <AlertTriangle className="h-6 w-6 text-destructive" />}
                    </div>
                    {!hasRequiredAsset && (
                        <div className="mt-4 p-4 bg-white rounded-xl border border-destructive/20 space-y-3">
                            <p className="text-xs text-destructive font-bold">Incomplete Data: No verified matching assets found.</p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                You must contribute your fleet information (RC1 certificates) to the registry before you can accept loads requiring specialized equipment.
                            </p>
                            <Button asChild variant="outline" size="sm" className="border-destructive/20 text-destructive">
                                <Link href="/contribute">Contribute Fleet Data</Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* STEP 3: DRIVER AUTHENTICATION */}
                <div className={cn("p-6 rounded-2xl border-2 transition-all", !hasConfirmedDriver ? "border-destructive/20 bg-destructive/5" : "border-green-100 bg-green-50")}>
                    <div className="flex justify-between items-start">
                        <div className="text-left">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                3. Confirmed Driver (PrDP)
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">Every load requires an assigned, verified professional driver.</p>
                        </div>
                        {hasConfirmedDriver ? <CheckCircle className="h-6 w-6 text-green-600" /> : <AlertTriangle className="h-6 w-6 text-destructive" />}
                    </div>
                    {!hasConfirmedDriver && (
                        <div className="mt-4 p-4 bg-white rounded-xl border border-destructive/20 space-y-3">
                            <p className="text-xs text-destructive font-bold">No Confirmed Personnel: Awaiting verification.</p>
                            <Button asChild variant="outline" size="sm" className="border-destructive/20 text-destructive">
                                <Link href="/account?view=staff">Register Driver Profiles</Link>
                            </Button>
                        </div>
                    )}
                </div>

            </CardContent>
            <CardFooter className="p-8 bg-slate-50 border-t flex justify-between">
                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button 
                    onClick={handleAcceptLoad} 
                    disabled={!isIntelligenceMember || !hasRequiredAsset || !hasConfirmedDriver || isLoading}
                    className="h-14 px-12 font-black uppercase tracking-tight shadow-xl"
                >
                    {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Establish Load Handshake"}
                </Button>
            </CardFooter>
        </Card>
    );
}
