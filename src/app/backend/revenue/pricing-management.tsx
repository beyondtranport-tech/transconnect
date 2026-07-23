'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Save, Edit, Trash2, Layers, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, getClientSideAuthToken, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import featuresData from '@/lib/features.json';
import { formatCurrency } from '@/lib/utils';

const { featureSections } = featuresData;

const defaultPlans = [
    {
        id: 'free',
        name: 'Free Observer',
        price: 0,
        type: 'foundation',
        description: 'Basic visibility into the community mall and registry.',
        features: ["1 Search per day", "View up to 10 records", "Basic company names only", "Public Mall access"],
        isPopular: false
    },
    {
        id: 'intelligence',
        name: 'Intelligence Access',
        price: 100,
        type: 'foundation',
        description: 'The foundation for industrial growth. Unlock the map.',
        features: ["Unlimited Registry Search", "Access to 22,000+ Records", "Reveal Direct MD/CEO Contacts", "Publish Your Digital Branch", "Apply for Direct Funding"],
        isPopular: true
    },
    {
        id: 'loads_intelligence',
        name: 'Loads Intelligence',
        price: 75,
        type: 'earning',
        description: 'The Brokerage Node. Access deep freight intelligence and clearing tools.',
        features: ["Unlock Direct Haulier Contacts", "Post Unlimited Loads (Broker)", "Take Matching Loads (Haulier)", "Access Settlement Ledger", "Verified Driver Registry"],
        isPopular: false
    },
    {
        id: 'warehouse_intelligence',
        name: 'Warehouse Intelligence',
        price: 125,
        type: 'earning',
        description: 'The Storage Node. Map community storage capacity and handling fees.',
        features: ["Map Excess Storage Capacity", "Calculate Daily Storage Fees", "Automated Inbound Uplift Fees", "Warehouse Facility Audit Trail", "Community Booking Portal"],
        isPopular: false
    },
    {
        id: 'finance_intelligence',
        name: 'Finance Intelligence',
        price: 150,
        type: 'earning',
        description: 'The Capital Node. Access specialized lender products and institutional criteria.',
        features: ["Detailed Funder Products", "Lending Criteria Disclosure", "Direct Origination Path", "Institutional Match Alerts", "Premium Financial Toolkit"],
        isPopular: false
    },
    {
        id: 'buy_sell_intelligence',
        name: 'Buy & Sell Intelligence',
        price: 150,
        type: 'earning',
        description: 'The Marketplace Node. Secure vehicle trading and automated docs.',
        features: ["Unlimited Vehicle Listings", "Automated Sales Documents", "Verified Escrow Integration", "Handshake Direct Chat", "Asset History Tracking"],
        isPopular: false
    },
    {
        id: 'distribution_intelligence',
        name: 'Distribution Intelligence',
        price: 75,
        type: 'earning',
        description: 'The Spoke Node. Access urban delivery capacity and local spoke mapping.',
        features: ["Map Urban Spoke Networks", "Local Capacity Broadcasts", "Final Mile Handshakes", "Same-Day Delivery Yields", "Regional Hub Verification"],
        isPopular: false
    },
    {
        id: 'transporter_intelligence',
        name: 'Transporter Intelligence',
        price: 100,
        type: 'earning',
        description: 'The Fleet Node. Access granular haulier technicals and RC1 verification.',
        features: ["RC1 Fleet Verification", "Direct Driver Lines", "Service Lane Analytics", "Vetted Capacity Search", "Compliance Registry Access"],
        isPopular: false
    },
    {
        id: 'supplier_intelligence',
        name: 'Supplier Intelligence',
        price: 100,
        type: 'earning',
        description: 'The Product Node. Access detailed catalogs and trade-negotiated pricing.',
        features: ["Detailed Product Catalogs", "Bulk Discount Tiers", "Direct RFQ Handshakes", "Inventory Search", "Supplier Trust Metrics"],
        isPopular: false
    }
];

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
            : Number(plan?.price) || 0;

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
            <div className="grid grid-cols-2 gap-4 text-left">
                <FormField name="id" control={form.control} render={({ field }) => (
                    <FormItem className="text-left"><FormLabel>Plan ID (Lowercase)</FormLabel><FormControl><Input {...field} disabled={!!plan} placeholder="e.g. intelligence" className="font-mono"/></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="type" control={form.control} render={({ field }) => (
                    <FormItem className="text-left text-foreground">
                        <FormLabel>Plan Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-white text-left text-foreground"><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="foundation">Foundation (Registry Access)</SelectItem>
                                <SelectItem value="earning">Earning Node (Mall Intelligence)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
            
            <FormField name="name" control={form.control} render={({ field }) => (
              <FormItem className="text-left text-foreground"><FormLabel>Public Plan Name</FormLabel><FormControl><Input {...field} placeholder="e.g. Intelligence Access" /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4 text-left text-foreground">
                <FormField name="price" control={form.control} render={({ field }) => (
                    <FormItem className="text-left"><FormLabel>Monthly Price (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="annualDiscount" control={form.control} render={({ field }) => (
                    <FormItem className="text-left"><FormLabel>Annual Discount (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>

            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem className="text-left text-foreground"><FormLabel>Brief Pitch</FormLabel><FormControl><Textarea {...field} placeholder="Visible on the pricing card..." /></FormControl><FormMessage /></FormItem>
            )} />

            <Separator />

             <FormField
                control={form.control}
                name="features"
                render={() => (
                    <FormItem className="text-left text-foreground">
                        <FormLabel className="text-base font-black uppercase tracking-tight">Feature Matrix</FormLabel>
                        <div className="space-y-6 mt-4 text-left">
                            {featureSections.map((section) => (
                                <div key={section.name} className="space-y-3 text-left">
                                    <h4 className="font-bold text-xs uppercase text-primary border-l-2 border-primary pl-2 text-left">{section.name}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2 text-left">
                                    {section.features.map((feature) => (
                                        <FormField
                                            key={feature.key}
                                            control={form.control}
                                            name="features"
                                            render={({ field }) => (
                                                <FormItem key={feature.key} className="flex flex-row items-center space-x-3 space-y-0 text-left">
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
                                                    <FormLabel className="font-normal text-xs cursor-pointer text-left">{feature.name}</FormLabel>
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

            <DialogFooter className="pt-6 border-t text-left">
              <Button type="submit" disabled={isLoading} className="w-full h-12 font-bold uppercase shadow-lg text-white">
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
  const [isSeeding, setIsSeeding] = useState(false);

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
            await fetch('/api/updateConfigDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: `memberships/${plan.id}`,
                    data: { ...plan, updatedAt: { _methodName: 'serverTimestamp' } }
                }),
            });
        }
        toast({ title: "Core Plans Seeded", description: "Standard Foundation and Mall Nodes are now live." });
        forceRefresh();
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Seeding Failed", description: e.message });
    } finally {
        setIsSeeding(false);
    }
  };

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
    <div className="space-y-6 text-left text-foreground">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left text-foreground">
        <div className="text-left text-foreground">
            <CardTitle className="flex items-center gap-2 text-2xl font-black font-headline text-left text-foreground"><Layers className="h-6 w-6 text-primary"/> Membership & Node Ledger</CardTitle>
            <CardDescription className="text-left text-foreground">Manage the modular building blocks of the industrial grid intelligence.</CardDescription>
        </div>
        <div className="flex gap-2 text-left">
            <Button variant="outline" onClick={handleSeed} disabled={isSeeding || isLoading} className="gap-2 text-foreground">
                {isSeeding ? <Loader2 className="h-4 w-4 animate-spin"/> : <Zap className="h-4 w-4" />}
                Seed All 9 Nodes
            </Button>
            <PlanDialog onSave={forceRefresh} />
        </div>
      </div>

      <Card className="text-left text-foreground">
        <CardContent className="pt-6 text-left text-foreground">
            {isLoading ? (
            <div className="flex justify-center items-center py-20 text-center text-foreground"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>
            ) : (
            <div className="border rounded-xl overflow-hidden text-left text-foreground">
                <Table className="text-left text-foreground">
                <TableHeader className="bg-slate-50 text-left text-foreground">
                    <TableRow className="text-left text-foreground">
                    <TableHead className="font-bold text-[10px] uppercase text-left text-foreground">Plan / Category</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase text-left text-foreground">Monthly Price</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase text-left text-foreground">Features</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase text-left text-foreground">Status</TableHead>
                    <TableHead className="text-right font-bold text-[10px] uppercase text-foreground">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="text-left text-foreground">
                    {plans && plans.map((plan: any) => (
                        <TableRow key={plan.id} className="hover:bg-slate-50/50 text-left text-foreground">
                            <TableCell className="py-4 text-left text-foreground">
                                <div className="flex flex-col text-left">
                                    <span className="font-black text-foreground">{plan.name}</span>
                                    <Badge variant="outline" className="w-fit text-[8px] h-3.5 mt-1 uppercase border-primary/20 text-primary">
                                        {plan.type === 'earning' ? 'Mall Node' : 'Foundation'}
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell className="font-mono font-bold text-primary text-left">
                                {formatCurrency(typeof plan.price === 'number' ? plan.price : (plan.price?.monthly || 0))}
                            </TableCell>
                            <TableCell className="text-left text-foreground">
                                <span className="text-xs font-medium">{plan.features?.length || 0} enabled</span>
                            </TableCell>
                            <TableCell className="text-left text-foreground">
                                {plan.isPopular && <Badge className="bg-amber-100 text-amber-800 border-none text-[8px] h-4 font-black uppercase">Popular</Badge>}
                            </TableCell>
                            <TableCell className="text-right text-foreground">
                                <div className="flex justify-end gap-1 text-foreground">
                                    <PlanDialog plan={plan} onSave={forceRefresh} />
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)} disabled={plan.id === 'free' || plan.id === 'intelligence'} className="text-foreground"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {(!plans || plans.length === 0) && (
                        <TableRow className="text-left text-foreground">
                            <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic text-foreground">
                                <div className="space-y-4 text-center">
                                    <p>No plans defined in registry.</p>
                                    <Button variant="outline" onClick={handleSeed} disabled={isSeeding} className="text-foreground">
                                        Click here to seed standard platform plans
                                    </Button>
                                </div>
                            </TableCell>
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
