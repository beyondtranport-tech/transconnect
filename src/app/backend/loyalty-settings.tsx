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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2, Save, Star, UserPlus, Store, Package, Sparkles, Edit, Video, Search, Truck, Building, Users, Handshake, Briefcase, Bot, Code, ShieldCheck, Warehouse } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getClientSideAuthToken } from '@/firebase';
import { useConfig } from '@/hooks/use-config';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import React from 'react';


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

const actionGroups = [
    {
        groupTitle: 'General Platform Actions',
        actions: [
            { id: 'userSignupPoints', label: 'Sign up for an account', icon: UserPlus },
            { id: 'shopCreationPoints', label: 'Create a Vendor Shop', icon: Store },
            { id: 'productAddPoints', label: 'Add a Product to Shop', icon: Package },
            { id: 'loadBoardCreationPoints', label: 'Create a Load Board', icon: Truck },
        ]
    },
    {
        groupTitle: 'AI Marketing & Content Studio',
        actions: [
            { id: 'seoBoosterPoints', label: 'Use AI SEO Booster', icon: Search },
            { id: 'aiImageGeneratorPoints', label: 'Use AI Image Generator', icon: Sparkles },
            { id: 'imageEnhancerPoints', label: 'Use AI Image Enhancer', icon: Edit },
            { id: 'aiVideoGeneratorPoints', label: 'Use AI Video Generator', icon: Video },
        ]
    },
    {
        groupTitle: 'Data Contributions',
        actions: [
            { id: 'truckContributionPoints', label: 'Contribute Truck Data', icon: Truck },
            { id: 'trailerContributionPoints', label: 'Contribute Trailer Data', icon: Warehouse },
            { id: 'supplierContributionPoints', label: 'Contribute Supplier Data', icon: Building },
            { id: 'debtorContributionPoints', label: 'Contribute Debtor Data', icon: Users },
        ]
    },
    {
        groupTitle: 'Partner & Network Actions',
        actions: [
            { id: 'partnerReferralPoints', label: 'Refer a New Member', icon: Handshake },
            { id: 'associateServiceListingPoints', label: 'Associate Lists a Service', icon: Briefcase },
            { id: 'isaSaleCommissionPoints', label: 'ISA Completes a Sale', icon: Bot },
            { id: 'driverSafetyRecordPoints', label: 'Driver Uploads Safety Record', icon: ShieldCheck },
            { id: 'developerApiIntegrationPoints', label: 'Developer Completes API Integration', icon: Code },
        ]
    }
];


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

  return (
    <Card className="w-full max-w-4xl">
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
                     <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-2/3">Action</TableHead>
                                    <TableHead className="w-1/3 text-right">Points Awarded</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {actionGroups.map((group) => (
                                    <React.Fragment key={group.groupTitle}>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableCell colSpan={2} className="font-semibold text-primary">{group.groupTitle}</TableCell>
                                        </TableRow>
                                        {group.actions.map(action => {
                                            const Icon = action.icon;
                                            return (
                                                <TableRow key={action.id}>
                                                    <TableCell>
                                                        <FormLabel htmlFor={action.id} className="flex items-center gap-3 font-normal">
                                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                                            {action.label}
                                                        </FormLabel>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                         <FormField
                                                            control={form.control}
                                                            name={action.id as keyof ActionPlanSettingsFormValues}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input id={action.id} type="number" className="w-24 text-right ml-auto" {...field} />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
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
