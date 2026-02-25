
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, Save, Users, DollarSign, Check } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || `API Error: ${action}`);
    return result;
}

const formSchema = z.object({
  name: z.string().min(1, 'Partner name is required.'),
  type: z.enum(['supplier', 'vendor', 'associate', 'debtor']),
  globalFacilityLimit: z.coerce.number().min(0).optional(),
});
type FormValues = z.infer<typeof formSchema>;

const wizardSteps = [
  { id: 'details', name: 'Partner Details', fields: ['name', 'type'] },
  { id: 'financials', name: 'Financials', fields: ['globalFacilityLimit'] },
  { id: 'review', name: 'Review & Save' },
];

export function PartnerWizard({ partner, onBack }: { partner?: any, onBack: () => void }) {
    const router = useRouter();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        mode: 'onChange',
        defaultValues: partner || { name: '', type: 'supplier', globalFacilityLimit: 0 },
    });

    useEffect(() => {
        if (partner) {
            methods.reset(partner);
        }
    }, [partner, methods]);

    const handleNext = async () => {
        const currentStepConfig = wizardSteps[currentStep];
        const isValid = await methods.trigger(currentStepConfig.fields as (keyof FormValues)[]);
        if (isValid && currentStep < wizardSteps.length - 1) {
            setCurrentStep(s => s + 1);
        }
    };
    
    const handleBackStep = () => currentStep > 0 && setCurrentStep(s => s - 1);

    const onSubmit = async (values: FormValues) => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");
            await performAdminAction(token, 'saveLendingPartner', { partner: { id: partner?.id, ...values } });
            toast({ title: partner?.id ? 'Partner Updated' : 'Partner Created' });
            router.push('/lending?view=partners');
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error saving partner', description: e.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    const isStepValid = (stepIndex: number) => {
        if (stepIndex < 0) return true;
        const step = wizardSteps[stepIndex];
        const fields = step.fields as (keyof FormValues)[];
        return fields.every(field => !methods.formState.errors[field]);
    };

    return (
        <Card className="w-full">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <h2 className="text-2xl font-bold font-headline">{partner ? 'Edit Partner' : 'Create New Partner'}</h2>
                                <p className="text-muted-foreground">{wizardSteps[currentStep].name}</p>
                            </div>
                             <Button type="button" variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4"/> Back to List</Button>
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
                             <div className="space-y-6 min-h-[300px]">
                                {currentStep === 0 && (
                                    <div className="space-y-4 max-w-lg">
                                        <FormField control={methods.control} name="name" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Users/>Partner Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={methods.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="supplier">Supplier</SelectItem><SelectItem value="vendor">Vendor</SelectItem><SelectItem value="associate">Associate</SelectItem><SelectItem value="debtor">Debtor</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                    </div>
                                )}
                                {currentStep === 1 && (
                                     <div className="space-y-4 max-w-lg">
                                        <FormField control={methods.control} name="globalFacilityLimit" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><DollarSign/>Global Facility Limit (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                     </div>
                                )}
                                {currentStep === 2 && (
                                     <div className="space-y-2">
                                        <h3 className="text-lg font-semibold">Review</h3>
                                        <pre className="p-4 bg-muted rounded-md text-xs whitespace-pre-wrap">{JSON.stringify(methods.getValues(), null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-6 mt-6">
                        <Button type="button" variant="outline" onClick={handleBackStep} disabled={currentStep === 0}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                        {currentStep < wizardSteps.length - 1 ? (
                            <Button type="button" onClick={handleNext}>Next <ArrowRight className="ml-2 h-4 w-4"/></Button>
                        ) : (
                            <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {partner ? 'Save Changes' : 'Create Partner'}</Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
