'use client';

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
import { useState, useEffect } from 'react';
import { Loader2, Save, Star, UserPlus, Store, Package, Sparkles, Edit, Video, Search, Truck, Building, Users, Handshake, Briefcase, Bot, Code, ShoppingCart, Warehouse, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getClientSideAuthToken } from '@/firebase';
import { Separator } from '@/components/ui/separator';
import { useConfig } from '@/hooks/use-config';

const formSchema = z.object({
  // General Platform Actions
  userSignupPoints: z.coerce.number().min(0, 'Points must be 0 or more.'),
  shopCreationPoints: z.coerce.number().min(0, 'Points must be 0 or more.'),
  productAddPoints: z.coerce.number().min(0, 'Points must be 0 or more.'),
  loadBoardCreationPoints: z.coerce.number().min(0, 'Points must be 0 or more.'),
  
  // AI Tool Actions
  seoBoosterPoints: z.coerce.number().min(0, 'Points must be 0 or more.'),
  aiImageGeneratorPoints: z.coerce.number().min(0, 'Points must be 0 or more.'),
  imageEnhancerPoints: z.coerce.number().min(0, 'Points must be 0 or more.'),
  aiVideoGeneratorPoints: z.coerce.number().min(0, 'Points must be 0 or more.'),

  // Role-based Data Contribution Actions
  truckContributionPoints: z.coerce.number().min(0),
  trailerContributionPoints: z.coerce.number().min(0),
  supplierContributionPoints: z.coerce.number().min(0),
  debtorContributionPoints: z.coerce.number().min(0),
  
  partnerReferralPoints: z.coerce.number().min(0),
  associateServiceListingPoints: z.coerce.number().min(0),
  isaSaleCommissionPoints: z.coerce.number().min(0),
  driverSafetyRecordPoints: z.coerce.number().min(0),
  developerApiIntegrationPoints: z.coerce.number().min(0),
});

type ActionPlanSettingsFormValues = z.infer<typeof formSchema>;

export default function ActionPlanSettings() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const { data: configData, isLoading: isConfigLoading, forceRefresh } = useConfig<ActionPlanSettingsFormValues>('loyaltySettings');

  const form = useForm<ActionPlanSettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userSignupPoints: 50,
      shopCreationPoints: 100,
      productAddPoints: 5,
      loadBoardCreationPoints: 75,
      seoBoosterPoints: 15,
      aiImageGeneratorPoints: 2,
      imageEnhancerPoints: 1,
      aiVideoGeneratorPoints: 20,
      truckContributionPoints: 10,
      trailerContributionPoints: 10,
      supplierContributionPoints: 15,
      debtorContributionPoints: 20,
      partnerReferralPoints: 200,
      associateServiceListingPoints: 50,
      isaSaleCommissionPoints: 25,
      driverSafetyRecordPoints: 50,
      developerApiIntegrationPoints: 500,
    },
  });

  useEffect(() => {
    if (configData) {
      form.reset(configData);
    }
  }, [configData, form]);

  const onSubmit = async (values: ActionPlanSettingsFormValues) => {
    setIsSaving(true);
    
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");

        const response = await fetch('/api/updateConfigDoc', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: 'configuration/loyaltySettings', data: { ...values, updatedAt: { _methodName: 'serverTimestamp' } } }),
        });

        if (!response.ok) throw new Error((await response.json()).error || "Failed to save settings.");
        
        toast({ title: 'Action Plan Settings Saved!', description: 'The action points have been updated.' });
        forceRefresh();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
    } finally {
        setIsSaving(false);
    }
  };
  
   const renderPointsField = (name: keyof ActionPlanSettingsFormValues, label: string, icon: React.ElementType) => {
      const Icon = icon;
      return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center"><Icon className="mr-2 h-4 w-4"/>{label}</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
      );
  }


  return (
    <Card className="w-full max-w-5xl">
        <CardHeader>
            <div className="flex items-center gap-4">
                <Star className="h-8 w-8 text-primary"/>
                <div>
                    <CardTitle>Action Plan Settings</CardTitle>
                    <CardDescription>
                       Define how many loyalty points are awarded for specific member actions.
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
                     <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-muted-foreground"/>Vendors</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {renderPointsField('shopCreationPoints', 'Points Per Shop Creation', Store)}
                                {renderPointsField('productAddPoints', 'Points Per Product', Package)}
                                {renderPointsField('supplierContributionPoints', 'Points Per Supplier', Building)}
                                {renderPointsField('debtorContributionPoints', 'Points Per Debtor', Users)}
                            </div>
                        </div>
                         <div>
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Truck className="h-5 w-5 text-muted-foreground"/>Transporters (Buyers)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                 {renderPointsField('truckContributionPoints', 'Points Per Truck', Truck)}
                                 {renderPointsField('trailerContributionPoints', 'Points Per Trailer', Warehouse)}
                                 {renderPointsField('loadBoardCreationPoints', 'Points Per Load Board Creation', Truck)}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Handshake className="h-5 w-5 text-muted-foreground"/>Partners & Referrals</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {renderPointsField('partnerReferralPoints', 'Points Per Member Referral', UserPlus)}
                                {renderPointsField('isaSaleCommissionPoints', 'Points for ISA Sale', Bot)}
                            </div>
                        </div>
                         <div>
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Briefcase className="h-5 w-5 text-muted-foreground"/>Associates</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {renderPointsField('associateServiceListingPoints', 'Points Per Service Listing', Package)}
                            </div>
                        </div>
                        
                         <div>
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-muted-foreground"/>Drivers</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {renderPointsField('driverSafetyRecordPoints', 'Points Per Safety Record', ShieldCheck)}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Code className="h-5 w-5 text-muted-foreground"/>Developers</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {renderPointsField('developerApiIntegrationPoints', 'Points Per API Integration', Code)}
                            </div>
                        </div>

                        <Separator />

                        <h3 className="font-semibold text-lg mb-4 pt-4">General Platform & AI Actions</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {renderPointsField('userSignupPoints', 'Points Per Sign-up', UserPlus)}
                            {renderPointsField('seoBoosterPoints', 'Points Per AI SEO Use', Search)}
                            {renderPointsField('aiImageGeneratorPoints', 'Points Per AI Image', Sparkles)}
                            {renderPointsField('imageEnhancerPoints', 'Points Per Image Enhance', Edit)}
                            {renderPointsField('aiVideoGeneratorPoints', 'Points Per AI Video', Video)}
                        </div>
                    </div>
                    <Button type="submit" disabled={isSaving} className="mt-8">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save All Settings
                    </Button>
                </form>
                </Form>
            )}
        </CardContent>
    </Card>
  );
}
