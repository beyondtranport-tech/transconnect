'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { 
    Loader2, Save, CheckCircle, Truck, MapPin, 
    DollarSign, ArrowRight, ArrowLeft, ImageIcon, 
    Warehouse, Banknote, ShieldCheck, UserCheck, Smartphone, PackageSearch,
    ClipboardList, Gavel, Sparkles
} from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import { generateImage } from '@/ai/flows/image-generation-flow';
import { supplierCategories } from '@/app/adminaccount/marketing/discovery-engine';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

// ====== SCHEMAS ======

const nodeFormSchema = z.object({
  shopName: z.string().min(1, "Identity label is required."),
  category: z.string().min(1, "Please select a forensic category."),
  websiteUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  contactEmail: z.string().email("Please enter a valid business email.").optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  homeHeading: z.string().min(5, "Headline must be at least 5 characters."),
  homeSubheading: z.string().optional(),
  aboutText: z.string().min(20, "Detailed profile summary required."),
  logoUrl: z.string().optional(),
  heroBannerUrl: z.string().optional(),
  termsText: z.string().optional().default("Standard platform terms apply."),
  privacyText: z.string().optional().default("Standard platform privacy policy applies."),
  // Warehouse specific
  upliftFee: z.coerce.number().optional(),
  placementFee: z.coerce.number().optional(),
  monthlyStorageFee: z.coerce.number().optional(),
  availablePallets: z.coerce.number().optional(),
  // Transport specific
  poweredUnits: z.array(z.string()).optional().default([]),
  trailers: z.array(z.string()).optional().default([]),
  primaryRegions: z.array(z.string()).optional().default([]),
  cargoTypes: z.array(z.string()).optional().default([]),
  fleetSummary: z.string().optional(),
  // Brokerage specific
  brokerageMargin: z.coerce.number().min(0).max(50).default(5),
  loadPostingTerms: z.string().optional().default("Standard 30-day payment terms after POD verification."),
  haulierVerificationRequired: z.boolean().default(true),
});

type NodeFormValues = z.infer<typeof nodeFormSchema>;

const fleetOptions = {
    powered: ['Horse', '8-ton Rigid', '4-ton Rigid', 'Bakkie'],
    trailers: ['Skeletal', 'Skeletal + Genset', 'Tautliner', 'Flatbed', 'Tipper', 'Lowbed', 'Reefer'],
    regions: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Mpumalanga', 'Limpopo', 'North West', 'Northern Cape', 'Cross-Border'],
    cargo: ['General Freight', 'Containers', 'Refrigerated Containers', 'Bulk / Aggregates', 'Abnormal Loads', 'Perishables', 'Hazmat', 'FMCG']
};

// ====== STEP COMPONENTS ======

function StepIdentity() {
    const { control } = useFormContext<NodeFormValues>();
    return (
        <div className="space-y-6 text-left">
            <h3 className="text-xl font-black font-headline flex items-center gap-2 text-foreground">
                <UserCheck className="h-6 w-6 text-primary" /> Node Identity
            </h3>
            <div className="space-y-4 text-left text-foreground">
                <FormField control={control} name="shopName" render={({ field }) => ( 
                    <FormItem>
                        <FormLabel>Public Identity Label</FormLabel>
                        <FormControl><Input placeholder="e.g. Cape Town Logistics Hub" {...field} className="h-11 border-2" /></FormControl>
                        <FormMessage />
                    </FormItem> 
                )} />
                <FormField control={control} name="category" render={({ field }) => ( 
                    <FormItem>
                        <FormLabel>Forensic Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="h-11 border-2 bg-white text-left text-foreground"><SelectValue placeholder="Select classification..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                {supplierCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem> 
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={control} name="contactEmail" render={({ field }) => ( 
                        <FormItem><FormLabel>Operations E-mail</FormLabel><FormControl><Input {...field} className="h-11 border-2" /></FormControl><FormMessage /></FormItem> 
                    )} />
                    <FormField control={control} name="contactPhone" render={({ field }) => ( 
                        <FormItem><FormLabel>Operations Number</FormLabel><FormControl><Input {...field} className="h-11 border-2" /></FormControl><FormMessage /></FormItem> 
                    )} />
                </div>
            </div>
        </div>
    );
}

function StepBranding() {
    const { setValue, watch } = useFormContext<NodeFormValues>();
    const logo = watch('logoUrl');
    const banner = watch('heroBannerUrl');

    return (
        <div className="space-y-8 text-left">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black font-headline flex items-center gap-2 text-foreground">
                    <ImageIcon className="h-6 w-6 text-primary" /> Node Branding
                </h3>
                <AIToolModal type="generate" targetField="logoUrl" onResult={(url: string) => setValue('logoUrl', url)} initialPrompt="Professional modern industrial logistics logo, minimalist vector style." />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Node Logo</Label>
                    <div className="aspect-square w-48 border-4 border-dashed rounded-3xl bg-muted/30 flex items-center justify-center relative overflow-hidden shadow-inner">
                        {logo ? <Image src={logo} alt="Logo" fill className="object-contain p-4" /> : <p className="text-xs italic text-muted-foreground">No Logo Uploaded</p>}
                    </div>
                </div>
                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Marketplace Banner</Label>
                    <div className="aspect-video w-full border-4 border-dashed rounded-3xl bg-muted/30 flex items-center justify-center relative overflow-hidden shadow-inner">
                        {banner ? <Image src={banner} alt="Banner" fill className="object-cover" /> : <p className="text-xs italic text-muted-foreground text-center px-4">Generate or upload a high-fidelity industrial banner.</p>}
                    </div>
                    <AIToolModal type="generate" targetField="heroBannerUrl" onResult={(url: string) => setValue('heroBannerUrl', url)} initialPrompt="Wide angle cinematic shot of an ultra-modern logistics warehouse interior at night, blue glowing data lines on the floor." />
                </div>
            </div>
        </div>
    );
}

function StepWarehouse() {
    const { control } = useFormContext<NodeFormValues>();
    return (
        <div className="space-y-8 text-left">
            <h3 className="text-xl font-black font-headline flex items-center gap-2 text-foreground">
                <Warehouse className="h-6 w-6 text-primary" /> Storage Hub Parameters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="space-y-4">
                    <FormField control={control} name="availablePallets" render={({ field }) => (
                        <FormItem className="text-left"><FormLabel>Total Pallet Slots</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2" /></FormControl><FormDescription>Total capacity currently unallocated.</FormDescription></FormItem>
                    )} />
                    <FormField control={control} name="monthlyStorageFee" render={({ field }) => (
                        <FormItem className="text-left"><FormLabel>Storage Rate (R/plt/mo)</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2" /></FormControl><FormDescription>Monthly recurring fee.</FormDescription></FormItem>
                    )} />
                </div>
                <div className="p-6 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20 space-y-4 text-left text-foreground">
                    <h4 className="font-bold text-sm uppercase tracking-widest text-primary flex items-center gap-2 text-left"><Banknote className="h-4 w-4" /> Handling Logic</h4>
                    <FormField control={control} name="upliftFee" render={({ field }) => (
                        <FormItem className="text-left"><FormLabel>Inbound Fee (R/plt)</FormLabel><FormControl><Input type="number" {...field} className="bg-white border-2" /></FormControl></FormItem>
                    )} />
                    <FormField control={control} name="placementFee" render={({ field }) => (
                        <FormItem className="text-left"><FormLabel>Outbound Fee (R/plt)</FormLabel><FormControl><Input type="number" {...field} className="bg-white border-2" /></FormControl></FormItem>
                    )} />
                </div>
            </div>
        </div>
    );
}

function StepTransport() {
    const { control } = useFormContext<NodeFormValues>();
    return (
        <div className="space-y-8 text-left text-foreground">
            <h3 className="text-xl font-black font-headline flex items-center gap-2 text-foreground">
                <Truck className="h-6 w-6 text-primary" /> Fleet Node Parameters
            </h3>
            <div className="space-y-10 text-left">
                <div className="space-y-4 text-left">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2 text-left">
                        <ShieldCheck className="h-4 w-4" /> Verified Capacity (Fleet)
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                        {fleetOptions.powered.map(item => (
                            <FormField key={item} control={control} name="poweredUnits" render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-xl hover:bg-muted/50 transition-all cursor-pointer text-left">
                                    <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => checked ? field.onChange([...field.value, item]) : field.onChange(field.value?.filter((v: string) => v !== item))} /></FormControl>
                                    <FormLabel className="font-bold text-xs cursor-pointer">{item}</FormLabel>
                                </FormItem>
                            )} />
                        ))}
                    </div>
                </div>

                <div className="space-y-4 text-left">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2 text-left">
                        <MapPin className="h-4 w-4" /> Primary Service Lanes
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-left text-foreground">
                        {fleetOptions.regions.map(item => (
                            <FormField key={item} control={control} name="primaryRegions" render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0 p-2 border rounded-lg hover:bg-muted/50 transition-all cursor-pointer">
                                    <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => checked ? field.onChange([...field.value, item]) : field.onChange(field.value?.filter((v: string) => v !== item))} /></FormControl>
                                    <FormLabel className="text-[10px] font-medium cursor-pointer">{item}</FormLabel>
                                </FormItem>
                            )} />
                        ))}
                    </div>
                </div>

                <FormField control={control} name="fleetSummary" render={({ field }) => (
                    <FormItem className="text-left text-foreground">
                        <FormLabel>Technical Profile Summary</FormLabel>
                        <FormControl><Textarea placeholder="Describe your specialized capabilities and corridors..." {...field} className="min-h-[120px] border-2" /></FormControl>
                        <FormDescription>This text is used for high-fidelity matching.</FormDescription>
                    </FormItem>
                )} />
            </div>
        </div>
    );
}

function StepLoads() {
    const { control } = useFormContext<NodeFormValues>();
    return (
        <div className="space-y-8 text-left text-foreground">
            <h3 className="text-xl font-black font-headline flex items-center gap-2 text-foreground">
                <PackageSearch className="h-6 w-6 text-primary" /> Brokerage Terminal Config
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-foreground">
                <div className="space-y-6 text-left">
                    <div className="p-6 border-2 border-primary bg-primary/5 rounded-3xl space-y-4 text-left text-foreground">
                        <div className="flex items-center gap-2 text-primary">
                            <DollarSign className="h-5 w-5" />
                            <h4 className="font-bold text-sm uppercase tracking-widest text-left text-foreground">Revenue Flow</h4>
                        </div>
                        <FormField control={control} name="brokerageMargin" render={({ field }) => (
                            <FormItem className="text-left text-foreground">
                                <FormLabel>Default Clearing Margin (%)</FormLabel>
                                <FormControl><Input type="number" {...field} className="h-12 text-2xl font-black bg-white" /></FormControl>
                                <FormDescription className="text-xs">Your participation percentage on posted freight.</FormDescription>
                            </FormItem>
                        )} />
                    </div>

                    <div className="p-6 border-2 rounded-3xl space-y-4 bg-slate-50 text-left text-foreground">
                         <FormField control={control} name="haulierVerificationRequired" render={({ field }) => (
                            <FormItem className="flex items-center justify-between space-y-0 text-left">
                                <FormLabel className="text-xs font-bold uppercase tracking-tight text-left">Enforce RC1 Compliance</FormLabel>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                         )} />
                         <p className="text-[10px] text-muted-foreground leading-tight italic text-left">Restricts load acceptance to verified fleet nodes only.</p>
                    </div>
                </div>

                <FormField control={control} name="loadPostingTerms" render={({ field }) => (
                    <FormItem className="text-left text-foreground">
                        <FormLabel className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> Settlement Ledger Terms</FormLabel>
                        <FormControl><Textarea placeholder="e.g. Payments processed 30 days from original POD submission..." {...field} className="min-h-[150px] border-2 bg-white" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
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
                body: JSON.stringify({ path: `companies/${shop.companyId}/shops/${shop.id}`, data: { status: 'pending_review' } }),
            });
            toast({ title: "Node Submitted for Review" });
            onSave();
        } catch (e) { toast({ variant: 'destructive', title: 'Submission Failed' }); }
        finally { setLoading(false); }
    };
    return (
        <div className="text-center py-16 space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="bg-primary/10 p-6 rounded-full w-fit mx-auto shadow-sm">
                <CheckCircle className="h-16 w-16 text-primary" />
            </div>
            <div className="space-y-2 text-center text-foreground">
                <h3 className="text-3xl font-black font-headline text-center">Node Configured</h3>
                <p className="text-muted-foreground max-sm mx-auto text-center">Your industrial parameters are ready for auditing. Once activated, your node will be visible across the specified malls.</p>
            </div>
            <Button onClick={handlePublish} disabled={loading} size="lg" className="h-16 px-12 text-lg font-black uppercase tracking-tight shadow-xl">
                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin"/> : <Smartphone className="mr-2 h-6 w-6"/>}
                Activate Commercial Hub
            </Button>
        </div>
    );
}

function AIToolModal({ initialPrompt, onResult, targetField }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState(initialPrompt);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useUser();
    const { toast } = useToast();

    const handleAction = async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");

            let result = await generateImage({ prompt });
            if (!result.imageDataUri) throw new Error("AI error.");

            const folder = `user-assets/${user!.uid}/node-ai`;
            const fileName = `ai_${targetField}_${Date.now()}.png`;
            
            const uploadRes = await fetch('/api/uploadImageAsset', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileDataUri: result.imageDataUri, folder, fileName })
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error);

            onResult(uploadData.url);
            setIsOpen(false);
            toast({ title: "Asset Ready" });
        } catch (e: any) {
            toast({ variant: 'destructive', title: "AI Error", description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 font-bold border-primary/20 text-primary hover:bg-primary/5">
                    <Sparkles className="h-4 w-4" /> AI Tool
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl text-left text-foreground">
                <DialogHeader>
                    <DialogTitle>AI Branding Tool</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 text-left">
                    <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} className="bg-slate-50 border-2" />
                    <div className="bg-muted aspect-video rounded-3xl flex flex-col items-center justify-center border-4 border-dashed shadow-inner">
                        {isLoading ? (
                            <div className="text-center space-y-2">
                                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                                <p className="text-[10px] font-black uppercase text-muted-foreground">Rendering...</p>
                            </div>
                        ) : <ImageIcon className="h-12 w-12 opacity-20" />}
                    </div>
                </div>
                <DialogFooter className="bg-slate-50 p-6 border-t rounded-b-lg">
                    <Button onClick={handleAction} disabled={isLoading} className="w-full h-12 font-black uppercase shadow-lg">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />} 
                        Generate Asset
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ====== MAIN WIZARD ======

export function ShopWizard({ shop, onUpdate }: { shop: any, onUpdate: () => void }) {
    const { toast } = useToast();
    const { user } = useUser();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const hasWarehouse = shop.shopType === 'warehouse' || user?.companyData?.hasWarehousePlan || user?.declaredPosition === 'warehouse';
    const hasTransport = shop.shopType === 'transporter' || user?.companyData?.hasLoadsPlan || user?.declaredPosition === 'transporter';
    const hasLoads = user?.companyData?.hasLoadsPlan || user?.companyData?.membershipId === 'loads_intelligence';

    const methods = useForm<NodeFormValues>({
        resolver: zodResolver(nodeFormSchema),
        mode: 'onChange',
        defaultValues: { ...shop }
    });

    const onSubmit = async (values: NodeFormValues) => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            await fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: `companies/${shop.companyId}/shops/${shop.id}`,
                    data: { ...values, updatedAt: { _methodName: 'serverTimestamp' } }
                }),
            });
            toast({ title: 'Draft Synced' });
            onUpdate();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Sync Failed' });
        } finally {
            setIsSaving(false);
        }
    };

    const wizardSteps = useMemo(() => {
        const base = [
            { id: 'identity', name: 'Identity', component: <StepIdentity />, fields: ['shopName', 'category'] },
            { id: 'branding', name: 'Branding', component: <StepBranding />, fields: [] },
        ];
        if (hasWarehouse) base.push({ id: 'warehouse', name: 'Storage Node', component: <StepWarehouse />, fields: ['availablePallets'] });
        if (hasTransport) base.push({ id: 'transport', name: 'Fleet Node', component: <StepTransport />, fields: ['fleetSummary'] });
        if (hasLoads) base.push({ id: 'loads', name: 'Brokerage', component: <StepLoads />, fields: ['brokerageMargin'] });
        base.push({ id: 'publish', name: 'Activate', component: <StepPublish shop={shop} onSave={onUpdate} />, fields: [] });
        return base;
    }, [shop, hasWarehouse, hasTransport, hasLoads, onUpdate]);

    const handleNext = async () => {
        const step = wizardSteps[currentStep];
        const isValid = step.fields && step.fields.length > 0 ? await methods.trigger(step.fields as any) : true;
        if (isValid && currentStep < wizardSteps.length - 1) setCurrentStep(prev => prev + 1);
    };
    
    return (
        <Card className="border-none shadow-xl bg-white overflow-hidden text-left text-foreground">
            <CardHeader className="bg-slate-50 border-b p-6">
                <Progress value={((currentStep + 1) / wizardSteps.length) * 100} className="h-2" />
            </CardHeader>
            <CardContent className="p-0 text-left text-foreground">
                <FormProvider {...methods}>
                    <form onSubmit={methods.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-[250px_1fr] text-left text-foreground">
                        <div className="bg-slate-50/50 border-r p-6 space-y-2 text-left">
                            {wizardSteps.map((step, index) => (
                                <Button 
                                    key={step.id} 
                                    type="button" 
                                    variant={currentStep === index ? 'secondary' : 'ghost'} 
                                    className={cn("w-full justify-start gap-3 h-12 px-4 transition-all text-left", currentStep === index && "bg-white shadow-md ring-1 ring-primary/20")} 
                                    onClick={() => setCurrentStep(index)}
                                >
                                    <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs font-black shrink-0", currentStep >= index ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{index + 1}</div>
                                    <span className="font-bold text-xs uppercase tracking-widest">{step.name}</span>
                                </Button>
                            ))}
                        </div>
                        <div className="p-10 min-h-[500px] text-left text-foreground">
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-left text-foreground">
                                {wizardSteps[currentStep].component}
                            </div>
                        </div>
                    </form>
                </FormProvider>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t p-6 flex justify-between">
                <Button type="button" variant="ghost" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 0} className="font-bold">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={methods.handleSubmit(onSubmit)} disabled={isSaving} className="font-bold">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4 mr-2" />} Sync
                    </Button>
                    {currentStep < wizardSteps.length - 1 && (
                        <Button type="button" onClick={handleNext} className="font-bold px-8">Continue <ArrowRight className="ml-2 h-4 w-4"/></Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}
