'use client';

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';

const partnerSchema = z.object({
  name: z.string().min(1, "Partner name is required."),
  globalFacilityLimit: z.coerce.number().min(0, "Limit must be a positive number.").optional(),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

interface PartnerWizardProps {
  partnerData?: Partial<PartnerFormValues> & { id?: string };
  partnerType: 'Suppliers' | 'Vendors' | 'Associates' | 'Debtors';
  onBack: () => void;
  onSaveSuccess: () => void;
}

export default function PartnerWizard({ partnerData, partnerType, onBack, onSaveSuccess }: PartnerWizardProps) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const isDebtor = partnerType === 'Debtors';
    const partnerTypeEnum = partnerType.slice(0, -1).toLowerCase();
    
    const methods = useForm<PartnerFormValues>({
        resolver: zodResolver(partnerSchema),
        defaultValues: {
            name: partnerData?.name || '',
            globalFacilityLimit: partnerData?.globalFacilityLimit || 0,
        }
    });

    const onSubmit = async (values: PartnerFormValues) => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const payload = isDebtor
                ? { client: { id: partnerData?.id, status: 'Active', ...values } }
                : { partner: { id: partnerData?.id, type: partnerTypeEnum, ...values } };

            const action = isDebtor ? 'saveLendingClient' : 'saveLendingPartner';
            
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            toast({ title: `${partnerType.slice(0, -1)} Saved`, description: `Details for ${values.name} have been saved.` });
            onSaveSuccess();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error Saving', description: e.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>{partnerData?.id ? 'Edit' : 'Add New'} {partnerType.slice(0, -1)}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={methods.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{partnerType.slice(0, -1)} Name</FormLabel>
                                    <FormControl><Input placeholder={`Enter ${partnerType.toLowerCase().slice(0,-1)} name`} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={methods.control}
                            name="globalFacilityLimit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Global Facility Limit</FormLabel>
                                    <FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="justify-between">
                         <Button variant="outline" type="button" onClick={onBack}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                        </Button>
                         <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                            Save {partnerType.slice(0,-1)}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </FormProvider>
    );
}
