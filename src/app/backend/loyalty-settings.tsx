
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
import { Loader2, Save, Star, Gift, UserPlus, Store, Package, Sparkles, Edit, Video, Search, Truck, Building, Users, Handshake, Briefcase, Bot, Code, ShoppingCart, ShieldCheck, Warehouse } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  bronze: z.coerce.number().min(0, 'Points must be 0 or more.'),
  silver: z.coerce.number().min(0, 'Points must be 0 or more.'),
  gold: z.coerce.number().min(0, 'Points must be 0 or more.'),
  
  // Platform Actions
  userSignupPoints: z.coerce.number().min(0, 'Points must be 0 or more.'),
  
  // AI Tool Actions
  seoBoosterPoints: z.coerce.number().min(0, 'Points must be 0 or more.'),
  aiImageGeneratorPoints: z.coerce.number().min(0, 'Points must be 0 or more.'),
  imageEnhancerPoints: z.coerce.number().min(0, 'Points must be 0 or more.'),
  aiVideoGeneratorPoints: z.coerce.number().min(0, 'Points must be 0 or more.'),

  // Role-based Data Contribution Actions
  vendorShopCreationPoints: z.coerce.number().min(0),
  vendorProductAddPoints: z.coerce.number().min(0),
  vendorSupplierContributionPoints: z.coerce.number().min(0),
  vendorDebtorContributionPoints: z.coerce.number().min(0),
  
  buyerTruckContributionPoints: z.coerce.number().min(0),
  buyerTrailerContributionPoints: z.coerce.number().min(0),
  buyerDebtorContributionPoints: z.coerce.number().min(0),

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
  const { data: loyaltyConfig, isLoading: isConfigLoading } = useDoc<LoyaltySettingsFormValues>(configRef);

  const form = useForm<LoyaltySettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bronze: 0,
      silver: 1000,
      gold: 5000,
      userSignupPoints: 50,
      seoBoosterPoints: 15,
      aiImageGeneratorPoints: 2,
      imageEnhancerPoints: 1,
      aiVideoGeneratorPoints: 20,
      vendorShopCreationPoints: 100,
      vendorProductAddPoints: 5,
      vendorSupplierContributionPoints: 15,
      vendorDebtorContributionPoints: 20,
      buyerTruckContributionPoints: 10,
      buyerTrailerContributionPoints: 10,
      buyerDebtorContributionPoints: 20,
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
      await setDoc(configRef, { ...values, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: 'Loyalty Settings Saved!', description: 'The loyalty tiers and action points have been updated.' });
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
    <Card className="w-full max-w-4xl">
        <CardHeader>
            <div className="flex items-center gap-4">
                <Star className="h-8 w-8 text-primary"/>
                <div>
                    <CardTitle>Loyalty & Points Settings</CardTitle>
                    <CardDescription>
                        Define point thresholds for loyalty tiers and points awarded for member actions.
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
                        <h3 className="text-lg font-medium flex items-center gap-2"><Star className="h-5 w-5" /> Loyalty Tier Thresholds</h3>
                        <p className="text-sm text-muted-foreground mt-1">Set the minimum points needed to enter each tier.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <FormField control={form.control} name="bronze" render={({ field }) => (<FormItem><FormLabel>Bronze Tier</FormLabel><FormControl><Input type="number" {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="silver" render={({ field }) => (<FormItem><FormLabel>Silver Tier</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="gold" render={({ field }) => (<FormItem><FormLabel>Gold Tier</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
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
                                    {renderPointsField('vendorShopCreationPoints', 'Shop Creation', Store)}
                                    {renderPointsField('vendorProductAddPoints', 'Product Add', Package)}
                                    {renderPointsField('vendorSupplierContributionPoints', 'Supplier Data', Building)}
                                    {renderPointsField('vendorDebtorContributionPoints', 'Debtor Data', Users)}
                                </div>
                            </div>
                             <div>
                                <h4 className="font-semibold text-base mb-3 flex items-center gap-2"><Truck className="h-5 w-5 text-muted-foreground"/>Buyers / Transporters</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                     {renderPointsField('buyerTruckContributionPoints', 'Truck Data', Truck)}
                                     {renderPointsField('buyerTrailerContributionPoints', 'Trailer Data', Warehouse)}
                                     {renderPointsField('buyerDebtorContributionPoints', 'Debtor Data', Users)}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-base mb-3 flex items-center gap-2"><Handshake className="h-5 w-5 text-muted-foreground"/>Partners</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {renderPointsField('partnerReferralPoints', 'Referral', UserPlus)}
                                </div>
                            </div>
                             <div>
                                <h4 className="font-semibold text-base mb-3 flex items-center gap-2"><Briefcase className="h-5 w-5 text-muted-foreground"/>Associates</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {renderPointsField('associateServiceListingPoints', 'Service Listing', Package)}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-base mb-3 flex items-center gap-2"><Bot className="h-5 w-5 text-muted-foreground"/>ISA Agents</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {renderPointsField('isaSaleCommissionPoints', 'Sale Made', Star)}
                                </div>
                            </div>
                             <div>
                                <h4 className="font-semibold text-base mb-3 flex items-center gap-2"><Users className="h-5 w-5 text-muted-foreground"/>Drivers</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {renderPointsField('driverSafetyRecordPoints', 'Safety Record Upload', ShieldCheck)}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-base mb-3 flex items-center gap-2"><Code className="h-5 w-5 text-muted-foreground"/>Developers</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {renderPointsField('developerApiIntegrationPoints', 'API Integration', Code)}
                                </div>
                            </div>

                            <Separator />

                            <h4 className="font-semibold text-base mb-3 pt-4">General Actions</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {renderPointsField('userSignupPoints', 'User Sign-up', UserPlus)}
                                {renderPointsField('seoBoosterPoints', 'AI SEO Booster Use', Search)}
                                {renderPointsField('aiImageGeneratorPoints', 'AI Designer Use', Sparkles)}
                                {renderPointsField('imageEnhancerPoints', 'Image Enhancer Use', Edit)}
                                {renderPointsField('aiVideoGeneratorPoints', 'AI Video Ad Use', Video)}
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

