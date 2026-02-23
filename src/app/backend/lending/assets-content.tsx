'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Link as LinkIcon, PlusCircle, Truck, Loader2, Save, Check, ArrowRight, Upload } from "lucide-react";
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
import { useCollection, useFirestore, useMemoFirebase, useUser, getClientSideAuthToken } from '@/firebase';
import { collection, query, collectionGroup } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';


// --- Zod Schemas ---
const assetDetailsSchema = z.object({
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
  clientId: z.string().min(1, "A client must be selected."),
  agreementId: z.string().min(1, "An agreement must be selected."),
  asset: assetDetailsSchema,
  documents: z.object({
      invoice: z.string().optional(),
      rc1: z.string().optional(),
      licenseDisk: z.string().optional(),
      deliveryNote: z.string().optional(),
  }).optional(),
});

type AssetWizardFormValues = z.infer<typeof formSchema>;

// --- Wizard Steps Configuration ---
const wizardSteps = [
    { id: 'client', name: 'Client', fields: ['clientId'] },
    { id: 'agreement', name: 'Agreement', fields: ['agreementId'] },
    { id: 'asset', name: 'Asset Details', fields: ['asset'] },
    { id: 'documents', name: 'Documents', fields: [] },
    { id: 'review', name: 'Review & Save' },
];

// --- Helper Functions ---
const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
});


// --- Sub-components for Wizard Steps ---
const StepSelectClient = () => {
    const { control } = useFormContext();
    const firestore = useFirestore();
    const clientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingClients')) : null, [firestore]);
    const { data: clients, isLoading } = useCollection(clientsQuery);
    return (
        <FormField control={control} name="clientId" render={({ field }) => (
            <FormItem><FormLabel>Select Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}><FormControl><SelectTrigger><SelectValue placeholder={isLoading ? "Loading..." : "Select a client..."} /></SelectTrigger></FormControl><SelectContent>{(clients || []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
        )}/>
    )
}
const StepSelectAgreement = () => {
    const { control, watch } = useFormContext();
    const firestore = useFirestore();
    const clientId = watch('clientId');
    const agreementsQuery = useMemoFirebase(() => firestore && clientId ? query(collection(firestore, `lendingClients/${clientId}/agreements`)) : null, [firestore, clientId]);
    const { data: agreements, isLoading } = useCollection(agreementsQuery);
    return (
        <FormField control={control} name="agreementId" render={({ field }) => (
            <FormItem><FormLabel>Select Agreement</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={!clientId || isLoading}><FormControl><SelectTrigger><SelectValue placeholder={isLoading ? "Loading..." : "Select an agreement..."} /></SelectTrigger></FormControl><SelectContent>{(agreements || []).map((a: any) => <SelectItem key={a.id} value={a.id}>{a.id}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
        )}/>
    )
}
const StepAssetDetails = () => (
    <div className="space-y-4">
        {Object.keys(assetDetailsSchema.shape).map(key => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return (
                <FormField key={key} control={useFormContext().control} name={`asset.${key}`} render={({ field }) => (
                    <FormItem><FormLabel>{label}</FormLabel><FormControl><Input type={key === 'year' || key === 'tare' || key === 'gvm' ? 'number' : key.includes('Date') ? 'date' : 'text'} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            )
        })}
    </div>
);
const documentTypes = [ { id: 'invoice', label: 'Invoice' }, { id: 'rc1', label: 'RC1 Certificate' }, { id: 'licenseDisk', label: 'License Disk' }, { id: 'deliveryNote', label: 'Delivery Note' } ];
const StepDocuments = () => {
    const { control, setValue } = useFormContext();
    const { user } = useUser();
    const { toast } = useToast();
    const [uploading, setUploading] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const handleFileUpload = async (file: File, docType: string) => {
        if (!file || !user) return;
        setUploading(docType); setProgress(10);
        try {
            const token = await getClientSideAuthToken(); if (!token) throw new Error("Authentication failed.");
            const fileDataUri = await fileToDataUri(file); setProgress(30);
            const folder = `lending-assets/${user.uid}/${docType}`; const fileName = `${Date.now()}_${file.name}`;
            const response = await fetch('/api/uploadImageAsset', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ fileDataUri, folder, fileName }) });
            setProgress(80);
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to upload document.');
            setValue(`documents.${docType}`, result.url, { shouldValidate: true });
            setProgress(100);
            toast({ title: 'Document Uploaded!', description: `${file.name} has been uploaded successfully.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
        } finally {
            setUploading(null); setProgress(0);
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Supporting Documents</h3>
            <p className="text-sm text-muted-foreground">Upload the required documents for the asset. You can upload PDF files or clear photographs of the documents.</p>
            <div className="space-y-4">
                {documentTypes.map(docType => (
                    <FormField key={docType.id} control={control} name={`documents.${docType.id}`}
                        render={({ field }) => (
                            <FormItem>
                                <div className="p-4 border rounded-lg flex items-center justify-between">
                                    <div>
                                        <FormLabel>{docType.label}</FormLabel>
                                        {field.value ? <div className="text-sm mt-1"><Link href={field.value} target="_blank" className="text-primary hover:underline break-all">View Uploaded Document</Link></div> : <div className="text-xs text-muted-foreground mt-1">No document uploaded.</div>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(`upload-${docType.id}`)?.click()} disabled={!!uploading}><Upload className="mr-2 h-4 w-4" /> Upload</Button>
                                        <Input id={`upload-${docType.id}`} type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], docType.id)} disabled={!!uploading} />
                                    </div>
                                </div>
                                {uploading === docType.id && <Progress value={progress} className="h-1 mt-1" />}
                            </FormItem>
                        )}
                    />
                ))}
            </div>
        </div>
    );
};

const StepReview = () => {
    const { getValues } = useFormContext();
    const values = getValues();
    return (
         <div className="space-y-4">
             <Card><CardHeader><CardTitle>Client & Agreement</CardTitle></CardHeader><CardContent><p>Client ID: {values.clientId}</p><p>Agreement ID: {values.agreementId}</p></CardContent></Card>
             <Card><CardHeader><CardTitle>Asset</CardTitle></CardHeader><CardContent><pre className="whitespace-pre-wrap text-xs">{JSON.stringify(values.asset, null, 2)}</pre></CardContent></Card>
             <Card><CardHeader><CardTitle>Documents</CardTitle></CardHeader><CardContent>
                <ul className="list-disc list-inside">
                    {Object.entries(values.documents || {}).map(([key, value]) => value ? <li key={key}><a href={value as string} target="_blank" rel="noopener noreferrer" className="text-primary underline">{key}</a></li> : null)}
                </ul>
             </CardContent></Card>
        </div>
    )
};


// --- Asset Wizard ---
const AssetWizard = ({ asset, onBack, onSaveSuccess }: { asset?: any, onBack: () => void, onSaveSuccess: () => void }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    
    const methods = useForm<AssetWizardFormValues>({
        resolver: zodResolver(formSchema),
        mode: 'onChange',
        defaultValues: asset || { clientId: '', agreementId: '', asset: {}, documents: {} },
    });

    const handleNext = async () => {
        const currentStepConfig = wizardSteps[currentStep];
        const isValid = currentStepConfig.fields ? await methods.trigger(currentStepConfig.fields as any) : true;
        if (isValid && currentStep < wizardSteps.length - 1) setCurrentStep(prev => prev + 1);
        else if (!isValid) toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill in all required fields.' });
    };
    
    const handleBack = () => { currentStep > 0 ? setCurrentStep(prev => prev - 1) : onBack(); };
    
    const onSubmit = async (values: AssetWizardFormValues) => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'saveLendingAsset', payload: { asset: { id: asset?.id, ...values } } }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            toast({ title: asset ? 'Asset Updated' : 'Asset Created' });
            onSaveSuccess();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error saving asset', description: e.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    const renderStepContent = () => {
        switch(wizardSteps[currentStep].id) {
            case 'client': return <StepSelectClient />;
            case 'agreement': return <StepSelectAgreement />;
            case 'asset': return <StepAssetDetails />;
            case 'documents': return <StepDocuments />;
            case 'review': return <StepReview />;
            default: return null;
        }
    };

    return (
        <Card>
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader><CardTitle>{asset ? 'Edit Asset' : 'Onboard New Asset'}</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
                            <div className="flex flex-col gap-2 border-r pr-4">
                                {wizardSteps.map((step, index) => (
                                    <Button key={step.id} variant={currentStep === index ? 'default' : 'ghost'} className="justify-start gap-2" onClick={() => setCurrentStep(index)} disabled={index > currentStep && !methods.formState.isValid}>
                                        {currentStep > index ? <Check className="h-5 w-5 text-green-500" /> : <div className="h-5 w-5" />} {step.name}
                                    </Button>
                                ))}
                            </div>
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold">{wizardSteps[currentStep].name}</h2>
                                {renderStepContent()}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-between">
                        <Button type="button" variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                        {currentStep < wizardSteps.length - 1 ? <Button type="button" onClick={handleNext}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button> : <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Asset</Button>}
                    </CardFooter>
                </form>
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
    const firestore = useFirestore();

    const assetsQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'assets')) : null, [firestore]);
    const { data: assets, isLoading, forceRefresh } = useCollection(assetsQuery);
    
    const clientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingClients')) : null, [firestore]);
    const { data: clients } = useCollection(clientsQuery);
    
    const clientMap = useMemo(() => {
        if (!clients) return new Map();
        return new Map(clients.map(c => [c.id, c.name]));
    }, [clients]);

    const enrichedAssets = useMemo(() => {
        return (assets || []).map(asset => ({ ...asset, clientName: clientMap.get(asset.clientId) || asset.clientId }));
    }, [assets, clientMap]);

    const handleEdit = useCallback((asset: any) => {
        setSelectedAsset(asset);
        setView('edit');
    }, []);
    
    const handleSaveSuccess = () => {
        forceRefresh();
        setView('list');
        setSelectedAsset(null);
    };

    const columns: ColumnDef<any>[] = useMemo(() => [
        { accessorKey: 'id', header: 'Asset ID' },
        { accessorKey: 'assetDescription', header: 'Description', cell: ({row}) => <div>{row.original.make} {row.original.model}</div>},
        { accessorKey: 'clientName', header: 'Client' },
        { accessorKey: 'agreementId', header: 'Agreement ID' },
        { id: 'actions', header: () => <div className="text-right">Actions</div>, cell: ({ row }) => <div className="text-right"><Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>Edit</Button></div> }
    ], [handleEdit]);

    if (view === 'create' || view === 'edit') {
        return <AssetWizard asset={selectedAsset} onBack={() => setView('list')} onSaveSuccess={handleSaveSuccess} />;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div><CardTitle className="flex items-center gap-2"><Truck /> Asset Register</CardTitle><CardDescription>Manage all financed assets.</CardDescription></div>
                <Button onClick={() => setView('create')}><PlusCircle className="mr-2 h-4 w-4" /> Add New Asset</Button>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                    <DataTable columns={columns} data={enrichedAssets} />
                )}
            </CardContent>
        </Card>
    );
}
