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
import { Loader2, Save, ArrowLeft, ArrowRight, CheckCircle, FileSignature, Truck, Building, User, Banknote, Database, Info, Search, CheckCircle2 } from 'lucide-react';
import { getClientSideAuthToken, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { cn, fetchFromAdminAPI, formatCurrency } from '@/lib/utils';
import { doc, collection, query, where, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

// Schema
const agreementSubSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  assetId: z.string().optional().nullable(),
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
    { id: 'client', title: 'Client & Facility', icon: User, fields: ['agreement.clientId', 'agreement.type', 'agreement.assetId'] },
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
    const router = useRouter();

    const methods = useForm<WizardFormValues>({
        resolver: zodResolver(wizardSchema),
        mode: 'onChange',
    });
    
    const isEditing = !!agreement;
    const selectedClientId = methods.watch('agreement.clientId');

    // Fetch available assets for binding
    const assetsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'lendingAssets'), where('status', '==', 'available'));
    }, [firestore]);
    const { data: availableAssets, isLoading: isLoadingAssets } = useCollection(assetsQuery);

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
                    assetId: agreement.assetId || null,
                    type: agreement.type,
                    description: agreement.description,
                    totalAdvanced: agreement.totalAdvanced,
                    interestRate: agreement.interestRate,
                    numberOfInstallments: agreement.numberOfInstallments
                }
            });
        }
    }, [isEditing, agreement, methods]);

    const handleRedirectToRegister = () => {
        const type = methods.watch('agreement.type')?.toLowerCase() === 'factoring' ? 'Debtor' : 'Truck';
        router.push(`/lending?view=assets&type=${type}&clientId=${selectedClientId || ''}`);
    };

    const onSubmit = async (data: WizardFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            // 1. COMMIT AGREEMENT
            const res = await fetchFromAdminAPI(token, 'saveLendingAgreement', { 
                agreement: { id: agreement?.id, ...data.agreement, status: 'active' } 
            });

            // 2. MARK ASSET AS FINANCED
            if (data.agreement.assetId) {
                await fetch('/api/updateUserDoc', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        path: `lendingAssets/${data.agreement.assetId}`,
                        data: { 
                            status: 'financed', 
                            agreementId: res.data.id,
                            clientId: data.agreement.clientId,
                            updatedAt: { _methodName: 'serverTimestamp' }
                        }
                    })
                });
            }

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
        }
    };
    
    const isStepValid = (index: number) => {
        const step = steps[index];
        if (!step.fields || step.fields.length === 0) return true;
        const errors = methods.formState.errors;
        return step.fields.every(field => {
            const parts = field.split('.');
            let err: any = errors;
            for (const p of parts) { err = err?.[p]; }
            return !err;
        });
    };
    
    const renderStepContent = () => {
        const stepId = steps[currentStep]?.id;
        switch (stepId) {
            case 'client': return (
                 <div className="space-y-10 animate-in fade-in duration-500">
                    <FormField control={methods.control} name="agreement.clientId" render={({ field }) => (
                        <FormItem className="text-left">
                            <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Target Client</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger className="h-12 border-2 bg-white font-bold"><SelectValue placeholder="Select member client..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />

                    {selectedClientId && (
                        <div className="space-y-10 animate-in slide-in-from-top-4 duration-500">
                            <FormField control={methods.control} name="agreement.type" render={({ field }) => (
                                <FormItem className="text-left">
                                    <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Facility Authority Node</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="h-12 border-2 bg-white font-black"><SelectValue placeholder="Select agreement type..." /></SelectTrigger></FormControl>
                                        <SelectContent>{availableTypes.map(type => <SelectItem key={type} value={type} className="capitalize">{type.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                            
                            <div className="p-8 border-2 border-dashed rounded-3xl bg-slate-50 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-lg"><Truck className="h-6 w-6 text-primary"/></div>
                                        <h4 className="font-black uppercase tracking-tight">Physical Asset Bind</h4>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleRedirectToRegister}>
                                        <PlusCircle className="h-4 w-4" /> Move Asset In
                                    </Button>
                                </div>
                                
                                <FormField control={methods.control} name="agreement.assetId" render={({ field }) => (
                                    <FormItem className="text-left">
                                        <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                                            <FormControl>
                                                <SelectTrigger className="h-14 border-2 bg-white font-bold text-left text-foreground">
                                                    <SelectValue placeholder={isLoadingAssets ? "Scanning Register..." : "Select available asset..."} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableAssets?.map((asset: any) => (
                                                    <SelectItem key={asset.id} value={asset.id}>
                                                        {asset.year} {asset.make} {asset.model} - {formatCurrency(asset.costOfSale)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-muted-foreground mt-2 italic">Only "Available" assets in the register can be bound.</p>
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                    )}
                 </div>
            );
            case 'details': return (
                 <div className="space-y-6 animate-in fade-in duration-500">
                    <FormField control={methods.control} name="agreement.description" render={({ field }) => (
                        <FormItem className="text-left">
                            <FormLabel>Agreement Description</FormLabel>
                            <FormControl><Textarea placeholder="e.g., Asset finance for Scania R500" {...field} className="min-h-[100px] border-2 bg-white" /></FormControl>
                        </FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField control={methods.control} name="agreement.totalAdvanced" render={({ field }) => (<FormItem className="text-left"><FormLabel>Amount Advanced (R)</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 bg-white font-black text-lg" /></FormControl></FormItem>)} />
                        <FormField control={methods.control} name="agreement.interestRate" render={({ field }) => (<FormItem className="text-left"><FormLabel>Rate (% p.a.)</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 bg-white" /></FormControl></FormItem>)} />
                        <FormField control={methods.control} name="agreement.numberOfInstallments" render={({ field }) => (<FormItem className="text-left"><FormLabel>Term (Months)</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 bg-white" /></FormControl></FormItem>)} />
                    </div>
                </div>
            );
            case 'review': return (
                <div className="text-center py-24 space-y-6 animate-in zoom-in-95 duration-500">
                    <CheckCircle className="h-20 w-20 text-primary mx-auto opacity-30" />
                    <div className="space-y-2 text-center text-foreground">
                        <h3 className="text-3xl font-black uppercase">Agreement Verified</h3>
                        <p className="text-sm text-muted-foreground max-sm mx-auto leading-relaxed">Ready to commit this agreement and bind the selected asset to the client's ledger.</p>
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
                    <CardHeader className="bg-slate-900 text-white p-10">
                        <div className="flex justify-between items-center">
                            <div className="text-left text-white">
                                <CardTitle className="text-3xl font-black font-headline uppercase">Agreement Authority Terminal</CardTitle>
                                <CardDescription className="text-slate-400 text-lg mt-1">Protocol: {steps[currentStep].title}</CardDescription>
                            </div>
                            <Button type="button" variant="ghost" className="text-white hover:text-primary" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Exit Ledger</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
                            <div className="bg-slate-50 border-r p-8 space-y-2">
                                {steps.map((step, index) => {
                                    const isCompleted = index < currentStep && isStepValid(index);
                                    return (
                                        <Button 
                                            key={step.id} 
                                            type="button" 
                                            variant={currentStep === index ? 'secondary' : 'ghost'} 
                                            className={cn("w-full justify-start gap-4 h-12 px-4 transition-all", currentStep === index && "bg-white shadow-sm ring-1 ring-primary/20")} 
                                            onClick={() => { if(index <= currentStep) setCurrentStep(index); }}
                                        >
                                            {isCompleted ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className={cn("h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-black", currentStep >= index ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{index + 1}</div>}
                                            <step.icon className={cn("h-5 w-5", currentStep >= index ? "text-primary" : "text-muted-foreground")} />
                                            <span className={cn("text-[10px] font-black uppercase tracking-[0.1em]", currentStep === index ? "text-primary" : "text-muted-foreground")}>{step.title}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                            <div className="p-12 space-y-12 bg-white min-h-[500px]">
                                {renderStepContent()}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t p-10 flex justify-between">
                        <Button type="button" variant="outline" onClick={() => setCurrentStep(prev => Math.max(prev - 1, 0))} disabled={currentStep === 0 || isLoading} className="font-bold h-12 px-8">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        {currentStep < steps.length - 1 ? (
                            <Button type="button" onClick={handleNext} className="h-12 px-12 font-black uppercase text-xs text-white shadow-lg">
                                Next Protocol Stage <ArrowRight className="ml-2 h-4 w-4"/>
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isLoading} className="h-14 px-16 bg-primary hover:bg-primary/90 shadow-2xl font-black uppercase tracking-tight text-white">
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                Commit Agreement to Registry
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
