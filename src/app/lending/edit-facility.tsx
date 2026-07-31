
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft, ArrowRight, Banknote, Users, CheckCircle, Handshake, Landmark, Building, Info, ShieldCheck, Zap } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
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
  facilityClass: z.enum(['global', 'client_specific']).default('global'),
  clientId: z.string().optional().nullable(),
  debtorId: z.string().optional().nullable(),
  associatedClientId: z.string().optional().nullable(),
  partnerId: z.string().optional().nullable(),
  type: z.string().min(1, 'Facility type is required'),
  limit: z.coerce.number().positive('Limit must be a positive number'),
  status: z.string().default('active'),
});

type FacilityFormValues = z.infer<typeof facilitySchema>;

const steps = [
    { id: 'type', title: 'Context & Type', icon: Landmark, fields: ['ownerType'] },
    { id: 'association', title: 'Core Association', icon: Building, fields: ['clientId', 'debtorId', 'facilityClass'] },
    { id: 'details', title: 'Facility Metrics', icon: Banknote, fields: ['type', 'limit'] },
    { id: 'review', title: 'Review & Commit', icon: ShieldCheck, fields: [] },
];

interface EditFacilityWizardProps {
  facility?: any;
  clients: any[];
  debtors: any[];
  partners: any[];
  onSave: () => void;
  onBack: () => void;
}

export function EditFacilityWizard({ facility, clients, debtors, partners, onSave, onBack }: EditFacilityWizardProps) {
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
            toast({ title: facility?.id ? 'Facility Updated' : 'Facility Initialized' });
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
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Establish Facility Context</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                    <div className={cn("p-6 border-2 rounded-[2rem] cursor-pointer transition-all", field.value === 'client' ? "border-primary bg-primary/5 shadow-md" : "bg-white")}>
                                        <div className="flex items-center gap-3"><RadioGroupItem value="client" id="type-client" /><Label htmlFor="cap-client" className="font-black text-xs uppercase cursor-pointer">Client Node</Label></div>
                                        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">Direct exposure limit for a borrowing member.</p>
                                    </div>
                                    <div className={cn("p-6 border-2 rounded-[2rem] cursor-pointer transition-all", field.value === 'debtor' ? "border-primary bg-primary/5 shadow-md" : "bg-white")}>
                                        <div className="flex items-center gap-3"><RadioGroupItem value="debtor" id="type-debtor" /><Label htmlFor="cap-debtor" className="font-black text-xs uppercase cursor-pointer">Debtor Node</Label></div>
                                        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">Exposure limit for a Load Provider/Cessionary.</p>
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
                        <FormField control={methods.control} name="clientId" render={({ field }) => (
                            <FormItem className="text-left"><FormLabel>Select Member Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || ''}><FormControl><SelectTrigger className="h-12 border-2 bg-white"><SelectValue placeholder="Choose client..." /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></FormItem>
                        )} />
                    ) : (
                        <div className="space-y-8 text-left text-foreground">
                            <FormField control={methods.control} name="debtorId" render={({ field }) => (
                                <FormItem className="text-left"><FormLabel>Select Debtor (Cessionary)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || ''}><FormControl><SelectTrigger className="h-12 border-2 bg-white"><SelectValue placeholder="Choose debtor..." /></SelectTrigger></FormControl><SelectContent>{debtors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></FormItem>
                            )} />

                            <FormField control={methods.control} name="facilityClass" render={({ field }) => (
                                <FormItem className="space-y-4 text-left">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Debtor Facility class</FormLabel>
                                    <FormControl>
                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                            <div className={cn("p-4 border-2 rounded-2xl cursor-pointer", field.value === 'global' ? "border-primary bg-primary/5" : "bg-white")}>
                                                <div className="flex items-center gap-3"><RadioGroupItem value="global" id="class-global" /><Label htmlFor="class-global" className="font-bold text-xs uppercase cursor-pointer">Global Debtor Limit</Label></div>
                                                <p className="text-[9px] text-muted-foreground mt-1">Total limit across all clients for this debtor.</p>
                                            </div>
                                            <div className={cn("p-4 border-2 rounded-2xl cursor-pointer", field.value === 'client_specific' ? "border-primary bg-primary/5" : "bg-white")}>
                                                <div className="flex items-center gap-3"><RadioGroupItem value="client_specific" id="class-client" /><Label htmlFor="class-client" className="font-bold text-xs uppercase cursor-pointer">Client-Specific Limit</Label></div>
                                                <p className="text-[9px] text-muted-foreground mt-1">Authorized limit for a specific Client-Debtor pair.</p>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                </FormItem>
                            )} />

                            {watched.facilityClass === 'client_specific' && (
                                <FormField control={methods.control} name="associatedClientId" render={({ field }) => (
                                    <FormItem className="animate-in slide-in-from-top-2 text-left text-foreground">
                                        <FormLabel>Link to Member Client</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                                            <FormControl><SelectTrigger className="h-12 border-2 bg-white"><SelectValue placeholder="Choose member..." /></SelectTrigger></FormControl>
                                            <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormDescription className="text-[10px] italic">This sets the "accepted per-client" limit for this Load Provider.</FormDescription>
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
                            <FormItem className="text-left text-foreground">
                                <FormLabel>Product Group</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                                    <FormControl><SelectTrigger className="h-11 border-2 bg-white"><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="factoring">Factoring (Debtors)</SelectItem>
                                        <SelectItem value="loan">Asset Loan</SelectItem>
                                        <SelectItem value="lease">Asset Lease</SelectItem>
                                        <SelectItem value="installment_sale">Installment Sale</SelectItem>
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

                    <div className="p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl space-y-4">
                        <div className="flex items-center gap-3">
                            <Info className="h-5 w-5 text-primary" />
                            <h4 className="text-xs font-black uppercase tracking-widest">Protocol Logic</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            {watched.ownerType === 'debtor' && watched.facilityClass === 'global' ? (
                                "This Global Limit caps the total exposure the platform will accept for this Load Provider across all member handshakes."
                            ) : watched.ownerType === 'debtor' && watched.facilityClass === 'client_specific' ? (
                                "This Client-Specific limit ensures that the platform only accepts a set volume of debt from this debtor for this specific member."
                            ) : (
                                "This Client Limit defines the total credit facility authorized for this member business node."
                            )}
                        </p>
                    </div>
                </div>
            );
            case 'review': return (
                <div className="text-center py-20 space-y-6 text-left text-foreground">
                    <CheckCircle className="h-16 w-16 text-primary mx-auto opacity-40" />
                    <div className="space-y-2 text-center text-foreground">
                        <h3 className="text-2xl font-black uppercase text-center text-foreground">Ready for Authorization</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed text-center text-foreground">Confirm node metrics before committing to the global facility ledger.</p>
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
                        <div className="flex justify-between items-center text-left text-white">
                            <div className="text-left text-white">
                                <CardTitle className="text-2xl font-black font-headline uppercase text-white text-left">Initialize Facility node</CardTitle>
                                <CardDescription className="text-slate-400 text-left text-white">Step: {steps[currentStep].title}</CardDescription>
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
                                        <Button key={step.id} type="button" variant={currentStep === index ? 'secondary' : 'ghost'} className={cn("w-full justify-start gap-3 h-10 px-3 transition-all", currentStep === index && "bg-white shadow-sm ring-1 ring-primary/20")} onClick={() => setCurrentStep(index)}>
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

