

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building, Eye, PlusCircle, Edit, Trash2, Send, Copy } from "lucide-react";
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { getClientSideAuthToken } from '@/firebase';
import { Button, buttonVariants } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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

const partnerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  type: z.string(),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

function SupplierDialog({ open, onOpenChange, partner, onSave, defaultType }: { open: boolean, onOpenChange: (open: boolean) => void, partner?: any, onSave: () => void, defaultType: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
  });

  useEffect(() => {
    if (open) {
      if (partner) {
        form.reset(partner);
      } else {
        form.reset({
          firstName: '', lastName: '', email: '', phone: '', companyName: '',
          status: 'active', type: defaultType,
        });
      }
    }
  }, [open, partner, form, defaultType]);


  const onSubmit = async (values: PartnerFormValues) => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");
      
      await performAdminAction(token, 'savePartner', { 
          partner: { id: partner?.id, ...values } 
      });

      toast({ title: 'Supplier Lead Added', description: `${values.companyName || `${values.firstName} ${values.lastName}`} has been added.` });
      onSave();
      onOpenChange(false);
      form.reset();
    } catch(e: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add New Supplier Lead</DialogTitle>
          <DialogDescription>
            Enter the details for the potential supplier. This will add them to the central partner database.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>Contact First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Contact Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email"/></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Add Supplier Lead</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function SupplierManagement() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [partnerToDelete, setPartnerToDelete] = useState<any | null>(null);

    const forceRefresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            const result = await performAdminAction(token, 'getPartnersByType', { type: 'supplier' });
            setSuppliers(result.data || []);

        } catch (e: any) {
            setError(e.message);
            toast({ variant: 'destructive', title: 'Error loading suppliers', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        forceRefresh();
    }, [forceRefresh]);

    const handleDelete = async () => {
        if (!partnerToDelete) return;
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await performAdminAction(token, 'deletePartner', { partnerId: partnerToDelete.id });
            toast({ title: 'Supplier Lead Deleted' });
            forceRefresh();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
        } finally {
             setPartnerToDelete(null);
             setIsDeleteAlertOpen(false);
        }
    };

    const columns: ColumnDef<any>[] = useMemo(() => [
        { accessorKey: 'companyName', header: 'Company Name' },
        { header: 'Contact Person', cell: ({row}) => `${row.original.firstName} ${row.original.lastName}` },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'phone', header: 'Phone' },
        { accessorKey: 'status', header: 'Status', cell: ({row}) => <Badge className="capitalize">{row.original.status}</Badge>},
        { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
            <div className="text-right">
                <Button variant="ghost" size="icon" onClick={() => { setPartnerToDelete(row.original); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
        )},
    ], [forceRefresh]);

    return (
      <>
        <SupplierDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSave={forceRefresh} defaultType="supplier" />
         <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently delete the lead "{partnerToDelete?.companyName}".</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPartnerToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Yes, delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><Building /> Supplier Leads Management</CardTitle>
                    <CardDescription>A list of all potential suppliers in the leads database.</CardDescription>
                </div>
                 <Button onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Supplier
                </Button>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : error ? (
                    <div className="text-destructive p-4 bg-destructive/10 rounded-md">{error}</div>
                ) : (
                    <DataTable columns={columns} data={suppliers} />
                )}
            </CardContent>
        </Card>
      </>
    );
}
