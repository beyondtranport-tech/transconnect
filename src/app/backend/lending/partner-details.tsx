
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Save } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const partnerSchema = z.object({
  name: z.string().min(1, 'Partner name is required.'),
  type: z.string(), // e.g., 'Supplier', 'Vendor'
  status: z.string(),
  globalFacilityLimit: z.coerce.number().optional(),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

const dummyData = {
    Suppliers: [{ id: 'sup-1', name: 'Parts Inc.', type: 'Supplier', status: 'Active', globalFacilityLimit: 1000000 }],
    Vendors: [{ id: 'ven-1', name: 'Trucks Galore', type: 'Vendor', status: 'Active', globalFacilityLimit: 5000000 }],
    Associates: [{ id: 'asc-1', name: 'Logistics Connect', type: 'Associate', status: 'Active', globalFacilityLimit: 0 }],
    Debtors: [{ id: 'deb-1', name: 'Debtor One', type: 'Debtor', status: 'Active', globalFacilityLimit: 50000 }],
};

const PartnerWizard = ({ partnerData, partnerType, onBack, onSaveSuccess }: { partnerData?: any; partnerType: string; onBack: () => void; onSaveSuccess: () => void; }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const methods = useForm<PartnerFormValues>({
        resolver: zodResolver(partnerSchema),
        defaultValues: partnerData ? { ...partnerData, type: partnerType } : { name: '', type: partnerType, status: 'Active', globalFacilityLimit: 0 },
    });

    const onSubmit = async (values: PartnerFormValues) => {
        setIsLoading(true);
        console.log("Saving partner:", { id: partnerData?.id, ...values });
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ title: partnerData ? 'Partner Updated' : 'Partner Created' });
        setIsLoading(false);
        onSaveSuccess();
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>{partnerData ? 'Edit' : 'Add New'} {partnerType.slice(0, -1)}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={methods.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder={`${partnerType.slice(0, -1)} Name`} {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={methods.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={methods.control} name="globalFacilityLimit" render={({ field }) => (<FormItem><FormLabel>Global Facility Limit</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </CardContent>
                    <CardFooter className="justify-between">
                        <Button variant="ghost" onClick={onBack}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} Save</Button>
                    </CardFooter>
                </Card>
            </form>
        </FormProvider>
    );
};

export default function PartnerDetails({ partnerType }: { partnerType: 'Suppliers' | 'Vendors' | 'Associates' | 'Debtors' }) {
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [selectedPartner, setSelectedPartner] = useState<any | null>(null);

    const partners = dummyData[partnerType] || [];
    
    const handleEdit = useCallback((partner: any) => {
        setSelectedPartner(partner);
        setView('edit');
    }, []);

    const columns: ColumnDef<any>[] = useMemo(() => [
        { accessorKey: 'name', header: `${partnerType.slice(0, -1)} Name` },
        { accessorKey: 'status', header: 'Status' },
        { accessorKey: 'globalFacilityLimit', header: 'Facility Limit', cell: ({ row }) => <span>{formatCurrency(row.original.globalFacilityLimit)}</span> },
        { id: 'actions', header: () => <div className="text-right">Actions</div>, cell: ({ row }) => <div className="text-right"><Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>Edit</Button></div> },
    ], [handleEdit, partnerType]);
    
    if (view === 'create' || view === 'edit') {
        return <PartnerWizard partnerData={selectedPartner} partnerType={partnerType} onBack={() => setView('list')} onSaveSuccess={() => setView('list')} />;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{partnerType} Management</CardTitle>
                    <CardDescription>Manage all {partnerType.toLowerCase()} in the system.</CardDescription>
                </div>
                <Button onClick={() => setView('create')}><PlusCircle className="mr-2 h-4 w-4"/> Add {partnerType.slice(0, -1)}</Button>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={partners} />
            </CardContent>
        </Card>
    );
}

function formatCurrency(amount: number) {
    if (typeof amount !== 'number') return 'R 0';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
}
