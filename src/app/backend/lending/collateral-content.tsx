
'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle, ShieldCheck, Upload, Loader2, Save } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const dummyCollateralAssets = [
    { id: 'asset-001', assetDescription: '2022 Scania R560 (FVH123GP)', client: 'Sample Transport Co.', agreement: 'AG-101', securityDocStatus: 'Generated', titleDocStatus: 'Received' },
    { id: 'asset-002', name: 'Office Property at 123 Main St', assetDescription: 'Erf 456, Sandton, GP', client: 'Another Client Ltd', agreement: 'AG-205', securityDocStatus: 'Signed In', titleDocStatus: 'Checked' },
];

const statusOptions = ["Generated", "Sent", "Received", "Checked", "Signed In"];

const collateralSchema = z.object({
  assetDescription: z.string().min(1, 'Asset description is required.'),
  client: z.string().min(1, 'Client is required.'),
  agreement: z.string().min(1, 'Agreement is required.'),
  securityDocStatus: z.string().optional(),
  titleDocStatus: z.string().optional(),
});

type CollateralFormValues = z.infer<typeof collateralSchema>;

function CollateralWizard({ collateral, onBack, onSaveSuccess }: { collateral?: any; onBack: () => void; onSaveSuccess: () => void; }) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const methods = useForm<CollateralFormValues>({
        resolver: zodResolver(collateralSchema),
        defaultValues: collateral || { assetDescription: '', client: '', agreement: '', securityDocStatus: 'Generated', titleDocStatus: 'Generated' },
    });

    const onSubmit = async (values: CollateralFormValues) => {
        setIsLoading(true);
        console.log("Saving collateral:", { id: collateral?.id, ...values });
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ title: collateral ? 'Collateral Updated' : 'Collateral Added' });
        setIsLoading(false);
        onSaveSuccess();
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>{collateral ? 'Edit' : 'Add'} Collateral Asset</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={methods.control} name="assetDescription" render={({ field }) => (<FormItem><FormLabel>Asset Description</FormLabel><FormControl><Input placeholder="e.g., 2023 Scania R560" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={methods.control} name="client" render={({ field }) => (<FormItem><FormLabel>Client</FormLabel><FormControl><Input placeholder="Client Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={methods.control} name="agreement" render={({ field }) => (<FormItem><FormLabel>Agreement</FormLabel><FormControl><Input placeholder="e.g., AG-101" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={methods.control} name="securityDocStatus" render={({ field }) => (<FormItem><FormLabel>Security Doc Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></FormItem>)} />
                        <FormField control={methods.control} name="titleDocStatus" render={({ field }) => (<FormItem><FormLabel>Title Doc Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></FormItem>)} />
                    </CardContent>
                    <CardFooter className="justify-between">
                        <Button variant="ghost" onClick={onBack}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} Save</Button>
                    </CardFooter>
                </Card>
            </form>
        </FormProvider>
    );
}

export default function CollateralContent() {
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [selectedCollateral, setSelectedCollateral] = useState<any | null>(null);

    const handleEdit = useCallback((collateral: any) => {
        setSelectedCollateral(collateral);
        setView('edit');
    }, []);

    const columns: ColumnDef<any>[] = useMemo(() => [
        { accessorKey: 'assetDescription', header: 'Asset Description' },
        { accessorKey: 'client', header: 'Client' },
        { accessorKey: 'agreement', header: 'Agreement' },
        { accessorKey: 'securityDocStatus', header: 'Security Doc Status' },
        { accessorKey: 'titleDocStatus', header: 'Title Doc Status' },
        { id: 'actions', header: () => <div className="text-right">Actions</div>, cell: ({ row }) => <div className="text-right"><Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>Edit</Button></div> },
    ], [handleEdit]);
    
    if (view === 'create' || view === 'edit') {
        return <CollateralWizard collateral={selectedCollateral} onBack={() => setView('list')} onSaveSuccess={() => setView('list')} />;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck /> Collateral Asset Register
                    </CardTitle>
                    <CardDescription>
                        Manage tangible assets (e.g., vehicles, property) pledged as collateral. Track the status of both the security agreement (like a notarial bond) and the asset's title document (like an RC1).
                    </CardDescription>
                </div>
                <Button onClick={() => setView('create')}><PlusCircle className="mr-2 h-4 w-4" /> Add Pledged Asset</Button>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={dummyCollateralAssets} />
            </CardContent>
        </Card>
    );
}
