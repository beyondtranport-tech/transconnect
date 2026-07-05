'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, FormProvider, useFormContext, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { 
    Loader2, Save, CheckCircle, PlusCircle, Send, Truck, MapPin, 
    DollarSign, ArrowRight, ArrowLeft, Info, Sparkles, ImageIcon, 
    Warehouse, Banknote, ShieldCheck, UserCheck, Smartphone, PackageSearch,
    Tags, Globe, LayoutTemplate, ClipboardList, ShieldAlert, Gavel
} from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn, formatCurrency } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import { generateImage } from '@/ai/flows/image-generation-flow';
import { supplierCategories } from '@/app/adminaccount/marketing/discovery-engine';
import { Label } from '@/components/ui/label';

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
  operatingRegions: z.array(z.string()).optional().default([]),
  fleetSummary: z.string().optional(),
  // Loads / Brokerage specific
  brokerageMargin: z.coerce.number().min(0).max(50).default(5),
  loadPostingTerms: z.string().optional().default("Standard 30-day payment terms after POD verification."),
  haulierVerificationRequired: z.boolean().default(true),
});

type NodeFormValues = z.infer<typeof nodeFormSchema>;

// ====== COMPONENTS ======

function StepIdentity() {
    const { control } = useFormContext();
    return (
        <div className="space-y-6 text-left">
            <h3 className="text-xl font-black font-headline flex items-center gap-2"><UserCheck className="h-6 w-6 text-primary" /> Industrial Identity</h3>
            <div className="space-y-4 text-left text-foreground">
                <FormField control={control} name="shopName" render={({ field }) => ( 
                    <FormItem className="text-left text-foreground">
                        <FormLabel>Public Label / Node Name</FormLabel>
                        <FormControl><Input placeholder="e.g. Cape Town Logistics Hub" {...field} className="h-11 border-2" /></FormControl>
                        <FormMessage />
                    </FormItem> 
                )} />
                <FormField control={control} name="category" render={({ field }) => ( 
                    <FormItem className="text-left text-foreground">
                        <FormLabel>Forensic Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="h-11 border-2 bg-white text-left"><SelectValue placeholder="Select classification..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                {supplierCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem> 
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <FormField control={control} name="contactEmail" render={({ field }) => ( 
                        <FormItem className="text-left text-foreground"><FormLabel>Operations E-mail</FormLabel><FormControl><Input {...field} className="h-11 border-2" /></FormControl><FormMessage /></FormItem> 
                    )} />
                    <FormField control={control} name="contactPhone" render={({ field }) => ( 
                        <FormItem className="text-left text-foreground"><FormLabel>Operations Number</FormLabel><FormControl><Input {...field} className="h-11 border-2" /></FormControl><FormMessage /></FormMessage> 
                    )} />
                </div>
            </div>
        </div>
    );
}

function StepBranding() {
    const { setValue, watch } = useFormContext();
    const logo = watch('logoUrl');
    const banner = watch('heroBannerUrl');

    return (
        <div className="space-y-8 text-left text-foreground">
            <div className="flex items-center justify-between text-left text-foreground">
                <h3 className="text-xl font-black font-headline flex items-center gap-2"><ImageIcon className="h-6 w-6 text-primary" /> Visual Branding</h3>
                <AIToolModal type="generate" targetField="logoUrl" onResult={(url:any) => setValue('logoUrl', url)} initialPrompt="Professional modern industrial logistics logo, minimalist vector style." />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-foreground">
                <div className="space-y-4 text-left">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Company Logo</Label>
                    <div className="aspect-square w-48 border-4 border-dashed rounded-3xl bg-muted/30 flex items-center justify-center relative overflow-hidden shadow-inner text-left text-foreground">
                        {logo ? <Image src={logo} alt="Logo" fill className="object-contain p-4" /> : <p className="text-xs italic text-muted-foreground">No Logo Uploaded</p>}
                    </div>
                </div>
                <div className="space-y-4 text-left text-foreground">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Marketplace Hero Banner</Label>
                    <div className="aspect-video w-full border-4 border-dashed rounded-3xl bg-muted/30 flex items-center justify-center relative overflow-hidden shadow-inner text-left text-foreground">
                        {banner ? <Image src={banner} alt="Banner" fill className="object-cover" /> : <p className="text-xs italic text-muted-foreground text-center px-4">Generate or upload a high-fidelity industrial banner.</p>}
                    </div>
                    <AIToolModal type="generate" targetField="heroBannerUrl" onResult={(url:any) => setValue('heroBannerUrl', url)} initialPrompt="Wide angle cinematic shot of an ultra-modern logistics warehouse interior at night, blue glowing data lines on the floor." />
                </div>
            </div>
        </div>
    );
}

function StepWarehouse() {
    const { control } = useFormContext();
    return (
        <div className="space-y-8 text-left">
            <h3 className="text-xl font-black font-headline flex items-center gap-2"><Warehouse className="h-6 w-6 text-primary" /> Storage Node Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="space-y-4 text-left text-foreground">
                    <FormField control={control} name="availablePallets" render={({ field }) => (
                        <FormItem className="text-left"><FormLabel>Total Positions (Available)</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2" /></FormControl><FormDescription>Total pallet slots currently unallocated.</FormDescription></FormItem>
                    )} />
                    <FormField control={control} name="monthlyStorageFee" render={({ field }) => (
                        <FormItem className="text-left text-foreground"><FormLabel>Base Storage Rate (R/mo)</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2" /></FormControl><FormDescription>Recurring monthly rental per pallet.</FormDescription></FormItem>
                    )} />
                </div>
                <div className="p-6 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20 space-y-4 text-left text-foreground">
                    <h4 className="font-bold text-sm uppercase tracking-widest text-primary flex items-center gap-2"><Banknote className="h-4 w-4" /> Handling & Logic</h4>
                    <FormField control={control} name="upliftFee" render={({ field }) => (
                        <FormItem className="text-left"><FormLabel>Uplift Fee (R/plt)</FormLabel><FormControl><Input type="number" {...field} className="bg-white border-2" /></FormControl><FormDescription>Offloading and verification fee.</FormDescription></FormItem>
                    )} />
                    <FormField control={control} name="placementFee" render={({ field }) => (
                        <FormItem className="text-left text-foreground"><FormLabel>Placement Fee (R/plt)</FormLabel><FormControl><Input type="number" {...field} className="bg-white border-2" /></FormControl><FormDescription>Racking and system registration fee.</FormDescription></FormItem>
                    )} />
                </div>
            </div>
        </div>
    );
}

function StepTransport() {
    const { control } = useFormContext();
    return (
        <div className="space-y-8 text-left">
            <h3 className="text-xl font-black font-headline flex items-center gap-2"><Truck className="h-6 w-6 text-primary" /> Transport Node Parameters</h3>
            <div className="space-y-6 text-left text-foreground">
                <FormField control={control} name="fleetSummary" render={({ field }) => (
                    <FormItem className="text-left text-foreground">
                        <FormLabel>Fleet Capabilities Summary</FormLabel>
                        <FormControl><Textarea placeholder="e.g. Specialized 34-ton Superlink fleet with Hazmat authorization..." {...field} className="min-h-[120px] border-2" /></FormControl>
                        <FormDescription>Describe your equipment and specialized service standing.</FormDescription>
                    </FormItem>
                )} />
                
                <div className="p-6 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20 space-y-4 text-left text-foreground">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <h4 className="font-bold text-sm uppercase tracking-widest text-primary">Service Corridors</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">List your primary routes and hubs. This helps the matching engine reduce empty miles.</p>
                    <div className="bg-white p-4 rounded-xl border">
                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Coming Soon: Interactive Hub Mapping</p>
                        <p className="text-xs italic">Route-specific rates and live GPS hub syncing is currently being integrated.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepLoads() {
    const { control, watch } = useFormContext<NodeFormValues>();
    return (
        <div className="space-y-8 text-left text-foreground">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black font-headline flex items-center gap-2"><PackageSearch className="h-6 w-6 text-primary" /> Brokerage Hub Configuration</h3>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase font-black text-[10px] tracking-widest">Earning Node Active</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-foreground">
                <div className="space-y-6 text-left">
                    <div className="p-6 border-2 border-primary bg-primary/5 rounded-3xl space-y-4 text-left">
                        <div className="flex items-center gap-2 text-primary">
                            <DollarSign className="h-5 w-5" />
                            <h4 className="font-bold text-sm uppercase tracking-widest">Revenue Participation</h4>
                        </div>
                        <FormField control={control} name="brokerageMargin" render={({ field }) => (
                            <FormItem className="text-left">
                                <FormLabel>Default Clearing Margin (%)</FormLabel>
                                <FormControl><Input type="number" {...field} className="h-12 text-2xl font-black bg-white" /></FormControl>
                                <FormDescription className="text-xs">The percentage deducted from the total load value before haulier payout.</FormDescription>
                            </FormItem>
                        )} />
                    </div>

                    <div className="p-6 border-2 rounded-3xl space-y-4 bg-slate-50 text-left text-foreground">
                        <div className="flex items-center gap-2 text-slate-800">
                            <Gavel className="h-5 w-5" />
                            <h4 className="font-bold text-sm uppercase tracking-widest">Risk & Compliance</h4>
                        </div>
                         <FormField control={control} name="haulierVerificationRequired" render={({ field }) => (
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-tight">Enforce RC1 Verification</span>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </div>
                         )} />
                         <p className="text-[10px] text-muted-foreground leading-tight italic">When enabled, only hauliers with verified RC1 documents can accept your posted loads.</p>
                    </div>
                </div>

                <div className="space-y-4 text-left">
                    <FormField control={control} name="loadPostingTerms" render={({ field }) => (
                        <FormItem className="text-left text-foreground">
                            <FormLabel className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> Settlement Terms</FormLabel>
                            <FormControl><Textarea placeholder="Describe your payment cycle (e.g. 14 days after original POD)..." {...field} className="min-h-[150px] border-2 bg-white" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <Alert className="bg-blue-50 border-blue-200">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-[11px] text-blue-800 leading-relaxed text-left">
                            <strong>Note:</strong> These terms are legally binding upon haulier acceptance. The platform handles the digital document vault for POD management automatically.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        </div>
    );
}

function StepPublish({ shop, onSave }: any) {
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
        <div className="text-center py-16 space-y-8 animate-in fade-in zoom-in duration-500 text-left text-foreground">
            <div className="bg-primary/10 p-6 rounded-full w-fit mx-auto shadow-sm text-left">
                <CheckCircle className="h-16 w-16 text-primary" />
            </div>
            <div className="space-y-2 text-center text-foreground">
                <h3 className="text-3xl font-black font-headline">Setup Complete</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">Your industrial node is configured and ready for the forensic audit. Once approved, your capacity and clearing hub will be visible in the malls.</p>
            </div>
            <Button onClick={handlePublish} disabled={loading} size="lg" className="h-16 px-12 text-lg font-black uppercase tracking-tight shadow-xl">
                {loading ? <Loader2 className="animate-spin mr-2 h-6 w-6"/> : <Smartphone className="mr-2 h-6 w-6"/>}
                Activate Hub Node
            </Button>
        </div>
    );
}

// ====== MAIN WIZARD ======

export function ShopWizard({ shop, onUpdate }: { shop: any, onUpdate: () => void }) {
    const { toast } = useToast();
    const { user } = useUser();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // Node Type Detection based on active plans
    const hasWarehouse = shop.shopType === 'warehouse' || user?.companyData?.hasWarehousePlan || user?.companyData?.membershipId === 'warehouse_intelligence' || user?.declaredPosition === 'warehouse';
    const hasTransport = shop.shopType === 'transporter' || user?.companyData?.hasLoadsPlan || user?.companyData?.membershipId === 'loads_intelligence' || user?.declaredPosition === 'transporter';
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
            toast({ title: 'Local Sync Complete' });
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
        
        if (hasWarehouse) {
            base.push({ id: 'warehouse', name: 'Storage Node', component: <StepWarehouse />, fields: ['upliftFee', 'availablePallets'] });
        }
        
        if (hasTransport) {
            base.push({ id: 'transport', name: 'Fleet Node', component: <StepTransport />, fields: ['fleetSummary'] });
        }

        if (hasLoads) {
            base.push({ id: 'loads', name: 'Brokerage Hub', component: <StepLoads />, fields: ['brokerageMargin', 'loadPostingTerms'] });
        }

        // Always add catalog for Suppliers/Vendors who aren't primarily transport/warehouse
        if (!hasWarehouse && !hasTransport) {
             base.push({ id: 'catalog', name: 'Catalog', component: <div className="p-12 text-center border-2 border-dashed rounded-3xl opacity-30"><LayoutTemplate className="h-12 w-12 mx-auto mb-2" /><p className="font-bold">Catalog Tools Active</p></div>, fields: [] });
        }

        base.push({ id: 'publish', name: 'Finalize', component: <StepPublish shop={shop} onSave={onUpdate} />, fields: [] });
        return base;
    }, [shop, hasWarehouse, hasTransport, hasLoads, onUpdate]);

    const handleNext = async () => {
        const step = wizardSteps[currentStep];
        const isValid = step.fields && step.fields.length > 0 ? await methods.trigger(step.fields as any) : true;
        if (isValid && currentStep < wizardSteps.length - 1) setCurrentStep(prev => prev + 1);
    };
    
    return (
        <Card className="border-none shadow-xl bg-white text-left text-foreground overflow-hidden">
            <CardHeader className="bg-slate-50 border-b p-6 text-left">
                <Progress value={((currentStep + 1) / wizardSteps.length) * 100} className="h-2" />
            </CardHeader>
            <CardContent className="p-0 text-left">
                <FormProvider {...methods}>
                    <form onSubmit={methods.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-[250px_1fr] text-left text-foreground">
                        <div className="bg-slate-50/50 border-r p-6 space-y-2 text-left">
                            {wizardSteps.map((step, index) => (
                                <Button 
                                    key={step.id} 
                                    type="button" 
                                    variant={currentStep === index ? 'secondary' : 'ghost'} 
                                    className={cn(
                                        "w-full justify-start gap-3 h-12 px-4 transition-all text-left text-foreground",
                                        currentStep === index && "bg-white shadow-md ring-1 ring-primary/20"
                                    )} 
                                    onClick={() => setCurrentStep(index)}
                                >
                                    <div className={cn(
                                        "h-6 w-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 text-left", 
                                        currentStep >= index ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                    )}>
                                        {index + 1}
                                    </div>
                                    <span className="font-bold text-xs uppercase tracking-widest text-left">{step.name}</span>
                                </Button>
                            ))}
                        </div>
                        <div className="p-10 min-h-[500px] text-left text-foreground">
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-left">
                                {wizardSteps[currentStep].component}
                            </div>
                        </div>
                    </form>
                </FormProvider>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t p-6 flex justify-between text-left text-foreground">
                <Button type="button" variant="ghost" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 0} className="font-bold text-left">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous Step
                </Button>
                <div className="flex gap-3 text-left">
                    <Button type="button" variant="outline" onClick={methods.handleSubmit(onSubmit)} disabled={isSaving} className="font-bold text-left">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4 mr-2" />} 
                        Sync Draft
                    </Button>
                    {currentStep < wizardSteps.length - 1 && (
                        <Button type="button" onClick={handleNext} className="font-bold px-8 text-left">
                            Continue <ArrowRight className="ml-2 h-4 w-4"/>
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
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
            if (!result.imageDataUri) throw new Error("AI failed to return image.");

            const folder = `user-assets/${user!.uid}/shop-ai`;
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
            toast({ title: "Branding Ready!" });
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
                    <Sparkles className="h-4 w-4" /> AI Creator
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl text-left text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-left">AI Branding Terminal</DialogTitle>
                    <DialogDescription className="text-left">Generate high-fidelity assets for your commercial node.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-left text-foreground">
                    <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} className="bg-slate-50 border-2"/>
                    <div className="bg-muted aspect-video rounded-3xl flex flex-col items-center justify-center border-4 border-dashed border-muted-foreground/20 shadow-inner">
                        {isLoading ? (
                            <div className="text-center space-y-2">
                                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Rendering Asset...</p>
                            </div>
                        ) : (
                            <div className="text-center opacity-30">
                                <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                                <p className="text-xs font-bold uppercase">Asset will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="bg-slate-50 p-6 border-t rounded-b-lg">
                    <Button onClick={handleAction} disabled={isLoading} className="w-full h-12 font-black uppercase shadow-lg">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />} 
                        Trigger Generation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
