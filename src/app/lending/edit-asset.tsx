
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, FormProvider, useFormContext, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, Save, ArrowLeft, ArrowRight, Truck, FileText, CheckCircle, 
    Warehouse, Wrench, Car, Bus, Monitor, CheckCircle2, ListChecks, 
    RefreshCcw, Building, User, ShoppingBag, Database, Info, ShieldCheck, Zap
} from 'lucide-react';
import { getClientSideAuthToken, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { cn, formatCurrency, fetchFromAdminAPI } from '@/lib/utils';
import { collection, query, doc, where, limit } from 'firebase/firestore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const assetSchema = z.object({
  sourceType: z.enum(['dealer', 'client', 'stock']).default('dealer'),
  sourceDealerId: z.string().optional().nullable(),
  sourceClientId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(), // Optional allocation for now
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.string().min(4, 'Year is required'),
  costOfSale: z.coerce.number().positive('Cost must be positive'),
  status: z.enum(['available', 'financed', 'sold', 'decommissioned']).default('available'),
  classification: z.string().min(1, "Asset class required"),
  registrationNumber: z.string().optional(),
  vin: z.string().optional(),
  engineNumber: z.string().optional(),
  tare: z.string().optional(),
  gvm: z.string().optional(),
  firstRegistrationDate: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

const allSteps = [
    { id: 'source', title: '1. Asset Source', icon: ShoppingBag, fields: ['sourceType', 'sourceDealerId', 'sourceClientId'] },
    { id: 'details', title: '2. Technical Node', icon: Truck, fields: ['make', 'model', 'year', 'costOfSale', 'classification'] },
    { id: 'identifiers', title: '3. Identifiers', icon: Database, fields: ['registrationNumber', 'vin', 'engineNumber'] },
    { id: 'audit', title: '4. Forensic Audit', icon: ShieldCheck, fields: [] },
];

export function EditAssetWizard({ asset, onSave, onBack, assetType: initialType, clientId: initialClientId }: { asset?: any, onSave: () => void, onBack: () => void, assetType?: string | null, clientId?: string | null }) {
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const { toast } = useToast();
    const firestore = useFirestore();
    
    const methods = useForm<AssetFormValues>({
        resolver: zodResolver(assetSchema),
        mode: 'onChange',
        defaultValues: asset || { 
            sourceType: 'dealer',
            classification: initialType || 'Truck',
            clientId: initialClientId || null,
            status: 'available',
            costOfSale: 0
        }
    });

    const watchedSource = methods.watch('sourceType');
    const watchedClass = methods.watch('classification');

    // Registry Fetching
    const suppliersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingSuppliers'), where('status', '==', 'active')) : null, [firestore]);
    const { data: suppliers } = useCollection(suppliersQuery);

    const clientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingClients'), where('status', '==', 'active')) : null, [firestore]);
    const { data: clients } = useCollection(clientsQuery);

    const steps = useMemo(() => {
        const isEquipment = watchedClass === 'Equipment' || watchedClass === 'Rights' || watchedClass === 'Invoice';
        return allSteps.filter(s => {
            if (s.id === 'identifiers' && isEquipment) return false;
            return true;
        });
    }, [watchedClass]);

    const onSubmit = async (values: AssetFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await fetchFromAdminAPI(token, 'saveLendingAsset', { asset: { id: asset?.id, ...values } });
            toast({ title: 'Asset Node Committed', description: 'Registry updated successfully.' });
            onSave();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Commit Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleNext = () => {
        const stepFields = steps[currentStep].fields;
        methods.trigger(stepFields as any).then(isValid => {
            if (isValid) setCurrentStep(prev => prev + 1);
            else toast({ variant: 'destructive', title: "Validation Exception", description: "Complete all required technical nodes." });
        });
    };
    
    const handleBackStep = () => setCurrentStep(prev => prev - 1);

    return (
        <Card className="max-w-6xl mx-auto shadow-2xl border-none overflow-hidden text-left text-foreground">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader className="bg-slate-900 text-white p-10 border-b border-white/5 text-left text-white">
                         <div className="flex justify-between items-center text-left text-white">
                            <div className="text-left text-white">
                                <CardTitle className="text-3xl font-black font-headline uppercase text-left text-white">Asset Protocol Terminal</CardTitle>
                                <CardDescription className="text-slate-400 text-lg mt-1 text-left text-white">Stage: {steps[currentStep].title}</CardDescription>
                            </div>
                            <Button type="button" variant="ghost" className="text-white hover:text-primary" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4"/> Back to Ledger</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 text-left text-foreground">
                        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] text-left text-foreground">
                             <div className="bg-slate-50 border-r p-8 space-y-2 text-left text-foreground">
                                {steps.map((step, i) => (
                                    <div key={step.id} className={cn(
                                        "flex items-center gap-4 p-4 rounded-xl transition-all text-left",
                                        currentStep === i ? "bg-white shadow-md ring-1 ring-primary/20" : "opacity-40"
                                    )}>
                                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", currentStep >= i ? "bg-primary text-white" : "bg-muted")}>
                                            {React.createElement(step.icon, { className: "h-4 w-4" })}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-left">{step.title}</span>
                                    </div>
                                ))}
                            </div>
                             <div className="p-12 space-y-10 bg-white min-h-[500px] text-left text-foreground">
                                {steps[currentStep].id === 'source' && (
                                    <div className="space-y-8 animate-in fade-in duration-500 text-left text-foreground">
                                        <FormField control={methods.control} name="sourceType" render={({ field }) => (
                                            <FormItem className="space-y-4 text-left text-foreground">
                                                <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest">Select Acquisition Path</FormLabel>
                                                <FormControl>
                                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left text-foreground">
                                                        <div className={cn("p-4 border-2 rounded-2xl cursor-pointer transition-all", field.value === 'dealer' ? "border-primary bg-primary/5 shadow-md" : "bg-white")}>
                                                            <div className="flex items-center gap-2"><RadioGroupItem value="dealer" id="src-dealer" /><Label htmlFor="src-dealer" className="font-bold text-xs uppercase cursor-pointer">Dealer (Supplier)</Label></div>
                                                            <p className="text-[10px] text-muted-foreground mt-2 leading-tight">Purchased from an authorized platform supplier.</p>
                                                        </div>
                                                        <div className={cn("p-4 border-2 rounded-2xl cursor-pointer transition-all", field.value === 'client' ? "border-primary bg-primary/5 shadow-md" : "bg-white")}>
                                                            <div className="flex items-center gap-2"><RadioGroupItem value="client" id="src-client" /><Label htmlFor="src-client" className="font-bold text-xs uppercase cursor-pointer">Client (Trade-in)</Label></div>
                                                            <p className="text-[10px] text-muted-foreground mt-2 leading-tight">Sourced as a trade-in from an existing member.</p>
                                                        </div>
                                                        <div className={cn("p-4 border-2 rounded-2xl cursor-pointer transition-all", field.value === 'stock' ? "border-primary bg-primary/5 shadow-md" : "bg-white")}>
                                                            <div className="flex items-center gap-2"><RadioGroupItem value="stock" id="src-stock" /><Label htmlFor="src-stock" className="font-bold text-xs uppercase cursor-pointer">Internal Stock</Label></div>
                                                            <p className="text-[10px] text-muted-foreground mt-2 leading-tight">Already in possession. Move from inventory.</p>
                                                        </div>
                                                    </RadioGroup>
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                        
                                        {watchedSource === 'dealer' && (
                                            <FormField control={methods.control} name="sourceDealerId" render={({ field }) => (
                                                <FormItem className="animate-in slide-in-from-left-2 text-left">
                                                    <FormLabel>Select Authorized Dealer</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                                        <FormControl><SelectTrigger className="h-12 border-2 bg-white"><SelectValue placeholder="Choose supplier..." /></SelectTrigger></FormControl>
                                                        <SelectContent>{suppliers?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )} />
                                        )}

                                        {watchedSource === 'client' && (
                                            <FormField control={methods.control} name="sourceClientId" render={({ field }) => (
                                                <FormItem className="animate-in slide-in-from-left-2 text-left">
                                                    <FormLabel>Select Trade-in Client</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                                        <FormControl><SelectTrigger className="h-12 border-2 bg-white"><SelectValue placeholder="Choose member..." /></SelectTrigger></FormControl>
                                                        <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )} />
                                        )}
                                    </div>
                                )}

                                {steps[currentStep].id === 'details' && (
                                    <div className="space-y-8 animate-in fade-in duration-500 text-left text-foreground">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-foreground">
                                            <FormField control={methods.control} name="classification" render={({ field }) => (
                                                <FormItem className="text-left text-foreground"><FormLabel>Asset Class</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger className="h-12 border-2 bg-white font-bold"><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Truck">Heavy Vehicle (Truck)</SelectItem><SelectItem value="Trailer">Interlink / Trailer</SelectItem><SelectItem value="Bakkie">Light Commercial</SelectItem><SelectItem value="Equipment">Industrial Equipment</SelectItem></SelectContent></Select></FormItem>
                                            )} />
                                            <FormField control={methods.control} name="costOfSale" render={({ field }) => (
                                                <FormItem className="text-left text-foreground"><FormLabel className="text-primary font-black uppercase text-[10px]">Purchase Valuation (Excl. VAT)</FormLabel><FormControl><Input type="number" {...field} className="h-12 border-2 bg-white text-xl font-black" /></FormControl></FormItem>
                                            )} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left text-foreground">
                                            <FormField control={methods.control} name="make" render={({ field }) => (<FormItem className="text-left"><FormLabel>Make</FormLabel><FormControl><Input {...field} className="border-2" /></FormControl></FormItem>)} />
                                            <FormField control={methods.control} name="model" render={({ field }) => (<FormItem className="text-left"><FormLabel>Model</FormLabel><FormControl><Input {...field} className="border-2" /></FormControl></FormItem>)} />
                                            <FormField control={methods.control} name="year" render={({ field }) => (<FormItem className="text-left"><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} className="border-2" /></FormControl></FormItem>)} />
                                        </div>
                                    </div>
                                )}

                                {steps[currentStep].id === 'identifiers' && (
                                    <div className="space-y-8 animate-in fade-in duration-500 text-left text-foreground">
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-foreground">
                                            <FormField control={methods.control} name="registrationNumber" render={({ field }) => (<FormItem className="text-left"><FormLabel>RSA Registration Number</FormLabel><FormControl><Input {...field} placeholder="e.g. AB 12 CD GP" className="h-12 border-2 font-black uppercase" /></FormControl></FormItem>)} />
                                            <FormField control={methods.control} name="vin" render={({ field }) => (<FormItem className="text-left"><FormLabel>VIN / Chassis Number</FormLabel><FormControl><Input {...field} className="h-12 border-2 font-mono uppercase" /></FormControl></FormItem>)} />
                                        </div>
                                        {watchedClass !== 'Trailer' && (
                                            <FormField control={methods.control} name="engineNumber" render={({ field }) => (<FormItem className="text-left animate-in slide-in-from-top-2"><FormLabel>Engine Number</FormLabel><FormControl><Input {...field} className="h-12 border-2 font-mono uppercase" /></FormControl></FormItem>)} />
                                        )}
                                    </div>
                                )}

                                {steps[currentStep].id === 'audit' && (
                                    <div className="text-center py-20 space-y-6 text-foreground text-center">
                                        <ShieldCheck className="h-20 w-20 text-primary mx-auto opacity-30" />
                                        <div className="space-y-2 text-center text-foreground text-foreground">
                                            <h3 className="text-3xl font-black uppercase">Final Protocol Check</h3>
                                            <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">Ensure all technical nodes and valuations are verified before committing this node to the registry.</p>
                                        </div>
                                    </div>
                                )}
                             </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t p-10 flex justify-between text-left text-foreground">
                        <Button type="button" variant="outline" onClick={handleBackStep} className="font-bold h-12 px-8">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        {currentStep < steps.length - 1 ? (
                            <Button type="button" onClick={handleNext} className="h-12 px-12 font-black uppercase text-xs text-white shadow-lg text-left">
                                Next Protocol Stage <ArrowRight className="ml-2 h-4 w-4"/>
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isLoading} className="h-14 px-16 bg-primary hover:bg-primary/90 shadow-2xl font-black uppercase tracking-tight text-white text-left">
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                Commit Node to Ledger
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
