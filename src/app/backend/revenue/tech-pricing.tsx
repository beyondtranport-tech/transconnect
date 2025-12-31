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
import { Loader2, Save, Cpu } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  // Shop Enhancements
  premiumThemes: z.coerce.number().min(0, 'Must be non-negative.'),
  seoBooster: z.coerce.number().min(0, 'Must be non-negative.'),
  advancedAnalytics: z.coerce.number().min(0, 'Must be non-negative.'),
  promotionsPlus: z.coerce.number().min(0, 'Must be non-negative.'),
  
  // Wallet & Financial Services
  walletMaintenanceFee: z.coerce.number().min(0, 'Must be non-negative.'),
  paymentProcessingFee: z.coerce.number().min(0).max(100, 'Must be 0-100'),
  eftTopUpFee: z.coerce.number().min(0, 'Fee must be non-negative.'),
  walletTransferFee: z.coerce.number().min(0).max(100, 'Must be between 0 and 100'),

  // API & Data Services
  aiFreightMatcher: z.coerce.number().min(0, 'Must be non-negative.'),
  analyticsDashboard: z.coerce.number().min(0, 'Must be non-negative.'),
  apiAccessPerCall: z.coerce.number().min(0, 'Must be non-negative.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function TechPricing() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);

  const configRef = useMemoFirebase(() => firestore ? doc(firestore, 'configuration', 'techPricing') : null, [firestore]);
  const { data: techPriceConfig, isLoading: isConfigLoading } = useDoc<FormValues>(configRef);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      premiumThemes: 0,
      seoBooster: 0,
      advancedAnalytics: 0,
      promotionsPlus: 0,
      walletMaintenanceFee: 0,
      paymentProcessingFee: 0,
      eftTopUpFee: 0,
      walletTransferFee: 0,
      aiFreightMatcher: 0,
      analyticsDashboard: 0,
      apiAccessPerCall: 0,
    },
  });

  useEffect(() => {
    if (techPriceConfig) {
      form.reset(techPriceConfig);
    }
  }, [techPriceConfig, form]);

  const onSubmit = async (values: FormValues) => {
    if (!configRef) return;
    setIsLoading(true);
    
    try {
      await setDoc(configRef, { ...values, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: 'Tech Pricing Updated!', description: 'The new SaaS prices have been saved.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
        <CardHeader>
            <div className="flex items-center gap-4">
                <Cpu className="h-8 w-8 text-primary"/>
                <div>
                    <CardTitle>Tech Component Pricing</CardTitle>
                    <CardDescription>
                        Set monthly SaaS pricing for individual technology components and value-added services.
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
                    
                    {/* Shop Enhancements */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Shop Enhancements</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-md">
                            <FormField control={form.control} name="premiumThemes" render={({ field }) => (
                                <FormItem><FormLabel>Premium Themes (R/mo)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="seoBooster" render={({ field }) => (
                                <FormItem><FormLabel>SEO Booster (R/mo)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="advancedAnalytics" render={({ field }) => (
                                <FormItem><FormLabel>Advanced Analytics (R/mo)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="promotionsPlus" render={({ field }) => (
                                <FormItem><FormLabel>Promotions Plus (R/mo)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </div>
                    
                    {/* Wallet & Financial Services */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Wallet & Financial Services</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-md">
                             <FormField control={form.control} name="walletMaintenanceFee" render={({ field }) => (
                                <FormItem><FormLabel>Wallet Maintenance (R/mo)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="paymentProcessingFee" render={({ field }) => (
                                <FormItem><FormLabel>Payment Processing (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField
                                control={form.control}
                                name="eftTopUpFee"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>EFT Top-up Fee (R)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="walletTransferFee"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Wallet Transfer Fee (%)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* API & Data Services */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">API & Data Services</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-md">
                            <FormField control={form.control} name="aiFreightMatcher" render={({ field }) => (
                                <FormItem><FormLabel>AI Freight Matcher (R/mo)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="analyticsDashboard" render={({ field }) => (
                                <FormItem><FormLabel>Analytics Dashboard (R/mo)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="apiAccessPerCall" render={({ field }) => (
                                <FormItem><FormLabel>API Access (R/call)</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </div>
                    
                    <Separator />
                    
                    <Button type="submit" disabled={isLoading} className="mt-4">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save All Tech Prices
                    </Button>
                </form>
                </Form>
            )}
        </CardContent>
    </Card>
  );
}
