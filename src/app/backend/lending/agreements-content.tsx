
'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Landmark, FileText, Repeat, Briefcase, Handshake, Users, Truck, PlusCircle, ArrowLeft, ArrowRight, Loader2, Save, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const agreementTypes = [
    { id: 'loan-pv', label: 'Loan pv' },
    { id: 'loan-fl', label: 'Loan fl' },
    { id: 'installment-sale', label: 'Instalment Sale' },
    { id: 'rental', label: 'Leases' },
    { id: 'discounting', label: 'Factoring' },
];

const agreementSchema = z.object({
  type: z.string(),
  status: z.string(),
  amount: z.coerce.number().optional(),
  term: z.coerce.number().optional(),
  rate: z.coerce.number().optional(),
});

type AgreementFormValues = z.infer<typeof agreementSchema>;

const AgreementWizard = ({ agreement, client, onBack, onSaveSuccess }: { agreement: any, client: any, onBack: () => void, onSaveSuccess: () => void }) => {
    const isEditable = agreement.status.toLowerCase() === 'pending';
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const methods = useForm<AgreementFormValues>({
        resolver: zodResolver(agreementSchema),
        defaultValues: {
            type: agreement.type || '',
            status: agreement.status || '',
            amount: agreement.amount || 0,
            term: agreement.term || 0,
            rate: agreement.rate || 0,
        },
    });

    const onSubmit = async (values: AgreementFormValues) => {
        setIsSaving(true);
        // Placeholder for API call
        console.log("Saving agreement:", { id: agreement.id, ...values });
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ title: 'Agreement Updated' });
        setIsSaving(false);
        onSaveSuccess();
    };

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">
                Managing Agreement: <span className="font-mono text-primary">{agreement.id}</span>
            </h3>
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Agreement Details</CardTitle>
                            {!isEditable && (
                                <CardDescription className="text-amber-600 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" /> This agreement is not in a 'Pending' state and cannot be edited.
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <fieldset disabled={!isEditable} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={methods.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>)} />
                                    <FormField control={methods.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>)} />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField control={methods.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                    <FormField control={methods.control} name="term" render={({ field }) => (<FormItem><FormLabel>Term (Months)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                    <FormField control={methods.control} name="rate" render={({ field }) => (<FormItem><FormLabel>Rate (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                </div>
                            </fieldset>

                            {agreement.type === 'installment-sale' && (
                                <>
                                    <Separator className="my-6" />
                                    <div>
                                        <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
                                            <Truck className="h-5 w-5 text-muted-foreground" />
                                            Associated Asset
                                        </h3>
                                        {agreement.assetId ? (
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm text-muted-foreground">Asset linked: <span className="font-mono text-foreground">{agreement.assetId}</span></p>
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/lending?view=assets&assetId=${agreement.assetId}`}>View Asset</Link>
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm text-muted-foreground">No asset has been linked to this agreement yet.</p>
                                                <Button asChild>
                                                    <Link href={`/lending?view=assets&clientId=${client?.id}&agreementId=${agreement.id}`}>Add Asset</Link>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={onBack} type="button">Back to List</Button>
                            <Button type="submit" disabled={!isEditable || isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </FormProvider>
        </div>
    );
};


export default function AgreementsContent() {
    const firestore = useFirestore();
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [selectedAgreementType, setSelectedAgreementType] = useState<string | null>(null);
    const [selectedAgreement, setSelectedAgreement] = useState<any | null>(null);

    const clientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingClients')) : null, [firestore]);
    const { data: clients, isLoading: areClientsLoading } = useCollection(clientsQuery);
    
    const agreementsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedClient) return null;
        return query(collection(firestore, `lendingClients/${selectedClient}/agreements`));
    }, [firestore, selectedClient]);
    const { data: agreements, isLoading: areAgreementsLoading, forceRefresh } = useCollection(agreementsQuery);

    const sampleClients = [{ id: 'sample-client-1', name: 'Sample Transport Co.' }];
    const sampleAgreements = [{ id: 'AG-101', type: 'loan-pv', status: 'Active' }, {id: 'AG-102', type: 'installment-sale', status: 'Pending'}];
    
    const displayClients = (clients && clients.length > 0) ? clients : sampleClients;
    const displayAgreements = (agreements && agreements.length > 0) ? agreements : (selectedClient ? sampleAgreements : []);
    
    const clientForAgreement = clients?.find(c => c.id === selectedClient);

    const handleSelectClient = (clientId: string) => {
        setSelectedClient(clientId);
        setView('list');
        setSelectedAgreement(null);
    }
    
    const handleCreateNew = () => {
        setView('create');
        setSelectedAgreementType(null);
        setSelectedAgreement(null);
    }
    
    const handleEdit = (agreement: any) => {
        setSelectedAgreement(agreement);
        setView('edit');
    };
    
    const handleBackToList = () => {
        setView('list');
        setSelectedAgreement(null);
    };

    const handleSaveSuccess = () => {
        forceRefresh();
        handleBackToList();
    };
    
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="client-select">1. Select a Client</Label>
                        <Select onValueChange={handleSelectClient} value={selectedClient || ''} disabled={areClientsLoading}>
                            <SelectTrigger id="client-select">
                                <SelectValue placeholder={areClientsLoading ? "Loading clients..." : "Select a client..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {displayClients.map(client => (
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
                
                {view === 'list' && selectedClient && (
                     <div className="pt-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Existing Agreements for: <span className="text-primary">{clients?.find(c => c.id === selectedClient)?.name}</span>
                        </h3>
                         <div className="border rounded-lg">
                            <Table>
                                <TableHeader><TableRow><TableHead>Agreement ID</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {areAgreementsLoading ? (
                                        <TableRow><TableCell colSpan={4} className="text-center"><Loader2 className="animate-spin"/></TableCell></TableRow>
                                    ) : displayAgreements.length > 0 ? (
                                        displayAgreements.map((agreement: any) => (
                                            <TableRow key={agreement.id}>
                                                <TableCell className="font-mono">{agreement.id}</TableCell>
                                                <TableCell className="capitalize">{agreement.type?.replace('-', ' ')}</TableCell>
                                                <TableCell><Badge>{agreement.status}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" onClick={() => handleEdit(agreement)}>Manage</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={4} className="text-center">No agreements found for this client.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                         </div>
                    </div>
                )}
                
                {view === 'create' && (
                    <div className="pt-6">
                        <h3 className="text-lg font-semibold mb-4">
                           Create New Agreement for: <span className="text-primary">{clients?.find(c => c.id === selectedClient)?.name}</span>
                        </h3>
                        <div className="max-w-sm space-y-2 mb-6">
                            <Label htmlFor="agreement-type-select">Select an Agreement Type</Label>
                            <Select onValueChange={setSelectedAgreementType} value={selectedAgreementType || ''}>
                                <SelectTrigger id="agreement-type-select"><SelectValue placeholder="Select an agreement type..." /></SelectTrigger>
                                <SelectContent>
                                    {agreementTypes.map(type => (
                                        <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedAgreementType && (
                            <div className="pt-6 border-t">
                                <h3 className="font-semibold mb-4 text-muted-foreground">
                                    New Agreement Details: <span className="text-foreground">{agreementTypes.find(t => t.id === selectedAgreementType)?.label}</span>
                                </h3>
                                {/* Form for the selected agreement type would go here */}
                                <div className="p-8 border-2 border-dashed rounded-lg text-center">
                                    <p className="text-muted-foreground">Form fields for this agreement type would appear here.</p>
                                </div>
                                <div className="flex justify-between items-center mt-6">
                                     <Button variant="outline" onClick={() => setView('list')}><ArrowLeft className="mr-2 h-4 w-4"/> Back to List</Button>
                                     <Button>Save Agreement</Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                 {view === 'edit' && selectedAgreement && (
                    <div className="pt-6">
                        <AgreementWizard
                            agreement={selectedAgreement}
                            client={clientForAgreement}
                            onBack={handleBackToList}
                            onSaveSuccess={handleSaveSuccess}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

