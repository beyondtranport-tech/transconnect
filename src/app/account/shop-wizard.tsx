
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, FormProvider, useFormContext, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { 
    Loader2, Save, CheckCircle, Truck, MapPin, 
    DollarSign, ArrowRight, ArrowLeft, ImageIcon, 
    Warehouse, Banknote, ShieldCheck, UserCheck, Smartphone, PackageSearch,
    ClipboardList, Sparkles, Store, Gavel, FileUp, Trash2, PlusCircle, 
    Package, Info, Navigation, Search, HelpCircle, Users, FileText, Camera,
    ShoppingCart
} from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, formatCurrency, formatDateSafe } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { collection, query, orderBy, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { provinces } from '@/lib/geodata';
import { Checkbox } from '@/components/ui/checkbox';

// ====== DATA SOURCES ======
const locations = provinces.flatMap(p => p.cities.map(c => `${c}, ${p.name}`));
const freightClassifications = ["Long Haul", "LTL", "Container", "Refrigerated", "Local Distribution", "Abnormal"];
const vehicleClasses = ["Heavy Truck (Horse)", "Trailer", "Rigid Truck (8t-14t)", "Light Commercial (Bakkie)", "Bus", "Passenger Vehicle", "Other"];

// ====== SCHEMAS ======

const loadOpportunitySchema = z.object({
    origin: z.string().min(1, "Origin hub required."),
    destination: z.string().min(1, "Destination hub required."),
    rate: z.coerce.number().positive("Rate required."),
    pickupDate: z.string().min(1, "Required."),
    dropoffDate: z.string().min(1, "Required."),
    conditions: z.string().optional(),
});

const vehicleListingSchema = z.object({
    make: z.string().min(1, "Make required."),
    model: z.string().min(1, "Model required."),
    year: z.string().min(4, "Year required."),
    price: z.coerce.number().positive("Price required."),
    location: z.string().min(1, "Location required."),
    serviceHistory: z.string().optional(),
    description: z.string().min(10, "Detail required."),
    photoUrl: z.string().min(1, "Photo required."),
    rc1Url: z.string().min(1, "RC1 required."),
    licenseUrl: z.string().min(1, "License required."),
});

const fleetAssetSchema = z.object({
    make: z.string().min(1, "Make required."),
    model: z.string().min(1, "Model required."),
    year: z.string().min(4, "Year required."),
    vClass: z.string().min(1, "Class required."),
    photoUrl: z.string().min(1, "Vehicle photo required."),
    rc1Url: z.string().min(1, "RC1 Document required."),
    licenseUrl: z.string().min(1, "License Disk required."),
});

const nodeFormSchema = z.object({
  shopName: z.string().min(1, "Identity label is required."),
  category: z.string().min(1, "Classification required."),
  contactEmail: z.string().email("Valid email required.").optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  homeHeading: z.string().min(5, "Headline required."),
  aboutText: z.string().min(20, "Summary required."),
  logoUrl: z.string().optional(),
  primaryContractUrl: z.string().optional(),
  subcontractorAgreementUrl: z.string().optional(),
  brokerageMargin: z.coerce.number().min(0).max(50).default(5),
  availablePallets: z.coerce.number().min(0).optional(),
  upliftFee: z.coerce.number().min(0).optional(),
  placementFee: z.coerce.number().min(0).optional(),
  monthlyStorageFee: z.coerce.number().min(0).optional(),
});

type NodeFormValues = z.infer<typeof nodeFormSchema>;

// ====== SHARED UI COMPONENTS ======

function FileUploadField({ name, label, folder, variant = 'standard', onUploadSuccess }: { name: string, label: string, folder: string, variant?: 'standard' | 'compact', onUploadSuccess?: (url: string) => void }) {
    const { setValue, watch } = useFormContext<any>();
    const [isUploading, setIsUploading] = useState(false);
    const { user } = useUser();
    const { toast } = useToast();
    const currentUrl = watch(name);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setIsUploading(true);
        try {
            const token = await getClientSideAuthToken();
            const reader = new FileReader();
            const dataUri = await new Promise<string>(res => {
                reader.onload = () => res(reader.result as string);
                reader.readAsDataURL(file);
            });
            const response = await fetch('/api/uploadImageAsset', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileDataUri: dataUri, folder: `${folder}/${user.uid}`, fileName: `${name}_${Date.now()}_${file.name}` })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            if (onUploadSuccess) {
                onUploadSuccess(result.url);
            } else {
                setValue(name, result.url, { shouldValidate: true });
            }
            toast({ title: "Document Attached" });
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Upload Failed", description: e.message });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-2 text-left">
            {variant === 'standard' && <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{label}</Label>}
            <Button type="button" variant="outline" className={cn("w-full h-12 border-2 border-dashed", currentUrl && "border-solid border-green-500 bg-green-50 text-green-700")} onClick={() => document.getElementById(`up-${name}`)?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="animate-spin h-4 w-4" /> : currentUrl ? <CheckCircle className="h-4 w-4 mr-2" /> : <FileUp className="h-4 w-4 mr-2" />}
                {currentUrl ? "File Attached" : `Select ${label}`}
            </Button>
            <input id={`up-${name}`} type="file" className="hidden" onChange={handleUpload} />
        </div>
    );
}

// ====== STEP COMPONENTS ======

function StepLegal() {
    return (
        <div className="space-y-8 text-left text-foreground">
            <h3 className="text-xl font-black font-headline flex items-center gap-2">
                <Gavel className="h-6 w-6 text-primary" />
                Legal Authorization
            </h3>
            <div className="space-y-6 text-left">
                <Alert className="bg-primary/5 border-primary/20 text-left">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <AlertTitle className="font-bold">Subcontracting Audit</AlertTitle>
                    <AlertDescription className="text-xs leading-relaxed">
                        You must provide evidence of your operating rights. For brokers, this includes subcontracting clauses. For hauliers, this is your operator permit.
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <FileUploadField name="primaryContractUrl" label="Operating Authority / Contract" folder="legal-docs" />
                    <FileUploadField name="subcontractorAgreementUrl" label="Master Sub-contractor Agreement" folder="legal-docs" />
                </div>
            </div>
        </div>
    );
}

function StepIdentity({ nodeType }: { nodeType: string }) {
    const { control, setValue, watch } = useFormContext<NodeFormValues>();
    const companyName = watch('shopName');
    const { user } = useUser();

    useEffect(() => {
        if (!companyName && user?.displayName) {
            const label = nodeType === 'loads' ? 'Loads Shop' : nodeType === 'warehouse' ? 'Warehouse Hub' : nodeType === 'transport' ? 'Fleet Node' : nodeType === 'buy-sell' ? 'Marketplace Profile' : 'Node';
            setValue('shopName', `${user.displayName}'s ${label}`);
        }
    }, [nodeType, companyName, setValue, user]);

    return (
        <div className="space-y-6 text-left text-foreground">
            <h3 className="text-xl font-black font-headline flex items-center gap-2">
                <UserCheck className="h-6 w-6 text-primary" /> 
                Node Identity & Labeling
            </h3>
            <div className="space-y-4 text-left">
                <FormField control={control} name="shopName" render={({ field }) => ( 
                    <FormItem>
                        <FormLabel>Public Identity Label</FormLabel>
                        <FormControl><Input {...field} className="h-11 border-2 bg-white" /></FormControl>
                        <FormMessage />
                    </FormItem> 
                )} />
                <FormField control={control} name="category" render={({ field }) => ( 
                    <FormItem>
                        <FormLabel>Primary Node Classification</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="h-11 border-2 bg-white text-left"><SelectValue placeholder="Select classification..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                {nodeType === 'warehouse' ? (
                                    <>
                                        <SelectItem value="Cold Storage">Cold Storage</SelectItem>
                                        <SelectItem value="Bulk General">Bulk General</SelectItem>
                                        <SelectItem value="Hazmat">Hazmat Storage</SelectItem>
                                        <SelectItem value="Distribution Hub">Distribution Hub</SelectItem>
                                    </>
                                ) : nodeType === 'transport' ? (
                                    <>
                                        <SelectItem value="Refrigerated">Refrigerated</SelectItem>
                                        <SelectItem value="Long-Haul Tipper">Long-Haul Tipper</SelectItem>
                                        <SelectItem value="General Freight">General Freight</SelectItem>
                                        <SelectItem value="Flatbed Specialists">Flatbed Specialists</SelectItem>
                                    </>
                                ) : nodeType === 'buy-sell' ? (
                                    <>
                                        <SelectItem value="Commercial Dealer">Commercial Dealer</SelectItem>
                                        <SelectItem value="Private Fleet Seller">Private Fleet Seller</SelectItem>
                                        <SelectItem value="Salvage Operator">Salvage Operator</SelectItem>
                                    </>
                                ) : (
                                    freightClassifications.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)
                                )}
                            </SelectContent>
                        </Select>
                    </FormItem> 
                )} />
            </div>
        </div>
    );
}

function StepWarehouseFees() {
    const { control } = useFormContext<NodeFormValues>();
    return (
        <div className="space-y-8 text-left text-foreground">
            <h3 className="text-xl font-black font-headline flex items-center gap-2">
                <Banknote className="h-6 w-6 text-primary" />
                Storage Yield Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="space-y-6">
                    <FormField control={control} name="availablePallets" render={({ field }) => (
                        <FormItem><FormLabel>Current Pallet Positions</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2" /></FormControl></FormItem>
                    )} />
                    <FormField control={control} name="monthlyStorageFee" render={({ field }) => (
                        <FormItem><FormLabel>Monthly Storage Rate (per plt)</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2" /></FormControl></FormItem>
                    )} />
                </div>
                <div className="space-y-6">
                    <FormField control={control} name="upliftFee" render={({ field }) => (
                        <FormItem><FormLabel>Inbound Handling (Uplift)</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2" /></FormControl></FormItem>
                    )} />
                    <FormField control={control} name="placementFee" render={({ field }) => (
                        <FormItem><FormLabel>Outbound Handling (Placement)</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2" /></FormControl></FormItem>
                    )} />
                </div>
            </div>
        </div>
    );
}

function StepBrokerageCommercials() {
    const { control, watch } = useFormContext<NodeFormValues>();
    const margin = watch('brokerageMargin') || 5;

    return (
        <div className="space-y-8 text-left text-foreground">
            <h3 className="text-xl font-black font-headline flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-primary" />
                Commercial Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="p-6 border-2 border-primary bg-primary/5 rounded-3xl space-y-4">
                    <FormField control={control} name="brokerageMargin" render={({ field }) => (
                        <FormItem className="text-left">
                            <FormLabel className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2">
                                Your Clearing Margin (%)
                                <HelpCircle className="h-3 w-3 opacity-50" />
                            </FormLabel>
                            <FormControl><Input type="number" {...field} className="h-12 text-2xl font-black bg-white" /></FormControl>
                            <FormDescription className="text-[10px] leading-tight mt-2 font-bold text-primary">
                                The profit you, as the Primary Contractor (Broker), retain from the total load value for your role in securing the freight.
                            </FormDescription>
                        </FormItem>
                    )} />
                </div>
                <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-2 shadow-xl flex flex-col justify-center text-left">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                        Platform Success Fee
                        <ShieldCheck className="h-3 w-3 text-primary" />
                    </p>
                    <p className="text-4xl font-black text-primary">2.5%</p>
                    <p className="text-[10px] text-slate-400 leading-tight pt-2 italic">
                        The fee paid to Logistics Flow for the forensic match and automated documentation.
                    </p>
                </div>
            </div>

            <Card className="border-none bg-slate-50 shadow-inner text-left text-foreground">
                <CardContent className="p-6 text-left text-foreground">
                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2 text-left">
                        <Info className="h-4 w-4 text-primary" />
                        Commercial Transparency Breakdown
                    </h4>
                    <div className="space-y-2 text-sm text-left">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Total Load Value (Example)</span>
                            <span className="font-bold">R 10,000.00</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Your Clearing Margin ({margin}%)</span>
                            <span className="font-bold text-green-600">+ R {(10000 * (margin/100)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Platform Success Fee (2.5%)</span>
                            <span className="font-bold text-slate-600">- R 250.00</span>
                        </div>
                        <div className="flex justify-between pt-2">
                            <span className="font-black uppercase text-xs">Available Haulier Payout</span>
                            <span className="font-black text-primary">R {(10000 - (10000 * (margin/100)) - 250).toFixed(2)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ====== INTERNAL TERMINALS FOR ASSETS AND LOADS ======

function AssetDialogContent({ shop, mode, onComplete }: { shop: any, mode: 'fleet' | 'sale', onComplete: () => void }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const form = useForm({ 
        resolver: zodResolver(mode === 'fleet' ? fleetAssetSchema : vehicleListingSchema),
        defaultValues: { photoUrl: '', rc1Url: '', licenseUrl: '', status: 'active' } 
    });

    const onSubmit = async (values: any) => {
        setLoading(true);
        try {
            const token = await getClientSideAuthToken();
            const collectionPath = mode === 'fleet' 
                ? `companies/${shop.companyId}/assets` 
                : `companies/${shop.companyId}/vehicleListings`;
            
            const res = await fetch('/api/addUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    collectionPath,
                    data: { ...values, status: 'active', type: 'vehicle', createdAt: { _methodName: 'serverTimestamp' } }
                })
            });
            if (!res.ok) throw new Error("Failed to register asset.");
            toast({ title: mode === 'fleet' ? "Asset Registered" : "Listing Published" });
            onComplete();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DialogContent className="sm:max-w-2xl text-left text-foreground">
            <DialogHeader>
                <DialogTitle>{mode === 'fleet' ? 'Register Fleet Asset (RC1)' : 'List Vehicle for Sale'}</DialogTitle>
                <DialogDescription>Attach verified documents and technical specifics.</DialogDescription>
            </DialogHeader>
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 text-left">
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <FormField control={form.control} name="make" render={({ field }) => (<FormItem><FormLabel>Make</FormLabel><FormControl><Input placeholder="e.g. Scania" {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="model" render={({ field }) => (<FormItem><FormLabel>Model</FormLabel><FormControl><Input placeholder="e.g. R560" {...field} /></FormControl></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-left">
                         <FormField control={form.control} name="year" render={({ field }) => (<FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" placeholder="20XX" {...field} /></FormControl></FormItem>)} />
                         {mode === 'fleet' ? (
                             <FormField control={form.control} name="vClass" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Asset Class</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>{vehicleClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                    </Select>
                                </FormItem>
                             ) } />
                         ) : (
                            <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Sales Price (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                         )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FileUploadField name="photoUrl" label="Primary Photo" folder="fleet-photos" />
                        <FileUploadField name="rc1Url" label="RC1 Doc" folder="fleet-docs" />
                        <FileUploadField name="licenseUrl" label="License Disk" folder="fleet-docs" />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full h-12 font-bold uppercase tracking-widest">
                            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                            Commit to Node
                        </Button>
                    </DialogFooter>
                </form>
            </FormProvider>
        </DialogContent>
    );
}

function LoadOpportunityDialogContent({ shop, onComplete }: { shop: any, onComplete: () => void }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const form = useForm({ resolver: zodResolver(loadOpportunitySchema), defaultValues: { origin: '', destination: '', rate: 0, pickupDate: '', dropoffDate: '', conditions: '' } });

    const onSubmit = async (values: any) => {
        setLoading(true);
        try {
            const token = await getClientSideAuthToken();
            const res = await fetch('/api/addUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    collectionPath: `companies/${shop.companyId}/loads`,
                    data: { ...values, status: 'active', brokerId: shop.companyId, brokerName: shop.shopName, createdAt: { _methodName: 'serverTimestamp' } }
                })
            });
            if (!res.ok) throw new Error("Failed to post load.");
            toast({ title: "Load Posted Successfully" });
            onComplete();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DialogContent className="sm:max-w-xl text-left text-foreground">
            <DialogHeader>
                <DialogTitle>Post Freight Opportunity</DialogTitle>
                <DialogDescription>Define the operational parameters for this freight instruction.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 text-left">
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <FormField control={form.control} name="origin" render={({ field }) => (
                            <FormItem className="text-left">
                                <FormLabel>Origin Hub</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger className="bg-white text-left"><SelectValue placeholder="Select origin..." /></SelectTrigger></FormControl>
                                    <SelectContent>{locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}</SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="destination" render={({ field }) => (
                            <FormItem className="text-left">
                                <FormLabel>Destination Hub</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger className="bg-white text-left"><SelectValue placeholder="Select destination..." /></SelectTrigger></FormControl>
                                    <SelectContent>{locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}</SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                        <FormField control={form.control} name="rate" render={({ field }) => (<FormItem><FormLabel>Target Rate (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="pickupDate" render={({ field }) => (<FormItem><FormLabel>Pickup</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="dropoffDate" render={({ field }) => (<FormItem><FormLabel>Drop-off</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="conditions" render={({ field }) => (<FormItem><FormLabel>Commercial Conditions</FormLabel><FormControl><Textarea placeholder="Specific equipment or insurance rules..." {...field} /></FormControl></FormItem>)} />
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            List Load Opportunity
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    );
}

// ====== MAIN WIZARD ======

function StepLoadBoard({ shop }: { shop: any }) {
    const firestore = useFirestore();
    const [isAdding, setIsAdding] = useState(false);
    const collectionPath = `companies/${shop.companyId}/loads`;
    const loadsQuery = useMemoFirebase(() => {
        if (!firestore || !shop?.companyId) return null;
        return query(collection(firestore, collectionPath), orderBy('createdAt', 'desc'));
    }, [firestore, shop.companyId, collectionPath]);
    const { data: loads, forceRefresh } = useCollection(loadsQuery);

    return (
        <div className="space-y-6 text-left text-foreground">
            <div className="flex justify-between items-center border-b pb-4 text-left">
                <div className="text-left">
                    <h3 className="text-xl font-black font-headline">Active Load Registry</h3>
                    <p className="text-xs text-muted-foreground">Manage your freight opportunities directly within your node.</p>
                </div>
                <Dialog open={isAdding} onOpenChange={setIsAdding}>
                    <DialogTrigger asChild><Button className="gap-2 font-bold"><PlusCircle className="h-4 w-4" /> Post New Load</Button></DialogTrigger>
                    <LoadOpportunityDialogContent shop={shop} onComplete={() => { forceRefresh(); setIsAdding(false); }} />
                </Dialog>
            </div>
            <div className="min-h-[300px] text-left">
                {loads && loads.length > 0 ? (
                    <DataTable 
                        data={loads}
                        columns={[
                            { header: 'Route', cell: ({row}) => <div className="font-bold flex items-center gap-2">{row.original.origin} <ArrowRight className="h-3 w-3 opacity-30" /> {row.original.destination}</div> },
                            { header: 'Rate', cell: ({row}) => <span className="font-black text-primary">{formatCurrency(row.original.rate)}</span> },
                            { header: 'Dates', cell: ({row}) => <div className="text-[10px] font-bold text-muted-foreground uppercase">{formatDateSafe(row.original.pickupDate, "dd MMM")} - {formatDateSafe(row.original.dropoffDate, "dd MMM")}</div> }
                        ]}
                    />
                ) : (
                    <div className="py-20 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
                        <PackageSearch className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-4 text-center">No loads listed in this node.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StepAssetRegistry({ shop, mode }: { shop: any, mode: 'fleet' | 'sale' }) {
    const firestore = useFirestore();
    const [isAdding, setIsAdding] = useState(false);
    const collectionPath = mode === 'fleet' ? `companies/${shop.companyId}/assets` : `companies/${shop.companyId}/vehicleListings`;
    const assetsQuery = useMemoFirebase(() => {
        if (!firestore || !shop?.companyId) return null;
        return query(collection(firestore, collectionPath), orderBy('createdAt', 'desc'));
    }, [firestore, shop.companyId, collectionPath]);
    const { data: assets, forceRefresh } = useCollection(assetsQuery);

    return (
        <div className="space-y-6 text-left text-foreground">
            <div className="flex justify-between items-center border-b pb-4 text-left">
                <div className="text-left">
                    <h3 className="text-xl font-black font-headline">{mode === 'fleet' ? 'Verified Fleet Roster' : 'Active Sales Inventory'}</h3>
                    <p className="text-xs text-muted-foreground">Manage your RC1-vetted assets for this node.</p>
                </div>
                <Dialog open={isAdding} onOpenChange={setIsAdding}>
                    <DialogTrigger asChild><Button className="gap-2 font-bold"><PlusCircle className="h-4 w-4" /> Add Asset</Button></DialogTrigger>
                    <AssetDialogContent shop={shop} mode={mode} onComplete={() => { forceRefresh(); setIsAdding(false); }} />
                </Dialog>
            </div>
            <div className="min-h-[300px]">
                {assets && assets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                        {assets.map(asset => (
                            <Card key={asset.id} className="overflow-hidden border-none shadow-md bg-white text-left">
                                <div className="relative aspect-video bg-muted">
                                    {asset.photoUrl && <Image src={asset.photoUrl} alt={asset.make} fill className="object-cover" />}
                                    <div className="absolute top-2 right-2"><Badge className="bg-green-600 text-white font-bold text-[9px] uppercase">Verified</Badge></div>
                                </div>
                                <CardContent className="p-4 text-left">
                                    <p className="font-bold text-sm text-left">{asset.year} {asset.make} {asset.model}</p>
                                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mt-1 text-left">{asset.vClass || asset.location}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
                        <Truck className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-4 text-center">No records found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StepPublish({ shop, onSave }: { shop: any, onSave: () => void }) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const handlePublish = async () => {
        setLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            await fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: `companies/${shop.companyId}/shops/${shop.id}`, data: { status: 'pending_review', updatedAt: { _methodName: 'serverTimestamp' } } }),
            });
            toast({ title: "Node Submitted for Review" });
            onSave();
        } catch (e) { toast({ variant: 'destructive', title: 'Submission Failed' }); }
        finally { setLoading(false); }
    };
    return (
        <div className="text-center py-16 space-y-8 animate-in fade-in zoom-in duration-500 text-left text-foreground">
            <div className="bg-primary/10 p-6 rounded-full w-fit mx-auto shadow-sm"><CheckCircle className="h-16 w-16 text-primary" /></div>
            <div className="space-y-2 text-center text-foreground">
                <h3 className="text-3xl font-black font-headline text-center">Node Handshake Ready</h3>
                <p className="text-muted-foreground max-w-sm mx-auto text-center">Your industrial parameters are ready for auditing. Once activated, your node will be visible across the specified malls.</p>
            </div>
            <div className="flex justify-center">
              <Button onClick={handlePublish} disabled={loading} size="lg" className="h-16 px-12 text-lg font-black uppercase tracking-tight shadow-xl">
                  {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin"/> : <Smartphone className="mr-2 h-6 w-6"/>}
                  Activate Commercial Hub
              </Button>
            </div>
        </div>
    );
}

export function ShopWizard({ shop, nodeType, onUpdate }: { shop: any, nodeType: string, onUpdate: () => void }) {
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const methods = useForm<NodeFormValues>({
        resolver: zodResolver(nodeFormSchema),
        mode: 'onChange',
        defaultValues: { 
            shopName: shop.shopName || '',
            category: shop.category || '',
            contactEmail: shop.contactEmail || '',
            contactPhone: shop.contactPhone || '',
            homeHeading: shop.homeHeading || '',
            aboutText: shop.aboutText || '',
            logoUrl: shop.logoUrl || '',
            primaryContractUrl: shop.primaryContractUrl || '',
            subcontractorAgreementUrl: shop.subcontractorAgreementUrl || '',
            brokerageMargin: shop.brokerageMargin || 5,
            availablePallets: shop.availablePallets || 0,
            upliftFee: shop.upliftFee || 0,
            placementFee: shop.placementFee || 0,
            monthlyStorageFee: shop.monthlyStorageFee || 0,
        }
    });

    // Reset current step when nodeType changes to prevent out of bounds
    useEffect(() => {
        setCurrentStep(0);
    }, [nodeType]);

    const wizardSteps = useMemo(() => {
        if (nodeType === 'loads') {
            return [
                { id: 'legal', name: '1. Legal Rights', component: <StepLegal />, fields: ['primaryContractUrl', 'subcontractorAgreementUrl'] },
                { id: 'identity', name: '2. Hub Identity', component: <StepIdentity nodeType="loads" />, fields: ['shopName', 'category'] },
                { id: 'commercials', name: '3. Brokerage Config', component: <StepBrokerageCommercials />, fields: ['brokerageMargin'] },
                { id: 'board', name: '4. Active Load Board', component: <StepLoadBoard shop={shop} />, fields: [] },
                { id: 'publish', name: '5. Activate Hub', component: <StepPublish shop={shop} onSave={onUpdate} />, fields: [] },
            ];
        }
        if (nodeType === 'warehouse') {
            return [
                { id: 'identity', name: '1. Facility Identity', component: <StepIdentity nodeType="warehouse" />, fields: ['shopName', 'category'] },
                { id: 'fees', name: '2. Capacity & Fees', component: <StepWarehouseFees />, fields: ['availablePallets', 'monthlyStorageFee'] },
                { id: 'publish', name: '3. Activate Hub', component: <StepPublish shop={shop} onSave={onUpdate} />, fields: [] },
            ];
        }
        if (nodeType === 'transport') {
            return [
                { id: 'identity', name: '1. Fleet Identity', component: <StepIdentity nodeType="transport" />, fields: ['shopName', 'category'] },
                { id: 'roster', name: '2. Asset Roster', component: <StepAssetRegistry shop={shop} mode="fleet" />, fields: [] },
                { id: 'publish', name: '3. Activate Hub', component: <StepPublish shop={shop} onSave={onUpdate} />, fields: [] },
            ];
        }
        if (nodeType === 'buy-sell') {
            return [
                { id: 'identity', name: '1. Dealer Identity', component: <StepIdentity nodeType="buy-sell" />, fields: ['shopName', 'category'] },
                { id: 'inventory', name: '2. Vehicle Inventory', component: <StepAssetRegistry shop={shop} mode="sale" />, fields: [] },
                { id: 'publish', name: '3. Activate Hub', component: <StepPublish shop={shop} onSave={onUpdate} />, fields: [] },
            ];
        }
        return [
            { id: 'identity', name: '1. Identity', component: <StepIdentity nodeType={nodeType} />, fields: ['shopName', 'category'] },
            { id: 'publish', name: '2. Activate', component: <StepPublish shop={shop} onSave={onUpdate} />, fields: [] },
        ];
    }, [shop, nodeType, onUpdate]);

    const nodeTitleMap: Record<string, string> = {
        loads: "Brokerage Node Configuration",
        warehouse: "Warehouse Hub Terminal",
        transport: "Fleet Node Configuration",
        "buy-sell": "Marketplace Terminal",
        supplier: "Supplier Shop Wizard"
    };

    const handleNext = async () => {
        const step = wizardSteps[currentStep];
        if (!step) return;
        const isValid = step.fields && step.fields.length > 0 ? await methods.trigger(step.fields as any) : true;
        if (isValid && currentStep < wizardSteps.length - 1) setCurrentStep(prev => prev + 1);
    };

    return (
        <Card className="border-none shadow-xl bg-white overflow-hidden text-left text-foreground">
            <CardHeader className="bg-slate-50 border-b p-6 text-left">
                <div className="text-left">
                    <CardTitle className="text-2xl font-black font-headline text-left">{nodeTitleMap[nodeType] || "Industrial Node Configuration"}</CardTitle>
                    <CardDescription className="text-left">Establish legal and commercial parameters for this business unit.</CardDescription>
                </div>
                <Progress value={((currentStep + 1) / wizardSteps.length) * 100} className="h-2 mt-4" />
            </CardHeader>
            <CardContent className="p-0 text-left text-foreground">
                <FormProvider {...methods}>
                    <form className="grid grid-cols-1 md:grid-cols-[250px_1fr] text-left text-foreground">
                        <div className="bg-slate-50/50 border-r p-6 space-y-2 text-left">
                            {wizardSteps.map((step, index) => (
                                <Button 
                                    key={step.id} 
                                    type="button" 
                                    variant={currentStep === index ? 'secondary' : 'ghost'} 
                                    className={cn("w-full justify-start gap-3 h-12 px-4 transition-all text-left", currentStep === index && "bg-white shadow-sm ring-1 ring-primary/20")} 
                                    onClick={() => setCurrentStep(index)}
                                >
                                    <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs font-black shrink-0", currentStep >= index ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{index + 1}</div>
                                    <span className="font-bold text-[10px] uppercase tracking-widest text-foreground text-left">{step.name}</span>
                                </Button>
                            ))}
                        </div>
                        <div className="p-10 min-h-[500px] text-left text-foreground">
                            {wizardSteps[currentStep] ? (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-left">
                                    {wizardSteps[currentStep].component}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                                </div>
                            )}
                        </div>
                    </form>
                </FormProvider>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t p-6 flex justify-between text-left">
                <Button type="button" variant="ghost" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 0} className="font-bold">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <div className="flex gap-3 text-left">
                    <Button type="button" variant="outline" onClick={methods.handleSubmit(async (v) => {
                        setIsSaving(true);
                        try {
                            const token = await getClientSideAuthToken();
                            if (!token) return;
                            await fetch('/api/updateUserDoc', {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ path: `companies/${shop.companyId}/shops/${shop.id}`, data: { ...v, updatedAt: { _methodName: 'serverTimestamp' } } }),
                            });
                            toast({ title: 'Node Data Synced' });
                            onUpdate();
                        } catch (e) { toast({ variant: 'destructive', title: 'Sync Failed' }); }
                        finally { setIsSaving(false); }
                    })} disabled={isSaving} className="font-bold">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />} Sync Draft
                    </Button>
                    {currentStep < wizardSteps.length - 1 && (
                        <Button type="button" onClick={handleNext} className="font-bold px-8">Continue <ArrowRight className="ml-2 h-4 w-4"/></Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}
