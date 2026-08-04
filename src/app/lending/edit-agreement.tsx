
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft, ArrowRight, CheckCircle, FileSignature, Truck, Building, User, Banknote, Database, Info } from 'lucide-react';
import { getClientSideAuthToken, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { cn, fetchFromAdminAPI } from '@/lib/utils';
import { doc, collection, query } from 'firebase/firestore';

// Schemas
const agreementSubSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  type: z.string().min(1, 'Agreement type is required'),
  description: z.string().min(1, 'Description is required'),
  totalAdvanced: z.coerce.number().positive('Amount must be positive'),
  interestRate: z.coerce.number().min(0, "Rate can't be negative"),
  numberOfInstallments: z.coerce.number().int().positive('Term must be a positive integer'),
});

const wizardSchema = z.object({
  agreement: agreementSubSchema,
});

type WizardFormValues = z.infer<typeof wizardSchema>;

const steps = [
    { id: 'client', title: 'Client & Facility', icon: User, fields: ['agreement.clientId', 'agreement.type'] },
    { id: 'details', title: 'Agreement Details', icon: FileSignature, fields: ['agreement.description', 'agreement.totalAdvanced', 'agreement.interestRate', 'agreement.numberOfInstallments'] },
    { id: 'review', title: 'Review & Submit', icon: CheckCircle, fields: [] },
];

interface AgreementWizardProps {
  agreement?: any;
  clients: any[];
  facilities: any[];
  onSave: () => void;
  onBack: () => void;
}

export function AgreementWizard({ agreement, clients, facilities, onSave, onBack }: AgreementWizardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const { toast } = useToast();
    const firestore = useFirestore();

    const methods = useForm<WizardFormValues>({
        resolver: zodResolver(wizardSchema),
        mode: 'onChange',
    });
    
    const isEditing = !!agreement;

    const selectedClientId = methods.watch('agreement.clientId');

    const availableFacilities = useMemo(() => {
        if (!selectedClientId) return [];
        return facilities.filter(f => f.clientId === selectedClientId && f.status === 'active');
    }, [facilities, selectedClientId]);

    const availableTypes = useMemo(() => {
        const types = availableFacilities.map(f => f.type);
        return [...new Set(types)];
    }, [availableFacilities]);
    
    useEffect(() => {
        if (isEditing) {
             methods.reset({
                agreement: { 
                    clientId: agreement.clientId,
                    type: agreement.type,
                    description: agreement.description,
                    totalAdvanced: agreement.totalAdvanced,
                    interestRate: agreement.interestRate,
                    numberOfInstallments: agreement.numberOfInstallments
                }
            });
        } else {
            methods.reset({});
        }
    }, [isEditing, agreement, methods]);

    const handleRedirect = async (type: string) => {
        const token = await getClientSideAuthToken();
        if (!token) return;
        
        // AUTOSAVE BEFORE REDIRECT: Persist current agreement node as a draft
        const values = methods.getValues('agreement');
        if (values.clientId) {
            try {
                await fetchFromAdminAPI(token, 'saveLendingAgreement', { 
                    agreement: { id: agreement?.id, ...values, status: 'draft' } 
                });
            } catch (e) {
                console.warn("Autosave failed", e);
            }
        }
        
        window.location.href = `/lending?view=assets&type=${type}&clientId=${selectedClientId || ''}&agreementId=${agreement?.id || ''}`;
    };

    const onSubmit = async (data: WizardFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            await fetchFromAdminAPI(token, 'saveLendingAgreement', { 
                agreement: { id: agreement?.id, ...data.agreement } 
            });

            toast({ title: agreement ? 'Agreement Updated' : 'Agreement Created' });
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
            toast({ variant: "destructive", title: "Please complete all required fields for this step." });
        }
    };
    
    const handleBackStep = () => setCurrentStep(prev => prev - 1);
    
    const renderStepContent = () => {
        const stepId = steps[currentStep]?.id;
        switch (stepId) {
            case 'client': return (
                 <div className="space-y-6">
                    <FormField control={methods.control} name="agreement.clientId" render={({ field }) => (<FormItem className="text-left"><FormLabel>Client Profile</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-12 border-2 bg-white"><SelectValue placeholder="Select a client..." /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    {selectedClientId && (
                        availableTypes.length > 0 ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                <FormField control={methods.control} name="agreement.type" render={({ field }) => (<FormItem className="text-left"><FormLabel>Facility Authority Node</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-12 border-2 bg-white font-bold"><SelectValue placeholder="Select an agreement type..." /></SelectTrigger></FormControl><SelectContent>{availableTypes.map(type => <SelectItem key={type} value={type} className="capitalize">{type.replace(/_/g, ' ')}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                
                                <div className="p-8 border-2 border-dashed rounded-3xl bg-slate-50 space-y-6 text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-lg"><Truck className="h-6 w-6 text-primary"/></div>
                                        <h4 className="font-black uppercase tracking-tight">Physical Asset Bind</h4>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Button type="button" variant="outline" className="h-20 border-2 gap-3 font-bold" onClick={() => handleRedirect('Truck')}>
                                            <div className="bg-primary/10 p-2 rounded-lg"><Truck className="h-5 w-5 text-primary" /></div>
                                            <span>Initialize Truck Node</span>
                                        </Button>
                                        <Button type="button" variant="outline" className="h-20 border-2 gap-3 font-bold" onClick={() => handleRedirect('Trailer')}>
                                            <div className="bg-primary/10 p-2 rounded-lg"><Database className="h-5 w-5 text-primary" /></div>
                                            <span>Initialize Trailer Node</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
                                <Info className="h-4 w-4" />
                                <AlertTitle>Authority Missing</AlertTitle>
                                <AlertDescription>This client has no active credit facilities. Establish a Global Limit before drafting an agreement.</AlertDescription>
                            </Alert>
                        )
                    )}
                 </div>
            );
            case 'details': return (
                 <div className="space-y-4 text-left">
                    <FormField control={methods.control} name="agreement.description" render={({ field }) => (<FormItem><FormLabel>Agreement Label</FormLabel><FormControl><Textarea placeholder="e.g., Asset finance for Scania R500" {...field} className="bg-white border-2" /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField control={methods.control} name="agreement.totalAdvanced" render={({ field }) => (<FormItem><FormLabel>Principal Advanced (R)</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 bg-white font-bold" /></FormControl></FormItem>)} />
                        <FormField control={methods.control} name="agreement.interestRate" render={({ field }) => (<FormItem><FormLabel>Interest Rate (% p.a.)</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 bg-white font-bold" /></FormControl></FormItem>)} />
                        <FormField control={methods.control} name="agreement.numberOfInstallments" render={({ field }) => (<FormItem><FormLabel>Term (Months)</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 bg-white font-bold" /></FormControl></FormItem>)} />
                    </div>
                </div>
            );
            case 'review': return <div className="text-center py-20 space-y-4"><CheckCircle className="h-16 w-16 text-primary mx-auto opacity-30" /><h3 className="text-2xl font-black uppercase">Final Protocol Check</h3><p className="text-muted-foreground max-w-sm mx-auto">Verify principal and term nodes before committing the agreement to the ledger.</p></div>;
            default: return null;
        }
    };
    
    return (
        <Card className="max-w-6xl mx-auto shadow-2xl border-none overflow-hidden text-left text-foreground">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader className="bg-slate-900 text-white p-10">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-3xl font-black font-headline uppercase">{agreement ? 'Audit' : 'Draft'} Agreement Node</CardTitle>
                                <CardDescription className="text-slate-400 text-lg mt-1">{steps[currentStep].title}</CardDescription>
                            </div>
                            <Button type="button" variant="ghost" className="text-white hover:text-primary" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Ledger</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] text-left">
                            <div className="bg-slate-50 border-r p-8 space-y-2 text-left">
                                {steps.map((step, index) => {
                                    const Icon = step.icon;
                                    return (
                                        <Button 
                                            key={step.id} 
                                            type="button" 
                                            variant={currentStep === index ? 'secondary' : 'ghost'} 
                                            className={cn("w-full justify-start gap-4 h-12 px-4 transition-all", currentStep === index && "bg-white shadow-md ring-1 ring-primary/20")} 
                                            onClick={() => setCurrentStep(index)}
                                        >
                                            <div className={cn("h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-black", currentStep >= index ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{index + 1}</div>
                                            <Icon className={cn("h-5 w-5", currentStep >= index ? "text-primary" : "text-muted-foreground")} />
                                            <span className={cn("text-[10px] font-black uppercase tracking-[0.1em]", currentStep === index ? "text-primary" : "text-muted-foreground")}>{step.title}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                            <div className="p-12 space-y-12 bg-white min-h-[500px] text-left">
                                {renderStepContent()}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t p-10 flex justify-between">
                        <Button type="button" variant="outline" onClick={handleBackStep} disabled={currentStep === 0 || isLoading} className="font-bold h-12 px-8">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        {currentStep < steps.length - 1 ? (
                            <Button type="button" onClick={handleNext} className="h-12 px-12 font-black uppercase text-xs text-white shadow-lg">
                                Next Protocol Stage <ArrowRight className="ml-2 h-4 w-4"/>
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isLoading} className="h-14 px-16 bg-primary hover:bg-primary/90 shadow-2xl font-black uppercase tracking-tight text-white">
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                Commit Agreement to Ledger
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
