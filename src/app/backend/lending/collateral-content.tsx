
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle, ShieldCheck, Loader2, Save, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Textarea } from "@/components/ui/textarea";

// Dummy Data
const dummyCollateralAssets = [
    { id: 'asset-001', assetDescription: '2022 Scania R560 (FVH123GP)', client: 'Sample Transport Co.', agreement: 'AG-101', securityDocStatus: 'Generated', titleDocStatus: 'Received' },
    { id: 'asset-002', name: 'Office Property at 123 Main St', assetDescription: 'Erf 456, Sandton, GP', client: 'Another Client Ltd', agreement: 'AG-205', securityDocStatus: 'Signed In', titleDocStatus: 'Checked' },
];

const docStatusOptions = ["Generated", "Sent", "Received", "Checked", "Signed In"];

// Zod Schema
const collateralSchema = z.object({
  clientId: z.string().min(1, "Client is required."),
  agreementId: z.string().min(1, "Agreement is required."),
  assetDescription: z.string().min(1, 'Asset description is required.'),
  securityDocStatus: z.string().optional().default("Generated"),
  titleDocStatus: z.string().optional().default("Generated"),
});
type CollateralFormValues = z.infer<typeof collateralSchema>;

// Wizard Steps
const wizardSteps = [
  { id: 'client', name: 'Select Client', fields: ['clientId'] },
  { id: 'agreement', name: 'Select Agreement', fields: ['agreementId'] },
  { id: 'details', name: 'Asset Details', fields: ['assetDescription'] },
  { id: 'status', name: 'Document Statuses', fields: ['securityDocStatus', 'titleDocStatus'] },
  { id: 'review', name: 'Review & Save' },
];

// Wizard Component
function CollateralWizard({ collateral, onBack, onSaveSuccess }: { collateral?: any; onBack: () => void; onSaveSuccess: () => void; }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const methods = useForm<CollateralFormValues>({
        resolver: zodResolver(collateralSchema),
        mode: 'onChange',
        defaultValues: collateral || { clientId: '', agreementId: '', assetDescription: '', securityDocStatus: 'Generated', titleDocStatus: 'Generated' },
    });
    
    const { control, watch, trigger, getValues } = methods;
    const selectedClientId = watch('clientId');

    const clientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingClients')) : null, [firestore]);
    const { data: clients, isLoading: areClientsLoading } = useCollection(clientsQuery);
    
    const agreementsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedClientId) return null;
        return query(collection(firestore, `lendingClients/${selectedClientId}/agreements`));
    }, [firestore, selectedClientId]);
    const { data: agreements, isLoading: areAgreementsLoading } = useCollection(agreementsQuery);

    const handleNext = async () => {
        const currentStepConfig = wizardSteps[currentStep];
        const isValid = currentStepConfig.fields ? await trigger(currentStepConfig.fields as any) : true;
        
        if (isValid && currentStep < wizardSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else if (!isValid) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please complete the current step.' });
        }
    };
    
    const handleBack = () => { currentStep > 0 ? setCurrentStep(prev => prev - 1) : onBack(); };

    const onSubmit = async (values: CollateralFormValues) => {
        setIsLoading(true);
        console.log("Saving collateral asset:", values);
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ title: 'Collateral Asset Saved', description: 'This is a demo save.' });
        setIsLoading(false);
        onSaveSuccess();
    };

    const renderStepContent = () => {
        switch (wizardSteps[currentStep].id) {
            case 'client':
                return (
                    <FormField control={control} name="clientId" render={({field}) => (
                        <FormItem>
                            <FormLabel>Client</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={areClientsLoading}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger></FormControl>
                                <SelectContent>{(clients || []).map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                );
            case 'agreement':
                return (
                    <FormField control={control} name="agreementId" render={({field}) => (
                        <FormItem>
                            <FormLabel>Agreement</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedClientId || areAgreementsLoading}>
                                <FormControl><SelectTrigger><SelectValue placeholder={areAgreementsLoading ? "Loading..." : "Select an agreement..."} /></SelectTrigger></FormControl>
                                <SelectContent>{(agreements || []).map((a:any) => (<SelectItem key={a.id} value={a.id}>{a.id}</SelectItem>))}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                );
            case 'details':
                return (
                    <FormField control={control} name="assetDescription" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Asset Description</FormLabel>
                            <FormControl><Textarea placeholder="e.g., 2023 Scania R560, VIN: ..., Reg: ..." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                );
            case 'status':
                 return (
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={control} name="securityDocStatus" render={({ field }) => (
                            <FormItem><FormLabel>Security Doc Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status..."/></SelectTrigger></FormControl><SelectContent>{docStatusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                        )} />
                        <FormField control={control} name="titleDocStatus" render={({ field }) => (
                            <FormItem><FormLabel>Title Doc Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status..."/></SelectTrigger></FormControl><SelectContent>{docStatusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                        )} />
                    </div>
                );
            case 'review':
                return (
                    <div className="space-y-2">
                        <p>Client: {watch('clientId')}</p>
                        <p>Agreement: {watch('agreementId')}</p>
                        <p>Asset: {watch('assetDescription')}</p>
                        <p>Security Doc: {watch('securityDocStatus')}</p>
                        <p>Title Doc: {watch('titleDocStatus')}</p>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <Card>
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle>{collateral ? 'Edit' : 'Add'} Collateral Asset</CardTitle>
                        <CardDescription>Follow the steps to register a collateral asset against an agreement.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-center gap-4 mb-8">
                            {wizardSteps.map((step, index) => (
                                <React.Fragment key={step.id}>
                                    <div className="flex flex-col items-center">
                                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center font-bold", currentStep >= index ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                            {currentStep > index ? <Check className="h-5 w-5"/> : index+1}
                                        </div>
                                        <p className={cn("text-xs mt-1 text-center", currentStep >= index ? "font-semibold text-primary" : "text-muted-foreground")}>{step.name}</p>
                                    </div>
                                    {index < wizardSteps.length - 1 && <div className={cn("flex-1 h-0.5 mb-4", currentStep > index ? "bg-primary" : "bg-muted")} />}
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="min-h-[200px]">
                            {renderStepContent()}
                        </div>
                    </CardContent>
                    <CardFooter className="justify-between">
                        <Button type="button" variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                        {currentStep < wizardSteps.length - 1 ? (
                            <Button type="button" onClick={handleNext}>Next <ArrowRight className="ml-2 h-4 w-4"/></Button>
                        ) : (
                            <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Collateral</Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}

// Main Component
export default function CollateralContent() {
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [selectedCollateral, setSelectedCollateral] = useState<any | null>(null);

    const handleEdit = useCallback((collateral: any) => {
        setSelectedCollateral(collateral);
        setView('edit');
    }, []);

    const columns: ColumnDef<any>[] = useMemo(() => [
        { accessorKey: 'assetDescription', header: 'Asset Description' },
        { accessorKey: 'client', header: 'Client' },
        { accessorKey: 'agreement', header: 'Agreement ID', cell: ({ row }) => <span className="font-mono text-xs">{row.original.agreement}</span> },
        { accessorKey: 'securityDocStatus', header: 'Security Doc', cell: ({ row }) => <Badge>{row.original.securityDocStatus}</Badge> },
        { accessorKey: 'titleDocStatus', header: 'Title Doc', cell: ({ row }) => <Badge>{row.original.titleDocStatus}</Badge> },
        { id: 'actions', header: () => <div className="text-right">Actions</div>, cell: ({ row }) => <div className="text-right"><Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>Edit</Button></div> },
    ], [handleEdit]);
    
    if (view === 'create' || view === 'edit') {
        return <CollateralWizard collateral={selectedCollateral} onBack={() => setView('list')} onSaveSuccess={() => setView('list')} />;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div><CardTitle className="flex items-center gap-2"><ShieldCheck /> Collateral Asset Register</CardTitle><CardDescription>Manage tangible assets (e.g., vehicles, property) pledged as collateral. Track the status of both the security agreement and the asset's title document.</CardDescription></div>
                <Button onClick={() => setView('create')}><PlusCircle className="mr-2 h-4 w-4" /> Add Pledged Asset</Button>
            </CardHeader>
            <CardContent><DataTable columns={columns} data={dummyCollateralAssets} /></CardContent>
        </Card>
    );
}
