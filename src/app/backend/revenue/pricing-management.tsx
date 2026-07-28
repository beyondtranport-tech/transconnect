'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Save, Edit, Trash2, Layers, Zap, Info, Package, Truck, ShoppingCart, Landmark } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, getClientSideAuthToken, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatCurrency } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const defaultPlans = [
    {
        id: 'basic',
        name: 'Basic Membership',
        price: 100,
        description: 'Establish forensic visibility in the industrial grid.',
        intelligenceQueries: 100,
        shopProducts: 5,
        loadsLimit: 2,
        vehiclesLimit: 1,
        financeApplications: 2,
        isPopular: false
    },
    {
        id: 'standard',
        name: 'Standard Membership',
        price: 500,
        description: 'The core commerce engine for active industrial trading.',
        intelligenceQueries: 1000,
        shopProducts: 50,
        loadsLimit: 20,
        vehiclesLimit: 5,
        financeApplications: 10,
        isPopular: true
    },
    {
        id: 'premium',
        name: 'Premium Membership',
        price: 1000,
        description: 'Maximum dominance with unlimited industrial power.',
        intelligenceQueries: 999999,
        shopProducts: 999999,
        loadsLimit: 999999,
        vehiclesLimit: 999999,
        financeApplications: 999999,
        isPopular: false
    }
];

const planSchema = z.object({
  id: z.string().min(1, 'ID is required (e.g., "basic")'),
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  intelligenceQueries: z.coerce.number().min(0),
  shopProducts: z.coerce.number().min(0),
  loadsLimit: z.coerce.number().min(0),
  vehiclesLimit: z.coerce.number().min(0),
  financeApplications: z.coerce.number().min(0),
  isPopular: z.boolean().default(false),
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
        form.reset({
            id: plan?.id || '',
            name: plan?.name || '',
            description: plan?.description || '',
            price: plan?.price || 0,
            intelligenceQueries: plan?.intelligenceQueries || 0,
            shopProducts: plan?.shopProducts || 0,
            loadsLimit: plan?.loadsLimit || 0,
            vehiclesLimit: plan?.vehiclesLimit || 0,
            financeApplications: plan?.financeApplications || 0,
            isPopular: plan?.isPopular || false,
        });
    }
  }, [isOpen, plan, form]);

  const onSubmit = async (values: PlanFormValues) => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");
      
      const planId = values.id.trim();
      const dataToSave = { ...values, id: planId, updatedAt: { _methodName: 'serverTimestamp' } };

      const response = await fetch('/api/updateConfigDoc', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `memberships/${planId}`,
          data: dataToSave
        }),
      });

      if (!response.ok) throw new Error("Failed to save plan.");
      
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
          <Button className="gap-2"><PlusCircle className="h-4 w-4" /> Add Plan</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 text-left text-foreground">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{plan ? 'Edit' : 'Add New'} Membership Tier</DialogTitle>
          <DialogDescription>Define the core commercial limits for this tier.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <FormField name="id" control={form.control} render={({ field }) => (
                    <FormItem className="text-left">
                        <FormLabel>Plan ID (Lowercase)</FormLabel>
                        <FormControl><Input {...field} disabled={!!plan} placeholder="e.g. basic" /></FormControl>
                    </FormItem>
                )} />
                 <FormField name="name" control={form.control} render={({ field }) => (
                    <FormItem className="text-left">
                        <FormLabel>Public Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <FormField name="price" control={form.control} render={({ field }) => (
                    <FormItem className="text-left">
                        <FormLabel>Monthly Price (R)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                    </FormItem>
                )} />
                <FormField name="isPopular" control={form.control} render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 pt-8 text-left">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="cursor-pointer">Mark as Popular</FormLabel>
                    </FormItem>
                )} />
            </div>

            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem className="text-left">
                  <FormLabel>Pitch Description</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
              </FormItem>
            )} />

            <Separator />
            <h4 className="text-xs font-black uppercase tracking-widest text-primary text-left">Outcome Metrics (Limits)</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-left">
                <FormField name="intelligenceQueries" control={form.control} render={({ field }) => (
                    <FormItem className="text-left"><FormLabel className="text-[10px] uppercase font-bold">Intel Queries</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
                <FormField name="shopProducts" control={form.control} render={({ field }) => (
                    <FormItem className="text-left"><FormLabel className="text-[10px] uppercase font-bold">Shop Products</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
                <FormField name="loadsLimit" control={form.control} render={({ field }) => (
                    <FormItem className="text-left"><FormLabel className="text-[10px] uppercase font-bold">Max Loads</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
                <FormField name="vehiclesLimit" control={form.control} render={({ field }) => (
                    <FormItem className="text-left"><FormLabel className="text-[10px] uppercase font-bold">Max Vehicles</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
                <FormField name="financeApplications" control={form.control} render={({ field }) => (
                    <FormItem className="text-left"><FormLabel className="text-[10px] uppercase font-bold">Max Finance Apps</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
            </div>
          </form>
        </Form>
        <DialogFooter className="p-6 pt-2 border-t text-left">
          <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isLoading} className="w-full font-bold">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Tier Logic
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PricingManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const membershipsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'memberships'));
  }, [firestore]);
  
  const { data: plans, isLoading, forceRefresh } = useCollection(membershipsQuery);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Auth failed.");

        for (const plan of defaultPlans) {
            const planId = plan.id.trim();
            await fetch('/api/updateConfigDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: `memberships/${planId}`,
                    data: { ...plan, id: planId, updatedAt: { _methodName: 'serverTimestamp' } }
                }),
            });
        }
        toast({ title: "Core Tiers Seeded", description: "Basic, Standard, and Premium tiers are now active." });
        forceRefresh();
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Seeding Failed", description: e.message });
    } finally {
        setIsSeeding(false);
    }
  };

  const handleDelete = async (planId: string) => {
    setIsDeleting(planId);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");

        // Use the exact document ID for the path
        const response = await fetch('/api/deleteConfigDoc', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: `memberships/${planId}` }),
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || "Deletion failed.");
        }

        toast({ title: "Plan Deleted", description: "The membership tier has been removed from the ledger." });
        forceRefresh();
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Delete Failed", description: e.message });
    } finally {
        setIsDeleting(null);
    }
  };

  const sortedPlans = useMemo(() => {
    if (!plans) return [];
    return [...plans].sort((a,b) => a.price - b.price);
  }, [plans]);

  return (
    <div className="space-y-6 text-left text-foreground">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div className="text-left">
            <CardTitle className="text-2xl font-black font-headline flex items-center gap-2 text-left text-foreground text-foreground"><Layers className="text-primary"/> Membership Tier Ledger</CardTitle>
            <CardDescription className="text-left">Manage the outcome-based pricing for the 3 core industrial tiers.</CardDescription>
        </div>
        <div className="flex gap-2 text-left text-foreground">
            <Button variant="outline" onClick={handleSeed} disabled={isSeeding || isLoading} className="gap-2 text-left text-foreground">
                {isSeeding ? <Loader2 className="h-4 w-4 animate-spin"/> : <Zap className="h-4 w-4 text-primary" />}
                Reset to Core Model
            </Button>
            <PlanDialog onSave={forceRefresh} />
        </div>
      </div>

      <Card className="text-left text-foreground">
        <CardContent className="pt-6 text-left">
            {isLoading ? (
            <div className="flex justify-center p-20 text-left"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : (
            <div className="border rounded-xl overflow-hidden text-left">
                <Table className="text-left">
                <TableHeader className="bg-slate-50 text-left">
                    <TableRow className="text-left">
                    <TableHead className="font-bold text-[10px] uppercase text-left">Plan</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase text-left">Price</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase text-left">Intel</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase text-left">Shop</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase text-left">Finance</TableHead>
                    <TableHead className="text-right font-bold text-[10px] uppercase text-left">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="text-left">
                    {sortedPlans.map((plan: any) => (
                        <TableRow key={plan.id} className="text-left">
                            <TableCell className="font-black py-4 text-left capitalize">{plan.name}</TableCell>
                            <TableCell className="font-mono font-bold text-primary text-left">{formatCurrency(plan.price)}</TableCell>
                            <TableCell className="text-xs text-left">{plan.intelligenceQueries === 999999 ? 'Unlimited' : plan.intelligenceQueries}</TableCell>
                            <TableCell className="text-xs text-left">{plan.shopProducts === 999999 ? 'Unlimited' : plan.shopProducts}</TableCell>
                            <TableCell className="text-xs text-left">{plan.financeApplications === 999999 ? 'Unlimited' : plan.financeApplications}</TableCell>
                            <TableCell className="text-right text-left flex justify-end gap-1">
                                <PlanDialog plan={plan} onSave={forceRefresh} />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" disabled={isDeleting === plan.id}>
                                            {isDeleting === plan.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 text-destructive" />}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="text-left">
                                        <AlertDialogHeader className="text-left">
                                            <AlertDialogTitle className="text-left">Delete Membership Plan?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-left text-foreground">
                                                This will remove "{plan.name}" from the commercial registry. Existing subscribers will not be affected, but new signups will no longer see this tier.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="text-left">
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={() => handleDelete(plan.id)}
                                                className={cn(buttonVariants({ variant: 'destructive' }), "font-bold")}
                                            >
                                                Delete Plan
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))}
                    {sortedPlans.length === 0 && (
                        <TableRow className="text-left text-foreground"><TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic text-left">No plans defined. Click "Reset to Core Model" above.</TableCell></TableRow>
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
