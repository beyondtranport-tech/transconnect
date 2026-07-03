
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, ShieldCheck, Truck, Users, Lock, CheckCircle, Info, Landmark, MapPin, AlertTriangle, UserPlus, Database, Gavel, FileSignature } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, getClientSideAuthToken } from '@/firebase';
import { doc, collection, query, where, serverTimestamp, setDoc } from 'firebase/firestore';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
    const [noCircumventionAccepted, setNoCircumventionAccepted] = useState(false);

    // 1. INTELLIGENCE AUDIT
    const isIntelligenceMember = user?.companyData?.membershipId && user.companyData.membershipId !== 'free';

    // 2. FLEET COMPLIANCE AUDIT (Uses Data as Currency logic)
    const fleetQuery = useMemoFirebase(() => {
        if (!firestore || !user?.companyId) return null;
        // Check for active facilities as a proxy for verified equipment
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
        if (!noCircumventionAccepted) {
            toast({ variant: 'destructive', title: 'Action Required', description: 'You must accept the non-circumvention terms.' });
            return;
        }

        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;

            const loadRef = doc(firestore, `companies/${load.brokerId}/loadBoard/loads/${load.id}`);
            await setDoc(loadRef, {
                status: 'assigned',
                takerId: user!.companyId,
                acceptedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });

            toast({ title: "Load Secured", description: "Trust binding established. Proceed to dispatch." });
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
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Performing Registry Compliance Audit...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
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
                    
                    {/* SECTION 1: TRUST & NON-CIRCUMVENTION */}
                    <div className="p-8 rounded-3xl border-2 border-primary bg-primary/5 shadow-sm text-left">
                        <div className="flex justify-between items-start text-left mb-6">
                            <div className="text-left space-y-1">
                                <h3 className="font-black text-xl flex items-center gap-2 text-foreground">
                                    <Gavel className="h-6 w-6 text-primary" />
                                    1. Trust Binding (No-Circumvention)
                                </h3>
                                <p className="text-sm text-muted-foreground">You are acting as a Subcontractor to the Primary Contractor.</p>
                            </div>
                            <Badge className="bg-primary text-white font-black uppercase text-[10px] tracking-widest">Required</Badge>
                        </div>
                        
                        <div className="p-6 bg-white rounded-2xl border border-primary/20 space-y-4 shadow-inner text-left">
                             <div className="flex items-start gap-4">
                                <Checkbox 
                                    id="circumvention-check" 
                                    checked={noCircumventionAccepted} 
                                    onCheckedChange={(c) => setNoCircumventionAccepted(!!c)} 
                                    className="mt-1 h-5 w-5"
                                />
                                <Label htmlFor="circumvention-check" className="text-sm font-medium leading-relaxed cursor-pointer text-left">
                                    I hereby agree to the **Non-Circumvention Clause**. I understand that I am prohibited from directly approaching or engaging the Debtor ({load.providerName || 'The Client'}) for this load or future work without the express written consent of the Primary Contractor.
                                </Label>
                             </div>
                        </div>
                    </div>

                    {/* SECTION 2: INTELLIGENCE TIER */}
                    <div className={cn("p-8 rounded-3xl border-2 transition-all shadow-sm text-left", !isIntelligenceMember ? "border-amber-200 bg-amber-50" : "border-green-100 bg-green-50")}>
                        <div className="flex justify-between items-start text-left">
                            <div className="text-left space-y-1">
                                <h3 className="font-black text-xl flex items-center gap-2 text-foreground">
                                    <Landmark className="h-6 w-6 text-primary" />
                                    2. Intelligence Activation
                                </h3>
                                <p className="text-sm text-muted-foreground">Only authorized Intelligence Tiers can engage in commercial handshakes.</p>
                            </div>
                            {isIntelligenceMember ? <CheckCircle className="h-8 w-8 text-green-600" /> : <Lock className="h-8 w-8 text-amber-600" />}
                        </div>
                        {!isIntelligenceMember && (
                            <div className="mt-8 p-6 bg-white rounded-2xl border border-amber-200 space-y-4 shadow-inner text-left">
                                <p className="text-sm font-medium text-amber-800 leading-relaxed text-left">
                                    This load has a verified payout of **{formatCurrency(load.haulierPayout)}**. To accept and start earning, activate your **Loads Intelligence** node for R75/mo.
                                </p>
                                <Button asChild size="lg" className="w-full bg-amber-600 hover:bg-amber-700 font-bold h-14">
                                    <Link href="/checkout/loads_intelligence">Unlock Earning Power <ArrowRight className="ml-2 h-4 w-4"/></Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* SECTION 3: FLEET COMPLIANCE */}
                    <div className={cn("p-8 rounded-3xl border-2 transition-all shadow-sm text-left", !hasRequiredAsset ? "border-destructive/20 bg-destructive/5" : "border-green-100 bg-green-50")}>
                        <div className="flex justify-between items-start text-left">
                            <div className="text-left space-y-1">
                                <h3 className="font-black text-xl flex items-center gap-2 text-foreground">
                                    <Truck className="h-6 w-6 text-primary" />
                                    3. Verified Fleet Asset (RC1)
                                </h3>
                                <p className="text-sm text-muted-foreground">Required Equipment: {load.requiredEquipment?.join(', ')}</p>
                            </div>
                            {hasRequiredAsset ? <CheckCircle className="h-8 w-8 text-green-600" /> : <AlertTriangle className="h-8 w-8 text-destructive" />}
                        </div>
                        {!hasRequiredAsset && (
                            <div className="mt-6 p-6 bg-white rounded-2xl border border-destructive/20 space-y-4 shadow-inner text-left">
                                <p className="text-xs text-muted-foreground leading-relaxed text-left">
                                    You have not registered any verified **RC1 assets** in your registry node. The primary contractor requires forensic proof of capacity before the handshake.
                                </p>
                                <Button asChild variant="outline" size="lg" className="w-full border-destructive/20 text-destructive font-bold h-12">
                                    <Link href="/contribute">Upload RC1 Verified Fleet Data</Link>
                                </Button>
                            </div>
                        )}
                    </div>

                </CardContent>
                <CardFooter className="p-10 bg-slate-50 border-t flex flex-col md:flex-row justify-between items-center gap-6">
                    <Button variant="ghost" onClick={onCancel} className="font-bold text-muted-foreground">Cancel Transaction</Button>
                    <div className="flex flex-col gap-2 w-full md:w-auto text-left">
                        <Button 
                            onClick={handleAcceptLoad} 
                            disabled={!isIntelligenceMember || !hasRequiredAsset || !hasConfirmedDriver || !noCircumventionAccepted || isLoading}
                            className="h-16 px-16 text-lg font-black uppercase tracking-tight shadow-2xl bg-primary hover:bg-primary/90 text-white"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : "Authorize Load Handshake"}
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground italic">Acceptance binding is legal and binding.</p>
                    </div>
                </CardFooter>
            </Card>

            {/* FACTORING NUDGE */}
            {isIntelligenceMember && (
                <Alert className="mt-8 bg-blue-50 border-blue-200 max-w-4xl mx-auto text-left">
                    <FileSignature className="h-5 w-5 text-blue-600" />
                    <AlertTitle className="font-black text-blue-900">Capital Flow Option: Factoring Ready</AlertTitle>
                    <AlertDescription className="text-sm text-blue-800 leading-relaxed mt-1 text-left">
                        Because this is a verified platform load, this invoice is eligible for **Instant Factoring**. Once you complete the delivery, you can request an 80% advance from our Finance Division directly from your dashboard.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
