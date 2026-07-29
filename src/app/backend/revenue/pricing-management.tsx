'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Save, Edit, Trash2, Layers, Zap, Info, Database, ShieldCheck, Lock, Eye, EyeOff, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatCurrency } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';

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
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
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
            type: plan?.type || 'access',
            intelligenceQueries: plan?.intelligenceQueries || 0,
            shopProducts: plan?.shopProducts || 0,
            loadsLimit: plan?.loadsLimit || 0,
            vehiclesLimit: plan?.vehiclesLimit || 0,
            financeApplications: plan?.financeApplications || 0,
            isPopular: plan?.isPopular || false,
            isActive: plan?.isActive !== false,
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
      
      toast({ title: 'Ledger Updated!', description: `${values.name} logic has been synchronized.` });
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
          <Button className="gap-2"><PlusCircle className="h-4 w-4" /> Add Record</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 text-left text-foreground">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{plan ? 'Audit' : 'Create'} {form.watch('type') === 'access' ? 'Access Tier' : 'Data Silo'}</DialogTitle>
          <DialogDescription>Define the commercial boundaries for this industrial node.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div className="grid grid-cols-2 gap-4 text-left">
                <FormField name="type" control={form.control} render={({ field }) => (
                    <FormItem className="text-left">
                        <FormLabel>Protocol Classification</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="bg-white border-2"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="access">Access Control (Frontend)</SelectItem>
                                <SelectItem value="data_silo">Data Silo (B2B Hidden)</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormItem>
                )} />
                 <FormField name="name" control={form.control} render={({ field }) => (
                    <FormItem className="text-left">
                        <FormLabel>Internal Ledger Name</FormLabel>
                        <FormControl><Input {...field} className="bg-white border-2" /></FormControl>
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-3 gap-4 text-left">
                 <FormField name="price" control={form.control} render={({ field }) => (
                    <FormItem className="text-left col-span-1">
                        <FormLabel>Yield Price (R)</FormLabel>
                        <FormControl><Input type="number" {...field} className="bg-white border-2" /></FormControl>
                    </FormItem>
                )} />
                <FormField name="isPopular" control={form.control} render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 pt-8 text-left col-span-1">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="cursor-pointer">Highlight Node</FormLabel>
                    </FormItem>
                )} />
                <FormField name="isActive" control={form.control} render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 pt-8 text-left col-span-1">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="cursor-pointer text-primary font-bold">In-Market Active</FormLabel>
                    </FormItem>
                )} />
            </div>

            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem className="text-left">
                  <FormLabel>Forensic Description</FormLabel>
                  <FormControl><Textarea {...field} className="bg-white border-2" /></FormControl>
              </FormItem>
            )} />

            {form.watch('type') === 'access' && (
                <div className="space-y-4 text-left">
                    <Separator />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary text-left">Capacity Constraints (Allowances)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-left">
                        <FormField name="intelligenceQueries" control={form.control} render={({ field }) => (
                            <FormItem className="text-left"><FormLabel className="text-[9px] uppercase font-black">Intel Queries</FormLabel><FormControl><Input type="number" {...field} className="h-9" /></FormControl></FormItem>
                        )} />
                        <FormField name="shopProducts" control={form.control} render={({ field }) => (
                            <FormItem className="text-left"><FormLabel className="text-[9px] uppercase font-black">Shop Products</FormLabel><FormControl><Input type="number" {...field} className="h-9" /></FormControl></FormItem>
                        )} />
                        <FormField name="loadsLimit" control={form.control} render={({ field }) => (
                            <FormItem className="text-left"><FormLabel className="text-[9px] uppercase font-black">Max Loads</FormLabel><FormControl><Input type="number" {...field} className="h-9" /></FormControl></FormItem>
                        )} />
                    </div>
                </div>
            )}
          </form>
        </Form>
        <DialogFooter className="p-6 pt-2 border-t text-left">
          <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isLoading} className="w-full h-12 font-black uppercase tracking-widest shadow-lg">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Sync Protocol to Ledger
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
        toast({ title: plan.isActive ? "Node Hidden" : "Node Published" });
        forceRefresh();
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Update Failed" });
    }
  };

  const accessTiers = useMemo(() => (plans || []).filter(p => p.type !== 'data_silo').sort((a,b) => a.price - b.price), [plans]);
  const dataSilos = useMemo(() => (plans || []).filter(p => p.type === 'data_silo').sort((a,b) => a.price - b.price), [plans]);

  const columns: ColumnDef<any>[] = [
    { 
        header: 'Status',
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
        header: 'Label',
        cell: ({ row }) => <div className="font-bold text-slate-900">{row.original.name}</div>,
    },
    { 
        accessorKey: 'price', 
        header: 'Yield (R)',
        cell: ({ row }) => <span className="font-mono font-bold text-primary">{formatCurrency(row.original.price)}</span> 
    },
    { 
        header: 'Silo Description',
        cell: ({row}) => <span className="text-xs text-muted-foreground truncate max-w-[300px]">{row.original.description}</span>
    },
    {
        id: 'actions',
        header: <div className="text-right">Audit</div>,
        cell: ({ row }) => (
            <div className="text-right flex justify-end gap-1">
                <PlanDialog plan={row.original} onSave={forceRefresh} />
            </div>
        )
    }
  ];

  return (
    <div className="space-y-12 text-left text-foreground">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div className="text-left">
            <CardTitle className="text-3xl font-black font-headline flex items-center gap-3 text-left text-foreground">
                <Layers className="text-primary h-8 w-8"/> 
                Commercial Node Ledger
            </CardTitle>
            <CardDescription className="text-left text-lg">Define access boundaries for members and B2B pricing for proprietary data silos.</CardDescription>
        </div>
        <PlanDialog onSave={forceRefresh} />
      </div>

      <div className="space-y-12 text-left">
        <div className="space-y-6 text-left">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 ml-1 text-left">
                <ShieldCheck className="h-4 w-4 text-primary" />
                1. Access Control Tiers (Frontend)
            </h3>
            <Card className="border-none shadow-xl bg-white text-left">
                <CardContent className="pt-6 text-left">
                    {isLoading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary h-8 w-8" /></div> : <DataTable columns={columns} data={accessTiers} />}
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6 text-left">
             <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 ml-1 text-left text-foreground">
                <Database className="h-4 w-4 text-primary" />
                2. Data Silos (B2B Proprietary)
            </h3>
            <Card className="border-none shadow-xl bg-white text-left text-foreground">
                <CardContent className="pt-6 text-left text-foreground">
                    {isLoading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary h-8 w-8" /></div> : <DataTable columns={columns} data={dataSilos} />}
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="p-8 bg-slate-900 text-white rounded-[2rem] shadow-2xl relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 p-12 opacity-5"><Zap className="h-40 w-40 text-primary" /></div>
            <div className="relative z-10 flex items-start gap-6 text-left">
                <div className="bg-primary/20 p-4 rounded-3xl"><Info className="h-8 w-8 text-primary" /></div>
                <div className="space-y-2 text-left text-white">
                    <h4 className="text-xl font-black uppercase text-left">Strategic Note: Data vs Access</h4>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-3xl text-left">
                        "Access" tiers are for our active membership community and are visible on the public frontend. "Data Silos" represent our deep-mined industrial IP and are deactivated for public view. These will be sold exclusively via direct B2B handshakes to institutional partners.
                    </p>
                </div>
            </div>
      </div>
    </div>
  );
}
