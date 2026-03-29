'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Gift, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getClientSideAuthToken } from '@/firebase';
import { useConfig } from '@/hooks/use-config';

// Define the schema for a single tier's benefits
const benefitsSchema = z.object({
  commissionShare: z.coerce.number().min(0, "Must be >= 0").max(100, "Must be <= 100"),
  discountShare: z.coerce.number().min(0, "Must be >= 0").max(100, "Must be <= 100"),
  // Add other benefit fields here in the future
});

// Define the main form schema
const formSchema = z.object({
  bronzeBenefits: benefitsSchema,
  silverBenefits: benefitsSchema,
  goldBenefits: benefitsSchema,
});

type FormValues = z.infer<typeof formSchema>;

export default function RewardsManagement() {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    // Fetch the single 'loyaltySettings' document from the 'configuration' collection
    const { data: configData, isLoading: isConfigLoading, forceRefresh } = useConfig<any>('loyaltySettings');

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            bronzeBenefits: { commissionShare: 0, discountShare: 3 },
            silverBenefits: { commissionShare: 2.5, discountShare: 6 },
            goldBenefits: { commissionShare: 5, discountShare: 9 },
        },
    });

    useEffect(() => {
        if (configData) {
            form.reset({
                bronzeBenefits: configData.bronzeBenefits || { commissionShare: 0, discountShare: 3 },
                silverBenefits: configData.silverBenefits || { commissionShare: 2.5, discountShare: 6 },
                goldBenefits: configData.goldBenefits || { commissionShare: 5, discountShare: 9 },
            });
        }
    }, [configData, form]);

    const onSubmit = async (values: FormValues) => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            // Merge the new benefits data with existing loyaltySettings
            const dataToSave = {
                ...configData, // Preserve existing settings like point thresholds
                ...values,     // Overwrite with the new benefits data
                updatedAt: { _methodName: 'serverTimestamp' }
            };

            const response = await fetch('/api/updateConfigDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: 'configuration/loyaltySettings',
                    data: dataToSave
                }),
            });

            if (!response.ok) throw new Error((await response.json()).error || 'Failed to save settings.');
            
            toast({ title: 'Rewards Plan Benefits Saved!', description: 'The benefits for each loyalty tier have been updated.' });
            forceRefresh();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
        } finally {
            setIsSaving(false);
        }
    };

    const renderTierCard = (tier: 'bronze' | 'silver' | 'gold', title: string) => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" /> {title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <FormField
                    control={form.control}
                    name={`${tier}Benefits.commissionShare`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Commission Share (%)</FormLabel>
                            <FormControl><Input type="number" placeholder="e.g., 5" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name={`${tier}Benefits.discountShare`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Discount Share (%)</FormLabel>
                            <FormControl><Input type="number" placeholder="e.g., 10" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );

    return (
        <Card className="w-full max-w-5xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Gift className="h-6 w-6" />Rewards Plan Benefits</CardTitle>
                <CardDescription>
                    Define the specific benefits a member receives when they reach a loyalty tier. These are automatically applied.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isConfigLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {renderTierCard('bronze', 'Bronze Tier')}
                                {renderTierCard('silver', 'Silver Tier')}
                                {renderTierCard('gold', 'Gold Tier')}
                            </div>
                            
                            <div className="border-t pt-6">
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save All Benefits
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </CardContent>
        </Card>
    )
}
