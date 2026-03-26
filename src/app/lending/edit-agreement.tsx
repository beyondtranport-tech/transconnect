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
import { Loader2, Save, ArrowLeft, ArrowRight, CheckCircle, FileSignature, AlertCircle, Banknote, User, PlusCircle } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

const agreementSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  type: z.string().min(1, 'Agreement type is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['pending', 'credit', 'payout', 'active', 'completed', 'defaulted']).default('pending'),
  totalAdvanced: z.coerce.number().positive('Amount must be positive'),
  interestRate: z.coerce.number().min(0, "Rate can't be negative"),
  numberOfInstallments: z.coerce.number().int().positive('Term must be a positive integer'),
  createDate: z.string().optional(),
  firstInstallmentDate: z.string().optional(),
});
type AgreementFormValues = z.infer<typeof agreementSchema>;

interface AgreementWizardProps {
  agreement?: any;
  clients: any[];
  facilities: any[];
  onSave: () => void;
  onBack: () => void;
}

const steps = [
    { id: 'client', title: 'Select Client', icon: User, fields: ['clientId'] },
    { id: 'facilities', title: 'Facilities', icon: Banknote, fields: ['type'] },
    { id: 'details', title: 'Agreement Details', icon: FileSignature, fields: ['description', 'totalAdvanced', 'interestRate', 'numberOfInstallments'] },
    { id: 'review', title: 'Review & Submit', icon: CheckCircle, fields: [] },
];

export function AgreementWizard({ agreement, clients, facilities, onSave, onBack }: AgreementWizardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const { toast } = useToast();
    const router = useRouter();

    const methods = useForm<AgreementFormValues>({
        resolver: zodResolver(agreementSchema),
        mode: 'onChange',
        defaultValues: agreement || {
            status: 'pending',
        }
    });
    
    const selectedClientId = methods.watch('clientId');

    const availableFacilities = useMemo(() => {
        if (!selectedClientId) return [];
        return facilities.filter(f => f.clientId === selectedClientId && f.status === 'active');
    }, [facilities, selectedClientId]);

    const availableTypes = useMemo(() => {
        const types = availableFacilities.map(f => f.type);
        return [...new Set(types)]; // Unique types
    }, [availableFacilities]);
    
    useEffect(() => {
        if (agreement) {
            methods.reset({
                ...agreement,
                createDate: agreement.createDate ? new Date(agreement.createDate).toISOString().split('T')[0] : undefined,
                firstInstallmentDate: agreement.firstInstallmentDate ? new Date(agreement.firstInstallmentDate).toISOString().split('T')[0] : undefined,
            });
        }
    }, [agreement, methods]);

    const onSubmit = async (values: AgreementFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await performAdminAction(token, 'saveLendingAgreement', { agreement: { id: agreement?.id, ...values } });
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
    
     const handleCreateFacility = () => {
        const clientId = methods.getValues('clientId');
        if (clientId) {
            router.push(`/lending?view=facilities&action=create&clientId=${clientId}`);
        } else {
            toast({
                variant: 'destructive',
                title: 'Client Not Selected',
                description: 'Please go back to the previous step and select a client.',
            });
        }
    };
    
    const renderStepContent = () => {
        const stepId = steps[currentStep]?.id;
        switch (stepId) {
            case 'client': return <FormField control={methods.control} name="clientId" render={({ field }) => (<FormItem><FormLabel>Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />;
            case 'facilities': return (
                <div>
                    {availableTypes.length > 0 ? (
                         <FormField control={methods.control} name="type" render={({ field }) => (<FormItem><FormLabel>Agreement Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an available agreement type..." /></SelectTrigger></FormControl><SelectContent>{availableTypes.map(type => <SelectItem key={type} value={type} className="capitalize">{type.replace(/_/g, ' ')}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    ) : (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>No Active Facilities Found</AlertTitle>
                            <AlertDescription>
                                This client does not have any active credit facilities. You must create a facility for them before you can create an agreement.
                            </AlertDescription>
                            <div className="mt-4">
                               <Button type="button" onClick={handleCreateFacility}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Create Facility
                                </Button>
                            </div>
                        </Alert>
                    )}
                </div>
            );
            case 'details': return (
                 <div className="space-y-4">
                    <FormField control={methods.control} name="description" render={({ field }) => (<FormItem><FormLabel>Agreement Description</FormLabel><FormControl><Textarea placeholder="e.g., Asset finance for Scania R500" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-3 gap-4">
                        <FormField control={methods.control} name="totalAdvanced" render={({ field }) => (<FormItem><FormLabel>Amount (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={methods.control} name="interestRate" render={({ field }) => (<FormItem><FormLabel>Rate (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={methods.control} name="numberOfInstallments" render={({ field }) => (<FormItem><FormLabel>Term (Months)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </div>
            );
            case 'review': return (
                <div className="text-center p-8">
                    <h3 className="text-lg font-semibold">Review and Submit</h3>
                    <p className="text-muted-foreground">Please confirm all details before saving the agreement.</p>
                </div>
            )
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
                                            <Icon className="h-4 w-4 mr-1" />
                                            {step.title}
                                        </Button>
                                    );
                                })}
                            </div>
                             <div className="space-y-6 min-h-[400px]">
                                {renderStepContent()}
                             </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-6 mt-6">
                        <Button type="button" variant="outline" onClick={handleBackStep} disabled={currentStep === 0 || isLoading}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        {currentStep === 0 ? (
                            <Button type="button" onClick={handleNext}>
                                Save & Continue <ArrowRight className="ml-2 h-4 w-4"/>
                            </Button>
                        ) : currentStep < steps.length - 1 ? (
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
