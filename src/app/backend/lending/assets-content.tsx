
'use client';

import { useState, useMemo } from 'react';
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
  description: z.string().min(1, "Asset description is required."),
  vin: z.string().optional(),
  registerNumber: z.string().optional(),
  // In a real scenario, you'd want to link this to a client
  // clientId: z.string().min(1, "Client must be selected."), 
});
type AssetFormValues = z.infer<typeof assetSchema>;

// Dummy data as the backend doesn't save assets yet
const dummyAssets = [
    { id: 'ASSET-001', description: '2022 Scania R560 (FVH123GP)', clientId: 'sample-client-1' },
    { id: 'ASSET-002', description: 'Henred Fruehauf Tautliner', clientId: 'sample-client-1' },
    { id: 'ASSET-003', description: 'CAT 320D Excavator', clientId: 'another-client-ltd' },
];

// --- Wizard Component for Adding/Editing Assets ---
function AssetWizard({ asset, onBack, onSaveSuccess }: { asset?: any, onBack: () => void, onSaveSuccess: () => void }) {
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const methods = useForm<AssetFormValues>({
        resolver: zodResolver(assetSchema),
        defaultValues: asset || { description: '', vin: '', registerNumber: '' },
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
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={methods.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Asset Description</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 2023 Scania R560" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={methods.control}
                                name="vin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>VIN (Optional)</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={methods.control}
                                name="registerNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Register Number (Optional)</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
    const [view, setView] = useState<'list' | 'create'>('list');

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
    };
    
    const handleSaveSuccess = () => {
        // In a real app, you would force a re-fetch of the assets list here.
        setView('list');
    };

    if (view === 'create') {
        return <AssetWizard onBack={handleBackToList} onSaveSuccess={handleSaveSuccess} />;
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
                                <TableHead>Description</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assetsForClient.length > 0 ? (
                                assetsForClient.map(asset => (
                                    <TableRow key={asset.id}>
                                        <TableCell className="font-mono">{asset.id}</TableCell>
                                        <TableCell>{asset.description}</TableCell>
                                        <TableCell>{asset.clientId}</TableCell>
                                        <TableCell className="text-right">
                                            {agreementId ? (
                                                <Button size="sm" onClick={() => handleLinkAsset(asset.id)}>
                                                    <LinkIcon className="mr-2 h-4 w-4" /> Link to Agreement
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="sm">View Details</Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
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
