'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Award, Trash2, PlusCircle, Gift } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useConfig } from '@/hooks/use-config';
import { getClientSideAuthToken } from '@/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


// Schema for a single benefit row
const benefitRowSchema = z.object({
  name: z.string().min(1, "Benefit name cannot be empty."),
  bronzeValue: z.string().optional(),
  silverValue: z.string().optional(),
  goldValue: z.string().optional(),
});

const formSchema = z.object({
  benefits: z.array(benefitRowSchema),
});

type FormValues = z.infer<typeof formSchema>;

export default function RewardsManagement() {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const { data: configData, isLoading: isConfigLoading, forceRefresh } = useConfig<any>('loyaltySettings');

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            benefits: [],
        },
    });

    useEffect(() => {
        if (configData) {
            if (Array.isArray(configData.benefits)) {
                // Data is already in the new format
                form.reset({ benefits: configData.benefits });
            } else {
                // Transform old data structure to new one for backward compatibility
                const allKeys = new Set<string>();
                const bronzeMap = new Map((configData.bronzeBenefits || []).map((b: any) => [b.key, b.value]));
                const silverMap = new Map((configData.silverBenefits || []).map((b: any) => [b.key, b.value]));
                const goldMap = new Map((configData.goldBenefits || []).map((b: any) => [b.key, b.value]));

                (configData.bronzeBenefits || []).forEach((b: any) => b.key && allKeys.add(b.key));
                (configData.silverBenefits || []).forEach((b: any) => b.key && allKeys.add(b.key));
                (configData.goldBenefits || []).forEach((b: any) => b.key && allKeys.add(b.key));

                const transformedBenefits = Array.from(allKeys).map(key => ({
                    name: key,
                    bronzeValue: bronzeMap.get(key) || '',
                    silverValue: silverMap.get(key) || '',
                    goldValue: goldMap.get(key) || '',
                }));

                form.reset({ benefits: transformedBenefits });
            }
        }
    }, [configData, form]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'benefits',
    });

    const onSubmit = async (values: FormValues) => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const dataToSave: any = { ...configData };
            
            dataToSave.benefits = values.benefits;

            delete dataToSave.bronzeBenefits;
            delete dataToSave.silverBenefits;
            delete dataToSave.goldBenefits;
            
            dataToSave.updatedAt = { _methodName: 'serverTimestamp' };

            await fetch('/api/updateConfigDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: 'configuration/loyaltySettings',
                    data: dataToSave
                }),
            });
            
            toast({ title: 'Rewards Plan Benefits Saved!', description: 'The benefits for each loyalty tier have been updated.' });
            forceRefresh();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Card className="w-full max-w-5xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Gift className="h-6 w-6" />Rewards Plan Benefits</CardTitle>
                <CardDescription>
                    Define the specific benefits a member receives when they reach a loyalty tier. These are automatically applied.
                </CardDescription>
            </CardHeader>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent>
                        {isConfigLoading ? (
                             <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                        ) : (
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[30%]">Benefit Name</TableHead>
                                            <TableHead>Bronze Value</TableHead>
                                            <TableHead>Silver Value</TableHead>
                                            <TableHead>Gold Value</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fields.map((field, index) => (
                                            <TableRow key={field.id}>
                                                <TableCell>
                                                    <FormField control={form.control} name={`benefits.${index}.name`} render={({ field }) => (
                                                        <Input {...field} placeholder="e.g., Commission Share" />
                                                    )}/>
                                                </TableCell>
                                                <TableCell>
                                                    <FormField control={form.control} name={`benefits.${index}.bronzeValue`} render={({ field }) => (
                                                        <Input {...field} placeholder="e.g., 5%" />
                                                    )}/>
                                                </TableCell>
                                                <TableCell>
                                                    <FormField control={form.control} name={`benefits.${index}.silverValue`} render={({ field }) => (
                                                        <Input {...field} placeholder="e.g., 10%" />
                                                    )}/>
                                                </TableCell>
                                                <TableCell>
                                                    <FormField control={form.control} name={`benefits.${index}.goldValue`} render={({ field }) => (
                                                        <Input {...field} placeholder="e.g., 15%" />
                                                    )}/>
                                                </TableCell>
                                                <TableCell>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ name: '', bronzeValue: '', silverValue: '', goldValue: '' })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Benefit Row
                        </Button>
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Benefits
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
