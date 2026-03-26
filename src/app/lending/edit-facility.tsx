'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft, ArrowRight, Banknote, Users, CheckCircle } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

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
  clientId: z.string().min(1, 'Client is required'),
  partnerId: z.string().optional(),
  type: z.string().min(1, 'Facility type is required'),
  status: z.enum(['pending', 'active', 'inactive']).default('pending'),
  limit: z.coerce.number().positive('Limit must be a positive number'),
});

type FacilityFormValues = z.infer<typeof facilitySchema>;

const steps = [
    { id: 'association', title: 'Association', fields: ['clientId'] },
    { id: 'details', title: 'Facility Details', fields: ['type', 'status', 'limit'] },
    { id: 'review', title: 'Review & Submit', fields: [] },
];

interface EditFacilityWizardProps {
  facility?: any;
  clients: any[];
  partners: any[];
  onSave: () => void;
  onBack: () => void;
}

export function EditFacilityWizard({ facility, clients, partners, onSave, onBack }: EditFacilityWizardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const { toast } = useToast();
    const searchParams = useSearchParams();

    const methods = useForm<FacilityFormValues>({
        resolver: zodResolver(facilitySchema),
        mode: 'onChange'
    });

    useEffect(() => {
        const clientIdFromUrl = searchParams.get('clientId');
        const initialValues = facility || {
            clientId: clientIdFromUrl || '',
            partnerId: '',
            type: '',
            status: 'pending',
            limit: 0,
        };
        methods.reset(initialValues);
    }, [facility, searchParams, methods]);

    const onSubmit = async (values: FacilityFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await performAdminAction(token, 'saveLendingFacility', { facility: { id: facility?.id, ...values } });
            toast({ title: facility ? 'Facility Updated' : 'Facility Created' });
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
        switch (currentStep) {
            case 0: return (
                <div className="space-y-4">
                    <FormField control={methods.control} name="clientId" render={({ field }) => (<FormItem><FormLabel>Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={methods.control} name="partnerId" render={({ field }) => (<FormItem><FormLabel>Co-funding Partner (Optional)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a partner..." /></SelectTrigger></FormControl><SelectContent>{partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
            );
            case 1: return (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={methods.control} name="type" render={({ field }) => (<FormItem><FormLabel>Facility Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="loan">Loan</SelectItem><SelectItem value="lease">Lease</SelectItem><SelectItem value="factoring">Factoring</SelectItem><SelectItem value="installment_sale">Installment Sale</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={methods.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={methods.control} name="limit" render={({ field }) => (<FormItem><FormLabel>Facility Limit (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
            );
            case 2: return (
                <div className="text-center p-8">
                    <h3 className="text-lg font-semibold">Review and Submit</h3>
                    <p className="text-muted-foreground">Please confirm all details before saving the facility.</p>
                </div>
            );
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
                                <h2 className="text-2xl font-bold font-headline">{facility ? 'Edit' : 'Add'} Facility</h2>
                                <p className="text-muted-foreground">{steps[currentStep].title}</p>
                            </div>
                            <Button type="button" variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4"/>Back to List</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
                             <div className="flex flex-col gap-2 border-r pr-4">
                                {steps.map((step, index) => {
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
                                {renderStepContent()}
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
                                {facility ? 'Update Facility' : 'Create Facility'}
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
