'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider, useFieldArray, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, Save, Users, Building, Phone, Mail, UserSquare, Banknote, FileText, BarChart2, PlusCircle, Trash2, Check } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
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

const ownerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  suburb: z.string().optional(),
  city: z.string().optional(),
  postCode: z.string().optional(),
  idNumber: z.string().optional(),
  cell: z.string().optional(),
  position: z.string().optional(),
  qualification: z.string().optional(),
  since: z.string().optional(),
  percentageHeld: z.coerce.number().min(0).max(100).optional(),
});

const managerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  suburb: z.string().optional(),
  city: z.string().optional(),
  postCode: z.string().optional(),
  idNumber: z.string().optional(),
  cell: z.string().optional(),
  position: z.string().optional(),
  qualification: z.string().optional(),
  since: z.string().optional(),
});

const bankAccountSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  branchCode: z.string().min(1, "Branch code is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  branchName: z.string().optional(),
  bankCode: z.string().optional(),
  address: z.string().optional(),
  postCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  contactPerson: z.string().optional(),
});

const formSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Client name is required."),
  status: z.enum(['active', 'inactive', 'draft']).default('draft'),
  type: z.string().optional(),
  category: z.string().optional(),
  language: z.string().optional(),
  vatRegistered: z.boolean().default(false),
  registrationId: z.string().optional(),
  
  physicalAddress: z.string().optional(),
  physicalPostalCode: z.string().optional(),
  postalAddress: z.string().optional(),
  postalPostalCode: z.string().optional(),
  
  contactPerson: z.string().optional(),
  telWork: z.string().optional(),
  telHome: z.string().optional(),
  fax: z.string().optional(),
  cell: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  url: z.string().url().optional().or(z.literal('')),
  
  owners: z.array(ownerSchema).optional(),
  management: z.array(managerSchema).optional(),
  bankAccounts: z.array(bankAccountSchema).optional(),
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
        <div className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-semibold text-md">Physical Address</h4>
                <FormField control={control} name="physicalAddress" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="123 Main Street&#10;Sandton" {...field} /></FormControl></FormItem>)} />
                <FormField control={control} name="physicalPostalCode" render={({ field }) => (<FormItem><FormLabel>Post Code</FormLabel><FormControl><Input placeholder="2196" {...field} /></FormControl></FormItem>)} />
            </div>
            <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-semibold text-md">Postal Address</h4>
                <FormField control={control} name="postalAddress" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="P.O. Box 123&#10;Sandton" {...field} /></FormControl></FormItem>)} />
                <FormField control={control} name="postalPostalCode" render={({ field }) => (<FormItem><FormLabel>Post Code</FormLabel><FormControl><Input placeholder="2146" {...field} /></FormControl></FormItem>)} />
            </div>
        </div>
    );
};

const StepContact = () => {
    const { control } = useFormContext<FormValues>();
    return (
        <div className="space-y-4 max-w-lg">
            <FormField control={control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={control} name="telWork" render={({ field }) => (<FormItem><FormLabel>Tel (w)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="telHome" render={({ field }) => (<FormItem><FormLabel>Tel (h)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={control} name="fax" render={({ field }) => (<FormItem><FormLabel>Fax</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="cell" render={({ field }) => (<FormItem><FormLabel>Cell</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={control} name="url" render={({ field }) => (<FormItem><FormLabel>URL</FormLabel><FormControl><Input type="url" placeholder="https://example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
    );
};

const StepOwners = () => {
    const { control } = useFormContext<FormValues>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "owners"
    });

    return (
        <div className="space-y-6">
            {fields.map((field, index) => (
                <Card key={field.id} className="relative p-4 pt-8">
                     <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <CardContent className="space-y-4">
                        <FormField control={control} name={`owners.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Owner Name</FormLabel><FormControl><Input placeholder="Full Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={control} name={`owners.${index}.address`} render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="123 Owner Ave" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={control} name={`owners.${index}.suburb`} render={({ field }) => (<FormItem><FormLabel>Suburb</FormLabel><FormControl><Input placeholder="Sandton" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name={`owners.${index}.city`} render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Johannesburg" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name={`owners.${index}.postCode`} render={({ field }) => (<FormItem><FormLabel>Post Code</FormLabel><FormControl><Input placeholder="2196" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={control} name={`owners.${index}.idNumber`} render={({ field }) => (<FormItem><FormLabel>ID No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name={`owners.${index}.cell`} render={({ field }) => (<FormItem><FormLabel>Cell</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <FormField control={control} name={`owners.${index}.position`} render={({ field }) => (<FormItem><FormLabel>Position</FormLabel><FormControl><Input placeholder="Director" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name={`owners.${index}.qualification`} render={({ field }) => (<FormItem><FormLabel>Qualification</FormLabel><FormControl><Input placeholder="B.Com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name={`owners.${index}.since`} render={({ field }) => (<FormItem><FormLabel>Since (Year)</FormLabel><FormControl><Input placeholder="2010" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name={`owners.${index}.percentageHeld`} render={({ field }) => (<FormItem><FormLabel>% Held</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </CardContent>
                </Card>
            ))}
            <Button
                type="button"
                variant="outline"
                onClick={() => append({ name: '', address: '', suburb: '', city: '', postCode: '', idNumber: '', cell: '', position: '', qualification: '', since: '', percentageHeld: 0 })}
            >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Owner
            </Button>
        </div>
    );
};

const StepManagement = () => {
    const { control } = useFormContext<FormValues>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "management"
    });

    return (
        <div className="space-y-6">
            {fields.map((field, index) => (
                <Card key={field.id} className="relative p-4 pt-8">
                     <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <CardContent className="space-y-4">
                        <FormField control={control} name={`management.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Manager Name</FormLabel><FormControl><Input placeholder="Full Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={control} name={`management.${index}.address`} render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="123 Manager Ave" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={control} name={`management.${index}.suburb`} render={({ field }) => (<FormItem><FormLabel>Suburb</FormLabel><FormControl><Input placeholder="Sandton" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name={`management.${index}.city`} render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Johannesburg" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name={`management.${index}.postCode`} render={({ field }) => (<FormItem><FormLabel>Post Code</FormLabel><FormControl><Input placeholder="2196" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={control} name={`management.${index}.idNumber`} render={({ field }) => (<FormItem><FormLabel>ID No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name={`management.${index}.cell`} render={({ field }) => (<FormItem><FormLabel>Cell</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={control} name={`management.${index}.position`} render={({ field }) => (<FormItem><FormLabel>Position</FormLabel><FormControl><Input placeholder="e.g., Fleet Manager" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name={`management.${index}.qualification`} render={({ field }) => (<FormItem><FormLabel>Qualification</FormLabel><FormControl><Input placeholder="e.g., B.Log" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name={`management.${index}.since`} render={({ field }) => (<FormItem><FormLabel>Since (Year)</FormLabel><FormControl><Input placeholder="2015" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </CardContent>
                </Card>
            ))}
            <Button
                type="button"
                variant="outline"
                onClick={() => append({ name: '', address: '', suburb: '', city: '', postCode: '', idNumber: '', cell: '', position: '', qualification: '', since: '' })}
            >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Manager
            </Button>
        </div>
    );
};

const StepBank = () => {
    const { control } = useFormContext<FormValues>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "bankAccounts"
    });

    return (
        <div className="space-y-6">
            {fields.map((field, index) => (
                <Card key={field.id} className="relative p-4 pt-8">
                     <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={control} name={`bankAccounts.${index}.bankName`} render={({ field }) => (<FormItem><FormLabel>Bank</FormLabel><FormControl><Input placeholder="e.g., FNB" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name={`bankAccounts.${index}.accountNumber`} render={({ field }) => (<FormItem><FormLabel>Account No</FormLabel><FormControl><Input placeholder="e.g., 62000123456" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={control} name={`bankAccounts.${index}.branchName`} render={({ field }) => (<FormItem><FormLabel>Branch Name</FormLabel><FormControl><Input placeholder="e.g., Sandton" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name={`bankAccounts.${index}.branchCode`} render={({ field }) => (<FormItem><FormLabel>Branch Code</FormLabel><FormControl><Input placeholder="e.g., 250655" {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={control} name={`bankAccounts.${index}.bankCode`} render={({ field }) => (<FormItem><FormLabel>Bank Code</FormLabel><FormControl><Input placeholder="e.g., FIRNZAJJ" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={control} name={`bankAccounts.${index}.address`} render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="Bank Address" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={control} name={`bankAccounts.${index}.postCode`} render={({ field }) => (<FormItem><FormLabel>Post Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={control} name={`bankAccounts.${index}.contactPerson`} render={({ field }) => (<FormItem><FormLabel>Contact</FormLabel><FormControl><Input placeholder="e.g., Bank Manager" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name={`bankAccounts.${index}.phone`} render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={control} name={`bankAccounts.${index}.email`} render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </CardContent>
                </Card>
            ))}
            <Button
                type="button"
                variant="outline"
                onClick={() => append({ bankName: '', branchCode: '', accountNumber: '' } as any)}
            >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Bank Account
            </Button>
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
            owners: [],
            management: [],
            bankAccounts: [],
        },
    });

    useEffect(() => {
        if (client) {
            methods.reset({
                ...client,
                owners: client.owners || [],
                management: client.management || [],
                bankAccounts: client.bankAccounts || [],
            });
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
            case 'owners': return <StepOwners />;
            case 'management': return <StepManagement />;
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
