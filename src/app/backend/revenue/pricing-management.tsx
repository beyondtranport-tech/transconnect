
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Save, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, getClientSideAuthToken, useMemoFirebase } from '@/firebase';
import { collection, query, doc, deleteDoc } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import featuresData from '@/lib/features.json';

const { featureSections } = featuresData;

const planSchema = z.object({
  id: z.string().min(1, 'ID is required (e.g., "basic")'),
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.object({
    monthly: z.coerce.number().min(0, 'Price must be 0 or more'),
    annual: z.coerce.number().min(0, 'Price must be 0 or more').optional(),
  }),
  annualDiscount: z.coerce.number().min(0).max(100, "Must be between 0-100").optional(),
  specialOfferDiscount: z.coerce.number().min(0).max(100, "Must be between 0-100").optional(),
  features: z.array(z.string()).min(1, 'At least one feature is required'),
  isPopular: z.boolean().default(false),
  version: z.coerce.number().min(1).optional(),
});


type PlanFormValues = z.infer<typeof planSchema>;

function PlanDialog({ plan, onSave }: { plan?: PlanFormValues; onSave: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
  });
  
  useEffect(() => {
    if (isOpen) {
        const defaultValues = {
            id: '',
            name: '',
            description: '',
            price: { monthly: 0, annual: 0 },
            annualDiscount: 0,
            specialOfferDiscount: 0,
            features: [],
            isPopular: false,
            version: 1,
        };
        form.reset({
            ...defaultValues,
            ...(plan || {}),
             price: {
                monthly: plan?.price?.monthly || 0,
                annual: plan?.price?.annual || 0,
            },
        });
    }
  }, [isOpen, plan, form]);

  const onSubmit = async (values: PlanFormValues) => {
    setIsLoading(true);

    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");
      
      const dataToSave: Partial<PlanFormValues> & { version: number } = { ...values, version: 1 };
      if (plan) {
        dataToSave.version = (plan.version || 1) + 1;
      }

      const response = await fetch('/api/updateConfigDoc', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `memberships/${values.id}`,
          data: { ...dataToSave, updatedAt: { _methodName: 'serverTimestamp' } }
        }),
      });

      if (!response.ok) throw new Error((await response.json()).error || 'Failed to save plan.');
      
      toast({ title: 'Plan Saved!', description: `${values.name} has been saved.` });
      onSave();
      setIsOpen(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {plan ? (
          <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
        ) : (
          <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Plan</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit' : 'Add New'} Membership Plan</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto pr-4">
            <FormField name="id" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Plan ID</FormLabel><FormControl><Input {...field} disabled={!!plan} placeholder="e.g. basic"/></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="name" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Plan Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="price.monthly" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Monthly Price (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
             <div className="grid grid-cols-2 gap-4">
                <FormField name="annualDiscount" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Annual Discount (%)</FormLabel><FormControl><Input type="number" placeholder="e.g., 15" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="specialOfferDiscount" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Special Offer Discount (%)</FormLabel><FormControl><Input type="number" placeholder="e.g., 10" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            
            <Separator />

             <FormField
                control={form.control}
                name="features"
                render={() => (
                    <FormItem>
                    <div className="mb-4">
                        <FormLabel className="text-base">Features</FormLabel>
                        <FormDescription>
                        Select the features to be included in this plan.
                        </FormDescription>
                    </div>
                    <div className="space-y-4">
                        {featureSections.map((section) => (
                            <div key={section.name}>
                                <h4 className="font-semibold text-muted-foreground">{section.name}</h4>
                                <div className="space-y-2 mt-2 pl-2">
                                {section.features.map((feature) => (
                                    <FormField
                                    key={feature.key}
                                    control={form.control}
                                    name="features"
                                    render={({ field }) => {
                                        return (
                                        <FormItem
                                            key={feature.key}
                                            className="flex flex-row items-center space-x-3 space-y-0"
                                        >
                                            <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(feature.key)}
                                                onCheckedChange={(checked) => {
                                                return checked
                                                    ? field.onChange([
                                                        ...(field.value || []),
                                                        feature.key,
                                                    ])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                        (value) =>
                                                            value !== feature.key
                                                        )
                                                    );
                                                }}
                                            />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                            {feature.name}
                                            </FormLabel>
                                        </FormItem>
                                        );
                                    }}
                                    />
                                ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />

            <FormField
                control={form.control}
                name="isPopular"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>Mark as Popular</FormLabel>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Plan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function PricingManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const membershipsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'memberships'));
  }, [firestore]);
  
  const { data: plans, isLoading, forceRefresh } = useCollection<PlanFormValues>(membershipsQuery);

  const handleDelete = async (planId: string) => {
     if (!firestore || planId === 'free') {
         toast({ variant: 'destructive', title: 'Cannot Delete', description: 'The free plan cannot be deleted.' });
         return;
     }

    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");

      await fetch('/api/deleteConfigDoc', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `memberships/${planId}` }),
      });
      
      toast({ title: 'Plan Deleted', description: 'The membership plan has been removed.' });
      forceRefresh();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Membership Plans</CardTitle>
            <CardDescription>Manage the membership tiers, pricing, and features available to users.</CardDescription>
        </div>
        <PlanDialog onSave={forceRefresh} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Monthly Price</TableHead>
                  <TableHead>Annual Discount</TableHead>
                  <TableHead>Special Offer</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans && plans.map(plan => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-semibold">{plan.name}</TableCell>
                    <TableCell>R {plan.price.monthly}</TableCell>
                    <TableCell>{plan.annualDiscount || 0}%</TableCell>
                    <TableCell>{plan.specialOfferDiscount || 0}%</TableCell>
                    <TableCell>{plan.features.length}</TableCell>
                    <TableCell>{plan.version || 1}</TableCell>
                    <TableCell className="text-right">
                        <PlanDialog plan={plan} onSave={forceRefresh} />
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)} disabled={plan.id === 'free'}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
