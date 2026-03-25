
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, useFormContext, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft, ArrowRight, CheckCircle, User, Building, Phone, Mail, Globe, Users, Banknote, FileText, BarChart, PlusCircle, Trash2 } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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


// --- ZOD Schemas ---
const contactSchema = z.object({
    name: z.string().optional(),
    position: z.string().optional(),
    cell: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
});

const ownerSchema = z.object({
    name: z.string().optional(), address: z.string().optional(), suburb: z.string().optional(), city: z.string().optional(),
    postCode: z.string().optional(), idNumber: z.string().optional(), cell: z.string().optional(), position: z.string().optional(),
    qualification: z.string().optional(), since: z.string().optional(), percentageHeld: z.coerce.number().optional(),
});
const managementSchema = z.object({
    name: z.string().optional(), address: z.string().optional(), suburb: z.string().optional(), city: z.string().optional(),
    postCode: z.string().optional(), idNumber: z.string().optional(), cell: z.string().optional(), position: z.string().optional(),
    qualification: z.string().optional(), since: z.string().optional(),
});
const bankAccountSchema = z.object({
    bankName: z.string().optional(), branchCode: z.string().optional(), accountNumber: z.string().optional(), branchName: z.string().optional(),
    bankCode: z.string().optional(), address: z.string().optional(), postCode: z.string().optional(), phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')), contactPerson: z.string().optional(),
});
const balanceSheetSchema = z.object({
    periodEndDate: z.string().optional(),
    propertyPlantEquipment: z.coerce.number().optional(),
    intangibleAssets: z.coerce.number().optional(),
    inventory: z.coerce.number().optional(),
    tradeReceivables: z.coerce.number().optional(),
    cashEquivalents: z.coerce.number().optional(),
    shareCapital: z.coerce.number().optional(),
    retainedEarnings: z.coerce.number().optional(),
    longTermLoans: z.coerce.number().optional(),
    tradePayables: z.coerce.number().optional(),
    shortTermLoans: z.coerce.number().optional(),
});
const incomeStatementSchema = z.object({
    periodEndDate: z.string().optional(),
    revenue: z.coerce.number().optional(),
    cogs: z.coerce.number().optional(),
    operatingExpenses: z.coerce.number().optional(),
    interestExpense: z.coerce.number().optional(),
    taxation: z.coerce.number().optional(),
});

const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  code: z.string().optional(),
  type: z.string().min(1, 'Client type is required'),
  category: z.string().optional(),
  status: z.enum(['draft', 'active', 'inactive', 'suspended']).default('draft'),
  registrationId: z.string().optional(),
  vatRegistered: z.boolean().default(false),
  physicalAddress: z.string().optional(),
  physicalPostalCode: z.string().optional(),
  postalAddress: z.string().optional(),
  postalPostalCode: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  contacts: z.array(contactSchema).optional(),
  owners: z.array(ownerSchema).optional(),
  management: z.array(managementSchema).optional(),
  bankAccounts: z.array(bankAccountSchema).optional(),
  balanceSheets: z.array(balanceSheetSchema).optional(),
  incomeStatements: z.array(incomeStatementSchema).optional(),
});
type ClientFormValues = z.infer<typeof clientSchema>;

// --- STEP COMPONENTS ---
const StepMain = () => {
    const { control } = useFormContext<ClientFormValues>();
    return (
         <div className="space-y-4">
            <FormField control={control} name="name" render={({ field }) => (<FormItem><FormLabel>Client Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
                <FormField control={control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a type..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="company">Company</SelectItem><SelectItem value="individual">Individual</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
             <FormField control={control} name="registrationId" render={({ field }) => (<FormItem><FormLabel>Registration ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={control} name="vatRegistered" render={({ field }) => (<FormItem className="flex items-center space-x-2 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><Label>VAT Registered?</Label></FormItem>)} />
        </div>
    )
};
const StepAddress = () => {
    const { control } = useFormContext<ClientFormValues>();
    return (
        <div className="space-y-6">
            <div>
                <h4 className="font-semibold mb-2">Physical Address</h4>
                <div className="space-y-4 p-4 border rounded-md">
                    <FormField control={control} name="physicalAddress" render={({ field }) => (<FormItem><FormLabel>Street Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={control} name="physicalPostalCode" render={({ field }) => (<FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
            </div>
             <div>
                <h4 className="font-semibold mb-2">Postal Address</h4>
                <div className="space-y-4 p-4 border rounded-md">
                    <FormField control={control} name="postalAddress" render={({ field }) => (<FormItem><FormLabel>Street Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={control} name="postalPostalCode" render={({ field }) => (<FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
            </div>
        </div>
    )
};

const ArrayStep = ({ name, title, fieldsConfig }: { name: any, title: string, fieldsConfig: {id: string, label: string, type: string}[] }) => {
    const { control } = useFormContext<ClientFormValues>();
    const { fields, append, remove } = useFieldArray({ control, name });

    return (
        <div className="space-y-4">
            {fields.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-lg relative">
                    <h4 className="font-medium mb-2">{title} #{index + 1}</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {fieldsConfig.map(config => (
                            <FormField
                                control={control}
                                key={`${item.id}-${config.id}`}
                                name={`${name}.${index}.${config.id}` as any}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{config.label}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type={config.type}
                                                {...field}
                                                // @ts-ignore - Handle coercion for number inputs
                                                onChange={e => field.onChange(config.type === 'number' ? parseFloat(e.target.value) || '' : e.target.value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
            ))}
            <Button type="button" variant="outline" onClick={() => append({})}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add {title}
            </Button>
        </div>
    )
}

// --- WIZARD COMPONENT ---
const steps = [
    { id: 'main', title: 'Main', icon: User, fields: ['name', 'type', 'status', 'registrationId', 'vatRegistered'] },
    { id: 'address', title: 'Address', icon: Building, fields: ['physicalAddress', 'physicalPostalCode', 'postalAddress', 'postalPostalCode'] },
    { id: 'contact', title: 'Contact', icon: Phone, fields: ['contacts'] },
    { id: 'owners', title: 'Owners', icon: Users, fields: ['owners'] },
    { id: 'management', title: 'Management', icon: Users, fields: ['management'] },
    { id: 'bankAccounts', title: 'Bank Accounts', icon: Banknote, fields: ['bankAccounts'] },
    { id: 'balanceSheet', title: 'Balance Sheet', icon: FileText, fields: ['balanceSheets'] },
    { id: 'incomeStatement', title: 'Income Statement', icon: BarChart, fields: ['incomeStatements'] },
    { id: 'review', title: 'Review & Submit', icon: CheckCircle, fields: [] },
];

interface EditClientWizardProps {
  client?: any;
  onSave: () => void;
  onBack: () => void;
}

export function EditClientWizard({ client, onSave, onBack }: EditClientWizardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState(new Set<string>());
    const { toast } = useToast();

    const methods = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        mode: 'onChange',
        defaultValues: client || { status: 'draft', vatRegistered: false, contacts: [], owners: [], management: [], bankAccounts: [], balanceSheets: [], incomeStatements: [] },
    });

    useEffect(() => {
        const initialValues = client || { status: 'draft', vatRegistered: false, contacts: [], owners: [], management: [], bankAccounts: [], balanceSheets: [], incomeStatements: [] };
        methods.reset(initialValues);

        const validateInitialSteps = async () => {
            const initiallyCompleted = new Set<string>();
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                if (step.fields.length > 0) {
                    const isValid = await methods.trigger(step.fields as any);
                    if (isValid) {
                        initiallyCompleted.add(step.id);
                    }
                }
            }
            setCompletedSteps(initiallyCompleted);
        };

        if (client) {
            validateInitialSteps();
        } else {
             setCompletedSteps(new Set());
        }
    }, [client, methods]);

    const onSubmit = async (values: ClientFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await performAdminAction(token, 'saveLendingClient', { client: { id: client?.id, ...values } });
            toast({ title: client ? 'Client Updated' : 'Client Created' });
            onSave();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleNext = async () => {
        const stepFields = steps[currentStep].fields;
        if (!stepFields || stepFields.length === 0) {
            if (currentStep < steps.length - 1) {
                setCompletedSteps(prev => new Set(prev).add(steps[currentStep].id));
                setCurrentStep(prev => prev + 1);
            }
            return;
        }

        const isValid = await methods.trigger(stepFields as any);
        if (isValid) {
            setCompletedSteps(prev => new Set(prev).add(steps[currentStep].id));
            if (currentStep < steps.length - 1) {
                setCurrentStep(prev => prev + 1);
            }
        } else {
            toast({ variant: "destructive", title: "Please complete all required fields for this step." });
        }
    };
    
    const handleBackStep = () => setCurrentStep(prev => prev - 1);
    
    const renderStepContent = () => {
        const stepId = steps[currentStep]?.id;
        switch (stepId) {
            case 'main': return <StepMain />;
            case 'address': return <StepAddress />;
            case 'contact': return <ArrayStep name="contacts" title="Contact" fieldsConfig={[ { id: 'name', label: 'Name', type: 'text' }, { id: 'position', label: 'Position', type: 'text' }, { id: 'cell', label: 'Cell', type: 'text'}, { id: 'email', label: 'Email', type: 'email'} ]} />;
            case 'owners': return <ArrayStep name="owners" title="Owner" fieldsConfig={[ { id: 'name', label: 'Name', type: 'text' }, { id: 'idNumber', label: 'ID Number', type: 'text' }, { id: 'cell', label: 'Cell', type: 'text'}, { id: 'percentageHeld', label: '% Held', type: 'number'} ]} />;
            case 'management': return <ArrayStep name="management" title="Manager" fieldsConfig={[ { id: 'name', label: 'Name', type: 'text' }, { id: 'idNumber', label: 'ID Number', type: 'text' }, { id: 'cell', label: 'Cell', type: 'text'}, { id: 'position', label: 'Position', type: 'text'} ]} />;
            case 'bankAccounts': return <ArrayStep name="bankAccounts" title="Bank Account" fieldsConfig={[ { id: 'bankName', label: 'Bank Name', type: 'text' }, { id: 'accountNumber', label: 'Account #', type: 'text' }, { id: 'branchCode', label: 'Branch Code', type: 'text'} ]} />;
            case 'balanceSheet': return <ArrayStep name="balanceSheets" title="Balance Sheet" fieldsConfig={[ { id: 'periodEndDate', label: 'Period End', type: 'date' }, { id: 'propertyPlantEquipment', label: 'Property, Plant & Equip.', type: 'number' }, { id: 'intangibleAssets', label: 'Intangible Assets', type: 'number' }, { id: 'inventory', label: 'Inventory', type: 'number' }, { id: 'tradeReceivables', label: 'Trade Receivables', type: 'number' }, { id: 'cashEquivalents', label: 'Cash & Equivalents', type: 'number' }, { id: 'shareCapital', label: 'Share Capital', type: 'number' }, { id: 'retainedEarnings', label: 'Retained Earnings', type: 'number' }, { id: 'longTermLoans', label: 'Long-Term Loans', type: 'number' }, { id: 'tradePayables', label: 'Trade Payables', type: 'number' }, { id: 'shortTermLoans', label: 'Short-Term Loans', type: 'number' } ]} />;
            case 'incomeStatement': return <ArrayStep name="incomeStatements" title="Income Statement" fieldsConfig={[ { id: 'periodEndDate', label: 'Period End Date', type: 'date' }, { id: 'revenue', label: 'Revenue', type: 'number' }, { id: 'cogs', label: 'Cost of Goods Sold', type: 'number' }, { id: 'operatingExpenses', label: 'Operating Expenses', type: 'number' }, { id: 'interestExpense', label: 'Interest Expense', type: 'number' }, { id: 'taxation', label: 'Taxation', type: 'number' } ]} />;
            case 'review': return <div className="text-center p-8"><h3 className="text-lg font-semibold">Review and Submit</h3><p className="text-muted-foreground">Please confirm all details before saving the client.</p></div>;
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
                                <h2 className="text-2xl font-bold font-headline">{client ? 'Edit' : 'Add'} Client</h2>
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
                                    const isCompleted = completedSteps.has(step.id);
                                    return (
                                        <Button key={step.id} type="button" variant={currentStep === index ? 'secondary' : 'ghost'} className="justify-start gap-2" onClick={() => setCurrentStep(index)}>
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
                                {client ? 'Update Client' : 'Create Client'}
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}

