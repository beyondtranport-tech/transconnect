
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, FormProvider, useFieldArray, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, Save, Truck, Image as ImageIcon, FileText, CheckCircle, UploadCloud, Trash2, Wand2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { provinces } from '@/lib/geodata';


const listingSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().min(4, "Please select a year"),
  price: z.coerce.number().positive("Price must be a positive number"),
  description: z.string().min(10, "Please provide a more detailed description"),
  mileage: z.coerce.number().min(0).optional(),
  location: z.string().min(1, "Location is required"),
  photos: z.array(z.string().url()).optional().default([]),
});

type ListingFormValues = z.infer<typeof listingSchema>;

const wizardSteps = [
    { id: 'details', name: 'Vehicle Details', fields: ['make', 'model', 'year', 'price', 'mileage', 'location', 'description'] },
    { id: 'photos', name: 'Photos', fields: [] },
    { id: 'commercials', name: 'Commercials', fields: [] },
    { id: 'publish', name: 'Publish', fields: [] },
];

const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
});

const vehicleMakes = [
  { id: 'scania', name: 'Scania' },
  { id: 'volvo', name: 'Volvo' },
  { id: 'mercedes-benz', name: 'Mercedes-Benz' },
  { id: 'man', name: 'MAN' },
  { id: 'freightliner', name: 'Freightliner' },
  { id: 'henred-fruehauf', name: 'Henred Fruehauf' },
  { id: 'afrit', name: 'Afrit' },
  { id: 'other', name: 'Other' },
];

const vehicleModels: { [key: string]: { id: string; name: string }[] } = {
  scania: [{ id: 'r-series', name: 'R-Series' }, { id: 'g-series', name: 'G-Series' }, { id: 'p-series', name: 'P-Series' }],
  volvo: [{ id: 'fh-series', name: 'FH Series' }, { id: 'fm-series', name: 'FM Series' }, { id: 'fmx-series', name: 'FMX Series' }],
  'mercedes-benz': [{ id: 'actros', name: 'Actros' }, { id: 'axor', name: 'Axor' }, { id: 'atego', name: 'Atego' }],
  man: [{ id: 'tgx', name: 'TGX' }, { id: 'tgs', name: 'TGS' }, { id: 'tgm', name: 'TGM' }],
  freightliner: [{ id: 'cascadia', name: 'Cascadia' }, { id: 'argosy', name: 'Argosy' }],
  'henred-fruehauf': [{ id: 'tautliner', name: 'Tautliner' }, { id: 'flatdeck', name: 'Flatdeck' }, { id: 'refrigerated', name: 'Refrigerated' }],
  afrit: [{ id: 'side-tipper', name: 'Side Tipper' }, { id: 'interlink', name: 'Interlink' }],
  other: [{ id: 'custom', name: 'Custom/Other' }],
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => ({ id: (currentYear - i).toString(), name: (currentYear - i).toString() }));

const locations = provinces.flatMap(p => p.cities.map(c => `${c}, ${p.name}`));


const StepDetails = () => {
    const { control, watch, setValue } = useFormContext<ListingFormValues>();
    const selectedMake = watch('make');

    const models = useMemo(() => {
        if (!selectedMake) return [];
        return vehicleModels[selectedMake] || [];
    }, [selectedMake]);

    useEffect(() => {
        if (selectedMake && models.length > 0) {
            const currentModel = watch('model');
            if (currentModel && !models.some(m => m.id === currentModel)) {
                setValue('model', '');
            }
        }
    }, [selectedMake, models, setValue, watch]);

    return (
        <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                    control={control}
                    name="make"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Make</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select make..." /></SelectTrigger></FormControl>
                                <SelectContent>{vehicleMakes.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={control}
                    name="model"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Model</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedMake}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select model..." /></SelectTrigger></FormControl>
                                <SelectContent>{models.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={control}
                    name="year"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Year</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select year..." /></SelectTrigger></FormControl>
                                <SelectContent>{years.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={control} name="price" render={({ field }) => <FormItem><FormLabel>Price (R)</FormLabel><FormControl><Input type="number" placeholder="e.g., 1200000" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={control} name="mileage" render={({ field }) => <FormItem><FormLabel>Mileage (km, optional)</FormLabel><FormControl><Input type="number" placeholder="e.g., 350000" {...field} /></FormControl><FormMessage /></FormItem>} />
            </div>
            <FormField
                control={control}
                name="location"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="e.g., Johannesburg, Gauteng" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField control={control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the vehicle's condition, features, and history..." {...field} rows={6}/></FormControl><FormMessage /></FormItem>} />
        </div>
    );
};

const StepPhotos = () => {
    const { control } = useFormContext<ListingFormValues>();
    const { fields, append, remove } = useFieldArray({ control, name: "photos" });
    const { user } = useUser();
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setUploading(true); setProgress(10);
        try {
            const token = await getClientSideAuthToken(); if (!token) throw new Error("Authentication failed.");
            const fileDataUri = await fileToDataUri(file); setProgress(30);
            const folder = `user-assets/${user.uid}/vehicle-listings`; const fileName = `${Date.now()}_${file.name}`;
            const response = await fetch('/api/uploadImageAsset', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ fileDataUri, folder, fileName }) });
            setProgress(80);
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Upload failed.');
            append(result.url);
            setProgress(100);
            toast({ title: 'Image Uploaded' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
        } finally {
            setUploading(false); setProgress(0);
        }
    };
    
    return (
        <div className="space-y-4">
            <div className="p-4 border rounded-md bg-muted/50 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {fields.map((field, index) => (
                         <div key={field.id} className="relative aspect-square">
                            <Image src={field.value} alt={`Vehicle photo ${index + 1}`} fill className="object-cover rounded-md border" />
                            <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => remove(index)} disabled={uploading}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                     <label htmlFor="photo-upload" className="relative aspect-square flex items-center justify-center border-2 border-dashed rounded-md cursor-pointer hover:bg-accent hover:border-primary transition-colors">
                        <div className="text-center">
                            <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground"/>
                            <span className="text-sm text-muted-foreground">Upload Photo</span>
                        </div>
                    </label>
                    <Input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                </div>
                {uploading && (
                    <div className="space-y-1">
                        <Progress value={progress} className="h-2"/>
                    </div>
                )}
            </div>
        </div>
    );
};

export function VehicleWizard({ listing, companyId, onBack, onSaveSuccess }: { listing?: any; companyId: string; onBack: () => void; onSaveSuccess: () => void; }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const methods = useForm<ListingFormValues>({
        resolver: zodResolver(listingSchema),
        mode: 'onChange',
        defaultValues: listing || { photos: [] },
    });

    const handleNext = async () => {
        const step = wizardSteps[currentStep];
        const isValid = await methods.trigger(step.fields as (keyof ListingFormValues)[]);
        if (isValid && currentStep < wizardSteps.length - 1) {
            setCurrentStep(s => s + 1);
        } else if (!isValid) {
            toast({ variant: 'destructive', title: 'Please complete all fields.' });
        }
    };

    const handleBackWizard = () => { currentStep > 0 ? setCurrentStep(prev => prev - 1) : onBack(); };

    const onSubmit = async (values: ListingFormValues) => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");

            const path = `companies/${companyId}/vehicleListings`;
            const dataToSave = { ...values, companyId };
            
            const response = await fetch(listing?.id ? '/api/updateUserDoc' : '/api/addUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(listing?.id ? { path: `${path}/${listing.id}`, data: dataToSave } : { collectionPath: path, data: dataToSave }),
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            toast({ title: listing?.id ? 'Listing Updated' : 'Listing Created' });
            onSaveSuccess();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error saving asset', description: e.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    const isStepValid = (stepIndex: number) => {
        if (stepIndex < 0) return true;
        const step = wizardSteps[stepIndex];
        if (!step.fields || step.fields.length === 0) return true;
        const fields = step.fields as (keyof ListingFormValues)[];
        return fields.every(field => !methods.formState.errors[field as keyof typeof methods.formState.errors]);
    };
    
     const renderStepContent = () => {
        switch (wizardSteps[currentStep].id) {
            case 'details': return <StepDetails />;
            case 'photos': return <StepPhotos />;
            default: return <div className="text-center py-10"><p className="text-muted-foreground">This step is under construction.</p></div>;
        }
    };
    
    return (
        <Card className="w-full">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <h2 className="text-2xl font-bold font-headline">{listing ? 'Edit Vehicle Listing' : 'Create New Vehicle Listing'}</h2>
                                <p className="text-muted-foreground">{wizardSteps[currentStep].name}</p>
                            </div>
                             <Button type="button" variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4"/> Back to List</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
                             <div className="flex flex-col gap-2 border-r pr-4">
                                {wizardSteps.map((step, index) => {
                                    const isCompleted = index < currentStep && isStepValid(index);
                                    const Icon = step.icon;
                                    return (
                                        <Button key={step.id} variant={currentStep === index ? 'default' : 'ghost'} className="justify-start gap-2" onClick={() => setCurrentStep(index)} disabled={index > currentStep && !isStepValid(currentStep - 1)}>
                                            {isCompleted ? <Check className="h-5 w-5 text-green-500" /> : <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold", currentStep >= index ? "bg-primary-foreground text-primary" : "bg-muted-foreground/20")}>{index + 1}</div>}
                                            {step.name.replace(/^Step \d+: /, '')}
                                        </Button>
                                    );
                                })}
                            </div>
                             <div className="min-h-[400px]">
                                {renderStepContent()}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-6 border-t">
                        <Button type="button" variant="outline" onClick={handleBackWizard}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                        {currentStep < wizardSteps.length - 1 ? (
                            <Button type="button" onClick={handleNext}>Next Step <ArrowRight className="ml-2 h-4 w-4"/></Button>
                        ) : (
                            <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Listing</Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
