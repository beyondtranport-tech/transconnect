
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, PlusCircle, Trash2, Loader2, Check, ArrowLeft, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useForm, useFieldArray, FormProvider, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import * as React from "react";
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { useCollection, useFirestore, useMemoFirebase, getClientSideAuthToken } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from 'zod';
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@/hooks/use-data-table";
import { Label } from "@/components/ui/label";
import BalanceSheetContent from './balance-sheet-content';
import IncomeStatementContent from './income-statement-content';


// --- Zod Schema ---
const ownerSchema = z.object({
  name: z.string().optional(),
  idNo: z.string().optional(),
  address: z.string().optional(),
  suburb: z.string().optional(),
  city: z.string().optional(),
  postCode: z.string().optional(),
  province: z.string().optional(),
  cell: z.string().optional(),
  position: z.string().optional(),
  qualification: z.string().optional(),
  since: z.string().optional(),
  held: z.coerce.number().optional(),
});

const managementSchema = z.object({
    name: z.string().optional(),
    idNo: z.string().optional(),
    address: z.string().optional(),
    suburb: z.string().optional(),
    city: z.string().optional(),
    postCode: z.string().optional(),
    province: z.string().optional(),
    cell: z.string().optional(),
    position: z.string().optional(),
    title: z.string().optional(),
    qualification: z.string().optional(),
    since: z.string().optional(),
    description: z.string().optional(),
});

const bankAccountSchema = z.object({
    bank: z.string().optional(),
    branchCode: z.string().optional(),
    accountNo: z.string().optional(),
    branchName: z.string().optional(),
    bankCode: z.string().optional(),
    address: z.string().optional(),
    postCode: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    contact: z.string().optional(),
});


const clientSchema = z.object({
  clientCode: z.string().optional(),
  name: z.string().min(1, "Client name is required."),
  status: z.enum(['active', 'inactive', 'pending']),
  type: z.string().optional(),
  category: z.string().optional(),
  language: z.string().optional(),
  regId: z.string().optional(),
  isVatRegistered: z.boolean().default(false),
  
  physicalStreet: z.string().optional(),
  physicalSuburb: z.string().optional(),
  physicalCity: z.string().optional(),
  physicalPostCode: z.string().optional(),
  
  usePhysicalForPostal: z.boolean().default(false),
  postalStreet: z.string().optional(),
  postalSuburb: z.string().optional(),
  postalCity: z.string().optional(),
  postalPostCode: z.string().optional(),
  
  telW: z.string().optional(),
  telH: z.string().optional(),
  fax: z.string().optional(),
  cell: z.string().optional(),
  email: z.string().optional(),
  url: z.string().optional(),
  primaryContact: z.string().optional(),
  
  owners: z.array(ownerSchema).optional(),
  management: z.array(managementSchema).optional(),
  bankAccounts: z.array(bankAccountSchema).optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

const steps = [
    { id: 'main', name: 'Main Details', fields: ['name', 'status', 'clientCode', 'regId', 'type', 'category', 'language'] },
    { id: 'address', name: 'Address', fields: ['physicalStreet', 'physicalCity', 'physicalPostCode', 'postalStreet', 'postalCity', 'postalPostCode'] },
    { id: 'contact', name: 'Contact Info', fields: ['email', 'cell', 'telW'] },
    { id: 'owners', name: 'Owners & Directors', fields: ['owners'] },
    { id: 'management', name: 'Management', fields: ['management'] },
    { id: 'banking', name: 'Bank Accounts', fields: ['bankAccounts'] },
    { id: 'balance-sheet', name: 'Balance Sheet' },
    { id: 'income-statement', name: 'Income Statement' },
    { id: 'agreements', name: 'Agreements & Submit' },
];

const defaultValues: Omit<ClientFormValues, 'globalFacilityLimit'> = {
  clientCode: '',
  name: '',
  status: 'pending',
  type: '',
  category: '',
  language: '',
  regId: '',
  isVatRegistered: false,
  usePhysicalForPostal: false,
  owners: [],
  management: [],
  bankAccounts: [],
};


// --- Sub-components for each step ---

const StepMain = () => (
    <div className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={useFormContext().control} name="clientCode" render={({ field }) => (<FormItem><FormLabel>Client Code</FormLabel><FormControl><Input placeholder="Client Code" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={useFormContext().control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Client Legal Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={useFormContext().control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select></FormItem>)} />
            <FormField control={useFormContext().control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger></FormControl><SelectContent><SelectItem value="individual">Individual</SelectItem><SelectItem value="company">Company</SelectItem></SelectContent></Select></FormItem>)} />
            <FormField control={useFormContext().control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger></FormControl><SelectContent><SelectItem value="transport">Transport</SelectItem><SelectItem value="logistics">Logistics</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></FormItem>)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={useFormContext().control} name="language" render={({ field }) => (<FormItem><FormLabel>Language</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger></FormControl><SelectContent><SelectItem value="english">English</SelectItem><SelectItem value="afrikaans">Afrikaans</SelectItem></SelectContent></Select></FormItem>)} />
            <FormField control={useFormContext().control} name="regId" render={({ field }) => (<FormItem><FormLabel>Reg. ID</FormLabel><FormControl><Input placeholder="Registration ID" {...field} /></FormControl></FormItem>)} />
        </div>
        <FormField control={useFormContext().control} name="isVatRegistered" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>VAT Registered?</FormLabel></FormItem>)} />
    </div>
);

const StepAddress = () => {
    const { control, watch, setValue } = useFormContext();
    const usePhysicalForPostal = watch('usePhysicalForPostal');
    const physicalAddress = watch(['physicalStreet', 'physicalSuburb', 'physicalCity', 'physicalPostCode']);

    useEffect(() => {
        if (usePhysicalForPostal) {
            setValue('postalStreet', physicalAddress[0] || '');
            setValue('postalSuburb', physicalAddress[1] || '');
            setValue('postalCity', physicalAddress[2] || '');
            setValue('postalPostCode', physicalAddress[3] || '');
        }
    }, [usePhysicalForPostal, physicalAddress, setValue]);

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-semibold mb-4">Physical Address</h3>
                <div className="space-y-4 max-w-2xl">
                    <FormField control={control} name="physicalStreet" render={({ field }) => (<FormItem><FormLabel>Street Address</FormLabel><FormControl><Input placeholder="e.g., 123 Industrial Rd" {...field} /></FormControl></FormItem>)} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={control} name="physicalSuburb" render={({ field }) => (<FormItem><FormLabel>Suburb</FormLabel><FormControl><Input placeholder="e.g., Pomona" {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name="physicalCity" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g., Kempton Park" {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name="physicalPostCode" render={({ field }) => (<FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input placeholder="e.g., 1619" {...field} /></FormControl></FormItem>)} />
                    </div>
                </div>
            </div>
            <Separator />
            <div>
                 <h3 className="text-lg font-semibold mb-4">Postal Address</h3>
                 <FormField control={control} name="usePhysicalForPostal" render={({ field }) => (<FormItem className="flex items-center space-x-2 mb-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Same as Physical Address</FormLabel></FormItem>)} />
                <div className="space-y-4 max-w-2xl">
                    <FormField control={control} name="postalStreet" render={({ field }) => (<FormItem><FormLabel>Street Address or P.O. Box</FormLabel><FormControl><Input placeholder="e.g., P.O. Box 12345" {...field} disabled={usePhysicalForPostal} /></FormControl></FormItem>)} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={control} name="postalSuburb" render={({ field }) => (<FormItem><FormLabel>Suburb</FormLabel><FormControl><Input placeholder="e.g., Pomona" {...field} disabled={usePhysicalForPostal} /></FormControl></FormItem>)} />
                        <FormField control={control} name="postalCity" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g., Kempton Park" {...field} disabled={usePhysicalForPostal} /></FormControl></FormItem>)} />
                        <FormField control={control} name="postalPostCode" render={({ field }) => (<FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input placeholder="e.g., 1619" {...field} disabled={usePhysicalForPostal} /></FormControl></FormItem>)} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const StepContact = () => (
     <div className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={useFormContext().control} name="telW" render={({ field }) => (<FormItem><FormLabel>Tel (Work)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={useFormContext().control} name="telH" render={({ field }) => (<FormItem><FormLabel>Tel (Home)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={useFormContext().control} name="fax" render={({ field }) => (<FormItem><FormLabel>Fax</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={useFormContext().control} name="cell" render={({ field }) => (<FormItem><FormLabel>Cell</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={useFormContext().control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>)} />
            <FormField control={useFormContext().control} name="url" render={({ field }) => (<FormItem><FormLabel>Website URL</FormLabel><FormControl><Input type="url" {...field} /></FormControl></FormItem>)} />
        </div>
        <FormField control={useFormContext().control} name="primaryContact" render={({ field }) => (<FormItem><FormLabel>Primary Contact Person</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
    </div>
);

const StepOwners = () => {
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({ control, name: "owners" });

    return (
        <div className="space-y-6">
            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', address: '', suburb: '', city: '', province: '', postCode: '', idNo: '', cell: '', position: '', qualification: '', since: '', held: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Owner</Button>
            {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                    <div className="flex justify-between items-center"><h3 className="font-semibold text-lg">Owner #{index + 1}</h3><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField control={control} name={`owners.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><FormField control={control} name={`owners.${index}.idNo`} render={({ field }) => (<FormItem><FormLabel>ID No</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /></div>
                    <FormField control={control} name={`owners.${index}.address`} render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={control} name={`owners.${index}.suburb`} render={({ field }) => (<FormItem><FormLabel>Suburb</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name={`owners.${index}.city`} render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name={`owners.${index}.postCode`} render={({ field }) => (<FormItem><FormLabel>Post Code</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={control} name={`owners.${index}.province`} render={({ field }) => (<FormItem><FormLabel>Province</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name={`owners.${index}.cell`} render={({ field }) => (<FormItem><FormLabel>Cell</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                         <FormField control={control} name={`owners.${index}.position`} render={({ field }) => (<FormItem><FormLabel>Position</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name={`owners.${index}.qualification`} render={({ field }) => (<FormItem><FormLabel>Qualification</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name={`owners.${index}.since`} render={({ field }) => (<FormItem><FormLabel>Since</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name={`owners.${index}.held`} render={({ field }) => (<FormItem><FormLabel>% Held</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                    </div>
                </div>
            ))}
        </div>
    );
};

const StepManagement = () => {
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({ control, name: "management" });
    return (
        <div className="space-y-6">
            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', address: '', suburb: '', city: '', province: '', postCode: '', idNo: '', cell: '', position: '', qualification: '', since: '', held: 0, title: '', description: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Manager</Button>
            {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                    <div className="flex justify-between items-center"><h3 className="font-semibold text-lg">Manager #{index + 1}</h3><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={control} name={`management.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name={`management.${index}.idNo`} render={({ field }) => (<FormItem><FormLabel>ID No</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>

                    <FormField control={control} name={`management.${index}.address`} render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={control} name={`management.${index}.suburb`} render={({ field }) => (<FormItem><FormLabel>Suburb</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name={`management.${index}.city`} render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name={`management.${index}.postCode`} render={({ field }) => (<FormItem><FormLabel>Post Code</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={control} name={`management.${index}.province`} render={({ field }) => (<FormItem><FormLabel>Province</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name={`management.${index}.cell`} render={({ field }) => (<FormItem><FormLabel>Cell</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={control} name={`management.${index}.position`} render={({ field }) => (<FormItem><FormLabel>Position</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                         <FormField control={control} name={`management.${index}.title`} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select title" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Mr.">Mr.</SelectItem>
                                        <SelectItem value="Mrs.">Mrs.</SelectItem>
                                        <SelectItem value="Ms.">Ms.</SelectItem>
                                        <SelectItem value="Miss">Miss</SelectItem>
                                        <SelectItem value="Dr.">Dr.</SelectItem>
                                        <SelectItem value="Prof.">Prof.</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                         <FormField control={control} name={`management.${index}.qualification`} render={({ field }) => (<FormItem><FormLabel>Qualification</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                         <FormField control={control} name={`management.${index}.since`} render={({ field }) => (<FormItem><FormLabel>Since</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                         <FormField control={control} name={`management.${index}.description`} render={({ field }) => (<FormItem className="md:col-span-1"><FormLabel>Description / Role</FormLabel><FormControl><Textarea {...field} placeholder="e.g., Handles all invoice queries."/></FormControl></FormItem>)} />
                    </div>
                </div>
            ))}
        </div>
    );
}


const StepBanking = () => {
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({ control, name: "bankAccounts" });
    return (
        <div className="space-y-6">
             <Button type="button" variant="outline" size="sm" onClick={() => append({ bank: '', accountNo: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Bank Account</Button>
            {fields.map((field, index) => (
                 <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                    <div className="flex justify-between items-center"><h3 className="font-semibold text-lg">Bank Account #{index + 1}</h3><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField control={control} name={`bankAccounts.${index}.bank`} render={({ field }) => (<FormItem><FormLabel>Bank</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><FormField control={control} name={`bankAccounts.${index}.accountNo`} render={({ field }) => (<FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /></div>
                </div>
            ))}
        </div>
    )
}

const StepAgreements = ({ onSubmit, isLoading }: { onSubmit: () => void, isLoading: boolean }) => (
    <div className="text-center">
        <h3 className="text-xl font-semibold">Agreements & Final Submission</h3>
        <p className="text-muted-foreground mt-2">The client needs to sign the necessary application and lending agreements. This step is a placeholder for that workflow.</p>
        <div className="mt-8 flex justify-center">
             <Button type="button" onClick={onSubmit} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                Save Client Profile
            </Button>
        </div>
    </div>
);


const ClientWizard = ({ clientData, onBack, onSaveSuccess }: { clientData?: Partial<ClientFormValues>, onBack: () => void, onSaveSuccess: () => void }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    
    const methods = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        mode: 'onChange',
        defaultValues: clientData || defaultValues
    });

    const handleNext = async () => {
        const currentStepConfig = steps[currentStep];
        if (!currentStepConfig) return;

        let isValid = false;
        if (currentStepConfig.fields) {
            isValid = await methods.trigger(currentStepConfig.fields as (keyof ClientFormValues)[]);
        } else {
            isValid = true;
        }

        if (isValid && currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else if (!isValid) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill in all required fields for this step.' });
        }
    };

    const handleBack = () => setCurrentStep(prev => prev - 1);
    
    const onSubmit = async (values: ClientFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'saveLendingClient', payload: { client: { id: clientData?.id, ...values } } }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            toast({ title: clientData?.id ? 'Client Updated' : 'Client Created', description: `Client "${values.name}" has been saved.` });
            onSaveSuccess();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error saving client', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    const isStepValid = (stepIndex: number) => {
        if (stepIndex < 0) return true; // Can always go back from step 0
        const step = steps[stepIndex];
        if (!step || !step.fields) return true; // Steps without fields are always "valid" for navigation
        const fields = step.fields as (keyof ClientFormValues)[];
        return fields.every(field => !methods.formState.errors[field as keyof typeof methods.formState.errors]);
    };


    const renderStepContent = () => {
        const stepId = steps[currentStep]?.id;
        switch (stepId) {
            case 'main': return <StepMain />;
            case 'address': return <StepAddress />;
            case 'contact': return <StepContact />;
            case 'owners': return <StepOwners />;
            case 'management': return <StepManagement />;
            case 'banking': return <StepBanking />;
            case 'balance-sheet': return <BalanceSheetContent />;
            case 'income-statement': return <IncomeStatementContent />;
            case 'agreements': return <StepAgreements onSubmit={methods.handleSubmit(onSubmit)} isLoading={isLoading} />;
            default: return null;
        }
    };

    return (
        <FormProvider {...methods}>
            <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
                {/* Stepper */}
                <div className="flex flex-col gap-2 border-r pr-4">
                    {steps.map((step, index) => {
                        const isCompleted = index < currentStep && isStepValid(index);
                        return (
                             <Button 
                                key={step.id} 
                                variant={currentStep === index ? 'default' : 'ghost'} 
                                className="justify-start gap-2"
                                onClick={() => setCurrentStep(index)}
                                disabled={index > currentStep && !isStepValid(currentStep - 1)}
                            >
                                {isCompleted ? <Check className="h-5 w-5 text-green-500" /> : <div className="h-5 w-5" />}
                                {step.name}
                            </Button>
                        )
                    })}
                </div>

                {/* Form Content */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">{steps[currentStep].name}</h2>
                    {renderStepContent()}
                    <div className="flex justify-between pt-8 mt-8 border-t">
                        <Button type="button" variant="outline" onClick={currentStep === 0 ? onBack : handleBack}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> {currentStep === 0 ? 'Back to List' : 'Back'}
                        </Button>
                         {currentStep < steps.length - 1 && (
                            <Button type="button" onClick={handleNext}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        )}
                    </div>
                </div>
            </div>
        </FormProvider>
    );
};

export default function ClientsContent() {
    const firestore = useFirestore();
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [selectedClient, setSelectedClient] = useState<any | null>(null);

    const clientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingClients')) : null, [firestore]);
    const { data: clients, isLoading, forceRefresh } = useCollection(clientsQuery);
    
    const handleEdit = (client: any) => {
        setSelectedClient(client);
        setView('edit');
    };
    
    const handleAdd = () => {
        setSelectedClient(null);
        setView('create');
    };
    
    const handleBackToList = () => {
        setView('list');
        setSelectedClient(null);
    };

    const handleSaveSuccess = () => {
        forceRefresh();
        handleBackToList();
    }
    
    const formatCurrency = (amount: number) => {
        if (typeof amount !== 'number' || isNaN(amount)) return 'R 0';
        return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount);
    };
    
    const columns: ColumnDef<any>[] = useMemo(() => [
        { accessorKey: 'name', header: 'Client Name' },
        { accessorKey: 'status', header: 'Status', cell: ({row}) => <Badge className="capitalize">{row.original.status}</Badge>},
        { accessorKey: 'globalFacilityLimit', header: 'Facility Limit', cell: ({row}) => <span>{formatCurrency(row.original.globalFacilityLimit)}</span> },
        { id: 'actions', header: () => <div className="text-right">Actions</div>, cell: ({ row }) => <div className="text-right"><Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>Edit</Button></div> }
    ], []);


    if (view === 'create' || view === 'edit') {
        return <ClientWizard clientData={selectedClient} onBack={handleBackToList} onSaveSuccess={handleSaveSuccess} />;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2"><Users /> Clients Management</CardTitle>
                    <CardDescription>Manage your lending clients (debtors).</CardDescription>
                </div>
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Client</Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                    <DataTable columns={columns} data={clients || []} />
                )}
            </CardContent>
        </Card>
    );
}
