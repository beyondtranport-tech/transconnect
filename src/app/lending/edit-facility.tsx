
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft, ArrowRight, Banknote, Users, CheckCircle, Handshake, Landmark, Building, Info, ShieldCheck, Zap, FileText } from 'lucide-react';
import { getClientSideAuthToken, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// API Helper
async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}

const facilitySchema = z.object({
  ownerType: z.enum(['client', 'debtor']).default('client'),
  facilityClass: z.enum(['global', 'sub']).default('global'),
  clientId: z.string().optional().nullable(),
  debtorId: z.string().optional().nullable(),
  associatedClientId: z.string().optional().nullable(), // For Debtor Sub-limits
  agreementType: z.string().optional().nullable(), // For Client Sub-limits
  type: z.string().min(1, 'Product type is required'),
  limit: z.coerce.number().positive('Limit must be a positive number'),
  status: z.string().default('active'),
});

type FacilityFormValues = z.infer<typeof facilitySchema>;

const steps = [
    { id: 'type', title: 'Context & Branch', icon: Landmark, fields: ['ownerType'] },
    { id: 'association', title: 'Core Association', icon: Building, fields: ['clientId', 'debtorId', 'facilityClass'] },
    { id: 'details', title: 'Facility Metrics', icon: Banknote, fields: ['type', 'limit'] },
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
        }
    }, [facility, methods]);

    const onSubmit = async (values: FacilityFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await performAdminAction(token, 'saveLendingFacility', { facility: { id: facility?.id, ...values } });
            toast({ title: facility?.id ? 'Facility Node Updated' : 'Facility Node Initialized' });
            onSave();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleNext = async () => {
        const stepFields = steps[currentStep].fields;
        const isValid = await methods.trigger(stepFields as any);
        if (isValid && currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else if (!isValid) {
            toast({ variant: "destructive", title: "Please complete mandatory fields for this step." });
        }
    };
    
    const handleBackStep = () => setCurrentStep(prev => prev - 1);
    
    const isStepValid = (stepIndex: number) => {
        if (stepIndex < 0 || stepIndex >= steps.length) return true;
        const step = steps[stepIndex];
        if (!step.fields || step.fields.length === 0) return true;
        return step.fields.every(field => !methods.formState.errors[field as keyof typeof methods.formState.errors]);
    };
    
    const renderStepContent = () => {
        const stepId = steps[currentStep]?.id;
        switch (stepId) {
            case 'type': return (
                 <div className="space-y-6 text-left text-foreground">
                    <FormField control={methods.control} name="ownerType" render={({ field }) => (
                        <FormItem className="space-y-4 text-left">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Identify Authority Branch</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                    <div className={cn("p-6 border-2 rounded-[2rem] cursor-pointer transition-all", field.value === 'client' ? "border-primary bg-primary/5 shadow-md" : "bg-white")}>
                                        <div className="flex items-center gap-3"><RadioGroupItem value="client" id="type-client" /><Label htmlFor="type-client" className="font-black text-xs uppercase cursor-pointer">Client Branch</Label></div>
                                        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">Exposure limits for borrowing member nodes.</p>
                                    </div>
                                    <div className={cn("p-6 border-2 rounded-[2rem] cursor-pointer transition-all", field.value === 'debtor' ? "border-primary bg-primary/5 shadow-md" : "bg-white")}>
                                        <div className="flex items-center gap-3"><RadioGroupItem value="debtor" id="type-debtor" /><Label htmlFor="type-debtor" className="font-black text-xs uppercase cursor-pointer">Debtor Branch</Label></div>
                                        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">Exposure limits for cessionary load providers.</p>
                                    </div>
                                </RadioGroup>
                            </FormControl>
                        </FormItem>
                    )} />
                </div>
            );
            case 'association': return (
                <div className="space-y-8 animate-in fade-in duration-500 text-left text-foreground">
                    {watched.ownerType === 'client' ? (
                        <div className="space-y-8 text-left">
                            <FormField control={methods.control} name="clientId" render={({ field }) => (
                                <FormItem className="text-left"><FormLabel>Select Member Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || ''}><FormControl><SelectTrigger className="h-12 border-2 bg-white font-bold"><SelectValue placeholder="Choose client..." /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></FormItem>
                            )} />

                            <FormField control={methods.control} name="facilityClass" render={({ field }) => (
                                <FormItem className="space-y-4 text-left">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Client Authority Type</FormLabel>
                                    <FormControl>
                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                            <div className={cn("p-4 border-2 rounded-2xl cursor-pointer", field.value === 'global' ? "border-primary bg-primary/5" : "bg-white")}>
                                                <div className="flex items-center gap-3"><RadioGroupItem value="global" id="c-global" /><Label htmlFor="c-global" className="font-bold text-xs uppercase cursor-pointer text-left">Global limit</Label></div>
                                                <p className="text-[9px] text-muted-foreground mt-1">Total exposure across ALL agreements.</p>
                                            </div>
                                            <div className={cn("p-4 border-2 rounded-2xl cursor-pointer", field.value === 'sub' ? "border-primary bg-primary/5" : "bg-white")}>
                                                <div className="flex items-center gap-3"><RadioGroupItem value="sub" id="c-sub" /><Label htmlFor="c-sub" className="font-bold text-xs uppercase cursor-pointer text-left">Sub Agreement Limit</Label></div>
                                                <p className="text-[9px] text-muted-foreground mt-1">Cap for specific product (e.g. Factoring).</p>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                </FormItem>
                            )} />

                            {watched.facilityClass === 'sub' && (
                                <FormField control={methods.control} name="agreementType" render={({ field }) => (
                                    <FormItem className="animate-in slide-in-from-top-2 text-left">
                                        <FormLabel>Link to Product Agreement</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                                            <FormControl><SelectTrigger className="h-11 border-2 bg-white"><SelectValue placeholder="Select Product..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="factoring">Factoring</SelectItem>
                                                <SelectItem value="loan">Asset Loan</SelectItem>
                                                <SelectItem value="installment_sale">Installment Sale</SelectItem>
                                                <SelectItem value="working_capital">Working Capital</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8 text-left text-foreground">
                            <FormField control={methods.control} name="debtorId" render={({ field }) => (
                                <FormItem className="text-left"><FormLabel>Select Debtor (Cessionary)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || ''}><FormControl><SelectTrigger className="h-12 border-2 bg-white font-bold"><SelectValue placeholder="Choose debtor..." /></SelectTrigger></FormControl><SelectContent>{debtors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></FormItem>
                            )} />

                            <FormField control={methods.control} name="facilityClass" render={({ field }) => (
                                <FormItem className="space-y-4 text-left">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Debtor Authority Type</FormLabel>
                                    <FormControl>
                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                            <div className={cn("p-4 border-2 rounded-2xl cursor-pointer", field.value === 'global' ? "border-primary bg-primary/5" : "bg-white")}>
                                                <div className="flex items-center gap-3"><RadioGroupItem value="global" id="d-global" /><Label htmlFor="d-global" className="font-bold text-xs uppercase cursor-pointer text-left">Global Platform limit</Label></div>
                                                <p className="text-[9px] text-muted-foreground mt-1">Total exposure for this debtor across the grid.</p>
                                            </div>
                                            <div className={cn("p-4 border-2 rounded-2xl cursor-pointer", field.value === 'sub' ? "border-primary bg-primary/5" : "bg-white")}>
                                                <div className="flex items-center gap-3"><RadioGroupItem value="sub" id="d-sub" /><Label htmlFor="d-sub" className="font-bold text-xs uppercase cursor-pointer text-left">Sub Client Limit</Label></div>
                                                <p className="text-[9px] text-muted-foreground mt-1">Cap per individual member client.</p>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                </FormItem>
                            )} />

                            {watched.facilityClass === 'sub' && (
                                <FormField control={methods.control} name="associatedClientId" render={({ field }) => (
                                    <FormItem className="animate-in slide-in-from-top-2 text-left">
                                        <FormLabel>Authorize for Specific Client</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                                            <FormControl><SelectTrigger className="h-11 border-2 bg-white"><SelectValue placeholder="Choose member..." /></SelectTrigger></FormControl>
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
                <div className="space-y-6 text-left text-foreground">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        <FormField control={methods.control} name="type" render={({ field }) => (
                            <FormItem className="text-left">
                                <FormLabel>Lending category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                                    <FormControl><SelectTrigger className="h-11 border-2 bg-white"><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="factoring">Factoring</SelectItem>
                                        <SelectItem value="asset_finance">Asset Finance</SelectItem>
                                        <SelectItem value="working_capital">Working Capital</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                        <FormField control={methods.control} name="limit" render={({ field }) => (
                            <FormItem className="text-left">
                                <FormLabel className="text-primary font-black uppercase text-[10px]">Authorized Limit (ZAR)</FormLabel>
                                <FormControl><Input type="number" {...field} className="h-11 border-2 bg-white text-lg font-black" /></FormControl>
                            </FormItem>
                        )} />
                    </div>

                    <div className="p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl space-y-4 text-left">
                        <div className="flex items-center gap-3">
                            <Info className="h-5 w-5 text-primary" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-white">Authority node Logic</h4>
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
                <div className="text-center py-20 space-y-6 text-left">
                    <CheckCircle className="h-16 w-16 text-primary mx-auto opacity-40" />
                    <div className="space-y-2 text-center text-foreground">
                        <h3 className="text-2xl font-black uppercase text-center">Protocol Confirmation</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed text-center">Verify the authority node boundaries before committing to the global facility ledger.</p>
                    </div>
                </div>
            );
            default: return null;
        }
    };
    
    return (
        <Card className="max-w-5xl mx-auto shadow-2xl border-none overflow-hidden text-left text-foreground">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader className="bg-slate-900 text-white p-8 border-b border-white/5">
                        <div className="flex justify-between items-center text-white">
                            <div className="text-left">
                                <CardTitle className="text-2xl font-black font-headline uppercase text-white">Initialize Facility Node</CardTitle>
                                <CardDescription className="text-slate-400">Step: {steps[currentStep].title}</CardDescription>
                            </div>
                            <Button type="button" variant="ghost" className="text-white hover:text-primary" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4"/> Back to Ledger</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] text-left">
                             <div className="bg-slate-50 border-r p-6 space-y-2 text-left">
                                {steps.map((step, index) => {
                                    const Icon = step.icon;
                                    const isCompleted = index < currentStep && isStepValid(index);
                                    return (
                                        <Button key={step.id} type="button" variant={currentStep === index ? 'secondary' : 'ghost'} className={cn("w-full justify-start gap-3 h-10 px-3 transition-all text-left", currentStep === index && "bg-white shadow-sm ring-1 ring-primary/20")} onClick={() => setCurrentStep(index)}>
                                            {isCompleted ? <CheckCircle className="h-4 w-4 text-green-500" /> : <div className={cn("h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold", currentStep >= index ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{index + 1}</div>}
                                            <Icon className={cn("h-4 w-4", currentStep >= index ? "text-primary" : "text-muted-foreground")} />
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest", currentStep === index ? "text-primary" : "text-muted-foreground")}>{step.title}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                             <div className="p-10 space-y-12 bg-white min-h-[500px] text-left">
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
