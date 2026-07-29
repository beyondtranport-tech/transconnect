'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Save, Edit, Trash2, Eye, EyeOff, Layers, Info, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import featuresData from '@/lib/features.json';

const planSchema = z.object({
  id: z.string().min(1, 'ID is required (e.g., "basic")'),
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  type: z.enum(['access', 'data_silo']).default('access'),
  intelligenceQueries: z.coerce.number().min(0),
  shopProducts: z.coerce.number().min(0),
  loadsLimit: z.coerce.number().min(0),
  vehiclesLimit: z.coerce.number().min(0),
  financeApplications: z.coerce.number().min(0),
  features: z.array(z.string()).default([]),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type PlanFormValues = z.infer<typeof planSchema>;

const coreIds = ['basic', 'standard', 'premium', 'intelligence'];

function PlanDialog({ plan, onSave }: { plan?: any; onSave: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
        id: '',
        name: '',
        description: '',
        price: 0,
        type: 'access',
        intelligenceQueries: 0,
        shopProducts: 0,
        loadsLimit: 0,
        vehiclesLimit: 0,
        financeApplications: 0,
        features: [],
        isPopular: false,
        isActive: true,
    }
  });

  // Watch features to ensure re-renders on change
  const watchedFeatures = form.watch('features') || [];
  
  useEffect(() => {
    if (isOpen) {
        if (plan) {
            form.reset({
                id: plan.id,
                name: plan.name,
                description: plan.description,
                price: plan.price,
                type: plan.type || (coreIds.includes(plan.id.toLowerCase()) ? 'access' : 'data_silo'),
                intelligenceQueries: plan.intelligenceQueries || 0,
                shopProducts: plan.shopProducts || 0,
                loadsLimit: plan.loadsLimit || 0,
                vehiclesLimit: plan.vehiclesLimit || 0,
                financeApplications: plan.financeApplications || 0,
                features: plan.features || [],
                isPopular: plan.isPopular || false,
                isActive: plan.isActive !== false,
            });
        } else {
            form.reset({
                id: '',
                name: '',
                description: '',
                price: 0,
                type: 'access',
                intelligenceQueries: 0,
                shopProducts: 0,
                loadsLimit: 0,
                vehiclesLimit: 0,
                financeApplications: 0,
                features: [],
                isPopular: false,
                isActive: true,
            });
        }
    }
  }, [isOpen, plan, form]);

  const handleFeatureToggle = (featureKey: string) => {
      const updated = watchedFeatures.includes(featureKey) 
        ? watchedFeatures.filter(f => f !== featureKey)
        : [...watchedFeatures, featureKey];
      form.setValue('features', updated, { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = async (values: PlanFormValues) => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");
      
      const planId = values.id.trim().toLowerCase();
      const finalType = coreIds.includes(planId) ? 'access' : values.type;
      
      const dataToSave = { 
          ...values, 
          id: planId, 
          type: finalType,
          updatedAt: { _methodName: 'serverTimestamp' } 
      };

      const response = await fetch('/api/updateConfigDoc', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `memberships/${planId}`,
          data: dataToSave
        }),
      });

      if (!response.ok) throw new Error("Failed to save plan.");
      
      toast({ title: 'Commercial Ledger Synchronized', description: `${values.name} logic has been updated in the grid.` });
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
          <Button className="gap-2"><PlusCircle className="h-4 w-4" /> Add Node</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 text-left text-foreground">
        <DialogHeader className="p-6 pb-2 text-left">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">{plan ? 'Audit' : 'Create'} {form.watch('type') === 'access' ? 'Access Tier' : 'Data Silo'}</DialogTitle>
          <DialogDescription className="text-left text-foreground">Define commercial boundaries and B2B valuation for this node.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-4 space-y-8 text-left">
            <div className="grid grid-cols-2 gap-4 text-left">
                <FormField name="type" control={form.control} render={({ field }) => {
                    const isCore = coreIds.includes(form.watch('id')?.toLowerCase());
                    return (
                        <FormItem className="text-left">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Protocol Classification</FormLabel>
                            <Select onValueChange={field.onChange} value={isCore ? 'access' : field.value}>
                                <FormControl>
                                    <SelectTrigger className="bg-white border-2" disabled={isCore}>
                                        <SelectValue placeholder="Select type..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="access">Access Control (Member Tier)</SelectItem>
                                    <SelectItem value="data_silo">Proprietary Data Silo (B2B)</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    );
                }} />
                 <FormField name="name" control={form.control} render={({ field }) => (
                    <FormItem className="text-left">
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Node Label</FormLabel>
                        <FormControl><Input {...field} className="bg-white border-2 font-bold" /></FormControl>
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-3 gap-4 text-left">
                 <FormField name="price" control={form.control} render={({ field }) => (
                    <FormItem className="text-left">
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Yield Price (R)</FormLabel>
                        <FormControl><Input type="number" {...field} className="bg-white border-2 font-mono" /></FormControl>
                    </FormItem>
                )} />
                <FormField name="isPopular" control={form.control} render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 pt-8 text-left">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="cursor-pointer text-xs font-bold uppercase">Highlight</FormLabel>
                    </FormItem>
                )} />
                <FormField name="isActive" control={form.control} render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 pt-8 text-left">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="cursor-pointer text-primary font-bold text-xs uppercase">Active</FormLabel>
                    </FormItem>
                )} />
            </div>

            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem className="text-left">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Value Proposition (Public Desc)</FormLabel>
                  <FormControl><Textarea {...field} className="bg-white border-2 leading-relaxed" /></FormControl>
              </FormItem>
            )} />

            {(form.watch('type') === 'access' || coreIds.includes(form.watch('id')?.toLowerCase())) && (
                <>
                    <div className="space-y-4 text-left">
                        <Separator />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary text-left">Usage Boundaries (Limits)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-left">
                            <FormField name="intelligenceQueries" control={form.control} render={({ field }) => (
                                <FormItem className="text-left">
                                    <FormLabel className="text-[9px] font-black uppercase tracking-tight">Intel Queries</FormLabel>
                                    <FormControl><Input type="number" {...field} className="h-9 font-mono" /></FormControl>
                                </FormItem>
                            )} />
                            <FormField name="shopProducts" control={form.control} render={({ field }) => (
                                <FormItem className="text-left">
                                    <FormLabel className="text-[9px] font-black uppercase tracking-tight">Catalogue Slots</FormLabel>
                                    <FormControl><Input type="number" {...field} className="h-9 font-mono" /></FormControl>
                                </FormItem>
                            )} />
                            <FormField name="loadsLimit" control={form.control} render={({ field }) => (
                                <FormItem className="text-left">
                                    <FormLabel className="text-[9px] font-black uppercase tracking-tight">Max Loads/Mo</FormLabel>
                                    <FormControl><Input type="number" {...field} className="h-9 font-mono" /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                    </div>

                    <div className="space-y-6 text-left">
                        <Separator />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary text-left">Platform Capabilities</h4>
                        <div className="grid grid-cols-1 gap-6 text-left">
                            {featuresData.featureSections.map((section) => (
                                <div key={section.name} className="space-y-3 text-left">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-1 rounded">{section.name}</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2 text-left">
                                        {section.features.map((feature) => (
                                            <div 
                                                key={feature.key} 
                                                className="flex items-center space-x-3 p-3 border rounded-xl hover:bg-slate-50 transition-all text-left cursor-pointer"
                                                onClick={() => handleFeatureToggle(feature.key)}
                                            >
                                                <Checkbox
                                                    id={`feature-${feature.key}`}
                                                    checked={watchedFeatures.includes(feature.key)}
                                                    onCheckedChange={() => {}} // Driven by div onClick
                                                />
                                                <label 
                                                    htmlFor={`feature-${feature.key}`}
                                                    className="text-[10px] font-black uppercase tracking-tight cursor-pointer flex-1 py-1"
                                                    onClick={(e) => e.preventDefault()}
                                                >
                                                    {feature.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
            
            <div className="pt-4 text-left">
                <FormField name="id" control={form.control} render={({ field }) => (
                  <FormItem className="text-left">
                      <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Protocol Identifier (Immutable ID)</FormLabel>
                      <FormControl><Input {...field} disabled={!!plan} className="h-8 font-mono text-xs bg-slate-50" /></FormControl>
                  </FormItem>
                )} />
            </div>
          </form>
        </Form>
        <DialogFooter className="p-6 pt-2 border-t text-left">
          <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isLoading} className="w-full h-12 font-black uppercase tracking-widest shadow-lg text-white">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Synchronize Commercial Protocol
          </Button>
        </DialogFooter>
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

  const handleToggleActive = async (plan: any) => {
    try {
        const token = await getClientSideAuthToken();
        if (!token) return;
        await fetch('/api/updateConfigDoc', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: `memberships/${plan.id}`,
                data: { isActive: !plan.isActive, updatedAt: { _methodName: 'serverTimestamp' } }
            }),
        });
        toast({ title: plan.isActive ? "Node Deactivated" : "Node Published" });
        forceRefresh();
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Update Failed" });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
        const token = await getClientSideAuthToken();
        if (!token) return;
        
        const response = await fetch('/api/deleteConfigDoc', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: `memberships/${planId}` }),
        });
        
        if (!response.ok) throw new Error("Delete failed.");
        
        toast({ title: "Node Expunged", description: "The plan has been removed from the ledger." });
        forceRefresh();
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Delete Failed" });
    }
  };

  const accessTiers = useMemo(() => {
      return (plans || [])
        .filter(p => p.type === 'access' || coreIds.includes(p.id?.toLowerCase()))
        .sort((a,b) => (a.price || 0) - (b.price || 0));
  }, [plans]);

  const dataSilos = useMemo(() => {
      return (plans || [])
        .filter(p => {
            const isCore = coreIds.includes(p.id?.toLowerCase());
            return p.type === 'data_silo' && !isCore;
        })
        .sort((a,b) => (a.price || 0) - (b.price || 0));
  }, [plans]);

  const columns: ColumnDef<any>[] = [
    { 
        header: 'Grid Status',
        cell: ({row}) => (
            <div className="flex items-center gap-2">
                <Switch 
                    checked={row.original.isActive !== false} 
                    onCheckedChange={() => handleToggleActive(row.original)}
                />
                {row.original.isActive !== false ? <Eye className="h-3 w-3 text-primary" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
            </div>
        )
    },
    { 
        accessorKey: 'name', 
        header: 'Commercial Label',
        cell: ({ row }) => (
            <div className="flex flex-col text-left text-foreground">
                <div className="font-bold text-slate-900">{row.original.name}</div>
                <span className="text-[9px] font-mono uppercase text-muted-foreground">{row.original.id}</span>
            </div>
        ),
    },
    { 
        accessorKey: 'price', 
        header: 'Yield (R)',
        cell: ({ row }) => <span className="font-mono font-bold text-primary">{row.original.price ? `R ${row.original.price.toLocaleString()}` : 'R 0'}</span> 
    },
    { 
        header: 'Forensic Description',
        cell: ({row}) => <span className="text-xs text-muted-foreground truncate max-w-[200px] text-left">{row.original.description}</span>
    },
    {
        id: 'actions',
        header: <div className="text-right">Audit</div>,
        cell: ({ row }) => (
            <div className="text-right flex justify-end gap-1">
                <PlanDialog plan={row.original} onSave={forceRefresh} />
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="text-left text-foreground">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-left text-foreground">Expunge Node Protocol?</AlertDialogTitle>
                            <AlertDialogDescription className="text-left text-foreground">
                                This will permanently delete the commercial definition for "{row.original.name}". This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePlan(row.original.id)} className={buttonVariants({ variant: 'destructive' })}>Delete Node</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )
    }
  ];

  return (
    <div className="space-y-12 text-left text-base text-foreground">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div className="text-left text-foreground">
            <CardTitle className="text-3xl font-black font-headline flex items-center gap-3 text-left">
                <Layers className="text-primary h-8 w-8"/> 
                Commercial Node Ledger
            </CardTitle>
            <CardDescription className="text-left text-lg">Define access boundaries for members and B2B pricing for proprietary data IP.</CardDescription>
        </div>
        <PlanDialog onSave={forceRefresh} />
      </div>

      <div className="space-y-16 text-left">
        <div className="space-y-6 text-left">
            <div className="flex items-center gap-4 border-l-4 border-primary pl-4 text-left">
                <div className="text-left">
                    <h3 className="text-xl font-black uppercase tracking-tight text-left">1. Access Control Tiers</h3>
                    <p className="text-sm text-muted-foreground text-left">Core memberships that manage navigation and usage boundaries.</p>
                </div>
            </div>
            <Card className="border-none shadow-xl bg-white text-left text-foreground">
                <CardContent className="pt-6 text-left">
                    {isLoading ? <div className="flex justify-center p-20 text-center"><Loader2 className="animate-spin text-primary h-8 w-8 mx-auto" /></div> : <DataTable columns={columns} data={accessTiers} />}
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6 text-left text-foreground">
             <div className="flex items-center gap-4 border-l-4 border-slate-900 pl-4 text-left">
                <div className="text-left">
                    <h3 className="text-xl font-black uppercase tracking-tight text-left">2. Proprietary Data Silos</h3>
                    <p className="text-sm text-muted-foreground text-left">B2B intelligence silos deactivated for public view. Sold via institutional handshake.</p>
                </div>
            </div>
            <Card className="border-none shadow-xl bg-white text-left text-foreground">
                <CardContent className="pt-6 text-left">
                    {isLoading ? <div className="flex justify-center p-20 text-center"><Loader2 className="animate-spin text-primary h-8 w-8 mx-auto" /></div> : <DataTable columns={columns} data={dataSilos} />}
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="p-10 bg-slate-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden text-left text-white">
            <div className="absolute top-0 right-0 p-12 opacity-5 text-left"><Zap className="h-40 w-40 text-primary" /></div>
            <div className="relative z-10 flex items-start gap-6 text-left">
                <div className="bg-primary/20 p-4 rounded-3xl shrink-0"><Info className="h-8 w-8 text-primary" /></div>
                <div className="space-y-2 text-left">
                    <h4 className="text-xl font-black uppercase text-left">Commercial Ledger Protection</h4>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-4xl text-left">
                        Core plans (Basic, Standard, Premium, Intelligence) are hard-coded to the Access Tiers section to prevent accidental misclassification. Data Silos are reserved for B2B intelligence modules and remain hidden from the public-facing /pricing terminal.
                    </p>
                </div>
            </div>
      </div>
    </div>
  );
}
