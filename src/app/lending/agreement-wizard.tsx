
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, Save, Users, FileText, Briefcase, Landmark, Sheet, LayoutDashboard, DollarSign } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

async function performAdminAction(token: string, action: string, payload?: any) {
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

const agreementFormSchema = z.object({
  clientId: z.string().min(1, "A client must be selected."),
  assetId: z.string().optional(),
  type: z.enum(["loan", "installment-sale", "lease", "factoring"]),
  description: z.string().optional(),
  totalAdvanced: z.coerce.number().positive('Amount must be positive'),
  interestRate: z.coerce.number().min(0, 'Rate cannot be negative'),
  arrearInterest: z.boolean().default(false),
  createDate: z.string().optional(),
  capitalizationDate: z.string().optional(),
  firstInstallmentDate: z.string().optional(),
  numberOfInstallments: z.coerce.number().int().positive('Term must be a positive integer'),
  interval: z.enum(["daily", "weekly", "bi-monthly", "monthly"]),
  paymentMethod: z.enum(["debit_order", "eft"]),
  bankAccountId: z.string().optional(),
  status: z.enum(['pending', 'active', 'completed', 'defaulted']).default('pending'),
});

type FormValues = z.infer<typeof agreementFormSchema>;

const wizardSteps = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'main', name: 'Main', icon: FileText, fields: ['clientId', 'type', 'totalAdvanced', 'interestRate', 'numberOfInstallments'] },
    { id: 'charges', name: 'Charges', icon: DollarSign },
    { id: 'assets', name: 'Assets', icon: Briefcase },
    { id: 'invoices', name: 'Invoices', icon: FileText },
    { id: 'payments', name: 'Payments', icon: Landmark },
    { id: 'statements', name: 'Statements', icon: Sheet },
];


function StepMain() {
    const { control, watch } = useFormContext<FormValues>();
    const [clients, setClients] = useState<any[]>([]);
    const [availableAssets, setAvailableAssets] = useState<any[]>([]);
    const [selectedClientDetails, setSelectedClientDetails] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const selectedClientId = watch('clientId');

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const token = await getClientSideAuthToken();
                if (!token) throw new Error("Auth failed.");
                const [clientsRes, assetsRes] = await Promise.all([
                    performAdminAction(token, 'getLendingData', { collectionName: 'lendingClients' }),
                    performAdminAction(token, 'getLendingData', { collectionName: 'lendingAssets' }),
                ]);
                setClients(clientsRes.data || []);
                setAvailableAssets((assetsRes.data || []).filter((a: any) => a.status === 'available'));
            } catch (e: any) {
                toast({ variant: 'destructive', title: "Failed to load data", description: e.message });
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [toast]);
    
     useEffect(() => {
        const loadClientDetails = async () => {
            if (!selectedClientId) {
                setSelectedClientDetails(null);
                return;
            }
            try {
                const token = await getClientSideAuthToken();
                if (!token) throw new Error("Auth failed.");
                const clientDetails = await performAdminAction(token, 'getLendingClientById', { clientId: selectedClientId });
                setSelectedClientDetails(clientDetails.data || null);
            } catch (e: any) {
                 toast({ variant: 'destructive', title: "Failed to load client details", description: e.message });
            }
        }
        loadClientDetails();
    }, [selectedClientId, toast]);


    return (
        <div className="space-y-4 max-w-2xl">
             <FormField control={control} name="clientId" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Users/>Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={control} name="assetId" render={({ field }) => (<FormItem><FormLabel>Link Asset (Optional)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an available asset..." /></SelectTrigger></FormControl><SelectContent>{availableAssets.map(a => <SelectItem key={a.id} value={a.id}>{a.make} {a.model} ({a.year})</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={control} name="type" render={({ field }) => (<FormItem><FormLabel>Agreement Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="loan">Loan</SelectItem><SelectItem value="installment-sale">Installment Sale</SelectItem><SelectItem value="lease">Lease</SelectItem><SelectItem value="factoring">Factoring</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="Agreement Description" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={control} name="totalAdvanced" render={({ field }) => (<FormItem><FormLabel>Total Advanced (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="interestRate" render={({ field }) => (<FormItem><FormLabel>Interest Rate (p.a. %)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={control} name="arrearInterest" render={({ field }) => (<FormItem className="flex flex-row items-end space-x-2 pb-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange}/></FormControl><FormLabel>Arrear Interest?</FormLabel></FormItem>)} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={control} name="createDate" render={({ field }) => (<FormItem><FormLabel>Create Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="capitalizationDate" render={({ field }) => (<FormItem><FormLabel>Charge Capitalised(Int.) From</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="firstInstallmentDate" render={({ field }) => (<FormItem><FormLabel>First Instalment Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={control} name="numberOfInstallments" render={({ field }) => (<FormItem><FormLabel># of Instalments</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={control} name="interval" render={({ field }) => (<FormItem><FormLabel>Interval</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select interval..."/></SelectTrigger></FormControl><SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="bi-monthly">Bi-Monthly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={control} name="paymentMethod" render={({ field }) => (<FormItem><FormLabel>Payment Method</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select method..."/></SelectTrigger></FormControl><SelectContent><SelectItem value="debit_order">Debit Order</SelectItem><SelectItem value="eft">EFT</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={control} name="bankAccountId" render={({ field }) => (<FormItem><FormLabel>Bank Account</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedClientDetails}><FormControl><SelectTrigger><SelectValue placeholder={selectedClientDetails ? "Select account..." : "Select client first"}/></SelectTrigger></FormControl><SelectContent>{(selectedClientDetails?.bankAccounts || []).map((acc: any, index: number) => <SelectItem key={index} value={acc.accountNumber}>{acc.bankName} - {acc.accountNumber}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
        </div>
    );
};

const PlaceholderStep = ({ name }: { name: string }) => (
    <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg p-8">
        <div className="text-center">
             <h3 className="text-xl font-semibold text-muted-foreground">{name}</h3>
            <p className="text-muted-foreground mt-2">This section is under construction.</p>
        </div>
    </div>
);


export function AgreementWizard({ agreement, defaultClientId }: { agreement?: any, defaultClientId?: string | null }) {
    const [currentStep, setCurrentStep] = useState(1); // Default to Main step
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    
    const methods = useForm<FormValues>({
        resolver: zodResolver(agreementFormSchema),
        mode: 'onChange',
        defaultValues: agreement || { 
            clientId: defaultClientId || '',
        },
    });

    const handleNext = async () => {
        const currentStepConfig = wizardSteps[currentStep];
        if (!currentStepConfig) return;

        let isValid = false;
        if (currentStepConfig.fields && currentStepConfig.fields.length > 0) {
            isValid = await methods.trigger(currentStepConfig.fields as (keyof FormValues)[]);
        } else {
            isValid = true;
        }

        if (isValid && currentStep < wizardSteps.length - 1) {
            setCurrentStep(s => s + 1);
        } else if (!isValid) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please complete all required fields.' });
        }
    };

    const handleBackWizard = () => { currentStep > 0 ? setCurrentStep(prev => prev - 1) : router.push('/lending?view=agreements'); };

    const onSubmit = async (values: FormValues) => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");

            await performAdminAction(token, 'saveLendingAgreement', { agreement: { id: agreement?.id, ...values } });
            
            toast({ title: agreement?.id ? 'Agreement Updated' : 'Agreement Created' });
            router.push('/lending?view=agreements');
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error saving agreement', description: e.message });
        } finally {
            setIsSaving(false);
        }
    };
    
     const renderStepContent = () => {
        const stepId = wizardSteps[currentStep]?.id;
        switch (stepId) {
            case 'dashboard': return <PlaceholderStep name="Dashboard" />;
            case 'main': return <StepMain />;
            case 'charges': return <PlaceholderStep name="Charges" />;
            case 'assets': return <PlaceholderStep name="Assets" />;
            case 'invoices': return <PlaceholderStep name="Invoices" />;
            case 'payments': return <PlaceholderStep name="Payments" />;
            case 'statements': return <PlaceholderStep name="Statements" />;
            default: return <PlaceholderStep name={wizardSteps[currentStep]?.name || 'Step'} />;
        }
    };
    
    return (
        <Card className="w-full">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <h2 className="text-2xl font-bold font-headline">{agreement ? 'Edit Agreement' : 'Create New Agreement'}</h2>
                                <p className="text-muted-foreground">{wizardSteps[currentStep].name}</p>
                            </div>
                             <Button type="button" variant="ghost" onClick={() => router.push('/lending?view=agreements')}><ArrowLeft className="mr-2 h-4 w-4"/> Back to List</Button>
                        </div>
                    </CardHeader>
                        <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
                             <div className="flex flex-col gap-2 border-r pr-4">
                                {wizardSteps.map((step, index) => {
                                    const Icon = step.icon;
                                    return (
                                        <Button key={step.id} variant={currentStep === index ? 'secondary' : 'ghost'} className="justify-start gap-2" onClick={() => setCurrentStep(index)}>
                                            <Icon className="h-5 w-5" />
                                            {step.name}
                                        </Button>
                                    );
                                })}
                            </div>
                             <div className="space-y-6 min-h-[400px]">
                                <h3 className="text-xl font-bold">{wizardSteps[currentStep].name}</h3>
                                {renderStepContent()}
                             </div>
                        </div>
                    </CardContent>
                     <CardFooter className="flex justify-between border-t pt-6 mt-6">
                        <Button type="button" variant="outline" onClick={handleBackWizard}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                        {currentStep < wizardSteps.length - 1 ? (
                            <Button type="button" onClick={handleNext}>Next <ArrowRight className="ml-2 h-4 w-4"/></Button>
                        ) : (
                            <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {agreement ? 'Save Changes' : 'Create Agreement'}</Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
