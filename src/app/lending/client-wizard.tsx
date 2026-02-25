'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, Save, Users, Building, Phone, Mail, UserSquare, Banknote, FileText, BarChart2 } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { provinces } from '@/lib/geodata';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';

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
  code: z.string().optional(),
  name: z.string().min(1, "Client name is required."),
  status: z.enum(['active', 'inactive', 'draft']).default('draft'),
  type: z.string().optional(),
  category: z.string().optional(),
  language: z.string().optional(),
  vatRegistered: z.boolean().default(false),
  registrationId: z.string().optional(),
  
  // Fields from other steps
  street: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  
  primaryContactName: z.string().optional(),
  primaryContactEmail: z.string().email().optional().or(z.literal('')),
  primaryContactPhone: z.string().optional(),
  
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  branchCode: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

const wizardSteps = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart2 },
    { id: 'main', name: 'Main', icon: Users },
    { id: 'address', name: 'Address', icon: Building },
    { id: 'contact', name: 'Contact', icon: Phone },
    { id: 'owners', name: 'Owners', icon: UserSquare },
    { id: 'management', name: 'Management', icon: UserSquare },
    { id: 'bank-accounts', name: 'Bank Accounts', icon: Banknote },
    { id: 'balance-sheet', name: 'Balance Sheet', icon: FileText },
    { id: 'income-statement', name: 'Income Statement', icon: FileText },
];

const StepMain = () => {
    const { control } = useFormContext<FormValues>();
    return (
        <div className="space-y-4 max-w-lg">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={control} name="code" render={({ field }) => (<FormItem><FormLabel>Code</FormLabel><FormControl><Input placeholder="Client Code" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Client Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a type..."/></SelectTrigger></FormControl><SelectContent><SelectItem value="individual">Individual</SelectItem><SelectItem value="company">Company</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category..."/></SelectTrigger></FormControl><SelectContent><SelectItem value="transport">Transport</SelectItem><SelectItem value="logistics">Logistics</SelectItem><SelectItem value="supplier">Supplier</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={control} name="language" render={({ field }) => (<FormItem><FormLabel>Language</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a language..."/></SelectTrigger></FormControl><SelectContent><SelectItem value="english">English</SelectItem><SelectItem value="afrikaans">Afrikaans</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            <FormField control={control} name="registrationId" render={({ field }) => (<FormItem><FormLabel>Reg. ID</FormLabel><FormControl><Input placeholder="Company Registration ID" {...field} /></FormControl><FormMessage /></FormItem>)} />
             <FormField control={control} name="vatRegistered" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base">VAT Registered?</FormLabel>
                        <FormDescription>Is this client registered for VAT?</FormDescription>
                    </div>
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
            )} />
        </div>
    );
};

const StepAddress = () => {
    const { control } = useFormContext<FormValues>();
    return (
        <div className="space-y-4 max-w-lg">
            <FormField control={control} name="street" render={({ field }) => (<FormItem><FormLabel>Street Address</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={control} name="province" render={({ field }) => (<FormItem><FormLabel>Province</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a province..."/></SelectTrigger></FormControl><SelectContent>{provinces.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}</SelectContent></Select></FormItem>)} />
            </div>
            <FormField control={control} name="postalCode" render={({ field }) => (<FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
        </div>
    );
};

const StepContact = () => {
     const { control } = useFormContext<FormValues>();
    return (
        <div className="space-y-4 max-w-lg">
            <FormField control={control} name="primaryContactName" render={({ field }) => (<FormItem><FormLabel>Primary Contact Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={control} name="primaryContactEmail" render={({ field }) => (<FormItem><FormLabel>Primary Contact Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>)} />
                <FormField control={control} name="primaryContactPhone" render={({ field }) => (<FormItem><FormLabel>Primary Contact Phone</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            </div>
        </div>
    );
}

const StepBank = () => {
    const { control } = useFormContext<FormValues>();
    return (
        <div className="space-y-4 max-w-lg">
            <FormField control={control} name="bankName" render={({ field }) => (<FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={control} name="accountNumber" render={({ field }) => (<FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={control} name="branchCode" render={({ field }) => (<FormItem><FormLabel>Branch Code</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
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


export function ClientWizard({ client, onBack, onSaveSuccess }: { client?: any, onBack: () => void, onSaveSuccess?: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: client || {
            name: '',
            status: 'draft',
        },
    });

    useEffect(() => {
        if (client) {
            methods.reset(client);
        }
    }, [client, methods]);


    const onSubmit = async (values: FormValues) => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");
            await performAdminAction(token, 'saveLendingClient', { client: { id: client?.id, ...values } });
            toast({ title: client?.id ? 'Client Updated' : 'Client Created' });
            if (onSaveSuccess) onSaveSuccess();
            else router.push('/lending?view=clients');
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error saving client', description: e.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    const renderStepContent = () => {
        const stepId = wizardSteps[currentStep]?.id;
        switch (stepId) {
            case 'main': return <StepMain />;
            case 'address': return <StepAddress />;
            case 'contact': return <StepContact />;
            case 'bank-accounts': return <StepBank />;
            default: return <PlaceholderStep name={wizardSteps[currentStep]?.name} />;
        }
    };
    
    return (
        <Card className="w-full">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <h2 className="text-2xl font-bold font-headline">{client ? `Edit Client: ${client.name}` : 'Create New Client'}</h2>
                            </div>
                             <Button type="button" variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4"/> Back to List</Button>
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
                                {renderStepContent()}
                             </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end border-t pt-6 mt-6">
                        <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {client ? 'Save Changes' : 'Create Client'}</Button>
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
