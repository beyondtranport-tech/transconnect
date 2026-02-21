
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Handshake, Loader2, PlusCircle, ArrowLeft } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase/errors';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

const partnerSchema = z.object({
  name: z.string().min(1, 'Partner name is required.'),
  globalFacilityLimit: z.coerce.number().min(0, 'Limit must be a positive number.'),
  type: z.string().min(1, "Partner type is required."),
  status: z.enum(['active', 'inactive'])
});
type PartnerFormValues = z.infer<typeof partnerSchema>;

const PartnerWizard = ({ partner, onBack, onSaveSuccess }: { partner?: any, onBack: () => void, onSaveSuccess: () => void }) => {
    const methods = useForm<PartnerFormValues>({
        resolver: zodResolver(partnerSchema),
        defaultValues: partner || { name: '', globalFacilityLimit: 0, type: '', status: 'active' }
    });
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (values: PartnerFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            // This would be an API call
            console.log("Saving partner:", {id: partner?.id, ...values});
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            toast({ title: partner ? 'Partner Updated' : 'Partner Created', description: `Partner "${values.name}" has been saved.` });
            onSaveSuccess();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error saving partner', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                 <CardHeader>
                    <CardTitle>{partner ? 'Edit' : 'Create'} Lending Partner</CardTitle>
                    <CardDescription>Fill in the details for the lending partner.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <FormField control={methods.control} name="name" render={({ field }) => (<FormItem><FormLabel>Partner Name</FormLabel><FormControl><Input placeholder="e.g., Global LendCo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={methods.control} name="globalFacilityLimit" render={({ field }) => (<FormItem><FormLabel>Global Facility Limit</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={methods.control} name="type" render={({ field }) => (<FormItem><FormLabel>Partner Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="bank">Bank</SelectItem><SelectItem value="niche">Niche Lender</SelectItem><SelectItem value="debt">Debt Funder</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                     <FormField control={methods.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button type="button" variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4"/> Back to List</Button>
                    <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save Partner</Button>
                </CardFooter>
            </form>
        </FormProvider>
    );
}

export default function PartnersContent() {
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
    const firestore = useFirestore();
    const partnersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingPartners')) : null, [firestore]);
    const { data: partners, isLoading, forceRefresh } = useCollection(partnersQuery);

    const handleEdit = (partner: any) => {
        setSelectedPartner(partner);
        setView('edit');
    };
    
    const handleAdd = () => {
        setSelectedPartner(null);
        setView('create');
    };
    
    const handleBackToList = () => {
        setView('list');
        setSelectedPartner(null);
    };

    const handleSaveSuccess = () => {
        forceRefresh();
        handleBackToList();
    }
    
    const columns: ColumnDef<any>[] = useMemo(() => [
        { 
            accessorKey: 'name', 
            header: 'Partner Name',
            cell: ({row}) => <div>{row.original.name}</div>
        },
        { 
            accessorKey: 'type', 
            header: 'Type', 
            cell: ({row}) => <span className="capitalize">{row.original.type}</span>
        },
        { 
            accessorKey: 'globalFacilityLimit', 
            header: 'Global Limit', 
            cell: ({row}) => <span>{formatCurrency(row.original.globalFacilityLimit)}</span> 
        },
        { 
            id: 'actions', 
            header: () => <div className="text-right">Actions</div>, 
            cell: ({ row }) => <div className="text-right"><Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>Edit</Button></div> 
        }
    ], [handleEdit]);

    if (view === 'create' || view === 'edit') {
        return <Card><PartnerWizard partner={selectedPartner} onBack={handleBackToList} onSaveSuccess={handleSaveSuccess} /></Card>;
    }
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Handshake /> Lending Partners Management
                    </CardTitle>
                    <CardDescription>
                       Manage the partners who provide capital for the lending facilities.
                    </CardDescription>
                </div>
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4"/> Add Partner</Button>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                    <DataTable columns={columns} data={partners || []} />
                )}
            </CardContent>
        </Card>
    );
}
