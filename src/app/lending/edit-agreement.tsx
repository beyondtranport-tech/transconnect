
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
import { Loader2, Save, ArrowLeft, ArrowRight, CheckCircle, FileSignature, Truck, Building, User, Banknote } from 'lucide-react';
import { getClientSideAuthToken, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, collection, query } from 'firebase/firestore';

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

// Schemas
const agreementSubSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  type: z.string().min(1, 'Agreement type is required'),
  description: z.string().min(1, 'Description is required'),
  totalAdvanced: z.coerce.number().positive('Amount must be positive'),
  interestRate: z.coerce.number().min(0, "Rate can't be negative"),
  numberOfInstallments: z.coerce.number().int().positive('Term must be a positive integer'),
});

const assetSubSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.string().optional(),
  costOfSale: z.coerce.number().optional(),
  registrationNumber: z.string().optional(),
  supplierName: z.string().optional(),
  supplierContact: z.string().optional(),
});

const wizardSchema = z.object({
  agreement: agreementSubSchema,
  asset: assetSubSchema,
});

type WizardFormValues = z.infer<typeof wizardSchema>;


const steps = [
    { id: 'client', title: 'Client & Facility', icon: User, fields: ['agreement.clientId', 'agreement.type'] },
    { id: 'details', title: 'Agreement Details', icon: FileSignature, fields: ['agreement.description', 'agreement.totalAdvanced', 'agreement.interestRate', 'agreement.numberOfInstallments'] },
    { id: 'asset', title: 'Asset Details', icon: Truck, fields: ['asset.make', 'asset.model', 'asset.year', 'asset.costOfSale'] },
    { id: 'supplier', title: 'Supplier Details', icon: Building, fields: ['asset.supplierName', 'asset.supplierContact'] },
    { id: 'review', title: 'Review & Submit', icon: CheckCircle, fields: [] },
];

const StepAsset = () => {
    const { control } = useFormContext<WizardFormValues>();
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={control} name="asset.make" render={({ field }) => (<FormItem><FormLabel>Make</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="asset.model" render={({ field }) => (<FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="asset.year" render={({ field }) => (<FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={control} name="asset.costOfSale" render={({ field }) => (<FormItem><FormLabel>Cost (Excl. VAT)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
    );
};

const StepSupplier = () => {
    const { control } = useFormContext<WizardFormValues>();
    return (
         <div className="space-y-4">
            <FormField control={control} name="asset.supplierName" render={({ field }) => (<FormItem><FormLabel>Supplier Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={control} name="asset.supplierContact" render={({ field }) => (<FormItem><FormLabel>Supplier Contact</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
    );
};


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
    const router = useRouter();
    const firestore = useFirestore();

    const methods = useForm<WizardFormValues>({
        resolver: zodResolver(wizardSchema),
        mode: 'onChange',
    });
    
    const assetRef = useMemoFirebase(() => {
        if (!firestore || !agreement?.assetId) return null;
        return doc(firestore, 'lendingAssets', agreement.assetId);
    }, [firestore, agreement]);
    const { data: assetData, isLoading: isAssetLoading } = useDoc(assetRef);
    
    const isEditing = !!agreement;
    const isEditDataLoading = isEditing && isAssetLoading;

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
        if (agreement) {
            methods.reset({
                agreement: {
                    clientId: agreement.clientId || '',
                    type: agreement.type || '',
                    description: agreement.description || '',
                    totalAdvanced: agreement.totalAdvanced || 0,
                    interestRate: agreement.interestRate || 0,
                    numberOfInstallments: agreement.numberOfInstallments || 0,
                },
                asset: assetData ? {
                    make: assetData.make || '',
                    model: assetData.model || '',
                    year: assetData.year || '',
                    costOfSale: assetData.costOfSale || 0,
                    registrationNumber: assetData.registrationNumber || '',
                    supplierName: assetData.supplierName || '',
                    supplierContact: assetData.supplierContact || '',
                } : {}
            });
        }
    }, [agreement, assetData, methods]);


    const onSubmit = async (values: WizardFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            let assetId = agreement?.assetId;
            const assetPayload: any = { ...values.asset, clientId: values.agreement.clientId };

            // Save/Update Asset if there's data for it
            if (Object.values(values.asset).some(v => v)) {
                if (assetId) {
                    assetPayload.id = assetId;
                }
                const assetResult = await performAdminAction(token, 'saveLendingAsset', { asset: assetPayload });
                assetId = assetResult.id;
            }

            // Save Agreement
            const agreementPayload = {
                id: agreement?.id,
                ...values.agreement,
                assetId: assetId,
            };
            await performAdminAction(token, 'saveLendingAgreement', { agreement: agreementPayload });

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
    
    const isStepValid = (stepIndex: number) => {
        if (stepIndex < 0 || stepIndex >= steps.length) return true;
        const step = steps[stepIndex];
        if (!step.fields || step.fields.length === 0) return true;
        return step.fields.every(field => !methods.formState.errors[field as keyof typeof methods.formState.errors]);
    };
    
     const renderStepContent = () => {
        const stepId = steps[currentStep]?.id;
        switch (stepId) {
            case 'client': return (
                 <div className="space-y-4">
                    <FormField control={methods.control} name="agreement.clientId" render={({ field }) => (<FormItem><FormLabel>Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    {selectedClientId && (
                        availableTypes.length > 0 ? (
                            <FormField control={methods.control} name="agreement.type" render={({ field }) => (<FormItem><FormLabel>Facility Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an agreement type..." /></SelectTrigger></FormControl><SelectContent>{availableTypes.map(type => <SelectItem key={type} value={type} className="capitalize">{type.replace(/_/g, ' ')}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        ) : (
                            <Alert>
                                <AlertTitle>No Active Facilities</AlertTitle>
                                <AlertDescription>This client has no active credit facilities. You must create one before creating an agreement.</AlertDescription>
                            </Alert>
                        )
                    )}
                 </div>
            );
            case 'details': return (
                 <div className="space-y-4">
                    <FormField control={methods.control} name="agreement.description" render={({ field }) => (<FormItem><FormLabel>Agreement Description</FormLabel><FormControl><Textarea placeholder="e.g., Asset finance for Scania R500" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-3 gap-4">
                        <FormField control={methods.control} name="agreement.totalAdvanced" render={({ field }) => (<FormItem><FormLabel>Amount (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={methods.control} name="agreement.interestRate" render={({ field }) => (<FormItem><FormLabel>Rate (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={methods.control} name="agreement.numberOfInstallments" render={({ field }) => (<FormItem><FormLabel>Term (Months)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </div>
            );
            case 'asset': return <StepAsset />;
            case 'supplier': return <StepSupplier />;
            case 'review': return <div className="text-center p-8"><h3 className="text-lg font-semibold">Review and Submit</h3></div>
            default: return null;
        }
    };
    
    return (
        <Card>
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold font-headline">{agreement ? 'Edit' : 'Create New'} Agreement</h2>
                                <p className="text-muted-foreground">{steps[currentStep].title}</p>
                            </div>
                            <Button type="button" variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4"/>Back to List</Button>
                        </div>
                    </CardHeader>
                        <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
                             <div className="flex flex-col gap-2 border-r pr-4">
                                {steps.map((step, index) => {
                                    const Icon = step.icon;
                                    const isCompleted = index < currentStep && isStepValid(index);
                                    return (
                                        <Button key={step.id} type="button" variant={currentStep === index ? 'secondary' : 'ghost'} className="justify-start gap-2" onClick={() => setCurrentStep(index)} disabled={index > currentStep && !isStepValid(currentStep - 1)}>
                                            {isCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> : <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold", currentStep >= index ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{index + 1}</div>}
                                            {step.title}
                                        </Button>
                                    );
                                })}
                            </div>
                             <div className="space-y-6 min-h-[400px]">
                                {isEditDataLoading ? <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div> : renderStepContent()}
                             </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-6 mt-6">
                        <Button type="button" variant="outline" onClick={handleBackStep} disabled={currentStep === 0 || isLoading}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        {currentStep < steps.length - 1 ? (
                            <Button type="button" onClick={handleNext}>
                                Next <ArrowRight className="ml-2 h-4 w-4"/>
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {agreement ? 'Update Agreement' : 'Create Agreement'}
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
