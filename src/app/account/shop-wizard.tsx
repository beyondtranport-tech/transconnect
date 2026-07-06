'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, FormProvider, useFormContext, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { 
    Loader2, Save, CheckCircle, Truck, MapPin, 
    DollarSign, ArrowRight, ArrowLeft, ImageIcon, 
    Warehouse, Banknote, ShieldCheck, UserCheck, Smartphone, PackageSearch,
    ClipboardList, Sparkles, Store, Gavel, FileUp, Trash2, PlusCircle, 
    Package, Info, Navigation, Search, HelpCircle, Users, FileText, Camera,
    ShoppingCart, Wrench, Shield, Clock, Map, ListOrdered, FileSignature, Edit, Tag, History, Zap
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
import { collection, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { DataTable } from '@/components/ui/data-table';
import { provinces } from '@/lib/geodata';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supplierCategories } from '@/app/adminaccount/marketing/discovery-engine';

// ====== DATA SOURCES ======
const locations = provinces.flatMap(p => p.cities.map(c => `${c}, ${p.name}`));
const vehicleClasses = ["Heavy Truck (Horse)", "Trailer", "Rigid Truck (8t-14t)", "Light Commercial (Bakkie)", "Bus", "Passenger Vehicle", "Other"];

// ====== SCHEMAS ======

const routeRateSchema = z.object({
    origin: z.string().min(1, "Origin required"),
    destination: z.string().min(1, "Destination required"),
    price: z.coerce.number().positive("Price required"),
});

const productSchema = z.object({
    name: z.string().min(1, "Product name required."),
    description: z.string().min(10, "Provide a brief description."),
    price: z.coerce.number().positive("Price must be positive."),
    stock: z.coerce.number().int().min(0).default(0),
    imageUrls: z.array(z.string()).optional().default([]),
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
  services: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  racking: z.array(z.string()).default([]),
  imageUrls: z.array(z.string()).default([]),
  securityFeatures: z.array(z.string()).default([]),
  accessControl: z.string().optional(),
  rollerDoors: z.string().optional(),
  operatingHours: z.string().optional(),
  rateType: z.enum(['none', 'route', 'per_km']).default('none'),
  kmRate: z.coerce.number().min(0).optional(),
  routeRates: z.array(routeRateSchema).default([]),
  contractType: z.enum(['none', 'master', 'one_off']).default('none'),
  monthlyLoadTarget: z.coerce.number().min(0).optional(),
});

type NodeFormValues = z.infer<typeof nodeFormSchema>;

// ====== SHARED UI COMPONENTS ======

function FileUploadField({ 
    name, 
    label, 
    folder, 
    variant = 'standard', 
    onUploadSuccess 
}: { 
    name: string, 
    label: string, 
    folder: string, 
    variant?: 'standard' | 'compact', 
    onUploadSuccess?: (url: string) => void 
}) {
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
            <Button type="button" variant="outline" className={cn("w-full min-h-[3rem] h-auto border-2 border-dashed py-2 whitespace-normal leading-tight", currentUrl && "border-solid border-green-500 bg-green-50 text-green-700")} onClick={() => document.getElementById(`up-${name}`)?.click()} disabled={isUploading}>
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
            <div className="space-y-6">
                <Alert className="bg-primary/5 border-primary/20">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <AlertTitle className="font-bold text-left">Operational Compliance Audit</AlertTitle>
                    <AlertDescription className="text-xs leading-relaxed text-left">
                        You must provide evidence of your operating rights. This allows the platform to verify your node before it is published to the public mall.
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FileUploadField name="primaryContractUrl" label="Operating Authority / Contract" folder="legal-docs" />
                    <FileUploadField name="subcontractorAgreementUrl" label="Standard Terms of Business" folder="legal-docs" />
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
            const labelMap: Record<string, string> = {
                loads: 'Loads Hub',
                warehouse: 'Warehouse Hub',
                transport: 'Fleet Node',
                'buy-sell': 'Marketplace Profile',
                supplier: 'Supplier Store'
            };
            const label = labelMap[nodeType] || 'Node';
            setValue('shopName', `${user.displayName}'s ${label}`);
        }
    }, [nodeType, companyName, setValue, user]);

    return (
        <div className="space-y-6 text-left text-foreground">
            <h3 className="text-xl font-black font-headline flex items-center gap-2">
                <UserCheck className="h-6 w-6 text-primary" /> 
                Node Identity & Labeling
            </h3>
            <div className="space-y-4">
                <FormField control={control} name="shopName" render={({ field }) => ( 
                    <FormItem className="text-left">
                        <FormLabel>Public Identity Label</FormLabel>
                        <FormControl><Input {...field} className="h-11 border-2 bg-white" /></FormControl>
                        <FormMessage />
                    </FormItem> 
                )} />
                <FormField control={control} name="category" render={({ field }) => ( 
                    <FormItem className="text-left">
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
                                    supplierCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)
                                )}
                            </SelectContent>
                        </Select>
                    </FormItem> 
                )} />
            </div>
        </div>
    );
}

function StepBranding() {
    const { control } = useFormContext<NodeFormValues>();
    return (
        <div className="space-y-6 text-left text-foreground">
            <h3 className="text-xl font-black font-headline flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" /> 
                Branding & Narrative
            </h3>
            <div className="space-y-4 text-left">
                <FileUploadField name="logoUrl" label="Company Logo" folder="node-branding" />
                <FormField control={control} name="homeHeading" render={({ field }) => (
                    <FormItem className="text-left">
                        <FormLabel>Public Headline</FormLabel>
                        <FormControl><Input placeholder="e.g. Premium Cold Storage in City Deep" {...field} className="h-11 border-2 bg-white" /></FormControl>
                    </FormItem>
                )} />
                <FormField control={control} name="aboutText" render={({ field }) => (
                    <FormItem className="text-left">
                        <FormLabel>Professional Summary (About Us)</FormLabel>
                        <FormControl><Textarea placeholder="Describe your facility, security, and specialized services..." {...field} className="min-h-[150px] border-2 bg-white" /></FormControl>
                    </FormItem>
                )} />
            </div>
        </div>
    );
}

function StepWarehouseCapabilities() {
    const { control } = useFormContext<NodeFormValues>();
    
    const serviceOptions = ["Packaging", "Shrink Wrapping", "Palletization", "Labeling", "Cross-Docking", "Inventory Management", "Quality Inspection"];
    const equipmentOptions = ["Hyster / Forklift", "Reach Truck", "Electric Pallet Jack", "Hand Pallet Jack", "Dock Levelers", "Weighing Scales"];
    const rackingOptions = ["Selective Racking", "Drive-In Racking", "Push-Back Racking", "Cantilever Racking", "Floor Storage", "Mezzanine"];

    const renderCheckboxes = (name: any, options: string[], title: string, icon: any) => (
        <div className="space-y-4 text-left">
            <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 ml-1">
                {React.createElement(icon, { className: "h-3.5 w-3.5" })}
                {title}
            </Label>
            <div className="grid grid-cols-2 gap-2 text-left">
                {options.map(opt => (
                    <FormField key={opt} control={control} name={name} render={({ field }) => (
                        <div className="flex items-center space-x-2 p-2 border rounded-md bg-white hover:bg-slate-50 transition-colors text-left">
                            <Checkbox 
                                checked={field.value?.includes(opt)} 
                                onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    return checked 
                                        ? field.onChange([...current, opt]) 
                                        : field.onChange(current.filter((v: string) => v !== opt));
                                }} 
                            />
                            <span className="text-[11px] font-medium">{opt}</span>
                        </div>
                    )} />
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-10 text-left text-foreground">
            <div className="text-left">
                <h3 className="text-xl font-black font-headline flex items-center gap-2">
                    <Wrench className="h-6 w-6 text-primary" />
                    Capabilities & Equipment
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Detail the tools and services that define your operational value.</p>
            </div>

            {renderCheckboxes('services', serviceOptions, "Available Services", ClipboardList)}
            <Separator />
            {renderCheckboxes('equipment', equipmentOptions, "On-Site Equipment", Truck)}
            <Separator />
            {renderCheckboxes('racking', rackingOptions, "Racking & Storage Configuration", Warehouse)}
        </div>
    );
}

function StepWarehouseSecurity() {
    const { control } = useFormContext<NodeFormValues>();
    
    const securityOptions = [
        "24/7 On-site Guards",
        "Perimeter Electric Fencing",
        "CCTV Surveillance (Internal)",
        "CCTV Surveillance (Perimeter)",
        "Biometric Access Control",
        "Alarm Linked to Armed Response",
        "Internal Cage / High-Value Vault",
        "Guard Patrol Points / QR Scan"
    ];

    return (
        <div className="space-y-8 text-left text-foreground">
            <div className="text-left">
                <h3 className="text-xl font-black font-headline flex items-center gap-2 text-foreground">
                    <Shield className="h-6 w-6 text-primary" />
                    Security & Access Protocol
                </h3>
                <p className="text-sm text-muted-foreground mt-1 text-left">Provide forensic clarity on how cargo is protected within your node.</p>
            </div>

            <div className="space-y-4 text-left">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 ml-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Security Infrastructure
                </Label>
                <div className="grid grid-cols-2 gap-2 text-left">
                    {securityOptions.map(opt => (
                        <FormField key={opt} control={control} name="securityFeatures" render={({ field }) => (
                            <div className="flex items-center space-x-2 p-2 border rounded-md bg-white hover:bg-slate-50 transition-colors text-left">
                                <Checkbox 
                                    checked={field.value?.includes(opt)} 
                                    onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        return checked 
                                            ? field.onChange([...current, opt]) 
                                            : field.onChange(current.filter((v: string) => v !== opt));
                                    }} 
                                />
                                <span className="text-[11px] font-medium">{opt}</span>
                            </div>
                        )} />
                    ))}
                </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <FormField control={control} name="accessControl" render={({ field }) => (
                    <FormItem className="text-left">
                        <FormLabel>Access Control Type</FormLabel>
                        <FormControl><Input placeholder="e.g. Biometric / Keycard / Manual log" {...field} className="h-10 border-2 bg-white" /></FormControl>
                    </FormItem>
                )} />
                <FormField control={control} name="rollerDoors" render={({ field }) => (
                    <FormItem className="text-left">
                        <FormLabel>Roller Door Configuration</FormLabel>
                        <FormControl><Input placeholder="e.g. 4 x Automated Heavy Duty" {...field} className="h-10 border-2 bg-white" /></FormControl>
                    </FormItem>
                )} />
            </div>

            <FormField control={control} name="operatingHours" render={({ field }) => (
                <FormItem className="text-left">
                    <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4" /> Receiving & Dispatch Hours</FormLabel>
                    <FormControl><Input placeholder="e.g. Mon-Fri: 08:00 - 16:30, Sat: 08:00 - 12:00" {...field} className="h-10 border-2 bg-white" /></FormControl>
                    <FormDescription className="text-[10px]">Critical for haulier planning and matching.</FormDescription>
                </FormItem>
            )} />
        </div>
    );
}

function StepGallery() {
    const { watch, setValue } = useFormContext<NodeFormValues>();
    const imageUrls = watch('imageUrls') || [];
    const { user } = useUser();
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !user) return;
        setUploading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            const newUrls = [...imageUrls];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                const dataUri = await new Promise<string>(res => {
                    reader.onload = () => res(reader.result as string);
                    reader.readAsDataURL(file);
                });
                const response = await fetch('/api/uploadImageAsset', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileDataUri: dataUri, folder: `node-gallery/${user.uid}`, fileName: `gallery_${Date.now()}_${file.name}` })
                });
                const result = await response.json();
                if (response.ok) newUrls.push(result.url);
            }
            setValue('imageUrls', newUrls, { shouldValidate: true });
            toast({ title: "Gallery Updated" });
        } catch (e) {
            toast({ variant: 'destructive', title: "Upload Error" });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6 text-left text-foreground">
            <h3 className="text-xl font-black font-headline flex items-center gap-2 text-left">
                <Camera className="h-6 w-6 text-primary" /> 
                Facility Gallery
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                {imageUrls.map((url: string, i: number) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-100 group shadow-sm">
                        <Image src={url} alt="Gallery" fill className="object-cover" />
                        <Button 
                            type="button" 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setValue('imageUrls', imageUrls.filter((_, idx) => idx !== i))}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                ))}
                <label className="aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors text-center p-4 text-foreground">
                    {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <PlusCircle className="h-6 w-6 text-muted-foreground" />}
                    <span className="text-[10px] font-black uppercase mt-2 tracking-widest leading-tight">Add Photos</span>
                    <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
            </div>
        </div>
    );
}

function StepWarehouseFees() {
    const { control } = useFormContext<NodeFormValues>();
    return (
        <div className="space-y-8 text-left text-foreground">
            <h3 className="text-xl font-black font-headline flex items-center gap-2 text-left">
                <Banknote className="h-6 w-6 text-primary" />
                Storage Yield Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-foreground">
                <div className="space-y-6 text-left">
                    <FormField control={control} name="availablePallets" render={({ field }) => (
                        <FormItem className="text-left"><FormLabel>Current Pallet Positions</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 bg-white" /></FormControl></FormItem>
                    )} />
                    <FormField control={control} name="monthlyStorageFee" render={({ field }) => (
                        <FormItem className="text-left"><FormLabel>Monthly Storage Rate (per plt)</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 bg-white" /></FormControl></FormItem>
                    )} />
                </div>
                <div className="space-y-6 text-left">
                    <FormField control={control} name="upliftFee" render={({ field }) => (
                        <FormItem className="text-left"><FormLabel>Inbound Handling (Uplift)</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 bg-white" /></FormControl></FormItem>
                    )} />
                    <FormField control={control} name="placementFee" render={({ field }) => (
                        <FormItem className="text-left"><FormLabel>Outbound Handling (Placement)</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 bg-white" /></FormControl></FormItem>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-foreground">
                <div className="p-6 border-2 border-primary bg-primary/5 rounded-3xl space-y-4 text-left">
                    <FormField control={control} name="brokerageMargin" render={({ field }) => (
                        <FormItem className="text-left">
                            <FormLabel className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2">
                                Your Clearing Margin (%)
                                <HelpCircle className="h-3 w-3 opacity-50" />
                            </FormLabel>
                            <FormControl><Input type="number" {...field} className="h-12 text-2xl font-black bg-white" /></FormControl>
                            <FormDescription className="text-[10px] leading-tight mt-2 font-bold text-primary text-left">
                                The profit you, as the Primary Contractor (Broker), retain from the total load value for your role in securing the freight.
                            </FormDescription>
                        </FormItem>
                    )} />
                </div>
                <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-2 shadow-xl flex flex-col justify-center text-left">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2 text-left">
                        Platform Success Fee
                        <ShieldCheck className="h-3 w-3 text-primary" />
                    </p>
                    <p className="text-4xl font-black text-primary text-left">2.5%</p>
                    <p className="text-[10px] text-slate-400 leading-tight pt-2 italic text-left">
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
                        <div className="flex justify-between border-b pb-2 text-left">
                            <span className="text-muted-foreground">Total Load Value (Example)</span>
                            <span className="font-bold">R 10,000.00</span>
                        </div>
                        <div className="flex justify-between border-b pb-2 text-left">
                            <span className="text-muted-foreground">Your Clearing Margin ({margin}%)</span>
                            <span className="font-bold text-green-600">+ R {(10000 * (margin/100)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2 text-left">
                            <span className="text-muted-foreground">Platform Success Fee (2.5%)</span>
                            <span className="font-bold text-slate-600">- R 250.00</span>
                        </div>
                        <div className="flex justify-between pt-2 text-left">
                            <span className="font-black uppercase text-xs">Available Haulier Payout</span>
                            <span className="font-black text-primary">R {(10000 - (10000 * (margin/100)) - 250).toFixed(2)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StepRateSheet() {
    const { control, watch } = useFormContext<NodeFormValues>();
    const rateType = watch('rateType');
    const { fields, append, remove } = useFieldArray({ control, name: 'routeRates' });

    return (
        <div className="space-y-8 text-left text-foreground">
            <h3 className="text-xl font-black font-headline flex items-center gap-2 text-left">
                <ListOrdered className="h-6 w-6 text-primary" />
                Fleet Rate Sheet (Optional)
            </h3>

            <FormField control={control} name="rateType" render={({ field }) => (
                <FormItem className="space-y-4 text-left">
                    <FormLabel className="font-bold">Select Rate Structure</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                            <div className={cn("flex items-center space-x-3 p-4 border rounded-xl cursor-pointer", field.value === 'none' ? "bg-primary/5 border-primary" : "bg-white")}>
                                <RadioGroupItem value="none" id="r-none" /><Label htmlFor="r-none" className="cursor-pointer">No Sheet</Label>
                            </div>
                            <div className={cn("flex items-center space-x-3 p-4 border rounded-xl cursor-pointer", field.value === 'route' ? "bg-primary/5 border-primary" : "bg-white")}>
                                <RadioGroupItem value="route" id="r-route" /><Label htmlFor="r-route" className="cursor-pointer">Route-Based</Label>
                            </div>
                            <div className={cn("flex items-center space-x-3 p-4 border rounded-xl cursor-pointer", field.value === 'per_km' ? "bg-primary/5 border-primary" : "bg-white")}>
                                <RadioGroupItem value="per_km" id="r-km" /><Label htmlFor="r-km" className="cursor-pointer">Rate per KM</Label>
                            </div>
                        </RadioGroup>
                    </FormControl>
                </FormItem>
            )} />

            {rateType === 'per_km' && (
                <FormField control={control} name="kmRate" render={({ field }) => (
                    <FormItem className="max-w-xs animate-in slide-in-from-top-2 text-left">
                        <FormLabel>Standard Rate per Kilometer (ZAR)</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g. 22.50" {...field} className="h-12 text-xl font-bold bg-white" /></FormControl>
                    </FormItem>
                )} />
            )}

            {rateType === 'route' && (
                <div className="space-y-4 animate-in slide-in-from-top-2 text-left">
                    <div className="flex justify-between items-center text-left">
                        <Label className="font-bold text-left">Common Route Rates</Label>
                        <Button type="button" size="sm" variant="outline" onClick={() => append({ origin: '', destination: '', price: 0 })} className="text-foreground">
                            <PlusCircle className="h-4 w-4 mr-2" /> Add Route
                        </Button>
                    </div>
                    {fields.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4 border rounded-xl bg-white shadow-sm text-left">
                            <FormField control={control} name={`routeRates.${index}.origin` as any} render={({ field }) => (
                                <FormItem className="text-left text-foreground">
                                    <FormLabel className="text-[10px] uppercase font-black">Origin</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="h-9 bg-white text-left"><SelectValue/></SelectTrigger></FormControl>
                                        <SelectContent>{locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                            <FormField control={control} name={`routeRates.${index}.destination` as any} render={({ field }) => (
                                <FormItem className="text-left text-foreground">
                                    <FormLabel className="text-[10px] uppercase font-black">Destination</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="h-9 bg-white text-left"><SelectValue/></SelectTrigger></FormControl>
                                        <SelectContent>{locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                            <div className="flex items-center gap-2 text-left text-foreground">
                                <FormField control={control} name={`routeRates.${index}.price` as any} render={({ field }) => (
                                    <FormItem className="flex-1 text-left">
                                        <FormLabel className="text-[10px] uppercase font-black">Total Price</FormLabel>
                                        <FormControl><Input type="number" {...field} className="h-9 bg-white" /></FormControl>
                                    </FormItem>
                                )} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="mb-0.5 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function StepLoadAgreement() {
    const { control, watch } = useFormContext<NodeFormValues>();
    const contractType = watch('contractType');

    return (
        <div className="space-y-8 text-left text-foreground">
            <h3 className="text-xl font-black font-headline flex items-center gap-2 text-left">
                <FileSignature className="h-6 w-6 text-primary" />
                Contractual Framework
            </h3>

            <FormField control={control} name="contractType" render={({ field }) => (
                <FormItem className="space-y-4 text-left">
                    <FormLabel className="font-bold">Default Agreement Preference</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            <div className={cn("flex items-center space-x-3 p-4 border rounded-xl cursor-pointer", field.value === 'master' ? "bg-primary/5 border-primary" : "bg-white")}>
                                <RadioGroupItem value="master" id="c-master" /><Label htmlFor="c-master" className="cursor-pointer font-bold">Master Agreement <span className="block text-[10px] font-normal text-muted-foreground">Fixed volume per month.</span></Label>
                            </div>
                            <div className={cn("flex items-center space-x-3 p-4 border rounded-xl cursor-pointer", field.value === 'one_off' ? "bg-primary/5 border-primary" : "bg-white")}>
                                <RadioGroupItem value="one_off" id="c-spot" /><Label htmlFor="c-spot" className="cursor-pointer font-bold">One-Off Agreement <span className="block text-[10px] font-normal text-muted-foreground">Spot market bookings.</span></Label>
                            </div>
                        </RadioGroup>
                    </FormControl>
                </FormItem>
            )} />

            {contractType === 'master' && (
                <FormField control={control} name="monthlyLoadTarget" render={({ field }) => (
                    <FormItem className="max-w-xs animate-in slide-in-from-top-2 text-left">
                        <FormLabel>Committed Loads per Month</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g. 20" {...field} className="h-12 text-xl font-bold bg-white" /></FormControl>
                        <FormDescription className="text-[10px]">Your node will be prioritized for long-term contract matching.</FormDescription>
                    </FormItem>
                )} />
            )}
        </div>
    );
}

function StepCommercials({ shop }: { shop: any }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [proposedRate, setProposedRate] = useState<number>(2.5);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const agreementsQuery = useMemoFirebase(() => {
        if (!firestore || !shop?.companyId) return null;
        return query(collection(firestore, `companies/${shop.companyId}/shops/${shop.id}/agreements`), orderBy('createdAt', 'desc'));
    }, [firestore, shop.companyId, shop.id]);

    const { data: agreements, forceRefresh } = useCollection(agreementsQuery);
    const pendingAgreement = useMemo(() => agreements?.find(a => a.status === 'proposed') || null, [agreements]);

    const handlePropose = async () => {
        setIsSubmitting(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            const response = await fetch('/api/proposeCommercialAgreement', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId: shop.companyId, shopId: shop.id, percentage: proposedRate }),
            });
            if (!response.ok) throw new Error("Failed to submit proposal.");
            toast({ title: "Proposal Submitted", description: "The platform AI agent will evaluate your proposed rate." });
            forceRefresh();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: e.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 text-left text-foreground">
            <h3 className="text-xl font-black font-headline flex items-center gap-2 text-left">
                <Handshake className="h-6 w-6 text-primary" />
                Mall Commercials
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-foreground">
                <div className="p-6 border rounded-3xl bg-muted/30 space-y-4 text-left">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-left">Standard Platform Rate</p>
                    <p className="text-3xl font-black text-left">2.5%</p>
                    <p className="text-xs text-muted-foreground leading-relaxed text-left">The facilitating commission earned by Logistics Flow on each successful transaction.</p>
                </div>
                
                <div className="p-6 border-2 border-primary bg-primary/5 rounded-3xl space-y-4 text-left">
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest text-left">Your Proposal (%)</p>
                    <Input type="number" value={proposedRate} onChange={e => setProposedRate(Number(e.target.value))} className="h-12 text-2xl font-black bg-white" />
                    <Button className="w-full h-10 font-bold" onClick={handlePropose} disabled={isSubmitting || !!pendingAgreement}>
                        {isSubmitting ? <Loader2 className="animate-spin h-4 w-4"/> : <Zap className="mr-2 h-4 w-4" />}
                        {pendingAgreement ? 'Awaiting Evaluation' : 'Propose Rate'}
                    </Button>
                </div>
            </div>

            {agreements && agreements.length > 0 && (
                <div className="space-y-4 text-left">
                    <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2 text-left">
                        <History className="h-4 w-4" />
                        Agreement History
                    </h4>
                    <DataTable 
                        data={agreements}
                        columns={[
                            { accessorKey: 'percentage', header: 'Rate (%)', cell: ({row}) => <strong>{row.original.percentage}%</strong> },
                            { accessorKey: 'status', header: 'Status', cell: ({row}) => <Badge variant={row.original.status === 'active' ? 'default' : 'secondary'} className="capitalize">{row.original.status}</Badge> },
                            { header: 'Date', cell: ({row}) => formatDateSafe(row.original.createdAt) }
                        ]}
                    />
                </div>
            )}
        </div>
    );
}

function StepCatalog({ shop }: { shop: any }) {
    const firestore = useFirestore();
    const [editingProduct, setEditingProduct] = useState<any | null>(null);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !shop?.companyId) return null;
        return query(collection(firestore, `companies/${shop.companyId}/shops/${shop.id}/products`), orderBy('createdAt', 'desc'));
    }, [firestore, shop.companyId, shop.id]);

    const { data: products, forceRefresh } = useCollection(productsQuery);

    return (
        <div className="space-y-6 text-left text-foreground">
            <div className="flex justify-between items-center border-b pb-4 text-left">
                <div className="text-left">
                    <h3 className="text-xl font-black font-headline text-left">Product Catalogue</h3>
                    <p className="text-xs text-muted-foreground text-left">List the items or services you sell directly in the Mall.</p>
                </div>
                <Dialog open={!!editingProduct} onOpenChange={(o) => { if (!o) setEditingProduct(null); }}>
                    <DialogTrigger asChild><Button className="gap-2 font-bold text-white"><PlusCircle className="h-4 w-4" /> Add Product</Button></DialogTrigger>
                    <ProductDialogContent shop={shop} product={editingProduct} onComplete={() => { forceRefresh(); setEditingProduct(null); }} />
                </Dialog>
            </div>
            
            <div className="min-h-[300px] text-left">
                {products && products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                        {products.map(p => (
                            <Card key={p.id} className="overflow-hidden border-none shadow-md bg-white group text-left">
                                <div className="relative aspect-square bg-muted">
                                    {p.imageUrls?.[0] ? <Image src={p.imageUrls[0]} alt={p.name} fill className="object-cover" /> : <div className="flex items-center justify-center h-full"><ImageIcon className="h-10 w-10 opacity-10" /></div>}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setEditingProduct(p)}><Edit className="h-4 w-4"/></Button>
                                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={async () => {
                                            const token = await getClientSideAuthToken();
                                            await fetch('/api/deleteUserDoc', {
                                                method: 'POST',
                                                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ path: `companies/${shop.companyId}/shops/${shop.id}/products/${p.id}` })
                                            });
                                            forceRefresh();
                                        }}><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                                <CardContent className="p-4 text-left">
                                    <p className="font-bold text-sm text-left">{p.name}</p>
                                    <p className="text-xs text-primary font-black mt-1 text-left">{formatCurrency(p.price)}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-4 text-center">Catalog Empty</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function ProductDialogContent({ shop, product, onComplete }: { shop: any, product?: any, onComplete: () => void }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const form = useForm({ 
        resolver: zodResolver(productSchema),
        defaultValues: product || { name: '', description: '', price: 0, stock: 0, imageUrls: [] } 
    });

    const onSubmit = async (values: any) => {
        setLoading(true);
        try {
            const token = await getClientSideAuthToken();
            const collectionPath = `companies/${shop.companyId}/shops/${shop.id}/products`;
            const res = await fetch(product ? '/api/updateUserDoc' : '/api/addUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(product 
                    ? { path: `${collectionPath}/${product.id}`, data: { ...values, updatedAt: { _methodName: 'serverTimestamp' } } }
                    : { collectionPath, data: values }
                )
            });
            if (!res.ok) throw new Error("Failed to save product.");
            toast({ title: "Catalogue Updated" });
            onComplete();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: e.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !shop) return;
        const token = await getClientSideAuthToken();
        const reader = new FileReader();
        const dataUri = await new Promise<string>(res => {
            reader.onload = () => res(reader.result as string);
            reader.readAsDataURL(file);
        });
        const response = await fetch('/api/uploadImageAsset', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileDataUri: dataUri, folder: `products/${shop.companyId}`, fileName: `prod_${Date.now()}_${file.name}` })
        });
        const result = await response.json();
        if (response.ok) {
            const current = form.getValues('imageUrls') || [];
            form.setValue('imageUrls', [...current, result.url]);
        }
    };

    return (
        <DialogContent className="sm:max-w-xl text-left text-foreground">
            <DialogHeader className="text-left">
                <DialogTitle>Product Management</DialogTitle>
                <DialogDescription>Define the technical and commercial details of this item.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 text-left">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem className="text-left"><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g. Heavy Duty Differential" {...field} className="bg-white" /></FormControl></FormItem>)} />
                    <div className="grid grid-cols-2 gap-4 text-left">
                         <FormField control={form.control} name="price" render={({ field }) => (<FormItem className="text-left"><FormLabel>Sales Price (R)</FormLabel><FormControl><Input type="number" {...field} className="bg-white" /></FormControl></FormItem>)} />
                         <FormField control={form.control} name="stock" render={({ field }) => (<FormItem className="text-left"><FormLabel>Current Stock</FormLabel><FormControl><Input type="number" {...field} className="bg-white" /></FormControl></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="description" render={({ field }) => (<FormItem className="text-left"><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Technical specifics..." {...field} className="bg-white" /></FormControl></FormItem>)} />
                    
                    <div className="space-y-4 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Product Images</Label>
                        <div className="grid grid-cols-4 gap-2">
                             {(form.watch('imageUrls') || []).map((url: string, i: number) => (
                                 <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                                     <Image src={url} alt="pic" fill className="object-cover" />
                                 </div>
                             ))}
                             <Button type="button" variant="outline" className="aspect-square flex-col gap-1 border-dashed" onClick={() => document.getElementById('prod-img-up')?.click()}>
                                 <Camera className="h-6 w-6 opacity-40" />
                                 <span className="text-[8px] uppercase font-bold">Add</span>
                             </Button>
                             <input type="file" id="prod-img-up" className="hidden" onChange={handleUpload} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full h-12 font-bold uppercase tracking-widest text-white">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Commit Product
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
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
                    <h3 className="text-xl font-black font-headline text-left">{mode === 'fleet' ? 'Verified Fleet Roster' : 'Active Sales Inventory'}</h3>
                    <p className="text-xs text-muted-foreground text-left">Manage your RC1-vetted assets for this node.</p>
                </div>
                <Dialog open={isAdding} onOpenChange={setIsAdding}>
                    <DialogTrigger asChild><Button className="gap-2 font-bold text-white"><PlusCircle className="h-4 w-4" /> Add Asset</Button></DialogTrigger>
                    <AssetDialogContent shop={shop} mode={mode} onComplete={() => { forceRefresh(); setIsAdding(false); }} />
                </Dialog>
            </div>
            <div className="min-h-[300px] text-left">
                {assets && assets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                        {assets.map(asset => (
                            <Card key={asset.id} className="overflow-hidden border-none shadow-md bg-white text-left">
                                <div className="relative aspect-video bg-muted">
                                    {asset.photoUrls?.[0] && <Image src={asset.photoUrls[0]} alt={asset.make} fill className="object-cover" />}
                                    <div className="absolute top-2 right-2 text-left"><Badge className="bg-green-600 text-white font-bold text-[9px] uppercase">Verified</Badge></div>
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

function AssetDialogContent({ shop, mode, onComplete }: { shop: any, mode: 'fleet' | 'sale', onComplete: () => void }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const form = useForm({ 
        defaultValues: { photoUrls: [], rc1Url: '', licenseUrl: '', status: 'active', make: '', model: '', year: '', vClass: '', price: 0 } 
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

    const handleMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !shop) return;
        const urls = [...form.getValues('photoUrls')];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const token = await getClientSideAuthToken();
            const reader = new FileReader();
            const dataUri = await new Promise<string>(res => {
                reader.onload = () => res(reader.result as string);
                reader.readAsDataURL(file);
            });
            const response = await fetch('/api/uploadImageAsset', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileDataUri: dataUri, folder: `fleet-photos/${shop.companyId}`, fileName: `photo_${Date.now()}_${file.name}` })
            });
            const result = await response.json();
            if (response.ok) urls.push(result.url);
        }
        form.setValue('photoUrls', urls as any);
    };

    return (
        <DialogContent className="sm:max-w-2xl text-left text-foreground">
            <DialogHeader className="text-left">
                <DialogTitle>{mode === 'fleet' ? 'Register Fleet Asset (RC1)' : 'List Vehicle for Sale'}</DialogTitle>
                <DialogDescription>Attach verified documents and technical specifics.</DialogDescription>
            </DialogHeader>
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 text-left">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="make" render={({ field }) => (<FormItem className="text-left"><FormLabel>Make</FormLabel><FormControl><Input placeholder="e.g. Scania" {...field} className="bg-white" /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="model" render={({ field }) => (<FormItem className="text-left"><FormLabel>Model</FormLabel><FormControl><Input placeholder="e.g. R560" {...field} className="bg-white" /></FormControl></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <FormField control={form.control} name="year" render={({ field }) => (<FormItem className="text-left"><FormLabel>Year</FormLabel><FormControl><Input type="number" placeholder="20XX" {...field} className="bg-white" /></FormControl></FormItem>)} />
                         {mode === 'fleet' ? (
                             <FormField control={form.control} name="vClass" render={({ field }) => (
                                <FormItem className="text-left">
                                    <FormLabel>Asset Class</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="bg-white text-left"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {vehicleClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                             ) } />
                         ) : (
                            <FormField control={form.control} name="price" render={({ field }) => (<FormItem className="text-left"><FormLabel>Sales Price (R)</FormLabel><FormControl><Input type="number" {...field} className="bg-white" /></FormControl></FormItem>)} />
                         )}
                    </div>

                    <div className="space-y-4 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Vehicle Gallery</Label>
                        <div className="grid grid-cols-3 gap-2 text-left">
                             {(form.watch('photoUrls') || []).map((url: string, i: number) => (
                                 <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                                     <Image src={url} alt="pic" fill className="object-cover" />
                                 </div>
                             ))}
                             <Button type="button" variant="outline" className="aspect-square flex-col gap-1 border-dashed" onClick={() => document.getElementById('multi-up')?.click()}>
                                 <Camera className="h-6 w-6 opacity-40" />
                                 <span className="text-[8px] uppercase font-bold">Add Photo</span>
                             </Button>
                             <input type="file" id="multi-up" multiple className="hidden" onChange={handleMultiUpload} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <FileUploadField name="rc1Url" label="RC1 Doc" folder="fleet-docs" />
                        <FileUploadField name="licenseUrl" label="License Disk" folder="fleet-docs" />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full h-12 font-bold uppercase tracking-widest text-white">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Commit to Node
                        </Button>
                    </DialogFooter>
                </form>
            </FormProvider>
        </DialogContent>
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
            <div className="space-y-2 text-center">
                <h3 className="text-3xl font-black font-headline text-center">Node Handshake Ready</h3>
                <p className="text-muted-foreground max-w-sm mx-auto text-center">Your industrial parameters are ready for auditing. Once activated, your node will be visible across the specified malls.</p>
            </div>
            <div className="flex justify-center text-center">
              <Button onClick={handlePublish} disabled={loading} size="lg" className="h-16 px-16 text-lg font-black uppercase tracking-tight shadow-xl text-white">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Smartphone className="mr-2 h-4 w-4"/>}
                  Activate Commercial Hub
              </Button>
            </div>
        </div>
    );
}

// ====== MAIN WIZARD ======

export function ShopWizard({ shop, nodeType, onUpdate }: { shop: any, nodeType: string, onUpdate: () => void }) {
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // RESET STEP ON NODE TYPE SWITCH
    useEffect(() => {
        setCurrentStep(0);
    }, [nodeType]);

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
            services: shop.services || [],
            equipment: shop.equipment || [],
            racking: shop.racking || [],
            imageUrls: shop.imageUrls || [],
            securityFeatures: shop.securityFeatures || [],
            accessControl: shop.accessControl || '',
            rollerDoors: shop.rollerDoors || '',
            operatingHours: shop.operatingHours || '',
            rateType: shop.rateType || 'none',
            kmRate: shop.kmRate || 0,
            routeRates: shop.routeRates || [],
            contractType: shop.contractType || 'none',
            monthlyLoadTarget: shop.monthlyLoadTarget || 0,
        }
    });

    const wizardSteps = useMemo(() => {
        if (nodeType === 'loads') {
            return [
                { id: 'legal', name: '1. Legal Rights', component: <StepLegal />, fields: ['primaryContractUrl', 'subcontractorAgreementUrl'] },
                { id: 'identity', name: '2. Hub Identity', component: <StepIdentity nodeType="loads" />, fields: ['shopName', 'category'] },
                { id: 'commercials', name: '3. Brokerage Config', component: <StepBrokerageCommercials />, fields: ['brokerageMargin'] },
                { id: 'publish', name: '4. Activate Hub', component: <StepPublish shop={shop} onSave={onUpdate} />, fields: [] },
            ];
        }
        if (nodeType === 'warehouse') {
            return [
                { id: 'legal', name: '1. Legal Rights', component: <StepLegal />, fields: ['primaryContractUrl', 'subcontractorAgreementUrl'] },
                { id: 'identity', name: '2. Facility Identity', component: <StepIdentity nodeType="warehouse" />, fields: ['shopName', 'category'] },
                { id: 'branding', name: '3. Branding & Narrative', component: <StepBranding />, fields: ['homeHeading', 'aboutText'] },
                { id: 'capabilities', name: '4. Capabilities & Equipment', component: <StepWarehouseCapabilities />, fields: ['services', 'equipment', 'racking'] },
                { id: 'security', name: '5. Security & Access', component: <StepWarehouseSecurity />, fields: ['securityFeatures', 'accessControl', 'rollerDoors', 'operatingHours'] },
                { id: 'fees', name: '6. Capacity & Fees', component: <StepWarehouseFees />, fields: ['availablePallets', 'monthlyStorageFee'] },
                { id: 'gallery', name: '7. Facility Gallery', component: <StepGallery />, fields: [] },
                { id: 'publish', name: '8. Activate Hub', component: <StepPublish shop={shop} onSave={onUpdate} />, fields: [] },
            ];
        }
        if (nodeType === 'transport') {
            return [
                { id: 'identity', name: '1. Fleet Identity', component: <StepIdentity nodeType="transport" />, fields: ['shopName', 'category'] },
                { id: 'roster', name: '2. Asset Roster', component: <StepAssetRegistry shop={shop} mode="fleet" />, fields: [] },
                { id: 'rates', name: '3. Rate Sheet', component: <StepRateSheet />, fields: ['rateType', 'kmRate', 'routeRates'] },
                { id: 'agreements', name: '4. Load Agreement', component: <StepLoadAgreement />, fields: ['contractType', 'monthlyLoadTarget'] },
                { id: 'publish', name: '5. Activate Hub', component: <StepPublish shop={shop} onSave={onUpdate} />, fields: [] },
            ];
        }
        if (nodeType === 'buy-sell') {
            return [
                { id: 'identity', name: '1. Dealer Identity', component: <StepIdentity nodeType="buy-sell" />, fields: ['shopName', 'category'] },
                { id: 'inventory', name: '2. Vehicle Inventory', component: <StepAssetRegistry shop={shop} mode="sale" />, fields: [] },
                { id: 'publish', name: '3. Activate Hub', component: <StepPublish shop={shop} onSave={onUpdate} />, fields: [] },
            ];
        }
        if (nodeType === 'supplier' || nodeType === 'default') {
            return [
                { id: 'identity', name: '1. Shop Identity', component: <StepIdentity nodeType="supplier" />, fields: ['shopName', 'category'] },
                { id: 'branding', name: '2. Branding & Narrative', component: <StepBranding />, fields: ['homeHeading', 'aboutText'] },
                { id: 'commercials', name: '3. Mall Commercials', component: <StepCommercials shop={shop} />, fields: [] },
                { id: 'catalog', name: '4. Product Catalogue', component: <StepCatalog shop={shop} />, fields: [] },
                { id: 'publish', name: '5. Activate Shop', component: <StepPublish shop={shop} onSave={onUpdate} />, fields: [] },
            ];
        }
        return [];
    }, [shop, nodeType, onUpdate]);

    const nodeTitleMap: Record<string, string> = {
        loads: "Brokerage Node Configuration",
        warehouse: "Warehouse Hub Terminal",
        transport: "Fleet Node Configuration",
        "buy-sell": "Marketplace Terminal",
        supplier: "Supplier Shop Wizard",
        default: "Industrial Node Configuration",
        finance: "Finance Node Configuration"
    };

    const handleNext = async () => {
        const step = wizardSteps[currentStep];
        if (!step) return;
        const isValid = step.fields && step.fields.length > 0 ? await methods.trigger(step.fields as any) : true;
        if (isValid && currentStep < wizardSteps.length - 1) setCurrentStep(prev => prev + 1);
    };

    const currentStepConfig = wizardSteps[currentStep];

    if (wizardSteps.length === 0) return <div className="flex justify-center p-20 text-foreground text-center"><Loader2 className="animate-spin h-8 w-8 text-primary mx-auto"/><p className="mt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Synchronizing Steps...</p></div>;

    return (
        <Card className="border-none shadow-xl bg-white overflow-hidden text-left text-foreground">
            <CardHeader className="bg-slate-50 border-b p-6 text-left">
                <div>
                    <CardTitle className="text-2xl font-black font-headline text-left">{nodeTitleMap[nodeType] || "Industrial Node Configuration"}</CardTitle>
                    <CardDescription className="text-left">Establish legal and commercial parameters for this business unit.</CardDescription>
                </div>
                <Progress value={((currentStep + 1) / wizardSteps.length) * 100} className="h-2 mt-4" />
            </CardHeader>
            <CardContent className="p-0 text-left text-foreground">
                <FormProvider {...methods}>
                    <div className="grid grid-cols-1 md:grid-cols-[250px_1fr]">
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
                                    <span className="font-bold text-[10px] uppercase tracking-widest text-left">{step.name}</span>
                                </Button>
                            ))}
                        </div>
                        <div className="p-10 min-h-[500px] text-left text-foreground">
                            {currentStepConfig ? (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-left text-foreground">
                                    {currentStepConfig.component}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-foreground gap-3">
                                    <Loader2 className="animate-spin h-10 w-10 text-primary" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Initializing Terminal Module...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </FormProvider>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t p-6 flex justify-between text-left text-foreground">
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
                    })} disabled={isSaving} className="font-bold text-foreground">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />} Sync Draft
                    </Button>
                    {currentStep < wizardSteps.length - 1 && (
                        <Button type="button" onClick={handleNext} className="font-bold px-8 text-white">Continue <ArrowRight className="ml-2 h-4 w-4"/></Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}