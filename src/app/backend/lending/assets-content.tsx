
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Link as LinkIcon, PlusCircle, Truck, Loader2, Save, Check, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';

// --- Zod Schemas ---
const assetSchema = z.object({
  make: z.string().min(1, 'Vehicle make is required'),
  model: z.string().min(1, 'Model/Series is required'),
  year: z.string().min(4, 'Enter a valid year').max(4, 'Enter a valid year'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  registerNumber: z.string().min(1, 'Register # is required'),
  vin: z.string().min(1, 'VIN is required'),
  engineNumber: z.string().optional(),
  tare: z.string().min(1, 'Tare weight is required'),
  gvm: z.string().min(1, 'GVM is required'),
  titleholder: z.string().min(1, 'Titleholder is required'),
  owner: z.string().min(1, 'Owner is required'),
  firstRegistrationDate: z.string().min(1, 'Date of first registration is required'),
  classification: z.string().min(1, 'Classification is required'),
});

const formSchema = z.object({
  supplierId: z.string().min(1, "A supplier must be selected."),
  asset: assetSchema,
  price: z.coerce.number().positive("Asset price is required."),
});

type AssetWizardFormValues = z.infer<typeof formSchema>;

// Dummy data
const dummyAssets = [
    { id: 'ASSET-001', make: 'Scania', model: 'R560', year: '2022', registrationNumber: 'FVH123GP', registerNumber: '123456789', vin: 'YS2R6X20001234567', tare: '9000', gvm: '26000', titleholder: 'Wesbank', owner: 'Sample Transport Co.', firstRegistrationDate: '2022-01-15', classification: 'Truck-Tractor', clientId: 'sample-client-1' },
    { id: 'ASSET-002', make: 'Henred Fruehauf', model: 'Tautliner', year: '2021', registrationNumber: 'ABC789GP', registerNumber: '987654321', vin: 'AHTF9T40001234567', tare: '7500', gvm: '34000', titleholder: 'Client Owned', owner: 'Sample Transport Co.', firstRegistrationDate: '2021-03-20', classification: 'Trailer', clientId: 'sample-client-1' },
];

const wizardSteps = [
    { id: 'supplier', name: 'Supplier', fields: ['supplierId'] },
    { id: 'asset', name: 'Asset Details', fields: ['asset'] },
    { id: 'price', name: 'Price', fields: ['price'] },
    { id: 'documents', name: 'Documents' },
    { id: 'review', name: 'Review' },
    { id: 'post', name: 'Post to Register' },
];


// --- Sub-components for Wizard Steps ---

const StepSupplier = () => {
    const firestore = useFirestore();
    const { control } = useFormContext();

    const partnersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingPartners')) : null, [firestore]);
    const { data: partners, isLoading } = useCollection(partnersQuery);

    // TODO: Implement "Add New Supplier" dialog
    return (
        <div className="max-w-md space-y-4">
            <FormField
                control={control}
                name="supplierId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Select Supplier</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder={isLoading ? "Loading..." : "Select a supplier..."} /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="internal_stock">-- Internal Stock (Repossessed) --</SelectItem>
                                {(partners || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => alert("'Add Supplier' feature coming soon.")}>
                <PlusCircle className="mr-2 h-4 w-4"/> Add New Supplier
            </Button>
        </div>
    );
};

const StepAssetDetails = () => {
    const { control } = useFormContext();
    return (
         <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField control={control} name="asset.make" render={({ field }) => (<FormItem><FormLabel>Vehicle Make</FormLabel><FormControl><Input placeholder="e.g., Scania" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="asset.model" render={({ field }) => (<FormItem><FormLabel>Model / Series</FormLabel><FormControl><Input placeholder="e.g., R 560" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="asset.year" render={({ field }) => (<FormItem><FormLabel>Year of Manufacture</FormLabel><FormControl><Input placeholder="e.g., 2018" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="asset.registrationNumber" render={({ field }) => (<FormItem><FormLabel>Registration Number</FormLabel><FormControl><Input placeholder="e.g., AB 12 CD GP" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="asset.registerNumber" render={({ field }) => (<FormItem><FormLabel>Register #</FormLabel><FormControl><Input placeholder="Dept. of Transport Number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="asset.vin" render={({ field }) => (<FormItem><FormLabel>Vehicle Identification Number (VIN)</FormLabel><FormControl><Input placeholder="Vehicle VIN" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="asset.engineNumber" render={({ field }) => (<FormItem><FormLabel>Engine Number</FormLabel><FormControl><Input placeholder="Engine Number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="asset.tare" render={({ field }) => (<FormItem><FormLabel>Tare (kg)</FormLabel><FormControl><Input placeholder="e.g., 9000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="asset.gvm" render={({ field }) => (<FormItem><FormLabel>Gross Vehicle Mass (GVM - kg)</FormLabel><FormControl><Input placeholder="e.g., 26000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="asset.titleholder" render={({ field }) => (<FormItem><FormLabel>Titleholder</FormLabel><FormControl><Input placeholder="Titleholder" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="asset.owner" render={({ field }) => (<FormItem><FormLabel>Owner</FormLabel><FormControl><Input placeholder="Owner" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="asset.firstRegistrationDate" render={({ field }) => (<FormItem><FormLabel>Date of First Registration</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="asset.classification" render={({ field }) => (<FormItem><FormLabel>Classification</FormLabel><FormControl><Input placeholder="e.g., Goods Vehicle" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        </div>
    );
};

const StepPrice = () => {
    const { control } = useFormContext();
    return (
        <div className="max-w-sm">
            <FormField control={control} name="price" render={({ field }) => (<FormItem><FormLabel>Cost of Asset (R)</FormLabel><FormControl><Input type="number" placeholder="e.g., 1250000" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
    );
}

const StepDocuments = () => <p className="text-muted-foreground">Document upload feature coming soon.</p>;

const StepReview = () => {
    const { getValues } = useFormContext();
    const values = getValues();
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

    return (
         <div className="space-y-4">
             <Card><CardHeader><CardTitle>Supplier</CardTitle></CardHeader><CardContent>{values.supplierId}</CardContent></Card>
             <Card><CardHeader><CardTitle>Asset</CardTitle></CardHeader><CardContent><pre className="whitespace-pre-wrap">{JSON.stringify(values.asset, null, 2)}</pre></CardContent></Card>
             <Card><CardHeader><CardTitle>Price</CardTitle></CardHeader><CardContent>{formatCurrency(values.price)}</CardContent></Card>
        </div>
    )
};

const StepPost = ({ onSubmit, isLoading }: {onSubmit: () => void, isLoading: boolean}) => (
    <div className="text-center">
        <h3 className="text-xl font-semibold">Ready to Post?</h3>
        <p className="text-muted-foreground mt-2">This will post the asset to the register.</p>
        <Button onClick={onSubmit} disabled={isLoading} className="mt-6">
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
            Post to Register
        </Button>
    </div>
);


// --- Asset Wizard ---
const AssetWizard = ({ asset, onBack, onSaveSuccess }: { asset?: any, onBack: () => void, onSaveSuccess: (data: AssetWizardFormValues) => void }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const { toast } = useToast();
    
    const methods = useForm<AssetWizardFormValues>({
        resolver: zodResolver(formSchema),
        mode: 'onChange',
        defaultValues: asset || {
            supplierId: '',
            asset: {},
            price: 0,
        },
    });

    const handleNext = async () => {
        const currentStepConfig = wizardSteps[currentStep];
        let isValid = false;
        if (currentStepConfig.fields) {
            isValid = await methods.trigger(currentStepConfig.fields as any);
        } else {
            isValid = true; 
        }

        if (isValid && currentStep < wizardSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else if (!isValid) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill in all required fields for this step.' });
        }
    };

     const handleBack = () => {
      if (currentStep > 0) {
        setCurrentStep(prev => prev - 1);
      } else {
        onBack();
      }
    };
    
     const onSubmit = (values: AssetWizardFormValues) => {
        // In a real application, this would be an API call to save the asset.
        console.log("Saving asset:", values);
        toast({ title: asset ? 'Asset Updated' : 'Asset Created' });
        onSaveSuccess(values);
    };
    
    const renderStepContent = () => {
        switch(wizardSteps[currentStep].id) {
            case 'supplier': return <StepSupplier />;
            case 'asset': return <StepAssetDetails />;
            case 'price': return <StepPrice />;
            case 'documents': return <StepDocuments />;
            case 'review': return <StepReview />;
            case 'post': return <StepPost onSubmit={methods.handleSubmit(onSubmit)} isLoading={methods.formState.isSubmitting} />;
            default: return null;
        }
    };

    return (
        <Card>
            <FormProvider {...methods}>
                <CardHeader>
                    <CardTitle>{asset ? 'Edit Asset' : 'Onboard New Asset'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
                        {/* Stepper */}
                         <div className="flex flex-col gap-2 border-r pr-4">
                            {wizardSteps.map((step, index) => (
                                <Button 
                                    key={step.id} 
                                    variant={currentStep === index ? 'secondary' : 'ghost'} 
                                    className="justify-start gap-2"
                                    onClick={() => setCurrentStep(index)}
                                >
                                    {currentStep > index ? <Check className="h-5 w-5 text-green-500" /> : <div className="h-5 w-5" />}
                                    {step.name}
                                </Button>
                            ))}
                        </div>
                        {/* Content */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">{wizardSteps[currentStep].name}</h2>
                             {renderStepContent()}
                             <div className="flex justify-between pt-8 mt-8 border-t">
                                <Button type="button" variant="outline" onClick={handleBack} disabled={methods.formState.isSubmitting}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> {currentStep === 0 ? 'Back to List' : 'Back'}
                                </Button>
                                {currentStep < wizardSteps.length - 1 && (
                                    <Button type="button" onClick={handleNext}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </FormProvider>
        </Card>
    );
};


// --- Main Component ---
export default function AssetsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
    const [assets, setAssets] = useState(dummyAssets); // State for assets

    const clientId = searchParams.get('clientId');
    const agreementId = searchParams.get('agreementId');

    const assetsForClient = useMemo(() => {
        if (!clientId) return assets;
        return assets.filter(asset => asset.clientId === clientId);
    }, [clientId, assets]);
    
    const handleLinkAsset = (assetId: string) => {
        if (!agreementId) return;
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
    
    const handleSaveSuccess = (newAssetData: AssetWizardFormValues) => {
        const newAsset = {
            ...newAssetData.asset,
            id: `ASSET-${Date.now()}`,
            clientId: clientId || 'Unassigned'
        };
        setAssets(prevAssets => [...prevAssets, newAsset]);
        setView('list');
        setSelectedAsset(null);
    };

    const handleEdit = useCallback((asset: any) => {
        setSelectedAsset(asset);
        setView('edit');
    }, []);

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
