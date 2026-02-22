
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Link as LinkIcon, PlusCircle, Truck, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// --- Zod Schema for Asset Form ---
const assetSchema = z.object({
  make: z.string().min(1, 'Vehicle make is required'),
  model: z.string().min(1, 'Model/Series is required'),
  year: z.string().min(4, 'Enter a valid year').max(4, 'Enter a valid year'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  vin: z.string().min(1, 'VIN is required'),
  engineNumber: z.string().optional(),
  tare: z.string().min(1, 'Tare weight is required'),
  gvm: z.string().min(1, 'GVM is required'),
  registerNumber: z.string().min(1, 'Register # is required'),
  titleholder: z.string().min(1, 'Titleholder is required'),
  owner: z.string().min(1, 'Owner is required'),
  firstRegistrationDate: z.string().min(1, 'Date of first registration is required'),
  classification: z.string().min(1, 'Classification is required'),
});
type AssetFormValues = z.infer<typeof assetSchema>;

// Dummy data as the backend doesn't save assets yet
const dummyAssets = [
    { id: 'ASSET-001', make: 'Scania', model: 'R560', year: '2022', registrationNumber: 'FVH123GP', registerNumber: '123456789', vin: 'YS2R6X20001234567', tare: '9000', gvm: '26000', titleholder: 'Wesbank', owner: 'Sample Transport Co.', firstRegistrationDate: '2022-01-15', classification: 'Truck-Tractor', clientId: 'sample-client-1' },
    { id: 'ASSET-002', make: 'Henred Fruehauf', model: 'Tautliner', year: '2021', registrationNumber: 'ABC789GP', registerNumber: '987654321', vin: 'AHTF9T40001234567', tare: '7500', gvm: '34000', titleholder: 'Client Owned', owner: 'Sample Transport Co.', firstRegistrationDate: '2021-03-20', classification: 'Trailer', clientId: 'sample-client-1' },
    { id: 'ASSET-003', make: 'CAT', model: '320D', year: '2020', registrationNumber: 'N/A', registerNumber: 'N/A', vin: 'CAT00320DVP012345', tare: '21000', gvm: '21000', titleholder: 'Yellow Plant Hire', owner: 'Another Client Ltd', firstRegistrationDate: '2020-05-10', classification: 'Excavator', clientId: 'another-client-ltd' },
];

// --- Wizard Component for Adding/Editing Assets ---
function AssetWizard({ asset, onBack, onSaveSuccess }: { asset?: any, onBack: () => void, onSaveSuccess: () => void }) {
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const methods = useForm<AssetFormValues>({
        resolver: zodResolver(assetSchema),
        defaultValues: asset || {
            make: '', model: '', year: '', registrationNumber: '', vin: '', engineNumber: '', tare: '', gvm: '',
            registerNumber: '', titleholder: '', owner: '', firstRegistrationDate: '', classification: ''
        },
    });

    const onSubmit = async (values: AssetFormValues) => {
        setIsSaving(true);
        // In a real application, this would be an API call to save the asset.
        console.log("Saving asset:", { id: asset?.id, ...values });
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ title: asset ? 'Asset Updated' : 'Asset Created' });
        setIsSaving(false);
        onSaveSuccess();
    };

    return (
        <Card>
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle>{asset ? 'Edit Asset' : 'Add New Asset'}</CardTitle>
                        <CardDescription>Enter the asset details as they appear on the RC1 certificate.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField control={methods.control} name="make" render={({ field }) => (<FormItem><FormLabel>Vehicle Make</FormLabel><FormControl><Input placeholder="e.g., Scania" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="model" render={({ field }) => (<FormItem><FormLabel>Model / Series</FormLabel><FormControl><Input placeholder="e.g., R 560" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="year" render={({ field }) => (<FormItem><FormLabel>Year of Manufacture</FormLabel><FormControl><Input placeholder="e.g., 2018" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="registrationNumber" render={({ field }) => (<FormItem><FormLabel>Registration Number</FormLabel><FormControl><Input placeholder="e.g., AB 12 CD GP" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="vin" render={({ field }) => (<FormItem><FormLabel>Vehicle Identification Number (VIN)</FormLabel><FormControl><Input placeholder="Vehicle VIN" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="engineNumber" render={({ field }) => (<FormItem><FormLabel>Engine Number</FormLabel><FormControl><Input placeholder="Engine Number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="tare" render={({ field }) => (<FormItem><FormLabel>Tare (kg)</FormLabel><FormControl><Input placeholder="e.g., 9000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="gvm" render={({ field }) => (<FormItem><FormLabel>Gross Vehicle Mass (GVM - kg)</FormLabel><FormControl><Input placeholder="e.g., 26000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="registerNumber" render={({ field }) => (<FormItem><FormLabel>Register #</FormLabel><FormControl><Input placeholder="Register Number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="titleholder" render={({ field }) => (<FormItem><FormLabel>Titleholder</FormLabel><FormControl><Input placeholder="Titleholder" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="owner" render={({ field }) => (<FormItem><FormLabel>Owner</FormLabel><FormControl><Input placeholder="Owner" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="firstRegistrationDate" render={({ field }) => (<FormItem><FormLabel>Date of First Registration</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="classification" render={({ field }) => (<FormItem><FormLabel>Classification</FormLabel><FormControl><Input placeholder="e.g., Goods Vehicle" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                         <Button variant="outline" type="button" onClick={onBack}>Cancel</Button>
                         <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                            Save Asset
                        </Button>
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}

// --- Main Component ---
export default function AssetsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

    const clientId = searchParams.get('clientId');
    const agreementId = searchParams.get('agreementId');

    const assetsForClient = useMemo(() => {
        if (!clientId) return dummyAssets; // Show all if no client is specified
        return dummyAssets.filter(asset => asset.clientId === clientId);
    }, [clientId]);
    
    const handleLinkAsset = (assetId: string) => {
        if (!agreementId) return;

        // In a real application, this would be an API call to update the Firestore document
        console.log(`Linking asset ${assetId} to agreement ${agreementId}`);

        toast({
            title: "Asset Linked",
            description: `Asset ${assetId} has been successfully linked to agreement ${agreementId}.`
        });

        router.push(`/lending?view=agreements`);
    };
    
    const handleBackToList = () => {
        setView('list');
        setSelectedAsset(null);
    };
    
    const handleSaveSuccess = () => {
        // In a real app, you would force a re-fetch of the assets list here.
        setView('list');
        setSelectedAsset(null);
    };

    const handleEdit = useCallback((asset: any) => {
        setSelectedAsset(asset);
        setView('edit');
    }, []);

    const columns: ColumnDef<any>[] = useMemo(() => [
        { 
            accessorKey: 'id', 
            header: 'Asset ID',
            cell: ({ row }) => <div className="font-mono">{row.original.id}</div>
        },
        { 
            accessorKey: 'make', 
            header: 'Make & Model',
            cell: ({ row }) => <div>{row.original.make} {row.original.model}</div>
        },
        { 
            accessorKey: 'year', 
            header: 'Year',
            cell: ({ row }) => <div>{row.original.year}</div>
        },
        {
            accessorKey: 'registrationNumber',
            header: 'Reg. Number',
            cell: ({ row }) => <div>{row.original.registrationNumber}</div>
        },
        { 
            accessorKey: 'clientId', 
            header: 'Client',
            cell: ({ row }) => <div>{row.original.clientId}</div>
        },
        { 
            id: 'actions', 
            header: () => <div className="text-right">Actions</div>, 
            cell: ({ row }) => (
                <div className="text-right">
                    {agreementId ? (
                        <Button size="sm" onClick={() => handleLinkAsset(row.original.id)}>
                            <LinkIcon className="mr-2 h-4 w-4" /> Link to Agreement
                        </Button>
                    ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>Edit Details</Button>
                    )}
                </div>
            )
        }
    ], [agreementId, handleLinkAsset, handleEdit]);

    if (view === 'create' || view === 'edit') {
        return <AssetWizard asset={selectedAsset} onBack={handleBackToList} onSaveSuccess={handleSaveSuccess} />;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Truck /> Asset Register
                    </CardTitle>
                    {clientId && agreementId ? (
                        <CardDescription>
                            Select an asset below to link it to agreement <span className="font-mono text-foreground">{agreementId}</span>.
                        </CardDescription>
                    ) : (
                         <CardDescription>
                            Manage all financed assets. You can add new assets or view existing ones.
                        </CardDescription>
                    )}
                </div>
                 <div className="flex items-center gap-2">
                    {agreementId && (
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                    )}
                    <Button onClick={() => setView('create')}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Asset
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Asset ID</TableHead>
                                <TableHead>Make & Model</TableHead>
                                <TableHead>Year</TableHead>
                                <TableHead>Reg. Number</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assetsForClient.length > 0 ? (
                                assetsForClient.map(asset => (
                                    <TableRow key={asset.id}>
                                        <TableCell className="font-mono">{asset.id}</TableCell>
                                        <TableCell>{asset.make} {asset.model}</TableCell>
                                        <TableCell>{asset.year}</TableCell>
                                        <TableCell>{asset.registrationNumber}</TableCell>
                                        <TableCell>{asset.clientId}</TableCell>
                                        <TableCell className="text-right">
                                            {agreementId ? (
                                                <Button size="sm" onClick={() => handleLinkAsset(asset.id)}>
                                                    <LinkIcon className="mr-2 h-4 w-4" /> Link to Agreement
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(asset)}>Edit Details</Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No assets found for this client.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
