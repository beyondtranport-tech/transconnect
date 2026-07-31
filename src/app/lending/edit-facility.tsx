
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

const facilitySchema = z.object({
  id: z.string().optional(),
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
    { id: 'association', title: 'Global limit', icon: Building, fields: ['clientId', 'debtorId', 'limit'] },
    { id: 'agreement_limit', title: 'Agreement limit', icon: Gavel, fields: ['facilityClass', 'associatedClientId', 'agreementType'] },
    { id: 'details', title: 'Facility Metrics', icon: Banknote, fields: ['type'] },
    { id: 'review', title: 'Review & Commit', icon: ShieldCheck, fields: [] },
];

interface EditFacilityWizardProps {
  facility?: any;
  clients: any[];
  debtors: any[];
  onSave: () => void;
  onBack: () => void;
}

export function EditFacilityWizard({ facility, clients, debtors, onSave, onBack }: EditFacilityWizardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [internalId, setInternalId] = useState<string | null>(facility?.id || null);
    const { toast } = useToast();
    
    const methods = useForm<FacilityFormValues>({
        resolver: zodResolver(facilitySchema),
        mode: 'onChange',
        defaultValues: facility || { 
            ownerType: 'client', 
            facilityClass: 'global',
            limit: 0, 
            status: 'active' 
        }
    });

    const watched = methods.watch();

    useEffect(() => {
        if (facility) {
            methods.reset(facility);
            setInternalId(facility.id);
        }
    }, [facility, methods]);

    /**
     * PERSISTENT AUTOSAVE HANDLER
     */
    const autosave = async (values: FacilityFormValues) => {
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;

            if (!values.ownerType) return;

            const res = await fetchFromAdminAPI(token, 'saveLendingFacility', { 
                facility: { ...values, id: internalId || undefined } 
            });
            
            if (!internalId && res.id) {
                setInternalId(res.id);
                methods.setValue('id', res.id);
            }
        } catch (e) {
            console.warn("Autosave standby - proceeding with local state", e);
        }
    };

    const handleNext = async () => {
        const stepFields = steps[currentStep].fields;
        const isValid = await methods.trigger(stepFields as any);
        
        if (isValid) {
            const currentValues = methods.getValues();
            await autosave(currentValues);
            
            if (currentStep < steps.length - 1) {
                setCurrentStep(prev => prev + 1);
            }
        } else {
            toast({ variant: "destructive", title: "Please complete mandatory fields for this step." });
        }
    };
    
    const handleBackStep = async () => {
        const currentValues = methods.getValues();
        await autosave(currentValues);
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
            toast({ title: facility?.id ? 'Facility Node Updated' : 'Facility Node Initialized' });
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
        if (index > currentStep) {
            const stepFields = steps[currentStep].fields;
            const isValid = await methods.trigger(stepFields as any);
            if (!isValid) return;
        }
        
        const currentValues = methods.getValues();
        await autosave(currentValues);
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
                                        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">Exposure limits for borrowing member nodes.</p>
                                    </div>
                                    <div className={cn("p-6 border-2 rounded-[2rem] cursor-pointer transition-all", field.value === 'debtor' ? "border-primary bg-primary/5 shadow-md" : "bg-white")}>
                                        <div className="flex items-center gap-3 text-left"><RadioGroupItem value="debtor" id="type-debtor" /><Label htmlFor="type-debtor" className="font-black text-xs uppercase cursor-pointer">Debtor Branch</Label></div>
                                        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">Exposure limits for cessionary load providers.</p>
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
                            <FormItem className="text-left"><FormLabel>Select Member Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || ''}><FormControl><SelectTrigger className="h-12 border-2 bg-white font-bold"><SelectValue placeholder="Choose client..." /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></FormItem>
                        )} />
                    ) : (
                        <FormField control={methods.control} name="debtorId" render={({ field }) => (
                            <FormItem className="text-left"><FormLabel>Select Debtor (Cessionary)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || ''}><FormControl><SelectTrigger className="h-12 border-2 bg-white font-bold text-left"><SelectValue placeholder="Choose debtor..." /></SelectTrigger></FormControl><SelectContent>{debtors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></FormItem>
                        )} />
                    )}

                    <FormField control={methods.control} name="limit" render={({ field }) => (
                        <FormItem className="text-left">
                            <FormLabel className="text-primary font-black uppercase text-[10px]">Authorized Limit (ZAR)</FormLabel>
                            <FormControl><Input type="number" {...field} className="h-11 border-2 bg-white text-lg font-black" /></FormControl>
                        </FormItem>
                    )} />
                </div>
            );
            case 'agreement_limit': return (
                <div className="space-y-8 animate-in fade-in duration-500 text-left">
                    <FormField control={methods.control} name="facilityClass" render={({ field }) => (
                        <FormItem className="space-y-4">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Limit Authority Class</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                    <div className={cn("p-4 border-2 rounded-2xl cursor-pointer", field.value === 'global' ? "border-primary bg-primary/5" : "bg-white")}>
                                        <div className="flex items-center gap-3"><RadioGroupItem value="global" id="class-global" /><Label htmlFor="class-global" className="font-bold text-xs uppercase cursor-pointer text-left">Global limit</Label></div>
                                        <p className="text-[9px] text-muted-foreground mt-1">Total exposure across all agreements or entities.</p>
                                    </div>
                                    <div className={cn("p-4 border-2 rounded-2xl cursor-pointer", field.value === 'sub' ? "border-primary bg-primary/5" : "bg-white")}>
                                        <div className="flex items-center gap-3"><RadioGroupItem value="sub" id="class-sub" /><Label htmlFor="class-sub" className="font-bold text-xs uppercase cursor-pointer text-left">{watched.ownerType === 'client' ? 'Sub Agreement' : 'Sub Client'} Limit</Label></div>
                                        <p className="text-[9px] text-muted-foreground mt-1">Cap for specific product or individual member pair.</p>
                                    </div>
                                </RadioGroup>
                            </FormControl>
                        </FormItem>
                    )} />

                    {watched.facilityClass === 'sub' && (
                        <div className="space-y-6 animate-in slide-in-from-top-2">
                            {watched.ownerType === 'client' ? (
                                <FormField control={methods.control} name="agreementType" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Link to Product Agreement</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ''}>
                                            <FormControl><SelectTrigger className="h-11 border-2 bg-white text-left"><SelectValue placeholder="Select Product..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="factoring">Factoring</SelectItem>
                                                <SelectItem value="loan">Asset Loan</SelectItem>
                                                <SelectItem value="installment_sale">Installment Sale</SelectItem>
                                                <SelectItem value="working_capital">Working Capital</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                            ) : (
                                <FormField control={methods.control} name="associatedClientId" render={({ field }) => (
                                    <FormItem className="text-left">
                                        <FormLabel>Authorize for Specific Member Client</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ''}>
                                            <FormControl><SelectTrigger className="h-11 border-2 bg-white text-left"><SelectValue placeholder="Choose member..." /></SelectTrigger></FormControl>
                                            <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                            )}
                        </div>
                    )}
                </div>
            );
             case 'details': return (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={methods.control} name="type" render={({ field }) => (
                            <FormItem className="text-left">
                                <FormLabel>Lending Group</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                    <FormControl><SelectTrigger className="h-11 border-2 bg-white text-left"><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="factoring">Factoring</SelectItem>
                                        <SelectItem value="asset_finance">Asset Finance</SelectItem>
                                        <SelectItem value="working_capital">Working Capital</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                    </div>

                    <div className="p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl space-y-4">
                        <div className="flex items-center gap-3 text-left">
                            <Info className="h-5 w-5 text-primary" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-left">Authority Node Logic</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed text-left">
                            {watched.ownerType === 'client' ? (
                                watched.facilityClass === 'global' 
                                ? "Global Client Limit: The total summation of all active exposure permitted for this member node."
                                : "Sub Agreement Limit: Caps the total exposure for a specific product type (e.g. all factoring deals)."
                            ) : (
                                watched.facilityClass === 'global'
                                ? "Global Debtor Limit: Absolute platform ceiling for this Cessionary. No client sum may breach this."
                                : "Sub Client Limit: Authorizes a specific member client to trade debt against this specific Load Provider."
                            )}
                        </p>
                    </div>
                </div>
            );
            case 'review': return (
                <div className="text-center py-20 space-y-6">
                    <CheckCircle className="h-16 w-16 text-primary mx-auto opacity-40 text-center" />
                    <div className="space-y-2 text-center">
                        <h3 className="text-2xl font-black uppercase">Protocol Confirmation</h3>
                        <p className="text-sm text-muted-foreground max-sm mx-auto leading-relaxed text-center">Verify the authority node boundaries before committing to the global facility ledger.</p>
                    </div>
                </div>
            );
            default: return null;
        }
    };
    
    return (
        <Card>
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader className="bg-slate-900 text-white p-8 border-b border-white/5">
                        <div className="flex justify-between items-center">
                            <div className="text-left">
                                <CardTitle className="text-2xl font-black font-headline uppercase text-left">Initialize Facility Node</CardTitle>
                                <CardDescription className="text-slate-400 text-left">Step: {steps[currentStep].title}</CardDescription>
                            </div>
                            <Button type="button" variant="ghost" className="text-white hover:text-primary" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Ledger</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr]">
                             <div className="bg-slate-50 border-r p-6 space-y-2 text-left">
                                {steps.map((step, index) => {
                                    const Icon = step.icon;
                                    const isCompleted = index < currentStep && isStepValid(index);
                                    return (
                                        <Button key={step.id} type="button" variant={currentStep === index ? 'secondary' : 'ghost'} className={cn("w-full justify-start gap-3 h-10 px-3 transition-all", currentStep === index && "bg-white shadow-sm ring-1 ring-primary/20")} onClick={() => handleStepTransition(index)}>
                                            {isCompleted ? <CheckCircle className="h-4 w-4 text-green-500" /> : <div className={cn("h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold", currentStep >= index ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{index + 1}</div>}
                                            <Icon className={cn("h-4 w-4", currentStep >= index ? "text-primary" : "text-muted-foreground")} />
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest", currentStep === index ? "text-primary" : "text-muted-foreground")}>{step.title}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                             <div className="p-10 space-y-12 bg-white min-h-[500px]">
                                {renderStepContent()}
                             </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t p-8 flex justify-between">
                        <Button type="button" variant="outline" onClick={handleBackStep} disabled={currentStep === 0 || isLoading} className="font-bold">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        {currentStep < steps.length - 1 ? (
                            <Button type="button" onClick={handleNext} className="h-12 px-10 font-black uppercase text-xs text-white">
                                Next Section <ArrowRight className="ml-2 h-4 w-4"/>
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isLoading} className="h-12 bg-primary hover:bg-primary/90 shadow-lg font-black uppercase tracking-tight text-white">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Commit Authority Node
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
