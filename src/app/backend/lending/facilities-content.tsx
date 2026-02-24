
'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Landmark, ArrowLeft, ArrowRight, Loader2, PlusCircle, Save, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { cn } from '@/lib/utils';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from 'zod';
import { FormProvider, useForm } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'R 0.00';
    const parts = amount.toFixed(2).toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `R ${integerPart}.${parts[1]}`;
};

const facilitySchema = z.object({
  clientId: z.string().min(1, 'Client is required.'),
  agreementId: z.string().min(1, 'Agreement is required.'),
  partnerId: z.string().min(1, 'Partner is required.'),
  limit: z.coerce.number().positive('Limit must be a positive number.'),
  type: z.string().min(1, 'Facility type is required.'),
});
type FacilityFormValues = z.infer<typeof facilitySchema>;


const FacilityWizard = ({ facility, onBack, onSaveSuccess }: { facility?: any, onBack: () => void, onSaveSuccess: () => void }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const methods = useForm<FacilityFormValues>({
        resolver: zodResolver(facilitySchema),
        defaultValues: facility || { clientId: '', agreementId: '', partnerId: '', limit: 0, type: 'loan' }
    });
    
    const { control, watch, trigger } = methods;

    const selectedClientId = watch('clientId');
    const selectedPartnerId = watch('partnerId');
    const newFacilityLimit = watch('limit');
    
    const clientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingClients')) : null, [firestore]);
    const { data: clients, isLoading: areClientsLoading } = useCollection(clientsQuery);
    const agreementsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedClientId) return null;
        return query(collection(firestore, `lendingClients/${selectedClientId}/agreements`));
    }, [firestore, selectedClientId]);
    const { data: agreements, isLoading: areAgreementsLoading } = useCollection(agreementsQuery);
    const partnersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingPartners')) : null, [firestore]);
    const { data: partners, isLoading: arePartnersLoading } = useCollection(partnersQuery);

    const selectedClient = clients?.find(c => c.id === selectedClientId);
    const selectedPartner = partners?.find(p => p.id === selectedPartnerId);

    const clientUsage = dummyFacilities.filter(f => f.clientName === selectedClient?.name).reduce((sum, f) => sum + f.limit, 0);
    const partnerUsage = dummyFacilities.filter(f => f.partnerName === selectedPartner?.name).reduce((sum, f) => sum + f.limit, 0);

    const isClientOverLimit = selectedClient && (clientUsage + newFacilityLimit > (selectedClient.globalFacilityLimit || 0));
    const isPartnerOverLimit = selectedPartner && (partnerUsage + newFacilityLimit > (selectedPartner.globalFacilityLimit || 0));
    
    const onSubmit = async (values: FacilityFormValues) => {
        setIsSaving(true);
        console.log("Saving facility...", values);
        await new Promise(res => setTimeout(res, 1000));
        toast({ title: "Facility Saved", description: "This is a demo save." });
        setIsSaving(false);
        onSaveSuccess();
    };
    
    const handleNext = async () => {
        const stepFields = [
            ['clientId'],
            ['agreementId'],
            ['partnerId'],
            ['limit', 'type']
        ];
        const isValid = await trigger(stepFields[currentStep] as any);
        if (isValid && currentStep < steps.length - 1) {
            setCurrentStep(s => s + 1);
        }
    };
    
    const steps = [ { name: 'Select Client' }, { name: 'Select Agreement' }, { name: 'Select Partner' }, { name: 'Set Limit & Review' }];
    
    return (
         <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
                <h3 className="text-lg font-semibold">Create New Facility</h3>
                <div className="flex items-center gap-4">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.name}>
                            <div className="flex flex-col items-center">
                                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center font-bold", currentStep >= index ? "bg-primary text-primary-foreground" : "bg-muted")}>{index+1}</div>
                                <p className={cn("text-xs mt-1", currentStep >= index ? "font-semibold" : "text-muted-foreground")}>{step.name}</p>
                            </div>
                            {index < steps.length - 1 && <div className={cn("flex-1 h-0.5 mb-4", currentStep > index ? "bg-primary" : "bg-muted")} />}
                        </React.Fragment>
                    ))}
                </div>

                <div className="pt-6">
                    {currentStep === 0 && (
                        <FormField control={control} name="clientId" render={({field}) => <FormItem><FormLabel>Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={areClientsLoading}><FormControl><SelectTrigger><SelectValue placeholder="Select a client..."/></SelectTrigger></FormControl><SelectContent>{(clients || []).map((c:any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>} />
                    )}
                    {currentStep === 1 && (
                         <FormField control={control} name="agreementId" render={({field}) => <FormItem><FormLabel>Agreement</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedClient || areAgreementsLoading}><FormControl><SelectTrigger><SelectValue placeholder={areAgreementsLoading ? "Loading..." : "Select agreement..."} /></SelectTrigger></FormControl><SelectContent>{(agreements || []).map((a:any) => <SelectItem key={a.id} value={a.id}>{a.id}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>} />
                    )}
                    {currentStep === 2 && (
                        <FormField control={control} name="partnerId" render={({field}) => <FormItem><FormLabel>Lending Partner</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={arePartnersLoading}><FormControl><SelectTrigger><SelectValue placeholder="Select partner..." /></SelectTrigger></FormControl><SelectContent>{(partners || []).map((p:any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>} />
                    )}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                             <div className="grid grid-cols-2 gap-4">
                                <FormField control={control} name="type" render={({field}) => <FormItem><FormLabel>Facility Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type..."/></SelectTrigger></FormControl><SelectContent><SelectItem value="loan">Loan</SelectItem><SelectItem value="lease">Lease</SelectItem><SelectItem value="factoring">Factoring</SelectItem><SelectItem value="installment_sale">Installment Sale</SelectItem></SelectContent></Select><FormMessage/></FormItem>} />
                                <FormField control={control} name="limit" render={({field}) => <FormItem><FormLabel>Facility Limit</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl><FormMessage/></FormItem>} />
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                                <Card className={cn(isClientOverLimit && 'border-destructive')}><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Client Exposure</CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><div className="flex justify-between"><span>Global Limit:</span><span className="font-semibold">{formatCurrency(selectedClient?.globalFacilityLimit || 0)}</span></div><div className="flex justify-between"><span>Current Usage:</span><span>{formatCurrency(clientUsage)}</span></div><div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Available:</span><span>{formatCurrency((selectedClient?.globalFacilityLimit || 0) - clientUsage)}</span></div></CardContent></Card>
                                <Card className={cn(isPartnerOverLimit && 'border-destructive')}><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Partner Exposure</CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><div className="flex justify-between"><span>Global Limit:</span><span className="font-semibold">{formatCurrency(selectedPartner?.globalFacilityLimit || 0)}</span></div><div className="flex justify-between"><span>Current Usage:</span><span>{formatCurrency(partnerUsage)}</span></div><div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Available:</span><span>{formatCurrency((selectedPartner?.globalFacilityLimit || 0) - partnerUsage)}</span></div></CardContent></Card>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center mt-8 pt-4 border-t">
                    <Button variant="outline" type="button" onClick={currentStep === 0 ? onBack : () => setCurrentStep(s => s - 1)}><ArrowLeft className="mr-2 h-4 w-4"/> Back</Button>
                    {currentStep < steps.length - 1 ? (
                        <Button onClick={handleNext} type="button">Next <ArrowRight className="ml-2 h-4 w-4"/></Button>
                    ) : (
                         <Button type="submit" disabled={isSaving || !selectedClient || !selectedPartner || !agreements || newFacilityLimit <= 0 || isClientOverLimit || isPartnerOverLimit}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                             Create Facility
                        </Button>
                    )}
                </div>
            </form>
        </FormProvider>
    )
}

const dummyFacilities = [
    { id: 'fac-001', clientName: 'Sample Transport Co.', partnerName: 'Global LendCo', agreementId: 'AG-101', limit: 500000, status: 'active'},
    { id: 'fac-002', clientName: 'Another Client Ltd', partnerName: 'Global LendCo', agreementId: 'AG-205', limit: 250000, status: 'active'},
];

export default function FacilitiesContent() {
    const [view, setView] = useState<'list' | 'create'>('list');
    
    const handleSaveSuccess = () => {
        setView('list');
    }

    const columns: ColumnDef<any>[] = useMemo(() => [
        { accessorKey: 'clientName', header: 'Client', cell: ({ row }) => <span>{row.original.clientName}</span> },
        { accessorKey: 'partnerName', header: 'Partner', cell: ({ row }) => <span>{row.original.partnerName}</span> },
        { accessorKey: 'agreementId', header: 'Agreement ID', cell: ({ row }) => <span className="font-mono text-xs">{row.original.agreementId}</span> },
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge>{row.original.status}</Badge> },
        { accessorKey: 'limit', header: 'Limit', cell: ({ row }) => <div className="text-right">{formatCurrency(row.original.limit)}</div> },
        { id: 'actions', header: () => <div className="text-right">Actions</div>, cell: ({ row }) => <div className="text-right"><Button variant="ghost" size="sm" onClick={() => alert('Edit facility')}>Edit</Button></div> }
    ], []);

    if(view === 'create') {
        return <FacilityWizard onBack={() => setView('list')} onSaveSuccess={handleSaveSuccess} />;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><Landmark /> Facility Management</CardTitle>
                    <CardDescription>View all active facilities or create a new one.</CardDescription>
                </div>
                <Button onClick={() => setView('create')}><PlusCircle className="mr-2 h-4 w-4"/> Add Facility</Button>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={dummyFacilities} />
            </CardContent>
        </Card>
    );
}
