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
  
  // Generative AI
  aiImageGenerator: z.coerce.number().min(0, 'Must be non-negative.'),
  aiVideoGenerator: z.coerce.number().min(0, 'Must be non-negative.'),

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
      aiImageGenerator: 0,
      aiVideoGenerator: 0,
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
                    
                    {/* Generative AI */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Generative AI Suite (per generation)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md">
                             <FormField control={form.control} name="aiImageGenerator" render={({ field }) => (
                                <FormItem><FormLabel>AI Designer / Image Generation (R)</FormLabel><FormControl><Input type="number" {...field} step="0.50" /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="aiVideoGenerator" render={({ field }) => (
                                <FormItem><FormLabel>AI Video Ad Generation (R)</FormLabel><FormControl><Input type="number" {...field} step="1.00" /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </div>
                    
                    {/* Shop Enhancements */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Shop Enhancements (per month)</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-md">
                            <FormField control={form.control} name="premiumThemes" render={({ field }) => (
                                <FormItem><FormLabel>Premium Themes</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="seoBooster" render={({ field }) => (
                                <FormItem><FormLabel>SEO Booster</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="advancedAnalytics" render={({ field }) => (
                                <FormItem><FormLabel>Advanced Analytics</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="promotionsPlus" render={({ field }) => (
                                <FormItem><FormLabel>Promotions Plus</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </div>

                    {/* API & Data Services */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">API & Data Services</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4 border rounded-md">
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
