
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, Users, FileText } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';

async function performAdminAction(token: string, action: string, payload?: any) {
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

const agreementFormSchema = z.object({
  clientId: z.string().min(1, "A client must be selected."),
  type: z.enum(["loan", "installment-sale", "lease", "factoring"]),
  description: z.string().optional(),
  totalAdvanced: z.coerce.number().positive('Amount must be positive'),
  interestRate: z.coerce.number().min(0, 'Rate cannot be negative'),
  arrearInterest: z.boolean().default(false),
  createDate: z.string().optional(),
  capitalizationDate: z.string().optional(),
  firstInstallmentDate: z.string().optional(),
  numberOfInstallments: z.coerce.number().int().positive('Term must be a positive integer'),
  interval: z.enum(["daily", "weekly", "bi-monthly", "monthly"]),
  paymentMethod: z.enum(["debit_order", "eft"]),
  bankAccountId: z.string().optional(),
  status: z.enum(['pending', 'active', 'completed', 'defaulted']).default('pending'),
});

type FormValues = z.infer<typeof agreementFormSchema>;

export function AgreementWizard({ agreement, defaultClientId }: { agreement?: any, defaultClientId?: string | null }) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClientDetails, setSelectedClientDetails] = useState<any | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const methods = useForm<FormValues>({
        resolver: zodResolver(agreementFormSchema),
        defaultValues: {
            clientId: defaultClientId || agreement?.clientId || '',
            // Initialize other fields...
        },
    });
    
    const selectedClientId = methods.watch('clientId');

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoadingData(true);
            try {
                const token = await getClientSideAuthToken();
                if (!token) throw new Error("Auth failed.");
                const clientsRes = await performAdminAction(token, 'getLendingData', { collectionName: 'lendingClients' });
                setClients(clientsRes.data || []);
            } catch (e: any) {
                toast({ variant: 'destructive', title: "Failed to load clients", description: e.message });
            } finally {
                setIsLoadingData(false);
            }
        };
        loadInitialData();
    }, [toast]);

    useEffect(() => {
        const loadClientDetails = async () => {
            if (!selectedClientId) {
                setSelectedClientDetails(null);
                return;
            }
            try {
                const token = await getClientSideAuthToken();
                if (!token) throw new Error("Auth failed.");
                const clientDetails = await performAdminAction(token, 'getLendingClientById', { clientId: selectedClientId });
                setSelectedClientDetails(clientDetails || null);
            } catch (e: any) {
                 toast({ variant: 'destructive', title: "Failed to load client details", description: e.message });
            }
        }
        loadClientDetails();
    }, [selectedClientId, toast]);
    
    useEffect(() => {
        if (agreement) {
            methods.reset({
                ...agreement,
                createDate: agreement.createDate ? new Date(agreement.createDate).toISOString().split('T')[0] : '',
                capitalizationDate: agreement.capitalizationDate ? new Date(agreement.capitalizationDate).toISOString().split('T')[0] : '',
                firstInstallmentDate: agreement.firstInstallmentDate ? new Date(agreement.firstInstallmentDate).toISOString().split('T')[0] : '',
            });
        }
    }, [agreement, methods]);

    const onSubmit = async (values: FormValues) => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");
            await performAdminAction(token, 'saveLendingAgreement', { agreement: { id: agreement?.id, ...values } });
            toast({ title: agreement?.id ? 'Agreement Updated' : 'Agreement Created' });
            router.push('/lending?view=agreements');
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error saving agreement', description: e.message });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="w-full max-w-4xl">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold font-headline">{agreement ? 'Edit Agreement' : 'Create New Agreement'}</h2>
                            </div>
                            <Button type="button" variant="ghost" onClick={() => router.push('/lending?view=agreements')}><ArrowLeft className="mr-2 h-4 w-4"/> Back to List</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={methods.control} name="clientId" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><Users/>Client</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger></FormControl>
                                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={methods.control} name="type" render={({ field }) => (<FormItem><FormLabel>Agreement Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="loan">Loan</SelectItem><SelectItem value="installment-sale">Installment Sale</SelectItem><SelectItem value="lease">Lease</SelectItem><SelectItem value="factoring">Factoring</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="Agreement Description" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={methods.control} name="totalAdvanced" render={({ field }) => (<FormItem><FormLabel>Total Advanced (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="interestRate" render={({ field }) => (<FormItem><FormLabel>Interest Rate (p.a. %)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={methods.control} name="arrearInterest" render={({ field }) => (<FormItem className="flex flex-row items-end space-x-2 pb-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange}/></FormControl><FormLabel>Arrear Interest?</FormLabel></FormItem>)} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={methods.control} name="createDate" render={({ field }) => (<FormItem><FormLabel>Create Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="capitalizationDate" render={({ field }) => (<FormItem><FormLabel>Charge Capitalised(Int.) From</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="firstInstallmentDate" render={({ field }) => (<FormItem><FormLabel>First Instalment Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField control={methods.control} name="numberOfInstallments" render={({ field }) => (<FormItem><FormLabel># of Instalments</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={methods.control} name="interval" render={({ field }) => (<FormItem><FormLabel>Interval</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select interval..."/></SelectTrigger></FormControl><SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="bi-monthly">Bi-Monthly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={methods.control} name="paymentMethod" render={({ field }) => (<FormItem><FormLabel>Payment Method</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select method..."/></SelectTrigger></FormControl><SelectContent><SelectItem value="debit_order">Debit Order</SelectItem><SelectItem value="eft">EFT</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="bankAccountId" render={({ field }) => (<FormItem><FormLabel>Bank Account</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedClientDetails}><FormControl><SelectTrigger><SelectValue placeholder={selectedClientDetails ? "Select account..." : "Select client first"}/></SelectTrigger></FormControl><SelectContent>{(selectedClientDetails?.bankAccounts || []).map((acc: any, index: number) => <SelectItem key={index} value={acc.accountNumber}>{acc.bankName} - {acc.accountNumber}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end border-t pt-6 mt-6">
                        <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {agreement ? 'Save Changes' : 'Create Agreement'}</Button>
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}

