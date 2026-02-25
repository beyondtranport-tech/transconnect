
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, Briefcase, FileText, Check } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

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

const formSchema = z.object({
  clientId: z.string().min(1, "A client must be selected."),
  make: z.string().min(1, 'Make is required.'),
  model: z.string().min(1, 'Model is required.'),
  year: z.string().min(4, 'Year is required.'),
  costOfSale: z.coerce.number().min(0),
  registrationNumber: z.string().optional(),
  vin: z.string().optional(),
  engineNumber: z.string().optional(),
  status: z.enum(['available', 'financed', 'sold', 'decommissioned']).default('available'),
});
type AssetWizardFormValues = z.infer<typeof formSchema>;

const wizardSteps = [
    { id: 'asset', name: 'Asset Details' },
    { id: 'review', name: 'Review & Save' },
];

export function AssetWizard({ asset, onBack, onSaveSuccess, defaultClientId }: { asset?: any, onBack: () => void, onSaveSuccess: () => void, defaultClientId?: string | null }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    
    const methods = useForm<AssetWizardFormValues>({
        resolver: zodResolver(formSchema),
        mode: 'onChange',
        defaultValues: asset || { 
            clientId: defaultClientId || '',
        },
    });

    const onSubmit = async (values: AssetWizardFormValues) => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");

            await performAdminAction(token, 'saveLendingAsset', { asset: { id: asset?.id, ...values } });
            
            toast({ title: asset?.id ? 'Asset Updated' : 'Asset Created' });
            onSaveSuccess();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error saving asset', description: e.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Card className="w-full">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <h2 className="text-2xl font-bold font-headline">{asset ? 'Edit Asset' : 'Create New Asset'}</h2>
                                <p className="text-muted-foreground">{wizardSteps[currentStep].name}</p>
                            </div>
                             <Button type="button" variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4"/> Back to List</Button>
                        </div>
                    </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <FormField control={methods.control} name="make" render={({ field }) => (<FormItem><FormLabel>Make</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={methods.control} name="model" render={({ field }) => (<FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={methods.control} name="year" render={({ field }) => (<FormItem><FormLabel>Year</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={methods.control} name="costOfSale" render={({ field }) => (<FormItem><FormLabel>Cost of Sale (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                <FormField control={methods.control} name="status" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="available">Available</SelectItem>
                                                <SelectItem value="financed">Financed</SelectItem>
                                                <SelectItem value="sold">Sold</SelectItem>
                                                <SelectItem value="decommissioned">Decommissioned</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                                <div className="flex justify-end pt-8 mt-8 border-t">
                                    <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Asset</Button>
                                </div>
                            </div>
                    </CardContent>
                </form>
            </FormProvider>
        </Card>
    );
}
