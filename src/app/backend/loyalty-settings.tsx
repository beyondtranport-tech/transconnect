
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
import { Loader2, Save, Star, Gift, UserPlus, Store, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  bronze: z.coerce.number().min(0, 'Points must be 0 or more.'),
  silver: z.coerce.number().min(0, 'Points must be 0 or more.'),
  gold: z.coerce.number().min(0, 'Points must be 0 or more.'),
  
  // Action Points
  contributionPoints: z.coerce.number().min(0, 'Points must be 0 or more.'),
  userSignupPoints: z.coerce.number().min(0, 'Points must be 0 or more.'),
  shopCreationPoints: z.coerce.number().min(0, 'Points must be 0 or more.'),
  productAddPoints: z.coerce.number().min(0, 'Points must be 0 or more.'),

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
      contributionPoints: 10,
      userSignupPoints: 50,
      shopCreationPoints: 100,
      productAddPoints: 5,
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
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            <FormField control={form.control} name="userSignupPoints" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><UserPlus className="mr-2 h-4 w-4"/>User Sign-up</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="shopCreationPoints" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Store className="mr-2 h-4 w-4"/>Shop Creation</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="productAddPoints" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Package className="mr-2 h-4 w-4"/>Product Added</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="contributionPoints" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Gift className="mr-2 h-4 w-4"/>Data Contribution</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                         </div>
                    </div>

                    <Button type="submit" disabled={isSaving} className="mt-4">
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
