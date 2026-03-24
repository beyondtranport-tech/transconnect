

'use client';

import React, { useState } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowRight, ArrowLeft, FileSignature, Truck, Paperclip, Eye } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

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
const agreementSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  description: z.string().min(1, 'Description is required'),
  totalAdvanced: z.coerce.number().positive('Amount must be positive'),
  interestRate: z.coerce.number().min(0, "Rate can't be negative"),
  numberOfInstallments: z.coerce.number().int().positive('Term must be a positive integer'),
});

const assetSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.string().min(4, 'Year is required'),
  costOfSale: z.coerce.number().positive('Cost must be positive'),
  registrationNumber: z.string().optional(),
});

const securitySchema = z.object({
  documentName: z.string().min(1, 'Document name is required'),
  documentType: z.string().min(1, 'Document type is required'),
  fileUrl: z.string().url('A valid file URL is required after upload.').optional().or(z.literal('')),
});

const wizardSchema = z.object({
    agreement: agreementSchema,
    asset: assetSchema,
    security: securitySchema,
});

type WizardFormValues = z.infer<typeof wizardSchema>;

// Step Components
const StepAgreement = ({ clients }: { clients: any[] }) => {
    const { control } = useFormContext<WizardFormValues>();
    return (
        <div className="space-y-4">
            <FormField control={control} name="agreement.clientId" render={({ field }) => (<FormItem><FormLabel>Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={control} name="agreement.description" render={({ field }) => (<FormItem><FormLabel>Agreement Description</FormLabel><FormControl><Textarea placeholder="e.g., Asset finance for Scania R500" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-3 gap-4">
                <FormField control={control} name="agreement.totalAdvanced" render={({ field }) => (<FormItem><FormLabel>Amount (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="agreement.interestRate" render={({ field }) => (<FormItem><FormLabel>Rate (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="agreement.numberOfInstallments" render={({ field }) => (<FormItem><FormLabel>Term (Months)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        </div>
    );
};

const StepAsset = () => {
     const { control } = useFormContext<WizardFormValues>();
     return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={control} name="asset.make" render={({ field }) => (<FormItem><FormLabel>Make</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="asset.model" render={({ field }) => (<FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="asset.year" render={({ field }) => (<FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={control} name="asset.costOfSale" render={({ field }) => (<FormItem><FormLabel>Cost (Excl. VAT)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="asset.registrationNumber" render={({ field }) => (<FormItem><FormLabel>Registration #</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        </div>
    );
};

const StepSecurity = () => {
    const { control } = useFormContext<WizardFormValues>();
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField control={control} name="security.documentName" render={({ field }) => (<FormItem><FormLabel>Document Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="security.documentType" render={({ field }) => (<FormItem><FormLabel>Document Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="surety">Surety</SelectItem><SelectItem value="pledge">Pledge</SelectItem><SelectItem value="cession">Cession</SelectItem><SelectItem value="notarial_bond">Notarial Bond</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            <FormField control={control} name="security.fileUrl" render={({ field }) => (<FormItem><FormLabel>File URL (Upload Later)</FormLabel><FormControl><Input {...field} placeholder="URL will be generated after upload" /></FormControl><FormMessage /></FormItem>)} />
        </div>
    );
};

const steps = [
    { id: 'agreement', title: 'Agreement Details', icon: FileSignature, fields: ['agreement.clientId', 'agreement.description', 'agreement.totalAdvanced', 'agreement.interestRate', 'agreement.numberOfInstallments'] },
    { id: 'asset', title: 'Asset Details', icon: Truck, fields: ['asset.make', 'asset.model', 'asset.year', 'asset.costOfSale'] },
    { id: 'security', title: 'Security Document', icon: Paperclip, fields: ['security.documentName', 'security.documentType'] },
    { id: 'review', title: 'Review & Submit', icon: Eye, fields: [] },
];


export function InstallmentSaleWizard({ isOpen, onOpenChange, clients, onSave }: { isOpen: boolean, onOpenChange: (open: boolean) => void, clients: any[], onSave: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const methods = useForm<WizardFormValues>({
        resolver: zodResolver(wizardSchema),
    });

    const onSubmit = async (values: WizardFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await performAdminAction(token, 'saveInstallmentSalePackage', values);
            toast({ title: 'Installment Sale Agreement Created!', description: 'All related documents have been saved.' });
            onSave();
            onOpenChange(false);
            setCurrentStep(0); // Reset wizard on close
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleNext = async () => {
        const stepFields = steps[currentStep].fields;
        const isValid = await methods.trigger(stepFields as any);
        if (isValid) {
            setCurrentStep(prev => prev + 1);
        } else {
            toast({ variant: "destructive", title: "Please complete all required fields for this step." });
        }
    };
    
    const handleBack = () => setCurrentStep(prev => prev - 1);
    
    const StepIcon = steps[currentStep].icon;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if(!open) setCurrentStep(0); }}>
            <DialogContent className="sm:max-w-3xl">
                 <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><StepIcon className="w-6 h-6" /> {steps[currentStep].title}</DialogTitle>
                    <DialogDescription>
                        {currentStep === 0 && "Enter the main financial terms of the installment sale."}
                        {currentStep === 1 && "Provide the details of the asset being financed."}
                        {currentStep === 2 && "Attach the primary security document for this agreement."}
                        {currentStep === 3 && "Please review all details before creating the agreement."}
                    </DialogDescription>
                </DialogHeader>
                <Progress value={(currentStep + 1) / steps.length * 100} className="w-full" />
                <FormProvider {...methods}>
                    <form onSubmit={methods.handleSubmit(onSubmit)}>
                        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                            {currentStep === 0 && <StepAgreement clients={clients} />}
                            {currentStep === 1 && <StepAsset />}
                            {currentStep === 2 && <StepSecurity />}
                            {currentStep === 3 && (
                               <div className="space-y-4">
                                  <p>Review the details and click Submit.</p>
                                </div>
                            )}
                        </div>
                        <DialogFooter className="pt-4 border-t">
                            <Button type="button" variant="outline" onClick={handleBack} disabled={currentStep === 0 || isLoading}>
                                <ArrowLeft className="mr-2"/> Back
                            </Button>
                            {currentStep < steps.length - 1 ? (
                                <Button type="button" onClick={handleNext}>
                                    Next <ArrowRight className="ml-2"/>
                                </Button>
                            ) : (
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2"/>}
                                    Submit
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
}
