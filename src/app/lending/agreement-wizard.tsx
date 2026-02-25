
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
import { Loader2, ArrowLeft, ArrowRight, Save, FileText, Check, Users, Briefcase, DollarSign } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

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

const formSchema = z.object({
  clientId: z.string().min(1, "A client must be selected."),
  type: z.enum(["loan", "installment-sale", "lease", "factoring"]),
  amount: z.coerce.number().positive('Amount must be positive'),
  rate: z.coerce.number().min(0, 'Rate cannot be negative'),
  term: z.coerce.number().int().positive('Term must be a positive integer'),
  assetId: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

const wizardSteps = [
  { id: 'client', name: 'Client & Type', fields: ['clientId', 'type'] },
  { id: 'financials', name: 'Financials', fields: ['amount', 'rate', 'term'] },
  { id: 'asset', name: 'Asset', fields: ['assetId'] },
  { id: 'review', name: 'Review & Save' },
];

// --- Step Components ---

const StepClientAndType = ({ clients }: { clients: any[] }) => {
    const { control } = useForm<FormValues>();
    return (
        <div className="space-y-4 max-w-lg">
            <FormField control={control} name="clientId" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Users/>Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={control} name="type" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><FileText/>Agreement Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="loan">Loan</SelectItem><SelectItem value="installment-sale">Installment Sale</SelectItem><SelectItem value="lease">Lease</SelectItem><SelectItem value="factoring">Factoring</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        </div>
    );
};

const StepFinancials = () => {
    const { control } = useForm<FormValues>();
    return (
        <div className="space-y-4 max-w-lg">
            <FormField control={control} name="amount" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><DollarSign/>Amount (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={control} name="rate" render={({ field }) => (<FormItem><FormLabel>Interest Rate (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={control} name="term" render={({ field }) => (<FormItem><FormLabel>Term (Months)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
    );
};

const StepAsset = ({ assets }: { assets: any[] }) => {
    const { control } = useForm<FormValues>();
    return (
        <div className="space-y-4 max-w-lg">
            <FormField control={control} name="assetId" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Briefcase/>Linked Asset (Optional)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an available asset..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="">None</SelectItem>{assets.map(a => <SelectItem key={a.id} value={a.id}>{a.make} {a.model} ({a.year})</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
        </div>
    );
};


export function AgreementWizard({ agreement, defaultClientId }: { agreement?: any, defaultClientId?: string | null }) {
    const router = useRouter();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        mode: 'onChange',
        defaultValues: agreement || { 
            clientId: defaultClientId || '',
        },
    });

    useEffect(() => {
        if (agreement) {
            methods.reset(agreement);
        }
    }, [agreement, methods]);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoadingData(true);
            try {
                const token = await getClientSideAuthToken();
                if (!token) throw new Error("Auth failed.");
                const [clientsRes, assetsRes] = await Promise.all([
                    performAdminAction(token, 'getLendingData', { collectionName: 'lendingClients' }),
                    performAdminAction(token, 'getLendingData', { collectionName: 'lendingAssets' }),
                ]);
                setClients(clientsRes.data || []);
                const availableAssets = (assetsRes.data || []).filter((a: any) => a.status === 'available' || a.id === agreement?.assetId);
                setAssets(availableAssets);
            } catch (e: any) {
                toast({ variant: 'destructive', title: "Failed to load data", description: e.message });
            } finally {
                setIsLoadingData(false);
            }
        };
        loadInitialData();
    }, [agreement, toast]);

    const handleNext = async () => {
        const currentStepConfig = wizardSteps[currentStep];
        let isValid = false;
        if (currentStepConfig.fields && currentStepConfig.fields.length > 0) {
            isValid = await methods.trigger(currentStepConfig.fields as (keyof FormValues)[]);
        } else {
            isValid = true;
        }

        if (isValid && currentStep < wizardSteps.length - 1) {
            setCurrentStep(s => s + 1);
        } else if (!isValid) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please complete all required fields for this step.' });
        }
    };
    
    const handleBackStep = () => currentStep > 0 && setCurrentStep(s => s - 1);

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
    
    const isStepValid = (stepIndex: number) => {
        if (stepIndex < 0) return true;
        const step = wizardSteps[stepIndex];
        if (!step.fields || step.fields.length === 0) return true;
        const fields = step.fields as (keyof FormValues)[];
        return fields.every(field => !methods.formState.errors[field]);
    };
    
     const renderStepContent = () => {
        const stepId = wizardSteps[currentStep]?.id;
        switch (stepId) {
            case 'client': return <StepClientAndType clients={clients} />;
            case 'financials': return <StepFinancials />;
            case 'asset': return <StepAsset assets={assets} />;
            case 'review': return <div className="p-4 bg-muted rounded-md text-xs whitespace-pre-wrap">{JSON.stringify(methods.getValues(), null, 2)}</div>;
            default: return <div className="text-center py-10"><p className="text-muted-foreground">This step is under construction.</p></div>;
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
                                    const isCompleted = index < currentStep && isStepValid(index);
                                    return (
                                        <Button key={step.id} variant={currentStep === index ? 'default' : 'ghost'} className="justify-start gap-2" onClick={() => setCurrentStep(index)} disabled={index > currentStep && !isStepValid(currentStep - 1)}>
                                            {isCompleted ? <Check className="h-5 w-5 text-green-500" /> : <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold", currentStep >= index ? "bg-primary-foreground text-primary" : "bg-muted-foreground/20")}>{index + 1}</div>}
                                            {step.name}
                                        </Button>
                                    );
                                })}
                            </div>
                             <div className="space-y-6">
                                <h2 className="text-2xl font-bold">{wizardSteps[currentStep].name}</h2>
                                <div className="min-h-[400px]">
                                    {isLoadingData ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : renderStepContent()}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-6 mt-6">
                        <Button type="button" variant="outline" onClick={handleBackStep} disabled={currentStep === 0}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
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
