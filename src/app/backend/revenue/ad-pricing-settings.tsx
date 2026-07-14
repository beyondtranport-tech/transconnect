
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
import { Loader2, Save, Zap, DollarSign, ShieldAlert, Layers } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getClientSideAuthToken, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  instanceBatchSize: z.coerce.number().min(1, 'Batch size must be at least 1'),
  pricePerBatch: z.coerce.number().min(1, 'Price must be at least R1'),
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
      instanceBatchSize: 1000,
      pricePerBatch: 100,
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

      toast({ title: 'Ad Pricing Updated!', description: 'Batch-based visibility pricing is now live.' });
      forceRefresh();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl text-left border-primary/20 bg-primary/5 shadow-xl">
        <CardHeader className="bg-white rounded-t-lg border-b p-8">
            <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                    <Zap className="h-8 w-8 text-primary"/>
                </div>
                <div className="text-left">
                    <CardTitle className="text-xl font-black uppercase tracking-tight">Ad Inventory Economics</CardTitle>
                    <CardDescription>
                        Set the cost per visibility instance. All ads are sold in standardized batches.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-8">
            {isConfigLoading ? (
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                        <FormField control={form.control} name="instanceBatchSize" render={({ field }) => (
                            <FormItem className="text-left">
                                <FormLabel className="flex items-center gap-2 font-bold"><Layers className="h-4 w-4 text-primary"/> Instance Batch Size</FormLabel>
                                <FormControl><Input type="number" {...field} className="h-12 border-2 bg-white text-lg font-black" /></FormControl>
                                <FormDescription className="text-[10px] uppercase font-bold text-muted-foreground">Standardized # of views per batch.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="pricePerBatch" render={({ field }) => (
                            <FormItem className="text-left">
                                <FormLabel className="flex items-center gap-2 font-bold"><DollarSign className="h-4 w-4 text-primary"/> Price per Batch (R)</FormLabel>
                                <FormControl><Input type="number" {...field} className="h-12 border-2 bg-white text-lg font-black" /></FormControl>
                                <FormDescription className="text-[10px] uppercase font-bold text-muted-foreground">Cost to the member per batch purchased.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    <div className="p-6 bg-white border-2 border-dashed rounded-2xl space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Calculated Unit Cost:</span>
                            <span className="font-mono font-black text-primary">R {(form.watch('pricePerBatch') / form.watch('instanceBatchSize')).toFixed(4)} per View</span>
                        </div>
                    </div>

                    <FormField control={form.control} name="isEngineActive" render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-6 bg-slate-900 text-white rounded-2xl shadow-lg text-left">
                            <div className="space-y-1 text-left">
                                <FormLabel className="text-base font-black flex items-center gap-2 uppercase tracking-tight">
                                    <ShieldAlert className="h-5 w-5 text-primary" />
                                    Ad Engine Global Switch
                                </FormLabel>
                                <FormDescription className="text-xs text-slate-400">Instantly pause all visibility delivery across the platform.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-primary" />
                            </FormControl>
                        </FormItem>
                    )} />
                    
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSaving} className="h-12 px-10 font-bold shadow-xl text-white">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Publish Pricing Strategy
                        </Button>
                    </div>
                </form>
                </Form>
            )}
        </CardContent>
    </Card>
  );
}
