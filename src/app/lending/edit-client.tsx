'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, FormProvider, useFormContext, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft, ArrowRight, CheckCircle, User, Building, Phone, Mail, Globe, Users, Banknote, FileText, BarChart, PlusCircle, Trash2, Sparkles, Camera, ShieldCheck, Zap } from 'lucide-react';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { VisionOnboardingDialog } from './VisionOnboardingDialog';
import { Separator } from '@/components/ui/separator';

// API Helper
async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
        cache: 'no-store'
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
         <div className="space-y-6 text-left text-foreground">
            <FormField control={control} name="name" render={({ field }) => (<FormItem className="text-left text-foreground"><FormLabel>Client Name</FormLabel><FormControl><Input {...field} value={field.value || ''} className="h-11 border-2 bg-white" /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4 text-left">
                <FormField control={control} name="type" render={({ field }) => (<FormItem className="text-left"><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-11 border-2 bg-white text-left"><SelectValue placeholder="Select a type..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="company">Company</SelectItem><SelectItem value="individual">Individual</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={control} name="status" render={({ field }) => (<FormItem className="text-left"><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-11 border-2 bg-white text-left"><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
             <FormField control={control} name="registrationId" render={({ field }) => (<FormItem className="text-left text-foreground"><FormLabel>Registration ID / RSA ID</FormLabel><FormControl><Input {...field} value={field.value || ''} className="h-11 border-2 bg-white" /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={control} name="vatRegistered" render={({ field }) => (<FormItem className="flex items-center space-x-2 pt-2 text-left"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><Label className="cursor-pointer font-bold">VAT Registered?</Label></FormItem>)} />
        </div>
    )
};

const StepAddress = () => {
    const { control } = useFormContext<ClientFormValues>();
    return (
        <div className="space-y-6 text-left">
            <div className="text-left text-foreground">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-left"><Building className="h-4 w-4 text-primary" /> Physical Address</h4>
                <div className="space-y-4 p-4 border rounded-md bg-white text-left">
                    <FormField control={control} name="physicalAddress" render={({ field }) => (<FormItem className="text-left"><FormLabel>Street Address</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>)} />
                    <FormField control={control} name="physicalPostalCode" render={({ field }) => (<FormItem className="text-left"><FormLabel>Postal Code</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>)} />
                </div>
            </div>
             <div className="text-left text-foreground">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-left"><Globe className="h-4 w-4 text-primary" /> Postal Address</h4>
                <div className="space-y-4 p-4 border rounded-md bg-white text-left text-foreground">
                    <FormField control={control} name="postalAddress" render={({ field }) => (<FormItem className="text-left"><FormLabel>Street Address</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>)} />
                    <FormField control={control} name="postalPostalCode" render={({ field }) => (<FormItem className="text-left"><FormLabel>Postal Code</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>)} />
                </div>
            </div>
        </div>
    )
};

const ArrayStep = ({ name, title, fieldsConfig }: { name: any, title: string, fieldsConfig: {id: string, label: string, type: string}[] }) => {
    const { control } = useFormContext<ClientFormValues>();
    const { fields, append, remove } = useFieldArray({ control, name });

    return (
        <div className="space-y-4 text-left">
            {fields.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-lg relative bg-white text-left text-foreground">
                    <h4 className="font-medium mb-2 text-left">{title} #{index + 1}</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left text-foreground">
                        {fieldsConfig.map(config => (
                            <FormField
                                control={control}
                                key={`${item.id}-${config.id}`}
                                name={`${name}.${index}.${config.id}` as any}
                                render={({ field }) => (
                                    <FormItem className="text-left">
                                        <FormLabel>{config.label}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type={config.type}
                                                {...field}
                                                value={field.value || ''}
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
            <Button type="button" variant="outline" onClick={() => append({})} className="font-bold border-2 text-left">
                <PlusCircle className="mr-2 h-4 w-4" /> Add {title}
            </Button>
        </div>
    )
}

// --- WIZARD COMPONENT ---
const steps = [
    { id: 'main', title: 'Main & AI Scan', icon: Sparkles, fields: ['name', 'type', 'status', 'registrationId', 'vatRegistered'] },
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

    const handleAiExtraction = useCallback((stepId: string, data: any) => {
        if (stepId === 'main') {
            if (data.name) methods.setValue('name', data.name);
            if (data.registrationNumber) methods.setValue('registrationId', data.registrationNumber);
            if (data.idNumber) methods.setValue('registrationId', data.idNumber);
            if (data.address) methods.setValue('physicalAddress', data.address);
        } else if (stepId === 'bankAccounts') {
             const current = methods.getValues('bankAccounts') || [];
             methods.setValue('bankAccounts', [...current, { 
                 bankName: data.bankName, 
                 accountNumber: data.accountNumber,
                 branchCode: data.branchCode 
             }]);
        }
        toast({ title: "Forensic Data Mapped", description: "The AI results have been committed to the form." });
    }, [methods, toast]);

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
            case 'review': return <div className="text-center py-20 space-y-6 text-left"><ShieldCheck className="h-16 w-16 text-primary mx-auto opacity-50" /><h3 className="text-2xl font-black uppercase">Audit Readiness Verified</h3><p className="text-muted-foreground max-sm mx-auto">Please confirm all details before committing this debtor node to the registry.</p></div>;
            default: return null;
        }
    };

    const suggestedDocType = useMemo(() => {
        const type = methods.watch('type');
        const stepId = steps[currentStep].id;
        if (stepId === 'main') {
            if (type === 'individual') return 'rsa_id';
            return 'company_formation';
        }
        if (stepId === 'bankAccounts') return 'bank_statement';
        if (stepId === 'balanceSheet' || stepId === 'incomeStatement') return 'invoice';
        return 'rc1';
    }, [currentStep, methods.watch('type')]);
    
    return (
         <Card className="max-w-6xl mx-auto shadow-2xl border-none overflow-hidden text-left text-foreground">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader className="bg-slate-900 text-white p-8 border-b border-white/5 text-left text-white">
                         <div className="flex justify-between items-start text-left text-white">
                            <div className="text-left">
                                <h2 className="text-2xl font-black font-headline text-white text-left uppercase tracking-tight">{client ? 'Edit' : 'Add'} Debtor Profile</h2>
                                <p className="text-slate-400 mt-1">{steps[currentStep].title}</p>
                            </div>
                            <Button type="button" variant="ghost" onClick={onBack} className="text-white hover:text-primary"><ArrowLeft className="mr-2 h-4 w-4"/>Back to List</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-12 text-left">
                            <div className="flex flex-col gap-2 border-r pr-6 text-left">
                                {steps.map((step, index) => {
                                    const Icon = step.icon;
                                    const isCompleted = completedSteps.has(step.id);
                                    const isActive = currentStep === index;

                                    return (
                                        <div key={step.id} className="space-y-1 text-left">
                                            <Button 
                                                type="button" 
                                                variant={isActive ? 'secondary' : 'ghost'} 
                                                className={cn("w-full justify-start gap-3 h-11 px-3 transition-all", isActive && "bg-white shadow-sm ring-1 ring-primary/20")} 
                                                onClick={() => setCurrentStep(index)} 
                                                disabled={index > currentStep && !isCompleted && !isActive}
                                            >
                                                {isCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> : <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold", currentStep >= index ? "bg-primary text-white" : "bg-muted")}>{index + 1}</div>}
                                                <Icon className="h-4 w-4 mr-1 text-primary" />
                                                <span className={cn("text-[10px] font-black uppercase tracking-widest", isActive ? "text-primary" : "text-muted-foreground")}>{step.title}</span>
                                            </Button>
                                            
                                            {isActive && step.id !== 'review' && (
                                                <div className="px-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                                    <VisionOnboardingDialog 
                                                        stepId={step.id}
                                                        initialDocType={suggestedDocType}
                                                        onExtractionComplete={(data) => handleAiExtraction(step.id, data)}
                                                        trigger={
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="h-8 w-full justify-start text-[9px] font-black uppercase text-primary gap-2 hover:bg-primary/5"
                                                            >
                                                                <Zap className="h-3 w-3 fill-current" />
                                                                AI Doc Onboarding
                                                            </Button>
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="space-y-6 min-h-[500px] text-left">
                                {renderStepContent()}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-8 bg-slate-50">
                        <Button type="button" variant="ghost" onClick={handleBackStep} disabled={currentStep === 0 || isLoading} className="font-bold">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        {currentStep < steps.length - 1 ? (
                            <Button type="button" onClick={handleNext} className="px-10 font-bold text-white shadow-lg">
                                Next Step <ArrowRight className="ml-2 h-4 w-4"/>
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isLoading} className="h-14 px-12 font-black uppercase tracking-tight shadow-xl text-white">
                                {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Save className="mr-2 h-6 w-6" />}
                                {client ? 'Update Forensic Record' : 'Create Forensic Record'}
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}

