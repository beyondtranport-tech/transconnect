
'use client';

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
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2, Save, Star, Gift, UserPlus, Store, Package, Sparkles, Edit, Video, Search, Truck, Building, Users, Handshake, Briefcase, Bot, Code, ShoppingCart, Warehouse, ShieldCheck, Percent } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getClientSideAuthToken, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  bronzePoints: z.coerce.number().min(0, 'Points must be 0 or more.'),
  silverPoints: z.coerce.number().min(0, 'Points must be 0 or more.'),
  goldPoints: z.coerce.number().min(0, 'Points must be 0 or more.'),
  
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

type LoyaltySettingsFormValues = z.infer<typeof formSchema>;

export default function LoyaltySettings() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);

  const configRef = useMemoFirebase(() => firestore ? doc(firestore, 'configuration', 'loyaltySettings') : null, [firestore]);
  const { data: loyaltyConfig, isLoading: isConfigLoading, forceRefresh } = useDoc<LoyaltySettingsFormValues>(configRef);

  const form = useForm<LoyaltySettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bronzePoints: 0,
      silverPoints: 1000,
      goldPoints: 5000,
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
    if (loyaltyConfig) {
      form.reset(loyaltyConfig);
    }
  }, [loyaltyConfig, form]);

  const onSubmit = async (values: LoyaltySettingsFormValues) => {
    if (!configRef) {
        toast({ variant: 'destructive', title: 'Error', description: 'Firestore not available.' });
        return;
    }
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
        
        toast({ title: 'Loyalty Settings Saved!', description: 'The loyalty tiers and action points have been updated.' });
        forceRefresh();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
    } finally {
        setIsSaving(false);
    }
  };

  const renderPointsField = (name: keyof LoyaltySettingsFormValues, label: string, icon: React.ElementType) => {
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
                    <CardTitle>Loyalty & Rewards Settings</CardTitle>
                    <CardDescription>
                        Define point thresholds and points awarded for member actions.
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
                    <div>
                        <h3 className="text-lg font-medium flex items-center gap-2 mb-4"><Star className="h-5 w-5" /> Loyalty Tier Thresholds</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="bronzePoints" render={({ field }) => (<FormItem><FormLabel>Bronze Tier</FormLabel><FormControl><Input type="number" {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="silverPoints" render={({ field }) => (<FormItem><FormLabel>Silver Tier</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="goldPoints" render={({ field }) => (<FormItem><FormLabel>Gold Tier</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <h3 className="text-lg font-medium flex items-center gap-2"><Gift className="h-5 w-5" /> Action Points</h3>
                        <p className="text-sm text-muted-foreground mt-1">Set how many points are awarded for specific member actions.</p>
                        
                         <div className="mt-6 space-y-6">
                            <div>
                                <h4 className="font-semibold text-base mb-3 flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-muted-foreground"/>Vendors</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {renderPointsField('shopCreationPoints', 'Points Per Shop Creation', Store)}
                                    {renderPointsField('productAddPoints', 'Points Per Product', Package)}
                                    {renderPointsField('supplierContributionPoints', 'Points Per Supplier', Building)}
                                    {renderPointsField('debtorContributionPoints', 'Points Per Debtor', Users)}
                                </div>
                            </div>
                             <div>
                                <h4 className="font-semibold text-base mb-3 flex items-center gap-2"><Truck className="h-5 w-5 text-muted-foreground"/>Transporters (Buyers)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                     {renderPointsField('truckContributionPoints', 'Points Per Truck', Truck)}
                                     {renderPointsField('trailerContributionPoints', 'Points Per Trailer', Warehouse)}
                                     {renderPointsField('loadBoardCreationPoints', 'Points Per Load Board Creation', Truck)}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-base mb-3 flex items-center gap-2"><Handshake className="h-5 w-5 text-muted-foreground"/>Partners & Referrals</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {renderPointsField('partnerReferralPoints', 'Points Per Member Referral', UserPlus)}
                                    {renderPointsField('isaSaleCommissionPoints', 'Points for ISA Sale', Bot)}
                                </div>
                            </div>
                             <div>
                                <h4 className="font-semibold text-base mb-3 flex items-center gap-2"><Briefcase className="h-5 w-5 text-muted-foreground"/>Associates</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {renderPointsField('associateServiceListingPoints', 'Points Per Service Listing', Package)}
                                </div>
                            </div>
                            
                             <div>
                                <h4 className="font-semibold text-base mb-3 flex items-center gap-2"><Users className="h-5 w-5 text-muted-foreground"/>Drivers</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {renderPointsField('driverSafetyRecordPoints', 'Points Per Safety Record', ShieldCheck)}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-base mb-3 flex items-center gap-2"><Code className="h-5 w-5 text-muted-foreground"/>Developers</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {renderPointsField('developerApiIntegrationPoints', 'Points Per API Integration', Code)}
                                </div>
                            </div>

                            <Separator />

                            <h4 className="font-semibold text-base mb-3 pt-4">General Platform & AI Actions</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {renderPointsField('userSignupPoints', 'Points Per Sign-up', UserPlus)}
                                {renderPointsField('seoBoosterPoints', 'Points Per AI SEO Use', Search)}
                                {renderPointsField('aiImageGeneratorPoints', 'Points Per AI Image', Sparkles)}
                                {renderPointsField('imageEnhancerPoints', 'Points Per Image Enhance', Edit)}
                                {renderPointsField('aiVideoGeneratorPoints', 'Points Per AI Video', Video)}
                            </div>
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
