
'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, Save, Handshake, Percent } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useDoc, useMemoFirebase, getClientSideAuthToken } from '@/firebase';
import { doc } from 'firebase/firestore';

const formSchema = z.object({
  membershipFee: z.coerce.number().min(0, 'Must be non-negative.'),
  isaSharePercentage: z.coerce.number().min(0).max(100, 'Must be between 0-100'),
  exampleDealSize: z.coerce.number().min(0, 'Must be non-negative.'),
  exampleOriginationFee: z.coerce.number().min(0).max(100, 'Must be between 0-100'),
  exampleIsaDealShare: z.coerce.number().min(0).max(100, 'Must be between 0-100'),
});

type FormValues = z.infer<typeof formSchema>;

export default function ISAPitchSettings() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);

  const configRef = useMemoFirebase(() => firestore ? doc(firestore, 'configuration', 'isaPitch') : null, [firestore]);
  const { data: configData, isLoading: isConfigLoading, forceRefresh } = useDoc<FormValues>(configRef);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      membershipFee: 500,
      isaSharePercentage: 30,
      exampleDealSize: 400000,
      exampleOriginationFee: 1,
      exampleIsaDealShare: 20,
    },
  });

  useEffect(() => {
    if (configData) {
      form.reset(configData);
    }
  }, [configData, form]);

  const onSubmit = async (values: FormValues) => {
    if (!configRef) return;
    setIsSaving(true);
    
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");

        const response = await fetch('/api/updateConfigDoc', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: configRef.path, data: { ...values, updatedAt: { _methodName: 'serverTimestamp' } } }),
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Failed to save ISA settings.');
        }

      toast({ title: 'ISA Pitch Settings Saved!', description: 'The values for the ISA pitch have been updated.' });
      forceRefresh();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
        <CardHeader>
            <div className="flex items-center gap-4">
                <Handshake className="h-8 w-8 text-primary"/>
                <div>
                    <CardTitle>ISA Pitch & Commission Settings</CardTitle>
                    <CardDescription>
                        Control the values displayed in the ISA pitch and used for commission calculations.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {isConfigLoading ? (
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2"><Percent className="h-5 w-5"/>Recurring Revenue</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                             <FormField
                                control={form.control}
                                name="membershipFee"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Avg. Membership Fee (R/mo)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="isaSharePercentage"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>ISA Share of Membership (%)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2"><Percent className="h-5 w-5"/>Transactional Revenue (Example)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                             <FormField
                                control={form.control}
                                name="exampleDealSize"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Example Deal Size (R)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="exampleOriginationFee"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Origination Fee (%)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="exampleIsaDealShare"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>ISA Share of Fee (%)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                    <Button type="submit" disabled={isSaving} className="mt-4">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save ISA Settings
                    </Button>
                </form>
                </Form>
            )}
        </CardContent>
    </Card>
  );
}
