'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft, ArrowRight, Banknote, Landmark, Building, Info, ShieldCheck, Zap, CheckCircle, Gavel } from 'lucide-react';
import { getClientSideAuthToken, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { cn, fetchFromAdminAPI } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

const facilitySchema = z.object({
  id: z.string().optional(),
  parentId: z.string().optional().nullable(),
  ownerType: z.enum(['client', 'debtor']).default('client'),
  facilityClass: z.enum(['global', 'sub']).default('global'),
  clientId: z.string().optional().nullable(),
  debtorId: z.string().optional().nullable(),
  associatedClientId: z.string().optional().nullable(), 
  agreementType: z.string().optional().nullable(), 
  type: z.string().min(1, 'Product type is required'),
  limit: z.coerce.number().positive('Limit must be a positive number'),
  status: z.string().default('active'),
});

type FacilityFormValues = z.infer<typeof facilitySchema>;

const steps = [
    { id: 'type', title: 'Context & Branch', icon: Landmark, fields: ['ownerType'] },
    { id: 'association', title: 'Entity & Limit', icon: Building, fields: ['clientId', 'debtorId', 'limit'] },
    { id: 'agreement_limit', title: 'Sub-Authorization', icon: Gavel, fields: ['facilityClass', 'associatedClientId', 'agreementType'] },
    { id: 'details', title: 'Product Group', icon: Banknote, fields: ['type'] },
    { id: 'review', title: 'Review & Commit', icon: ShieldCheck, fields: [] },
];

interface EditFacilityWizardProps {
  facility?: any;
  parentFacility?: any; // Used when creating a sub-limit
  clients: any[];
  debtors: any[];
  onSave: () => void;
  onBack: () => void;
}

export function EditFacilityWizard({ facility, parentFacility, clients, debtors, onSave, onBack }: EditFacilityWizardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [internalId, setInternalId] = useState<string | null>(facility?.id || null);
    const { toast } = useToast();
    const firestore = useFirestore();
    
    // Determine if this is a sub-limit creation workflow
    const isSubLimitMode = !!parentFacility;

    const methods = useForm<FacilityFormValues>({
        resolver: zodResolver(facilitySchema),
        mode: 'onChange',
        defaultValues: facility || { 
            ownerType: parentFacility?.ownerType || 'client', 
            facilityClass: isSubLimitMode ? 'sub' : 'global',
            parentId: parentFacility?.id || null,
            clientId: parentFacility?.clientId || null,
            debtorId: parentFacility?.debtorId || null,
            limit: 0, 
            status: 'active' 
        }
    });

    const watched = methods.watch();

    useEffect(() => {
        if (facility) {
            methods.reset(facility);
            setInternalId(facility.id);
        } else if (parentFacility) {
            methods.reset({
                ...methods.getValues(),
                ownerType: parentFacility.ownerType,
                facilityClass: 'sub',
                parentId: parentFacility.id,
                clientId: parentFacility.clientId,
                debtorId: parentFacility.debtorId,
            });
            // If in sub-limit mode, skip to the relevant step
            setCurrentStep(2);
        }
    }, [facility, parentFacility, methods]);

    const autosave = async (values: FacilityFormValues) => {
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            const res = await fetchFromAdminAPI(token, 'saveLendingFacility', { 
                facility: { ...values, id: internalId || undefined } 
            });
            if (!internalId && res.id) {
                setInternalId(res.id);
                methods.setValue('id', res.id);
            }
        } catch (e) {
            console.warn("Autosave standby", e);
        }
    };

    const handleNext = async () => {
        const stepFields = steps[currentStep].fields;
        const isValid = await methods.trigger(stepFields as any);
        if (isValid) {
            await autosave(methods.getValues());
            if (currentStep < steps.length - 1) setCurrentStep(prev => prev + 1);
        } else {
            toast({ variant: "destructive", title: "Complete all fields to proceed." });
        }
    };
    
    const handleBackStep = async () => {
        await autosave(methods.getValues());
        // If sub-limit mode, don't allow going back past step 2
        if (isSubLimitMode && currentStep === 2) {
            onBack();
            return;
        }
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const onSubmit = async (values: FacilityFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await fetchFromAdminAPI(token, 'saveLendingFacility', { 
                facility: { ...values, id: internalId || undefined } 
            });
            toast({ title: 'Authority Node Committed' });
            onSave();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    const isStepValid = (stepIndex: number) => {
        if (stepIndex < 0 || stepIndex >= steps.length) return true;
        const step = steps[stepIndex];
        if (!step.fields || step.fields.length === 0) return true;
        return step.fields.every(field => !methods.formState.errors[field as keyof typeof methods.formState.errors]);
    };

    const handleStepTransition = async (index: number) => {
        if (isSubLimitMode && index < 2) return; // Block going back to core selection
        if (index > currentStep) {
            const stepFields = steps[currentStep].fields;
            const isValid = await methods.trigger(stepFields as any);
            if (!isValid) return;
        }
        await autosave(methods.getValues());
        setCurrentStep(index);
    };
    
    const renderStepContent = () => {
        const stepId = steps[currentStep]?.id;
        switch (stepId) {
            case 'type': return (
                 <div className="space-y-6 text-left">
                    <FormField control={methods.control} name="ownerType" render={({ field }) => (
                        <FormItem className="space-y-4">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Identify Authority Branch</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                    <div className={cn("p-6 border-2 rounded-[2rem] cursor-pointer transition-all", field.value === 'client' ? "border-primary bg-primary/5 shadow-md" : "bg-white")}>
                                        <div className="flex items-center gap-3 text-left"><RadioGroupItem value="client" id="type-client" /><Label htmlFor="type-client" className="font-black text-xs uppercase cursor-pointer">Client Branch</Label></div>
                                        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed text-left text-foreground">Exposure limits for borrowing member nodes.</p>
                                    </div>
                                    <div className={cn("p-6 border-2 rounded-[2rem] cursor-pointer transition-all", field.value === 'debtor' ? "border-primary bg-primary/5 shadow-md" : "bg-white")}>
                                        <div className="flex items-center gap-3 text-left text-foreground"><RadioGroupItem value="debtor" id="type-debtor" /><Label htmlFor="type-debtor" className="font-black text-xs uppercase cursor-pointer">Debtor Branch</Label></div>
                                        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed text-left text-foreground">Exposure limits for cessionary load providers.</p>
                                    </div>
                                </RadioGroup>
                            </FormControl>
                        </FormItem>
                    )} />
                </div>
            );
            case 'association': return (
                <div className="space-y-8 animate-in fade-in duration-500 text-left">
                    {watched.ownerType === 'client' ? (
                        <FormField control={methods.control} name="clientId" render={({ field }) => (
                            <FormItem className="text-left text-foreground"><FormLabel>Select Member Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || ''}><FormControl><SelectTrigger className="h-12 border-2 bg-white font-bold text-left text-foreground"><SelectValue placeholder="Choose client..." /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></FormItem>
                        )} />
                    ) : (
                        <FormField control={methods.control} name="debtorId" render={({ field }) => (
                            <FormItem className="text-left text-foreground text-foreground"><FormLabel>Select Debtor (Cessionary)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || ''}><FormControl><SelectTrigger className="h-12 border-2 bg-white font-bold text-left text-foreground"><SelectValue placeholder="Choose debtor..." /></SelectTrigger></FormControl><SelectContent>{debtors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></FormItem>
                        )} />
                    )}

                    <FormField control={methods.control} name="limit" render={({ field }) => (
                        <FormItem className="text-left text-foreground">
                            <FormLabel className="text-primary font-black uppercase text-[10px] text-left text-foreground">Authorized Limit (ZAR)</FormLabel>
                            <FormControl><Input type="number" {...field} className="h-11 border-2 bg-white text-lg font-black text-left text-foreground" /></FormControl>
                        </FormItem>
                    )} />
                </div>
            );
            case 'agreement_limit': return (
                <div className="space-y-8 animate-in fade-in duration-500 text-left text-foreground">
                    <Alert className="bg-primary/5 border-primary/20 p-6 rounded-[2rem] text-left text-foreground">
                        <Gavel className="h-6 w-6 text-primary" />
                        <div className="ml-2 text-left text-foreground">
                            <AlertTitle className="font-black uppercase text-xs tracking-widest text-primary text-left">Partition Logic Active</AlertTitle>
                            <AlertDescription className="text-[11px] leading-relaxed mt-1 text-left text-foreground">
                                You are initializing a **Sub-Limit**. This node authorizes specific exposure within the parent entity's global ceiling.
                            </AlertDescription>
                        </div>
                    </Alert>

                    <div className="p-8 border-2 rounded-[2.5rem] bg-white space-y-6 shadow-sm text-left text-foreground">
                        {watched.ownerType === 'client' ? (
                            <FormField control={methods.control} name="agreementType" render={({ field }) => (
                                <FormItem className="text-left text-foreground">
                                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Target Product Agreement</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                        <FormControl><SelectTrigger className="h-12 border-2 bg-white text-left font-bold text-foreground"><SelectValue placeholder="Select Product..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="factoring">Factoring</SelectItem>
                                            <SelectItem value="asset_finance">Asset Finance</SelectItem>
                                            <SelectItem value="working_capital">Working Capital</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                        ) : (
                            <FormField control={methods.control} name="associatedClientId" render={({ field }) => (
                                <FormItem className="text-left text-foreground">
                                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Authorize for Specific Member Client</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                        <FormControl><SelectTrigger className="h-12 border-2 bg-white text-left font-bold text-foreground"><SelectValue placeholder="Choose member..." /></SelectTrigger></FormControl>
                                        <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                        )}

                        <FormField control={methods.control} name="limit" render={({ field }) => (
                            <FormItem className="text-left text-foreground">
                                <FormLabel className="text-[10px] font-black uppercase text-primary ml-1">Authorized Sub-Node Limit (ZAR)</FormLabel>
                                <FormControl><Input type="number" {...field} className="h-11 border-2 bg-white text-lg font-black text-foreground" /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                </div>
            );
             case 'details': return (
                <div className="space-y-6 text-left text-foreground">
                    <FormField control={methods.control} name="type" render={({ field }) => (
                        <FormItem className="text-left text-foreground">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 text-left text-foreground">Lending Group Classification</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl><SelectTrigger className="h-12 border-2 bg-white text-left font-bold text-foreground"><SelectValue placeholder="Select group..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="factoring">Factoring (Discounting)</SelectItem>
                                    <SelectItem value="asset_finance">Asset Finance (Lease/Sale)</SelectItem>
                                    <SelectItem value="working_capital">Working Capital (Loan)</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />

                    <div className="p-8 bg-slate-900 text-white rounded-[2rem] shadow-xl space-y-4 text-left text-foreground">
                        <div className="flex items-center gap-3 text-left text-foreground">
                            <Info className="h-5 w-5 text-primary text-left text-white" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary text-left text-white">Authority Context</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed text-left text-white">
                            Sub-Node Type: Determines the functional matching logic. Only enquiries of this group will be matched against this authority node.
                        </p>
                    </div>
                </div>
            );
            case 'review': return (
                <div className="text-center py-20 space-y-6 text-left text-foreground">
                    <CheckCircle className="h-16 w-16 text-primary mx-auto opacity-40 text-center" />
                    <div className="space-y-2 text-center text-foreground text-left">
                        <h3 className="text-3xl font-black uppercase">Final Protocol Check</h3>
                        <p className="text-sm text-muted-foreground max-sm mx-auto leading-relaxed text-center">Confirm functional boundaries before committing this node to the global authority ledger.</p>
                    </div>
                </div>
            );
            default: return null;
        }
    };
    
    return (
        <Card className="max-w-6xl mx-auto shadow-2xl border-none overflow-hidden text-left text-foreground">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader className="bg-slate-900 text-white p-10 border-b border-white/5 text-left text-foreground text-foreground">
                        <div className="flex justify-between items-center text-left text-foreground">
                            <div className="text-left text-foreground text-left text-white">
                                <CardTitle className="text-3xl font-black font-headline uppercase text-left text-white">Authority Node Terminal</CardTitle>
                                <CardDescription className="text-slate-400 text-lg mt-1 text-left text-white">Protocol: {isSubLimitMode ? 'Partitioned Sub-Authorization' : 'Global Ceiling Initialization'}</CardDescription>
                            </div>
                            <Button type="button" variant="ghost" className="text-white hover:text-primary" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Ledger</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 text-left text-foreground text-foreground">
                        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] text-left text-foreground">
                             <div className="bg-slate-50 border-r p-8 space-y-2 text-left text-foreground">
                                {steps.map((step, index) => {
                                    const Icon = step.icon;
                                    const isCompleted = index < currentStep && isStepValid(index);
                                    const isDisabled = isSubLimitMode && index < 2;
                                    
                                    return (
                                        <Button 
                                            key={step.id} 
                                            type="button" 
                                            variant={currentStep === index ? 'secondary' : 'ghost'} 
                                            className={cn(
                                                "w-full justify-start gap-4 h-12 px-4 transition-all text-left text-foreground", 
                                                currentStep === index && "bg-white shadow-sm ring-1 ring-primary/20",
                                                isDisabled && "opacity-30 cursor-not-allowed"
                                            )} 
                                            onClick={() => handleStepTransition(index)}
                                            disabled={isDisabled}
                                        >
                                            {isCompleted ? <CheckCircle className="h-5 w-5 text-green-600" /> : <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black", currentStep >= index ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{index + 1}</div>}
                                            <Icon className={cn("h-5 w-5", currentStep >= index ? "text-primary" : "text-muted-foreground")} />
                                            <span className={cn("text-[10px] font-black uppercase tracking-[0.1em]", currentStep === index ? "text-primary" : "text-muted-foreground")}>{step.title}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                             <div className="p-12 space-y-12 bg-white min-h-[550px] text-left text-foreground text-foreground text-foreground">
                                {renderStepContent()}
                             </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t p-10 flex justify-between text-left text-foreground text-foreground">
                        <Button type="button" variant="outline" onClick={handleBackStep} className="font-bold h-12 px-8 text-foreground text-left text-foreground">
                            <ArrowLeft className="mr-2 h-4 w-4" /> {isSubLimitMode && currentStep === 2 ? 'Cancel' : 'Back'}
                        </Button>
                        {currentStep < steps.length - 1 ? (
                            <Button type="button" onClick={handleNext} className="h-12 px-12 font-black uppercase text-xs text-white shadow-lg text-left text-foreground text-foreground">
                                Next Protocol Stage <ArrowRight className="ml-2 h-4 w-4"/>
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isLoading} className="h-14 px-16 bg-primary hover:bg-primary/90 shadow-2xl font-black uppercase tracking-tight text-white text-left text-foreground">
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                                Commit Node to Ledger
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
