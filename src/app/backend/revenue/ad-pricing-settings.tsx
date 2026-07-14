
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Zap, DollarSign, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getClientSideAuthToken, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  minBudget: z.coerce.number().min(1, 'Minimum budget must be at least R1'),
  serviceFeePercent: z.coerce.number().min(0).max(50, 'Fee capped at 50%'),
  isEngineActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdPricingSettings() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const firestore = useFirestore();

  const configRef = useMemoFirebase(() => firestore ? doc(firestore, 'configuration', 'adPricing') : null, [firestore]);
  const { data: adPricing, isLoading: isConfigLoading, forceRefresh } = useDoc<FormValues>(configRef);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      minBudget: 500,
      serviceFeePercent: 10,
      isEngineActive: true,
    },
  });

  useEffect(() => {
    if (adPricing) {
      form.reset(adPricing);
    }
  }, [adPricing, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");

        const response = await fetch('/api/updateConfigDoc', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: 'configuration/adPricing', data: { ...values, updatedAt: { _methodName: 'serverTimestamp' } } }),
        });
        
        if (!response.ok) {
            throw new Error((await response.json()).error || 'Failed to save settings.');
        }

      toast({ title: 'Ad Pricing Updated!', description: 'Global promotion parameters are now live.' });
      forceRefresh();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl text-left border-primary/20 bg-primary/5">
        <CardHeader>
            <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                    <Zap className="h-8 w-8 text-primary"/>
                </div>
                <div className="text-left">
                    <CardTitle>Global Ad Engine Pricing</CardTitle>
                    <CardDescription>
                        Control the economics of the platform's visibility revenue stream.
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        <FormField control={form.control} name="minBudget" render={({ field }) => (
                            <FormItem className="text-left">
                                <FormLabel className="flex items-center gap-2"><DollarSign className="h-3 w-3"/> Min. Campaign Budget (R)</FormLabel>
                                <FormControl><Input type="number" {...field} className="bg-white border-2" /></FormControl>
                                <FormDescription className="text-[10px]">The lowest amount a member can allocate to a visibility boost.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="serviceFeePercent" render={({ field }) => (
                            <FormItem className="text-left">
                                <FormLabel>Platform Yield (%)</FormLabel>
                                <FormControl><Input type="number" {...field} className="bg-white border-2" /></FormControl>
                                <FormDescription className="text-[10px]">The portion of the budget retained as platform revenue.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    <FormField control={form.control} name="isEngineActive" render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-4 bg-white border-2 rounded-xl text-left">
                            <div className="space-y-0.5 text-left">
                                <FormLabel className="text-sm font-bold flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                                    Global Ad Engine Status
                                </FormLabel>
                                <FormDescription className="text-[10px]">Instantly toggle visibility for all active campaigns.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )} />
                    
                    <div className="flex justify-end pt-4 border-t">
                        <Button type="submit" disabled={isSaving} className="font-bold shadow-lg">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Update Ad Economics
                        </Button>
                    </div>
                </form>
                </Form>
            )}
        </CardContent>
    </Card>
  );
}
