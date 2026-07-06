'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
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
    ClipboardList, Sparkles, Store, Gavel, FileUp, Trash2, PlusCircle, Circle,
    Package, Calendar, Info, Globe, Navigation
} from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, formatCurrency, formatDateSafe } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { collection, query, orderBy, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';

// ====== SCHEMAS ======

const loadOpportunitySchema = z.object({
    origin: z.string().min(1, "Origin hub required."),
    destination: z.string().min(1, "Destination hub required."),
    rate: z.coerce.number().positive("Rate required."),
    pickupDate: z.string().min(1, "Required."),
    dropoffDate: z.string().min(1, "Required."),
    conditions: z.string().optional(),
});

const nodeFormSchema = z.object({
  shopName: z.string().min(1, "Identity label is required."),
  category: z.string().min(1, "Classification required."),
  contactEmail: z.string().email("Valid email required.").optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  homeHeading: z.string().min(5, "Headline required."),
  aboutText: z.string().min(20, "Summary required."),
  logoUrl: z.string().optional(),
  primaryContractUrl: z.string().min(1, "Primary contract required for audit."),
  subcontractorAgreementUrl: z.string().min(1, "Subcontractor agreement required."),
  brokerageMargin: z.coerce.number().min(0).max(50).default(5),
});

type NodeFormValues = z.infer<typeof nodeFormSchema>;

const freightClassifications = ["Long Haul", "LTL", "Container", "Refrigerated", "Local Distribution", "Abnormal"];

// ====== SHARED UI COMPONENTS ======

function FileUploadField({ name, label, folder }: { name: string, label: string, folder: string }) {
    const { setValue, watch } = useFormContext<NodeFormValues>();
    const [isUploading, setIsUploading] = useState(false);
    const { user } = useUser();
    const { toast } = useToast();
    const currentUrl = watch(name as any);

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
            setValue(name as any, result.url, { shouldValidate: true });
            toast({ title: "Document Attached" });
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Upload Failed", description: e.message });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-2 text-left">
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{label}</Label>
            <Button type="button" variant="outline" className={cn("w-full h-12 border-2 border-dashed", currentUrl && "border-solid border-green-500 bg-green-50 text-green-700")} onClick={() => document.getElementById(`up-${name}`)?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="animate-spin h-4 w-4" /> : currentUrl ? <CheckCircle className="h-4 w-4 mr-2" /> : <FileUp className="h-4 w-4 mr-2" />}
                {currentUrl ? "File Attached" : "Select Document"}
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
                <Alert className="bg-primary/5 border-primary/20">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <AlertTitle className="font-bold">Subcontracting Audit</AlertTitle>
                    <AlertDescription className="text-xs leading-relaxed">
                        You must provide evidence of your right to subcontract freight. These documents are held in our secure vault for Admin Audit only.
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FileUploadField name="primaryContractUrl" label="Primary Contract (Audit Only)" folder="legal-docs" />
                    <FileUploadField name="subcontractorAgreementUrl" label="Subcontractor Agreement" folder="legal-docs" />
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
        if (!companyName && nodeType === 'loads' && user?.displayName) {
            setValue('shopName', `${user.displayName}'s Loads Shop`);
        }
    }, [nodeType, companyName, setValue, user]);

    return (
        <div className="space-y-6 text-left text-foreground">
            <h3 className="text-xl font-black font-headline flex items-center gap-2">
                <UserCheck className="h-6 w-6 text-primary" /> 
                Commercial Identity
            </h3>
            <div className="space-y-4 text-left text-foreground">
                <FormField control={control} name="shopName" render={({ field }) => ( 
                    <FormItem>
                        <FormLabel>Public Identity Label</FormLabel>
                        <FormControl><Input {...field} className="h-11 border-2 bg-white" /></FormControl>
                        <FormMessage />
                    </FormItem> 
                )} />
                <FormField control={control} name="category" render={({ field }) => ( 
                    <FormItem>
                        <FormLabel>Forensic Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="h-11 border-2 bg-white text-left"><SelectValue placeholder="Select classification..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                {freightClassifications.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FormItem> 
                )} />
            </div>
        </div>
    );
}

function StepBrokerageCommercials() {
    const { control } = useFormContext<NodeFormValues>();
    return (
        <div className="space-y-8 text-left text-foreground">
            <h3 className="text-xl font-black font-headline flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-primary" />
                Commercial Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="p-6 border-2 border-primary bg-primary/5 rounded-3xl space-y-4">
                    <FormField control={control} name="brokerageMargin" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-black uppercase text-[10px] tracking-widest text-primary">Your Clearing Margin (%)</FormLabel>
                            <FormControl><Input type="number" {...field} className="h-12 text-2xl font-black bg-white" /></FormControl>
                            <FormDescription className="text-[10px]">Your percentage participation in each load payout.</FormDescription>
                        </FormItem>
                    )} />
                </div>
                <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-2 shadow-xl">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Platform Success Fee</p>
                    <p className="text-3xl font-black text-primary">2.5%</p>
                    <p className="text-[10px] text-slate-400 leading-tight pt-2 italic">Standard ecosystem fee applied to all matched freight transactions.</p>
                </div>
            </div>
        </div>
    );
}

function LoadOpportunityDialog({ shop, onComplete }: { shop: any, onComplete: () => void }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const form = useForm({ resolver: zodResolver(loadOpportunitySchema) });

    const onSubmit = async (values: any) => {
        setLoading(true);
        try {
            const token = await getClientSideAuthToken();
            const res = await fetch('/api/addUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    collectionPath: `companies/${shop.companyId}/loadBoard/loads`,
                    data: { ...values, status: 'active', brokerId: shop.companyId, brokerName: shop.shopName }
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
            <DialogHeader><DialogTitle>Post Freight Opportunity</DialogTitle></DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 text-left">
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <FormField control={form.control} name="origin" render={({ field }) => (<FormItem className="text-left"><FormLabel>Origin Hub</FormLabel><FormControl><Input placeholder="City/Region" {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="destination" render={({ field }) => (<FormItem className="text-left"><FormLabel>Destination Hub</FormLabel><FormControl><Input placeholder="City/Region" {...field} /></FormControl></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                        <FormField control={form.control} name="rate" render={({ field }) => (<FormItem className="text-left"><FormLabel>Target Rate (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="pickupDate" render={({ field }) => (<FormItem className="text-left"><FormLabel>Pickup</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="dropoffDate" render={({ field }) => (<FormItem className="text-left"><FormLabel>Drop-off</Label><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="conditions" render={({ field }) => (<FormItem className="text-left"><FormLabel>Commercial Conditions</FormLabel><FormControl><Textarea placeholder="Specific equipment or insurance rules..." {...field} /></FormControl></FormItem>)} />
                    <DialogFooter><Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <PlusCircle className="mr-2 h-4 w-4"/>} List Load</Button></DialogFooter>
                </form>
            </Form>
        </DialogContent>
    );
}

function StepLoadBoard({ shop }: { shop: any }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isAdding, setIsAdding] = useState(false);
    
    const loadsQuery = useMemoFirebase(() => {
        if (!firestore || !shop?.companyId) return null;
        return query(collection(firestore, `companies/${shop.companyId}/loadBoard/loads`), orderBy('createdAt', 'desc'));
    }, [firestore, shop.companyId]);
    
    const { data: loads, forceRefresh } = useCollection(loadsQuery);

    return (
        <div className="space-y-6 text-left text-foreground">
            <div className="flex justify-between items-center border-b pb-4">
                <div className="text-left">
                    <h3 className="text-xl font-black font-headline">Active Load Registry</h3>
                    <p className="text-xs text-muted-foreground">Manage your freight opportunities directly within your node.</p>
                </div>
                <Dialog open={isAdding} onOpenChange={setIsAdding}>
                    <DialogTrigger asChild><Button className="gap-2 font-bold"><PlusCircle className="h-4 w-4" /> Post New Load</Button></DialogTrigger>
                    <LoadOpportunityDialog shop={shop} onComplete={() => { forceRefresh(); setIsAdding(false); }} />
                </Dialog>
            </div>
            
            <div className="min-h-[300px] text-left">
                {loads && loads.length > 0 ? (
                    <DataTable 
                        data={loads}
                        columns={[
                            { header: 'Route', cell: ({row}) => <div className="font-bold flex items-center gap-2">{row.original.origin} <ArrowRight className="h-3 w-3 opacity-30" /> {row.original.destination}</div> },
                            { header: 'Rate', cell: ({row}) => <span className="font-black text-primary">{formatCurrency(row.original.rate)}</span> },
                            { header: 'Dates', cell: ({row}) => <div className="text-[10px] font-bold text-muted-foreground uppercase">{formatDateSafe(row.original.pickupDate, "dd MMM")} - {formatDateSafe(row.original.dropoffDate, "dd MMM")}</div> },
                            { 
                                id: 'actions', 
                                header: '', 
                                cell: ({row}) => <Button variant="ghost" size="icon" onClick={() => toast({ title: "Record Isolation Active" })}><Trash2 className="h-4 w-4 text-destructive"/></Button> 
                            }
                        ]}
                    />
                ) : (
                    <div className="py-20 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
                        <PackageSearch className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-4">No loads listed in this node.</p>
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
            <div className="space-y-2">
                <h3 className="text-3xl font-black font-headline">Node Configured</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">Your industrial parameters are ready for auditing. Once activated, your node will be visible across the specified malls.</p>
            </div>
            <Button onClick={handlePublish} disabled={loading} size="lg" className="h-16 px-12 text-lg font-black uppercase tracking-tight shadow-xl">
                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin"/> : <Smartphone className="mr-2 h-6 w-6"/>}
                Activate Commercial Hub
            </Button>
        </div>
    );
}

// ====== MAIN WIZARD ======

export function ShopWizard({ shop, nodeType, onUpdate }: { shop: any, nodeType: string, onUpdate: () => void }) {
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

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
        if (nodeType === 'loads') {
            return [
                { id: 'legal', name: '1. Legal Rights', component: <StepLegal />, fields: ['primaryContractUrl', 'subcontractorAgreementUrl'] },
                { id: 'identity', name: '2. Hub Identity', component: <StepIdentity nodeType="loads" />, fields: ['shopName', 'category'] },
                { id: 'commercials', name: '3. Brokerage Config', component: <StepBrokerageCommercials />, fields: ['brokerageMargin'] },
                { id: 'board', name: '4. Active Load Board', component: <StepLoadBoard shop={shop} />, fields: [] },
                { id: 'publish', name: '5. Activate Hub', component: <StepPublish shop={shop} onSave={onUpdate} />, fields: [] },
            ];
        }
        
        return [
            { id: 'identity', name: 'Identity', component: <StepIdentity nodeType={nodeType} />, fields: ['shopName', 'category'] },
            { id: 'publish', name: 'Activate', component: <StepPublish shop={shop} onSave={onUpdate} />, fields: [] },
        ];
    }, [shop, nodeType, onUpdate]);

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
                        <div className="bg-slate-50/50 border-r p-6 space-y-2">
                            {wizardSteps.map((step, index) => (
                                <Button 
                                    key={step.id} 
                                    type="button" 
                                    variant={currentStep === index ? 'secondary' : 'ghost'} 
                                    className={cn("w-full justify-start gap-3 h-12 px-4 transition-all", currentStep === index && "bg-white shadow-sm ring-1 ring-primary/20")} 
                                    onClick={() => setCurrentStep(index)}
                                >
                                    <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs font-black shrink-0", currentStep >= index ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{index + 1}</div>
                                    <span className="font-bold text-xs uppercase tracking-widest">{step.name}</span>
                                </Button>
                            ))}
                        </div>
                        <div className="p-10 min-h-[500px]">
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
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />} Sync
                    </Button>
                    {currentStep < wizardSteps.length - 1 && (
                        <Button type="button" onClick={handleNext} className="font-bold px-8">Continue <ArrowRight className="ml-2 h-4 w-4"/></Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}