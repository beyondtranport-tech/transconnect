'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { 
  Loader2, PlusCircle, Building, Edit, Trash2, Globe, Search, Download, Save, 
  RotateCcw, Upload, Zap, ShieldCheck, ShoppingBag, Landmark, ArrowRight, UserCheck, Users, Mail, Phone, MapPin, Wrench
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn, fetchFromAdminAPI } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const contactSchema = z.object({
  name: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
});

const supplierSchema = z.object({
  name: z.string().min(1, 'Entity name is required'),
  category: z.string().min(1, 'Category is required'),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'draft']).default('active'),
  marketingManager: contactSchema.optional().nullable(),
  ceo: contactSchema.optional().nullable(),
  notes: z.string().optional().nullable(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

function SupplierDialog({ open, onOpenChange, supplier, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; supplier?: any; onSave: () => void; }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<SupplierFormValues>({ 
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier || { status: 'active', marketingManager: {}, ceo: {} }
  });

  const onSubmit = async (values: SupplierFormValues) => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Auth failed.");
      await fetchFromAdminAPI(token, 'saveLendingPartner', { 
        collection: 'lendingSuppliers', 
        partner: { id: supplier?.id, ...values } 
      });
      toast({ title: 'Supplier Node Committed' });
      onSave();
      onOpenChange(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl text-left text-foreground">
        <DialogHeader>
            <DialogTitle>{supplier ? 'Audit' : 'Initialize'} Supplier Node</DialogTitle>
            <DialogDescription>Define high-fidelity contact nodes for asset procurement.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4 max-h-[85vh] overflow-y-auto pr-2 text-left">
            <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 text-left">
                    <Building className="h-4 w-4" /> Core Entity Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <FormField control={form.control} name="name" render={({ field }) => (<FormItem className="text-left"><FormLabel>Legal Trading Name</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="category" render={({ field }) => (<FormItem className="text-left"><FormLabel>Industrial Trade (e.g. Scania Dealer)</FormLabel><FormControl><Input {...field} className="bg-white border-2" /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <FormField control={form.control} name="website" render={({ field }) => (<FormItem className="text-left"><FormLabel>Official URL</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="https://..." className="bg-white border-2" /></FormControl></FormItem>)} />
                  <FormField control={form.control} name="phone" render={({ field }) => (<FormItem className="text-left"><FormLabel>Landline</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem>)} />
                </div>
                <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="text-left"><FormLabel>Physical Yard Address</FormLabel><FormControl><Textarea {...field} value={field.value || ''} className="bg-white h-20 border-2" /></FormControl></FormItem>)} />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="space-y-4 p-6 rounded-2xl bg-primary/5 border border-primary/10 shadow-inner">
                    <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Users className="h-4 w-4" /> Sales / Marketing Lead
                    </h4>
                    <FormField control={form.control} name="marketingManager.name" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Full Name</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem> )} />
                    <FormField control={form.control} name="marketingManager.email" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Direct Email</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem> )} />
                    <FormField control={form.control} name="marketingManager.mobile" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Mobile</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem> )} />
                </div>

                <div className="space-y-4 p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                        <UserCheck className="h-4 w-4" /> CEO / Dealer Principal
                    </h4>
                    <FormField control={form.control} name="ceo.name" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Full Name</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem> )} />
                    <FormField control={form.control} name="ceo.email" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Direct Email</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem> )} />
                    <FormField control={form.control} name="ceo.mobile" render={({ field }) => ( <FormItem className="text-left"><FormLabel>Mobile</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem> )} />
                </div>
            </div>

            <DialogFooter className="pt-4 border-t sticky bottom-0 bg-white z-10">
              <Button type="submit" disabled={isLoading} size="lg" className="w-full font-bold shadow-lg">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Supplier Profile
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function SuppliersContent() {
    const { toast } = useToast();
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'list' | 'edit'>('list');
    const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState<any | null>(null);

    const forceRefresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            const res = await fetchFromAdminAPI(token, 'getLendingData', { collectionName: 'lendingSuppliers' });
            setSuppliers(res.data || []);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Load Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    useEffect(() => { forceRefresh(); }, [forceRefresh]);

    const handleDelete = async () => {
        if (!supplierToDelete) return;
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            await fetchFromAdminAPI(token, 'deleteLendingPartner', { collection: 'lendingSuppliers', partnerId: supplierToDelete.id });
            toast({ title: 'Node Expunged' });
            forceRefresh();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
        } finally {
            setIsDeleteOpen(false);
            setSupplierToDelete(null);
        }
    };

    const columns: ColumnDef<any>[] = [
        { 
            header: 'Dealer Entity',
            cell: ({row}) => (
                <div className="flex flex-col text-left">
                    <span className="font-bold text-foreground">{row.original.name}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[8px] h-3.5 uppercase font-black border-primary/20 text-primary">{row.original.category}</Badge>
                        <span className="text-[9px] text-muted-foreground font-mono uppercase">ID: {row.original.id.slice(-6)}</span>
                    </div>
                </div>
            )
        },
        { 
            header: 'Stakeholder Nodes',
            cell: ({row}) => (
                <div className="flex flex-col gap-1 text-left">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
                        <UserCheck className="h-3 w-3 text-primary" /> {row.original.marketingManager?.name || 'N/A'}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Mail className="h-2.5 w-2.5" /> {row.original.email || 'No Email'}
                    </div>
                </div>
            )
        },
        { 
            header: 'Fidelity',
            cell: ({row}) => (
                <div className="flex items-center gap-2">
                    {row.original.website ? <Globe className="h-4 w-4 text-primary" /> : <Globe className="h-4 w-4 text-muted-foreground opacity-20" />}
                    {row.original.address ? <MapPin className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-muted-foreground opacity-20" />}
                </div>
            )
        },
        { accessorKey: 'status', header: 'Status', cell: ({row}) => <Badge variant={row.original.status === 'active' ? 'default' : 'outline'} className="capitalize text-[10px] font-black">{row.original.status}</Badge> },
        { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
            <div className="flex justify-end items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setSelectedSupplier(row.original); setView('edit'); }}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { setSupplierToDelete(row.original); setIsDeleteOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
        ) },
    ];

    return (
        <div className="space-y-8 text-left text-foreground">
            <SupplierDialog open={view === 'edit'} onOpenChange={(o) => !o && setView('list')} supplier={selectedSupplier} onSave={forceRefresh} />
            
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent className="text-left">
                    <AlertDialogHeader><AlertDialogTitle>Expunge Supplier Node?</AlertDialogTitle><AlertDialogDescription>This will permanently remove the dealership from the authorized register.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel onClick={() => setSupplierToDelete(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Confirm Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-left">
                <div className="text-left">
                    <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3 text-left">
                        <ShoppingBag className="h-8 w-8 text-primary" />
                        Supplier Registry
                    </h1>
                    <p className="text-muted-foreground mt-1">Authorized asset dealers and equipment manufacturers for the lending grid.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={forceRefresh} disabled={isLoading} className="gap-2">
                        <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} /> Refresh
                    </Button>
                    <Button onClick={() => { setSelectedSupplier(null); setView('edit'); }} className="gap-2 font-bold shadow-lg text-white">
                        <PlusCircle className="h-4 w-4" /> Initialize Supplier
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-xl bg-white overflow-hidden text-left">
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Mapping Authorized Dealers...</p>
                        </div>
                    ) : (
                        <DataTable columns={columns} data={suppliers} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
