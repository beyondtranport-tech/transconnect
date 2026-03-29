
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Award, Trash2, PlusCircle, Gift } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useConfig } from '@/hooks/use-config';
import { getClientSideAuthToken } from '@/firebase';

// Schema for a single benefit key-value pair
const benefitFieldSchema = z.object({
  key: z.string().min(1, "Benefit name cannot be empty."),
  value: z.string().min(1, "Benefit value cannot be empty."),
});

// Schema for the entire form
const formSchema = z.object({
  bronzeBenefits: z.array(benefitFieldSchema),
  silverBenefits: z.array(benefitFieldSchema),
  goldBenefits: z.array(benefitFieldSchema),
});

type FormValues = z.infer<typeof formSchema>;

export default function RewardsManagement() {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const { data: configData, isLoading: isConfigLoading, forceRefresh } = useConfig<any>('loyaltySettings');

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            bronzeBenefits: [],
            silverBenefits: [],
            goldBenefits: [],
        },
    });

    useEffect(() => {
        if (configData) {
            // Helper to convert old object format to new array format for backward compatibility
            const transformBenefits = (benefits: any) => {
                if (Array.isArray(benefits)) {
                    return benefits; // Already in new format
                }
                if (typeof benefits === 'object' && benefits !== null) {
                    return Object.entries(benefits).map(([key, value]) => ({ key, value: String(value) }));
                }
                return [];
            };

            form.reset({
                bronzeBenefits: transformBenefits(configData.bronzeBenefits),
                silverBenefits: transformBenefits(configData.silverBenefits),
                goldBenefits: transformBenefits(configData.goldBenefits),
            });
        }
    }, [configData, form]);

    const onSubmit = async (values: FormValues) => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            // Merge the new benefits data with existing loyaltySettings (like point thresholds)
            const dataToSave = {
                ...configData, 
                ...values,
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

    const TierCard = ({ tier, title }: { tier: 'bronze' | 'silver' | 'gold', title: string }) => {
        const { fields, append, remove } = useFieldArray({
            control: form.control,
            name: `${tier}Benefits`,
        });

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" /> {title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-2">
                             <FormField
                                control={form.control}
                                name={`${tier}Benefits.${index}.key`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Benefit Name</FormLabel>
                                        <FormControl><Input placeholder="e.g., Commission Share" {...field} /></FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`${tier}Benefits.${index}.value`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Value</FormLabel>
                                        <FormControl><Input placeholder="e.g., 5%" {...field} /></FormControl>
                                    </FormItem>
                                )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ key: '', value: '' })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Benefit
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-4xl">
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
                             <div className="space-y-6">
                                <TierCard tier="bronze" title="Bronze Tier Benefits" />
                                <TierCard tier="silver" title="Silver Tier Benefits" />
                                <TierCard tier="gold" title="Gold Tier Benefits" />
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
    );
}
