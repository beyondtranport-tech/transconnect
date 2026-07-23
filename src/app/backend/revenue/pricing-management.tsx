
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Save, Edit, Trash2, Layers } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, getClientSideAuthToken, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import featuresData from '@/lib/features.json';

const { featureSections } = featuresData;

const planSchema = z.object({
  id: z.string().min(1, 'ID is required (e.g., "basic")'),
  name: z.string().min(1, 'Plan name is required'),
  type: z.enum(['foundation', 'earning']).default('foundation'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  annualDiscount: z.coerce.number().min(0, "Must be between 0-100").optional(),
  features: z.array(z.string()).min(1, 'At least one feature is required'),
  isPopular: z.boolean().default(false),
  version: z.coerce.number().min(1).optional(),
});

type PlanFormValues = z.infer<typeof planSchema>;

function PlanDialog({ plan, onSave }: { plan?: any; onSave: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
  });
  
  useEffect(() => {
    if (isOpen) {
        const monthlyPrice = (typeof plan?.price === 'object' && plan?.price !== null)
            ? plan.price.monthly || 0
            : plan?.price || 0;

        form.reset({
            id: plan?.id || '',
            name: plan?.name || '',
            type: plan?.type || 'foundation',
            description: plan?.description || '',
            price: monthlyPrice,
            annualDiscount: plan?.annualDiscount ?? 0,
            features: plan?.features || [],
            isPopular: plan?.isPopular || false,
            version: plan?.version || 1,
        });
    }
  }, [isOpen, plan, form]);

  const onSubmit = async (values: PlanFormValues) => {
    setIsLoading(true);

    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");
      
      const dataToSave = { ...values, version: (plan?.version || 0) + 1, updatedAt: { _methodName: 'serverTimestamp' } };

      const response = await fetch('/api/updateConfigDoc', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `memberships/${values.id}`,
          data: dataToSave
        }),
      });

      if (!response.ok) throw new Error((await response.json()).error || 'Failed to save plan.');
      
      toast({ title: 'Plan Saved!', description: `${values.name} is now live.` });
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
          <Button className="gap-2"><PlusCircle className="h-4 w-4" /> Add New Plan</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl text-left text-foreground">
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit' : 'Add New'} Membership Plan</DialogTitle>
          <DialogDescription>Define the pricing, category, and features for this industrial node.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[75vh] overflow-y-auto pr-4 text-left">
            <div className="grid grid-cols-2 gap-4">
                <FormField name="id" control={form.control} render={({ field }) => (
                    <FormItem className="text-left"><FormLabel>Plan ID (Lowercase)</FormLabel><FormControl><Input {...field} disabled={!!plan} placeholder="e.g. intelligence" className="font-mono"/></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="type" control={form.control} render={({ field }) => (
                    <FormItem className="text-left">
                        <FormLabel>Plan Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="foundation">Foundation (Registry Access)</SelectItem>
                                <SelectItem value="earning">Earning Node (Commercial Tools)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
            
            <FormField name="name" control={form.control} render={({ field }) => (
              <FormItem className="text-left"><FormLabel>Public Plan Name</FormLabel><FormControl><Input {...field} placeholder="e.g. Intelligence Access" /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
                <FormField name="price" control={form.control} render={({ field }) => (
                    <FormItem className="text-left"><FormLabel>Monthly Price (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="annualDiscount" control={form.control} render={({ field }) => (
                    <FormItem className="text-left"><FormLabel>Annual Discount (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>

            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem className="text-left"><FormLabel>Brief Pitch</FormLabel><FormControl><Textarea {...field} placeholder="Visible on the pricing card..." /></FormControl><FormMessage /></FormItem>
            )} />

            <Separator />

             <FormField
                control={form.control}
                name="features"
                render={() => (
                    <FormItem className="text-left">
                        <FormLabel className="text-base font-black uppercase tracking-tight">Feature Matrix</FormLabel>
                        <div className="space-y-6 mt-4">
                            {featureSections.map((section) => (
                                <div key={section.name} className="space-y-3">
                                    <h4 className="font-bold text-xs uppercase text-primary border-l-2 border-primary pl-2">{section.name}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                                    {section.features.map((feature) => (
                                        <FormField
                                            key={feature.key}
                                            control={form.control}
                                            name="features"
                                            render={({ field }) => (
                                                <FormItem key={feature.key} className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(feature.key)}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), feature.key])
                                                                    : field.onChange(field.value?.filter((value) => value !== feature.key));
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal text-xs cursor-pointer">{feature.name}</FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </FormItem>
                )}
                />

            <DialogFooter className="pt-6 border-t">
              <Button type="submit" disabled={isLoading} className="w-full h-12 font-bold uppercase shadow-lg">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Plan Configuration
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
  
  const { data: plans, isLoading, forceRefresh } = useCollection(membershipsQuery);

  const handleDelete = async (planId: string) => {
    if (planId === 'free' || planId === 'intelligence') {
        toast({ variant: 'destructive', title: 'System Constraint', description: 'Core plans cannot be deleted.' });
        return;
    }
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Auth failed.");
      await fetch('/api/deleteConfigDoc', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `memberships/${planId}` }),
      });
      toast({ title: 'Plan Removed' });
      forceRefresh();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div className="text-left">
            <CardTitle className="text-2xl font-black font-headline flex items-center gap-2 text-left"><Layers className="h-6 w-6 text-primary"/> Membership & Node Ledger</CardTitle>
            <CardDescription className="text-left">Manage the modular building blocks of the industrial grid.</CardDescription>
        </div>
        <PlanDialog onSave={forceRefresh} />
      </div>

      <Card className="text-left">
        <CardContent className="pt-6 text-left">
            {isLoading ? (
            <div className="flex justify-center items-center py-20 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>
            ) : (
            <div className="border rounded-xl overflow-hidden text-left">
                <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                    <TableHead className="font-bold text-[10px] uppercase">Plan / Category</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase">Monthly Price</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase">Features</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase">Status</TableHead>
                    <TableHead className="text-right font-bold text-[10px] uppercase">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {plans && plans.map((plan: any) => (
                        <TableRow key={plan.id} className="hover:bg-slate-50/50">
                            <TableCell className="py-4">
                                <div className="flex flex-col text-left">
                                    <span className="font-black text-foreground">{plan.name}</span>
                                    <Badge variant="outline" className="w-fit text-[8px] h-3.5 mt-1 uppercase border-primary/20 text-primary">
                                        {plan.type || 'Foundation'}
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell className="font-mono font-bold text-primary">
                                {formatCurrency(typeof plan.price === 'number' ? plan.price : (plan.price?.monthly || 0))}
                            </TableCell>
                            <TableCell>
                                <span className="text-xs font-medium">{plan.features?.length || 0} enabled</span>
                            </TableCell>
                            <TableCell>
                                {plan.isPopular && <Badge className="bg-amber-100 text-amber-800 border-none text-[8px] h-4 font-black uppercase">Popular</Badge>}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <PlanDialog plan={plan} onSave={forceRefresh} />
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)} disabled={plan.id === 'free' || plan.id === 'intelligence'}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {(!plans || plans.length === 0) && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">No plans defined in registry. Add a new plan above.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
