
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, FileText, ArrowLeft, ArrowRight, Loader2, PlusCircle, Save, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { getClientSideAuthToken } from '@/firebase';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { AgreementActionMenu } from './AgreementActionMenu';


const agreementTypes = [
    { id: 'loan-pv', label: 'Loan pv' },
    { id: 'loan-fl', label: 'Loan fl' },
    { id: 'installment-sale', label: 'Installment Sale' },
    { id: 'rental', label: 'Leases' },
    { id: 'discounting', label: 'Factoring' },
];

const agreementSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  type: z.string().min(1, 'Agreement type is required'),
  status: z.string().default('pending'),
  amount: z.coerce.number().positive("Amount must be a positive number."),
  term: z.coerce.number().int().positive("Term must be a positive integer."),
  rate: z.coerce.number().min(0, "Rate cannot be negative."),
  assetId: z.string().optional(),
});

type AgreementFormValues = z.infer<typeof agreementSchema>;

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R 0';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value);
};


export default function AgreementsContent() {
    const firestore = useFirestore();
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [selectedAgreement, setSelectedAgreement] = useState<any | null>(null);

    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const [isTypeEditable, setIsTypeEditable] = useState(false);

    const methods = useForm<AgreementFormValues>({
        resolver: zodResolver(agreementSchema),
        mode: 'onChange',
    });

    const { control, watch, trigger, getValues, reset } = methods;

    const clientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingClients')) : null, [firestore]);
    const { data: clients, isLoading: areClientsLoading } = useCollection(clientsQuery);
    
    const clientIdFromForm = watch('clientId'); 
    const clientIdForQueries = view === 'list' ? selectedClient : clientIdFromForm;

    const agreementsQuery = useMemoFirebase(() => {
        if (!firestore || !clientIdForQueries) return null;
        return query(collection(firestore, `lendingClients/${clientIdForQueries}/agreements`));
    }, [firestore, clientIdForQueries]);
    const { data: agreements, isLoading: areAgreementsLoading, forceRefresh } = useCollection(agreementsQuery);

    const assetsQuery = useMemoFirebase(() => {
        if (!firestore || !clientIdForQueries) return null;
        return query(collection(firestore, `lendingClients/${clientIdForQueries}/assets`));
    }, [firestore, clientIdForQueries]);
    const { data: assets, isLoading: areAssetsLoading } = useCollection(assetsQuery);
    
    useEffect(() => {
        if (view === 'edit' && selectedAgreement) {
            reset({ clientId: selectedClient, ...selectedAgreement });
            setIsTypeEditable(false);
            setCurrentStep(0);
        } else if (view === 'create') {
            reset({ clientId: selectedClient || '', type: '', status: 'pending', amount: 0, term: 0, rate: 0, assetId: '' });
            setIsTypeEditable(true);
            setCurrentStep(0);
        }
    }, [view, selectedAgreement, reset, selectedClient]);

    const handleSelectClient = (clientId: string) => {
        setSelectedClient(clientId);
        setView('list');
        setSelectedAgreement(null);
    }
    
    const handleCreateNew = () => {
        setView('create');
        setSelectedAgreement(null);
    }
    
    const handleEdit = useCallback((agreement: any) => {
        setSelectedAgreement(agreement);
        setView('edit');
    }, []);
    
    const handleBackToList = () => {
        setView('list');
        setSelectedAgreement(null);
    };

    const handleSaveSuccess = () => {
        forceRefresh();
        handleBackToList();
    };

    const agreementType = watch('type');

    const dynamicSteps = useMemo(() => {
        const baseSteps = [
            { id: 'client', name: 'Select Client', fields: ['clientId'] },
            { id: 'type', name: 'Agreement Type', fields: ['type'] },
            { id: 'details', name: 'Financial Details', fields: ['amount', 'term', 'rate'] },
        ];
        
        if (agreementType === 'installment-sale') {
            baseSteps.push({ id: 'asset', name: 'Link Asset', fields: ['assetId'] });
        }

        baseSteps.push({ id: 'review', name: 'Review & Save' });

        return baseSteps.map((step, index) => ({
            ...step,
            name: `Step ${index + 1}: ${step.name.replace(/^Step \d+: /, '')}`,
        }));
    }, [agreementType]);
    
    const handleNext = async () => {
        const currentStepConfig = dynamicSteps[currentStep];
        const isValid = currentStepConfig.fields ? await trigger(currentStepConfig.fields as any) : true;
        
        if (isValid && currentStep < dynamicSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else if (!isValid) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please complete the current step.' });
        }
    };
    
    const handleBack = () => { currentStep > 0 ? setCurrentStep(prev => prev - 1) : handleBackToList(); };

    const onSubmit = async (values: AgreementFormValues) => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'saveLendingAgreement', payload: { agreement: { id: selectedAgreement?.id, ...values } } }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            toast({ title: selectedAgreement?.id ? 'Agreement Updated' : 'Agreement Created' });
            handleSaveSuccess();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error saving agreement', description: e.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    const isStepValid = (stepIndex: number) => {
        if (stepIndex < 0) return true;
        const step = dynamicSteps[stepIndex];
        if (!step.fields) return true;
        const fields = step.fields as (keyof AgreementFormValues)[];
        return fields.every(field => !methods.formState.errors[field as keyof typeof methods.formState.errors]);
    };

    const renderStepContent = () => {
        const stepId = dynamicSteps[currentStep].id;
        switch (stepId) {
            case 'client':
                return (
                    <FormField control={control} name="clientId" render={({field}) => (
                        <FormItem>
                            <FormLabel>Client</FormLabel>
                             {view === 'edit' ? (
                                <FormControl>
                                    <Input value={clients?.find(c => c.id === field.value)?.name || 'Loading...'} disabled />
                                </FormControl>
                            ) : (
                                <Select onValueChange={field.onChange} value={field.value || ''} disabled={areClientsLoading}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a client..."/></SelectTrigger></FormControl>
                                    <SelectContent>{(clients || []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                            )}
                            <FormMessage/>
                        </FormItem>
                    )} />
                );
            case 'type':
                return (
                    <div className="space-y-4">
                        <Label>Agreement Type</Label>
                        {!isTypeEditable && view === 'edit' ? (
                            <div className="flex items-center gap-4">
                                <Input value={agreementTypes.find(t => t.id === watch('type'))?.label || 'Not set'} disabled />
                                <Button type="button" variant="outline" onClick={() => setIsTypeEditable(true)}>Change</Button>
                            </div>
                        ) : (
                            <FormField control={control} name="type" render={({field}) => (
                                <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select type..."/></SelectTrigger></FormControl>
                                        <SelectContent>{agreementTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage/>
                                </FormItem>
                            )}/>
                        )}
                    </div>
                );
            case 'details':
                return (
                    <div className="grid grid-cols-3 gap-4">
                        <FormField control={control} name="amount" render={({field}) => <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" {...field}/></FormControl><FormMessage/></FormItem>}/>
                        <FormField control={control} name="term" render={({field}) => <FormItem><FormLabel>Term (Months)</FormLabel><FormControl><Input type="number" {...field}/></FormControl><FormMessage/></FormItem>}/>
                        <FormField control={control} name="rate" render={({field}) => <FormItem><FormLabel>Rate (%)</FormLabel><FormControl><Input type="number" {...field}/></FormControl><FormMessage/></FormItem>}/>
                    </div>
                );
            case 'asset':
                return (
                    <div className="space-y-4">
                        <FormField control={control} name="assetId" render={({field}) => 
                            <FormItem>
                                <FormLabel>Linked Asset</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={areAssetsLoading}>
                                    <FormControl><SelectTrigger><SelectValue placeholder={areAssetsLoading ? "Loading assets..." : "Select an asset..."}/></SelectTrigger></FormControl>
                                    <SelectContent>{(assets && assets.length > 0) ? (
                                        (assets || []).map((a:any) => <SelectItem key={a.id} value={a.id}>{a.make} {a.model} ({a.registrationNumber})</SelectItem>)
                                    ) : (
                                        <div className="p-4 text-sm text-muted-foreground text-center">No assets found for this client.</div>
                                    )}</SelectContent>
                                </Select>
                                <FormMessage/>
                            </FormItem>
                        }/>
                        <Button asChild variant="outline" className="w-full">
                            <Link href={`/lending?view=assets&action=add&clientId=${getValues('clientId')}`}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add New Asset
                            </Link>
                        </Button>
                        <p className="text-xs text-muted-foreground">If the asset is not in the list, you will be redirected to add it. You will need to restart this agreement wizard afterward.</p>
                    </div>
                );
            case 'review':
                const values = getValues();
                const clientNameReview = clients?.find(c => c.id === values.clientId)?.name;
                const asset = assets?.find(a => a.id === values.assetId);
                return (
                    <div className="space-y-2 text-sm">
                        <p><strong>Client:</strong> {clientNameReview}</p>
                        <p><strong>Type:</strong> {values.type}</p>
                        <p><strong>Amount:</strong> {formatCurrency(values.amount || 0)}</p>
                        <p><strong>Term:</strong> {values.term} months</p>
                        <p><strong>Rate:</strong> {values.rate}%</p>
                        {asset && <p><strong>Asset:</strong> {asset.make} {asset.model}</p>}
                    </div>
                );
            default: return null;
        }
    }


    const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
        pending: 'secondary',
        active: 'default',
        completed: 'outline',
        defaulted: 'destructive',
    };

    const columns: ColumnDef<any>[] = useMemo(() => [
        { accessorKey: 'id', header: 'Agreement ID', cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span> },
        { accessorKey: 'type', header: 'Type', cell: ({ row }) => <span className="capitalize">{row.original.type?.replace('-', ' ')}</span> },
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={statusColors[row.original.status] || 'secondary'} className="capitalize">{row.original.status}</Badge> },
        { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => formatCurrency(row.original.amount) },
        { id: 'actions', header: () => <div className="text-right">Actions</div>, cell: ({ row }) => (
            <div className="text-right">
                <AgreementActionMenu agreement={{clientId: selectedClient, ...row.original}} onEdit={() => handleEdit(row.original)} onUpdate={forceRefresh} />
            </div>
        )}
    ], [selectedClient, forceRefresh, handleEdit]);
    
    if (view === 'create' || view === 'edit') {
        return (
             <Card>
                <FormProvider {...methods}>
                    <form onSubmit={methods.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>{selectedAgreement?.id ? 'Edit' : 'Create New'} Agreement</CardTitle>
                            <CardDescription>Follow the steps to set up a new lending agreement.</CardDescription>
                        </CardHeader>
                         <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
                                {/* Sidebar Stepper */}
                                <div className="flex flex-col gap-2 border-r pr-4">
                                    {dynamicSteps.map((step, index) => {
                                        const isCompleted = index < currentStep && isStepValid(index);
                                        return (
                                            <Button 
                                                key={step.id} 
                                                variant={currentStep === index ? 'default' : 'ghost'} 
                                                className="justify-start gap-2"
                                                onClick={() => setCurrentStep(index)}
                                                disabled={index > currentStep && !isStepValid(currentStep - 1)}
                                            >
                                                {isCompleted ? <Check className="h-5 w-5 text-green-500" /> : <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold", currentStep >= index ? "bg-primary-foreground text-primary" : "bg-muted-foreground/20")}>{index + 1}</div>}
                                                {step.name}
                                            </Button>
                                        );
                                    })}
                                </div>

                                {/* Form Content */}
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold">{dynamicSteps[currentStep].name}</h2>
                                    <div className="min-h-[250px]">
                                        {renderStepContent()}
                                    </div>
                                    <div className="flex justify-between pt-8 mt-8 border-t">
                                        <Button type="button" variant="outline" onClick={handleBack}>
                                            <ArrowLeft className="mr-2 h-4 w-4" /> {currentStep === 0 ? 'Back to List' : 'Back'}
                                        </Button>
                                        {currentStep < dynamicSteps.length - 1 ? (
                                            <Button type="button" onClick={handleNext}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                                        ) : (
                                            <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />} {selectedAgreement?.id ? 'Update' : 'Create'} Agreement</Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </form>
                </FormProvider>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText /> Agreement Management
                </CardTitle>
                <CardDescription>
                    Create new lending agreements or manage existing ones for a client.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="client-select">1. Select a Client</Label>
                        <Select onValueChange={handleSelectClient} value={selectedClient || ''} disabled={areClientsLoading}>
                            <SelectTrigger id="client-select">
                                <SelectValue placeholder={areClientsLoading ? "Loading clients..." : "Select a client..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {(clients || []).map((client:any) => (
                                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2 self-end">
                         <Button className="w-full" onClick={handleCreateNew} disabled={!selectedClient}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create New Agreement
                        </Button>
                    </div>
                </div>
                
                <Separator />
                
                {selectedClient && (
                     <div className="pt-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Existing Agreements for: <span className="text-primary">{clients?.find(c => c.id === selectedClient)?.name}</span>
                        </h3>
                        {areAgreementsLoading ? (
                             <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin"/></div>
                        ) : (
                            <DataTable columns={columns} data={agreements || []} />
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

