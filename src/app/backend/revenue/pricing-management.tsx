
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Save, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Label } from '@/components/ui/label';

const planSchema = z.object({
  id: z.string().min(1, 'ID is required (e.g., "basic")'),
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.object({
    monthly: z.coerce.number().min(0, 'Price must be 0 or more'),
    annual: z.coerce.number().min(0, 'Price must be 0 or more'),
  }),
  annualDiscount: z.coerce.number().min(0).optional(),
  sessionDiscount: z.coerce.number().min(0).optional(),
  features: z.array(z.string()).min(1, 'At least one feature is required'),
  isPopular: z.boolean().default(false),
});

type PlanFormValues = z.infer<typeof planSchema>;

function PlanDialog({ plan, onSave }: { plan?: PlanFormValues; onSave: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: plan || {
      id: '',
      name: '',
      description: '',
      price: { monthly: 0, annual: 0 },
      annualDiscount: 0,
      sessionDiscount: 0,
      features: [''],
      isPopular: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'features',
  });

  const onSubmit = async (values: PlanFormValues) => {
    setIsLoading(true);
    if (!firestore) return;

    try {
      const planRef = doc(firestore, 'memberships', values.id);
      await writeBatch(firestore)
        .set(planRef, { ...values, updatedAt: serverTimestamp() }, { merge: true })
        .commit();
      
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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit' : 'Add New'} Membership Plan</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="id" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Plan ID</FormLabel><FormControl><Input {...field} disabled={!!plan} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="name" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Plan Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField name="price.monthly" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Monthly Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="price.annual" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Annual Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <FormField name="annualDiscount" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Annual Discount (%)</FormLabel><FormControl><Input type="number" placeholder="e.g., 15" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="sessionDiscount" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Session Discount (%)</FormLabel><FormControl><Input type="number" placeholder="e.g., 10" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            <div>
              <Label>Features</Label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2 mt-2">
                  <Input {...form.register(`features.${index}` as const)} />
                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => append('')}>Add Feature</Button>
            </div>
            <DialogFooter>
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
     if (!firestore) return;

    try {
      const planRef = doc(firestore, 'memberships', planId);
      await writeBatch(firestore).delete(planRef).commit();
      
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
            <CardTitle>Membership Pricing</CardTitle>
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
                  <TableHead>Annual Price</TableHead>
                  <TableHead>Annual Discount</TableHead>
                  <TableHead>Session Discount</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans && plans.map(plan => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-semibold">{plan.name}</TableCell>
                    <TableCell>R {plan.price.monthly}</TableCell>
                    <TableCell>R {plan.price.annual}</TableCell>
                    <TableCell>{plan.annualDiscount || 0}%</TableCell>
                    <TableCell>{plan.sessionDiscount || 0}%</TableCell>
                    <TableCell>{plan.features.length}</TableCell>
                    <TableCell className="text-right">
                        <PlanDialog plan={plan} onSave={forceRefresh} />
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

    