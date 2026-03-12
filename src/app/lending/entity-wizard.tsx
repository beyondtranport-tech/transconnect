
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider, useFieldArray, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, Users, Building, Phone, Mail, UserSquare, Banknote, FileText, BarChart2, PlusCircle, Trash2, Check, LayoutDashboard, DollarSign, Briefcase, Landmark, Sheet } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';


async function performAdminAction(token: string, action: string, payload?: any) {
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

const balanceSheetSchema = z.object({
  periodEndDate: z.string().min(1, "Period end date is required"),
  propertyPlantEquipment: z.coerce.number().optional().default(0),
  intangibleAssets: z.coerce.number().optional().default(0),
  inventory: z.coerce.number().optional().default(0),
  tradeReceivables: z.coerce.number().optional().default(0),
  cashEquivalents: z.coerce.number().optional().default(0),
  shareCapital: z.coerce.number().optional().default(0),
  retainedEarnings: z.coerce.number().optional().default(0),
  longTermLoans: z.coerce.number().optional().default(0),
  tradePayables: z.coerce.number().optional().default(0),
  shortTermLoans: z.coerce.number().optional().default(0),
});

const incomeStatementSchema = z.object({
  periodEndDate: z.string().min(1, "Period end date is required"),
  revenue: z.coerce.number().optional().default(0),
  cogs: z.coerce.number().optional().default(0),
  operatingExpenses: z.coerce.number().optional().default(0),
  interestExpense: z.coerce.number().optional().default(0),
  taxation: z.coerce.number().optional().default(0),
});

const formSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Name is required."),
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
  balanceSheets: z.array(balanceSheetSchema).optional(),
  incomeStatements: z.array(incomeStatementSchema).optional(),
  globalFacilityLimit: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const wizardSteps = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'main', name: 'Main', icon: Users, fields: ['name', 'status', 'type', 'category', 'language', 'vatRegistered', 'registrationId'] },
    { id: 'charges', name: 'Charges', icon: DollarSign },
    { id: 'assets', name: 'Assets', icon: Briefcase },
    { id: 'invoices', name: 'Invoices', icon: FileText },
    { id: 'payments', name: 'Payments', icon: Landmark },
    { id: 'statements', name: 'Statements', icon: Sheet },
];

const StepMain = ({ entityType }: { entityType: 'client' | 'partner' }) => {
    const { control } = useFormContext<FormValues>();
    return (
        <div className="space-y-4 max-w-lg">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={control} name="code" render={({ field }) => (<FormItem><FormLabel>Code</FormLabel><FormControl><Input placeholder="Unique Code" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder={`${entityType === 'client' ? 'Client' : 'Partner'} Name`} {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a type..."/></SelectTrigger></FormControl><SelectContent>
                    {entityType === 'client' ? (
                        <>
                            <SelectItem value="individual">Individual</SelectItem>
                            <SelectItem value="company">Company</SelectItem>
                        </>
                    ) : (
                         <>
                            <SelectItem value="supplier">Supplier</SelectItem>
                            <SelectItem value="vendor">Vendor</SelectItem>
                            <SelectItem value="associate">Associate</SelectItem>
                            <SelectItem value="debtor">Debtor</SelectItem>
                        </>
                    )}
                </SelectContent></Select><FormMessage /></FormItem>)} />
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
                    </div>
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
            )} />
        </div>
    );
};

const StepDashboard = () => (
    <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg p-8">
        <div className="text-center">
            <h3 className="text-xl font-semibold text-muted-foreground">Client Dashboard</h3>
            <p className="text-muted-foreground mt-2">A summary of this client's financial health, agreements, and assets will be displayed here.</p>
        </div>
    </div>
);

const StepAssets = ({ clientId }: { clientId: string }) => {
    const [assets, setAssets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!clientId) {
            setIsLoading(false);
            return;
        };
        const loadAssets = async () => {
            setIsLoading(true);
            try {
                const token = await getClientSideAuthToken();
                if (!token) throw new Error("Auth failed.");
                const result = await performAdminAction(token, 'getLendingData', { collectionName: 'lendingAssets' });
                setAssets((result.data || []).filter((a: any) => a.clientId === clientId));
            } catch (e: any) {
                toast({ variant: 'destructive', title: 'Failed to load assets', description: e.message });
            } finally {
                setIsLoading(false);
            }
        };
        loadAssets();
    }, [clientId, toast]);

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div>
            {assets.length > 0 ? (
                <Table>
                    <TableHeader><TableRow><TableHead>Make</TableHead><TableHead>Model</TableHead><TableHead>Year</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {assets.map(asset => (
                            <TableRow key={asset.id}>
                                <TableCell>{asset.make}</TableCell>
                                <TableCell>{asset.model}</TableCell>
                                <TableCell>{asset.year}</TableCell>
                                <TableCell><Badge>{asset.status}</Badge></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <p>No assets linked to this client.</p>
            )}
             <Button asChild variant="outline" className="mt-4"><Link href={`/lending?view=assets&clientId=${clientId}`}>Manage Assets</Link></Button>
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


export function EntityWizard({ entity, entityType, onBack, onSaveSuccess }: { entity?: any, entityType: 'client' | 'partner', onBack: () => void, onSaveSuccess?: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: entity || {
            name: '',
            status: 'draft',
            owners: [],
            management: [],
            bankAccounts: [],
            balanceSheets: [],
            incomeStatements: [],
        },
    });

    useEffect(() => {
        if (entity) {
            methods.reset({
                ...entity,
                owners: entity.owners || [],
                management: entity.management || [],
                bankAccounts: entity.bankAccounts || [],
                balanceSheets: entity.balanceSheets || [],
                incomeStatements: entity.incomeStatements || [],
            });
        }
    }, [entity, methods]);


    const onSubmit = async (values: FormValues) => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");

            const action = entityType === 'client' ? 'saveLendingClient' : 'saveLendingPartner';
            const payloadKey = entityType === 'client' ? 'client' : 'partner';

            await performAdminAction(token, action, { [payloadKey]: { id: entity?.id, ...values } });
            
            toast({ title: `${entityType === 'client' ? 'Client' : 'Partner'} ${entity?.id ? 'Updated' : 'Created'}` });
            if (onSaveSuccess) onSaveSuccess();
            else router.push(`/lending?view=${entityType}s`);

        } catch (e: any) {
            toast({ variant: 'destructive', title: `Error saving ${entityType}`, description: e.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    const renderStepContent = () => {
        const stepId = wizardSteps[currentStep]?.id;
        switch (stepId) {
            case 'dashboard': return <StepDashboard />;
            case 'main': return <StepMain entityType={entityType}/>;
            case 'charges': return <PlaceholderStep name="Charges" />;
            case 'assets': return <StepAssets clientId={entity?.id} />;
            case 'invoices': return <PlaceholderStep name="Invoices" />;
            case 'payments': return <PlaceholderStep name="Payments" />;
            case 'statements': return <PlaceholderStep name="Statements" />;
            default: return <PlaceholderStep name={wizardSteps[currentStep]?.name || 'Step'} />;
        }
    };
    
    const entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1);

    return (
        <Card className="w-full">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <h2 className="text-2xl font-bold font-headline">{entity ? `Edit ${entityName}: ${entity.name}` : `Create New ${entityName}`}</h2>
                            </div>
                             <Button type="button" variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4"/> Back to List</Button>
                        </div>
                    </CardHeader>
                        <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
                             <div className="flex flex-col gap-2 border-r pr-4">
                                {wizardSteps.map((step, index) => {
                                    const Icon = step.icon;
                                    const isCompleted = index < currentStep; // Simplified logic
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
                    <CardFooter className="flex justify-end border-t pt-6 mt-6">
                        <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {entity ? 'Save Changes' : `Create ${entityName}`}</Button>
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
