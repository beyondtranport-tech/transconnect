
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle, FileSignature, Loader2, Save, Trash2, ArrowLeft, ArrowRight, Check } from 'lucide-react';
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


const dummySecurityDocs = [
    { id: 'sec-001', name: 'Cession of Book Debts', client: 'Sample Transport Co.', clientCode: 'STC-001', agreement: 'AG-101', docStatus: 'Generated', recordStatus: 'Unconfirmed' },
    { id: 'sec-002', name: 'Suretyship by Directors', client: 'Another Client Ltd', clientCode: 'ACL-001', agreement: 'AG-205', docStatus: 'Signed In', recordStatus: 'Confirmed' },
];

const docStatusOptions = ["Generated", "Sent", "Received", "Checked", "Signed In"];

const securitySchema = z.object({
  clientId: z.string().min(1, "Client is required."),
  agreementId: z.string().min(1, "Agreement is required."),
  securityType: z.string().min(1, "A type is required (e.g., Cession of Debtors)."),
  description: z.string().optional(),
  docStatus: z.string().optional().default("Generated"),
  clientCode: z.string().optional(),
});

type SecurityFormValues = z.infer<typeof securitySchema>;

const wizardSteps = [
  { id: 'client', name: 'Select Client', fields: ['clientId'] },
  { id: 'agreement', name: 'Select Agreement', fields: ['agreementId'] },
  { id: 'details', name: 'Security Details', fields: ['securityType', 'description', 'clientCode'] },
  { id: 'status', name: 'Document Status', fields: ['docStatus'] },
  { id: 'review', name: 'Review & Save' },
];

function SecurityWizard({ securityDoc, onBack, onSaveSuccess }: { securityDoc?: any; onBack: () => void; onSaveSuccess: () => void; }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const methods = useForm<SecurityFormValues>({
        resolver: zodResolver(securitySchema),
        mode: 'onChange',
        defaultValues: securityDoc || { clientId: '', agreementId: '', securityType: '', description: '', docStatus: 'Generated', clientCode: '' },
    });
    
    const { control, watch, trigger } = methods;

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
    
    const handleBack = () => {
        currentStep > 0 ? setCurrentStep(prev => prev - 1) : onBack();
    };

    const onSubmit = async (values: SecurityFormValues) => {
        setIsLoading(true);
        console.log("Saving security agreement:", values);
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ title: 'Security Agreement Saved', description: 'This is a demo save.' });
        setIsLoading(false);
        onSaveSuccess();
    };

    const renderStepContent = () => {
        const stepId = wizardSteps[currentStep]?.id;
        switch (stepId) {
            case 'client':
                return (
                    <FormField
                        control={control}
                        name="clientId"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Client</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={areClientsLoading}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger></FormControl>
                                    <SelectContent>{(clients || []).map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );
            case 'agreement':
                return (
                    <FormField
                        control={control}
                        name="agreementId"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Agreement</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedClientId || areAgreementsLoading}>
                                    <FormControl><SelectTrigger><SelectValue placeholder={areAgreementsLoading ? "Loading..." : "Select an agreement..."} /></SelectTrigger></FormControl>
                                    <SelectContent>{(agreements || []).map((a:any) => (
                                        <SelectItem key={a.id} value={a.id}>{a.id}</SelectItem>
                                    ))}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );
            case 'details':
                return (
                    <div className="space-y-4">
                        <FormField control={control} name="securityType" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type of Security</FormLabel>
                                <FormControl><Input placeholder="e.g., Cession of Debtors" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl><Textarea placeholder="Add any relevant details..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={control} name="clientCode" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Client Code</FormLabel>
                                <FormControl><Input placeholder="e.g., STC-001" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                );
            case 'status':
                return (
                    <FormField 
                        control={control} 
                        name="docStatus" 
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Document Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select status..."/></SelectTrigger></FormControl>
                                    <SelectContent>{docStatusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} 
                    />
                );
            case 'review':
                return (
                    <div className="space-y-2">
                        <p>Client: {watch('clientId')}</p>
                        <p>Agreement: {watch('agreementId')}</p>
                        <p>Type: {watch('securityType')}</p>
                        <p>Status: {watch('docStatus')}</p>
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
                        <CardTitle>{securityDoc ? 'Edit' : 'Create'} Security Agreement</CardTitle>
                        <CardDescription>Follow the steps to link a security document to an agreement.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-center gap-4 mb-8">
                            {wizardSteps.map((step, index) => (
                                <React.Fragment key={step.id}>
                                    <div className="flex flex-col items-center">
                                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center font-bold", currentStep >= index ? "bg-primary text-primary-foreground" : "bg-muted")}>{currentStep > index ? <Check className="h-5 w-5"/> : index+1}</div>
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
                            <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Agreement</Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}

export default function SecurityContent() {
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

    const handleEdit = useCallback((doc: any) => {
        setSelectedDoc(doc);
        setView('edit');
    }, []);

    const columns: ColumnDef<any>[] = useMemo(() => [
        { accessorKey: 'name', header: 'Agreement Type', cell: ({ row }) => <span>{row.original.name}</span> },
        { accessorKey: 'client', header: 'Client', cell: ({ row }) => <span>{row.original.client}</span> },
        { accessorKey: 'clientCode', header: 'Client Code', cell: ({ row }) => <span className="font-mono text-xs">{row.original.clientCode}</span> },
        { accessorKey: 'agreement', header: 'Agreement ID', cell: ({ row }) => <span className="font-mono text-xs">{row.original.agreement}</span> },
        { accessorKey: 'docStatus', header: 'Document Status', cell: ({ row }) => <Badge>{row.original.docStatus}</Badge> },
        { accessorKey: 'recordStatus', header: 'Record Status', cell: ({ row }) => <Badge>{row.original.recordStatus}</Badge> },
        { id: 'actions', header: () => <div className="text-right">Actions</div>, cell: ({ row }) => <div className="text-right"><Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>Edit</Button></div> },
    ], [handleEdit]);
    
    if (view === 'create' || view === 'edit') {
        return <SecurityWizard securityDoc={selectedDoc} onBack={() => setView('list')} onSaveSuccess={() => setView('list')} />;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <FileSignature /> Security Agreements Register
                    </CardTitle>
                    <CardDescription>
                        Track non-tangible security agreements like deeds of surety and cessions of book debt.
                    </CardDescription>
                </div>
                <Button onClick={() => setView('create')}><PlusCircle className="mr-2 h-4 w-4" /> Add Security Agreement</Button>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={dummySecurityDocs} />
            </CardContent>
        </Card>
    );
}
