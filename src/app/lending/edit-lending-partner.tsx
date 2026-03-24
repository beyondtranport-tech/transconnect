'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft, ArrowRight, CheckCircle, Handshake, Building, User } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

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

const partnerSchema = z.object({
  name: z.string().min(1, 'Partner name is required'),
  type: z.enum(['supplier', 'vendor', 'associate', 'debtor']),
  status: z.enum(['draft', 'active', 'inactive']),
  contactPerson: z.string().optional(),
  cell: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  registrationId: z.string().optional(),
  vatRegistered: z.boolean().default(false),
  category: z.string().optional(),
  code: z.string().optional(),
});
type PartnerFormValues = z.infer<typeof partnerSchema>;

const steps = [
    { id: 'details', title: 'Partner Details', fields: ['name', 'type', 'status', 'contactPerson', 'email', 'cell'] },
    { id: 'company', title: 'Company Details', fields: ['registrationId', 'vatRegistered', 'category', 'code'] },
    { id: 'review', title: 'Review & Submit', fields: [] },
];

interface EditLendingPartnerWizardProps {
  partner?: any;
  onSave: () => void;
  onBack: () => void;
}

export function EditLendingPartnerWizard({ partner, onSave, onBack }: EditLendingPartnerWizardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const { toast } = useToast();

    const methods = useForm<PartnerFormValues>({
        resolver: zodResolver(partnerSchema),
        mode: 'onChange'
    });

    useEffect(() => {
        methods.reset(partner || { name: '', type: 'supplier', status: 'draft', contactPerson: '', cell: '', email: '', registrationId: '', vatRegistered: false, category: '', code: '' });
    }, [partner, methods]);

    const onSubmit = async (values: PartnerFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await performAdminAction(token, 'saveLendingPartner', { partner: { id: partner?.id, ...values } });
            toast({ title: partner ? 'Partner Updated' : 'Partner Created' });
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
                    <FormField control={methods.control} name="name" render={({ field }) => (<FormItem><FormLabel>Partner Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={methods.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="supplier">Supplier</SelectItem><SelectItem value="vendor">Vendor</SelectItem><SelectItem value="associate">Affiliate</SelectItem><SelectItem value="debtor">Debtor</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={methods.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={methods.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={methods.control} name="cell" render={({ field }) => (<FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={methods.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </div>
            );
            case 1: return (
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                         <FormField control={methods.control} name="registrationId" render={({ field }) => (<FormItem><FormLabel>Registration ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                         <FormField control={methods.control} name="vatRegistered" render={({ field }) => (<FormItem className="flex items-center space-x-2 pt-8"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>VAT Registered?</FormLabel></FormItem>)} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={methods.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={methods.control} name="code" render={({ field }) => (<FormItem><FormLabel>Partner Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </div>
            );
            case 2: return (
                <div className="text-center p-8">
                    <h3 className="text-lg font-semibold">Review and Submit</h3>
                    <p className="text-muted-foreground">Please confirm all details before saving.</p>
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
                                <h2 className="text-2xl font-bold font-headline">{partner ? 'Edit' : 'Add'} Lending Partner</h2>
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
                                    const Icon = step.icon || User;
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
                                {partner ? 'Update Partner' : 'Create Partner'}
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
