'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// API Helper
async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}

const assetSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.string().min(4, 'Year is required'),
  registrationNumber: z.string().optional(),
  vin: z.string().optional(),
  engineNumber: z.string().optional(),
  costOfSale: z.coerce.number().positive('Cost must be positive'),
  status: z.enum(['available', 'financed', 'sold', 'decommissioned']).default('available'),
  tare: z.string().optional(),
  gvm: z.string().optional(),
  titleholder: z.string().optional(),
  owner: z.string().optional(),
  firstRegistrationDate: z.string().optional(),
  classification: z.string().optional(),
});
type AssetFormValues = z.infer<typeof assetSchema>;

interface EditAssetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: any;
  clients: any[];
  onSave: () => void;
}

export function EditAssetDialog({ isOpen, onOpenChange, asset, clients, onSave }: EditAssetDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<AssetFormValues>({
        resolver: zodResolver(assetSchema),
    });

    useEffect(() => {
        if (isOpen) {
            form.reset({
                clientId: asset?.clientId || '',
                make: asset?.make || '',
                model: asset?.model || '',
                year: asset?.year || '',
                registrationNumber: asset?.registrationNumber || '',
                vin: asset?.vin || '',
                engineNumber: asset?.engineNumber || '',
                costOfSale: asset?.costOfSale || 0,
                status: asset?.status || 'available',
                tare: asset?.tare || '',
                gvm: asset?.gvm || '',
                titleholder: asset?.titleholder || '',
                owner: asset?.owner || '',
                firstRegistrationDate: asset?.firstRegistrationDate ? new Date(asset.firstRegistrationDate).toISOString().split('T')[0] : '',
                classification: asset?.classification || '',
            });
        }
    }, [isOpen, asset, form]);

    const onSubmit = async (values: AssetFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await performAdminAction(token, 'saveLendingAsset', { asset: { id: asset?.id, ...values } });
            toast({ title: asset ? 'Asset Updated' : 'Asset Created' });
            onSave();
            onOpenChange(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{asset ? 'Edit Asset' : 'Create New Asset'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                        <FormField control={form.control} name="clientId" render={({ field }) => (<FormItem><FormLabel>Client (Owner)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="make" render={({ field }) => (<FormItem><FormLabel>Make</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="model" render={({ field }) => (<FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="year" render={({ field }) => (<FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="costOfSale" render={({ field }) => (<FormItem><FormLabel>Cost (Excl. VAT)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="financed">Financed</SelectItem><SelectItem value="sold">Sold</SelectItem><SelectItem value="decommissioned">Decommissioned</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <FormField control={form.control} name="registrationNumber" render={({ field }) => (<FormItem><FormLabel>Registration #</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name="vin" render={({ field }) => (<FormItem><FormLabel>VIN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name="engineNumber" render={({ field }) => (<FormItem><FormLabel>Engine #</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        
                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} Save Asset</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
