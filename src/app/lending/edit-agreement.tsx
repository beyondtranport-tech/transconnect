'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, Save, ArrowLeft, ArrowRight, FileSignature, 
    Truck, Building, User, Banknote, Database, Info, Search, 
    CheckCircle2, Scale, UserCheck, Zap, Handshake, ShieldCheck,
    ClipboardCheck, Landmark, Lock, RefreshCcw
} from 'lucide-react';
import { getClientSideAuthToken, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { cn, fetchFromAdminAPI, formatCurrency } from '@/lib/utils';
import { doc, collection, query, where, setDoc, serverTimestamp } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

// --- SCHEMA ---
const agreementSubSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  assetId: z.string().optional().nullable(),
  type: z.string().min(1, 'Agreement type is required'),
  description: z.string().min(1, 'Description is required'),
  totalAdvanced: z.coerce.number().positive('Amount must be positive'),
  interestRate: z.coerce.number().min(0, "Rate can't be negative"),
  numberOfInstallments: z.coerce.number().int().positive('Term must be a positive integer'),
  creditorId: z.string().optional().nullable(),
  creditorName: z.string().optional().nullable(),
  liabilityAmount: z.coerce.number().min(0).optional(),
});

const wizardSchema = z.object({
  agreement: agreementSubSchema,
});

type WizardFormValues = z.infer<typeof wizardSchema>;

// --- STEP COMPONENTS ---

function StepClientAsset({ clients, availableAssets, isLoadingAssets, isLocked }: { clients: any[], availableAssets: any[], isLoadingAssets: boolean, isLocked: boolean }) {
    const { control } = useFormContext<WizardFormValues>();
    return (
        <div className="space-y-10 animate-in fade-in duration-500 text-left">
            <fieldset disabled={isLocked} className="space-y-10">
                <FormField control={control} name="agreement.clientId" render={({ field }) => (
                    <FormItem className="text-left text-foreground">
                        <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Member Client (Borrower)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl><SelectTrigger className="h-12 border-2 bg-white font-bold text-left"><SelectValue placeholder="Choose client..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                {clients.map((c:any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )} />
                <FormField control={control} name="agreement.type" render={({ field }) => (
                    <FormItem className="text-left text-foreground">
                        <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Facility Protocol</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl><SelectTrigger className="h-12 border-2 bg-white font-black text-left"><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="loan-pv-term">Loan / Working Capital</SelectItem>
                                <SelectItem value="installment-sale-term">Installment Sale</SelectItem>
                                <SelectItem value="rental-term">Lease / Rental</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormItem>
                )} />
                <div className="p-8 border-2 border-dashed rounded-[2rem] bg-slate-50 space-y-4 text-left">
                    <h4 className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2 text-left text-foreground"><Truck className="h-4 w-4" /> Physical Asset Bind</h4>
                    <FormField control={control} name="agreement.assetId" render={({ field }) => (
                        <FormItem className="text-left">
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl>
                                    <SelectTrigger className="h-14 border-2 bg-white font-bold text-left text-foreground text-foreground">
                                        <SelectValue placeholder={isLoadingAssets ? "Scanning Register..." : "Select from available assets..."} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {availableAssets?.map((a:any) => (
                                        <SelectItem key={a.id} value={a.id}>{a.year} {a.make} {a.model} - {formatCurrency(a.costOfSale)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            </fieldset>
        </div>
    );
}

function StepTerms({ isLocked }: { isLocked: boolean }) {
    const { control } = useFormContext<WizardFormValues>();
    return (
        <div className="space-y-10 animate-in fade-in duration-500 text-left text-foreground">
            <fieldset disabled={isLocked} className="space-y-10">
                <FormField control={control} name="agreement.description" render={({ field }) => (
                    <FormItem className="text-left">
                        <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Deal Descriptor</FormLabel>
                        <FormControl><Textarea {...field} className="h-24 border-2 bg-white font-bold text-base leading-relaxed" placeholder="Summarize the commercial purpose..." /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <FormField control={control} name="agreement.totalAdvanced" render={({ field }) => (
                        <FormItem className="text-left text-foreground">
                            <FormLabel className="text-primary font-black uppercase text-[10px] tracking-widest ml-1">Principal (ZAR)</FormLabel>
                            <FormControl><Input type="number" {...field} className="h-12 border-2 bg-white font-black text-xl" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={control} name="agreement.interestRate" render={({ field }) => (
                        <FormItem className="text-left text-foreground">
                            <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Rate (% p.a.)</FormLabel>
                            <FormControl><Input type="number" {...field} className="h-12 border-2 bg-white font-bold" /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={control} name="agreement.numberOfInstallments" render={({ field }) => (
                        <FormItem className="text-left text-foreground">
                            <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Term (Months)</FormLabel>
                            <FormControl><Input type="number" {...field} className="h-12 border-2 bg-white font-bold" /></FormControl>
                        </FormItem>
                    )} />
                </div>
            </fieldset>
        </div>
    );
}

function StepDisbursement({ availableAssets, isLocked }: { availableAssets: any[], isLocked: boolean }) {
    const { watch, setValue } = useFormContext<WizardFormValues>();
    const assetId = watch('agreement.assetId');
    const asset = useMemo(() => availableAssets?.find(a => a.id === assetId), [availableAssets, assetId]);

    useEffect(() => {
        if (asset && !isLocked) {
            const creditorName = asset.sourceType === 'dealer' ? asset.sourceDealerName : (asset.sourceType === 'client' ? asset.sourceClientName : 'Internal Stock');
            setValue('agreement.creditorId', asset.sourceDealerId || asset.sourceClientId || 'internal', { shouldDirty: true });
            setValue('agreement.creditorName', creditorName || 'DMS Managed Source', { shouldDirty: true });
            setValue('agreement.liabilityAmount', asset.costOfSale || 0, { shouldDirty: true });
        }
    }, [asset, setValue, isLocked]);

    return (
        <div className="space-y-10 animate-in fade-in duration-500 text-left text-foreground">
            <div className="bg-primary/5 p-8 rounded-[2.5rem] border-2 border-primary/20 space-y-6 text-left">
                <div className="flex items-center gap-3 text-left">
                    <div className="bg-primary p-2 rounded-lg text-white shadow-md text-left"><Scale className="h-6 w-6" /></div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-foreground text-left">Liability Recognition Node</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed text-left text-foreground">Committing this agreement creates an authorized disbursement record. The financial settlement path remains flexible for contingent milestones.</p>
                
                <Separator className="bg-primary/10" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-foreground text-foreground">
                    <div className="space-y-1 text-left text-foreground">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Recipient Creditor</Label>
                        <p className="text-lg font-bold text-slate-900 border-b-2 pb-1 border-primary/10 text-left text-foreground">{watch('agreement.creditorName') || 'Resolving from asset...'}</p>
                    </div>
                    <div className="space-y-1 text-left">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-left">Authorized Disbursement (ZAR)</Label>
                        <p className="text-3xl font-black text-primary text-left">{formatCurrency(watch('agreement.liabilityAmount'))}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepCommitmentAudit({ isLocked, onRefinance }: { isLocked: boolean, onRefinance: () => void }) {
    const { watch } = useFormContext<WizardFormValues>();
    const values = watch('agreement');

    return (
        <div className="space-y-8 animate-in zoom-in-95 duration-500 text-left text-foreground text-foreground">
            <div className="text-center py-10 space-y-6 text-foreground text-foreground">
                <div className="bg-primary/10 p-6 rounded-full w-fit mx-auto border border-primary/20 text-foreground">
                    <ClipboardCheck className="h-16 w-16 text-primary" />
                </div>
                <div className="space-y-2 text-foreground text-center">
                    <h3 className="text-3xl font-black uppercase text-center">Fiduciary Lock Status</h3>
                    <p className="text-sm text-muted-foreground max-sm mx-auto leading-relaxed text-center">Verified agreements are immutable to ensure institutional audit integrity.</p>
                </div>
                {isLocked && (
                    <Button variant="outline" className="gap-2 font-bold text-foreground" onClick={onRefinance}>
                        <RefreshCcw className="h-4 w-4" /> Initialize Refinance Protocol
                    </Button>
                )}
            </div>

            <Card className="border-2 bg-slate-50/50 text-left text-foreground text-foreground text-foreground">
                <CardContent className="p-8 space-y-6 text-left">
                    <div className="grid grid-cols-2 gap-8 text-left text-foreground">
                        <div className="space-y-1 text-left">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground">Agreement Class</Label>
                            <p className="font-bold text-sm capitalize text-left">{values.type?.replace(/-/g, ' ')}</p>
                        </div>
                        <div className="space-y-1 text-right text-foreground">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground">Authorized Principal</Label>
                            <p className="font-black text-xl text-primary text-right">{formatCurrency(values.totalAdvanced)}</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-1 text-left text-foreground">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Registry Recipient (Creditor)</Label>
                        <div className="flex items-center gap-2 font-bold text-sm text-left">
                            <Building className="h-4 w-4 text-primary" />
                            {values.creditorName}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// --- WIZARD TERMINAL ---

export function AgreementWizard({ agreement, clients, onSave, onBack }: any) {
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isRefinancing, setIsRefinancing] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const isLocked = useMemo(() => {
        return agreement?.status === 'active' && !isRefinancing;
    }, [agreement, isRefinancing]);

    const methods = useForm<WizardFormValues>({
        resolver: zodResolver(wizardSchema),
        mode: 'onChange',
        defaultValues: agreement ? { agreement } : { 
            agreement: { totalAdvanced: 0, interestRate: 15, numberOfInstallments: 60, status: 'pending' } 
        }
    });
    
    const assetsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'lendingAssets'), where('status', '==', 'available'));
    }, [firestore]);
    const { data: availableAssets, isLoading: isLoadingAssets } = useCollection(assetsQuery);

    const steps = [
        { id: 'client', title: '1. Identity', icon: User, fields: ['agreement.clientId', 'agreement.assetId', 'agreement.type'] },
        { id: 'details', title: '2. Terms Node', icon: FileSignature, fields: ['agreement.description', 'agreement.totalAdvanced', 'agreement.interestRate', 'agreement.numberOfInstallments'] },
        { id: 'liability', title: '3. Financial Lock', icon: Scale, fields: ['agreement.creditorId', 'agreement.liabilityAmount'] },
        { id: 'review', title: '4. Audit & Status', icon: ShieldCheck, fields: [] },
    ];

    const isStepValid = (index: number) => {
        if (isLocked) return true;
        const step = steps[index];
        if (!step.fields || step.fields.length === 0) return true;
        const errors = methods.formState.errors;
        return step.fields.every(field => {
            const parts = field.split('.');
            let err: any = errors;
            for (const p of parts) { err = err?.[p]; }
            return !err;
        });
    };

    const onSubmit = async (data: WizardFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");

            // 1. Commit Agreement protocol (Set to active)
            const agreementRes = await fetchFromAdminAPI(token, 'saveLendingAgreement', { 
                agreement: { 
                    ...data.agreement, 
                    status: 'active',
                    isRefinanced: isRefinancing,
                    refinancedFromId: isRefinancing ? agreement.id : null
                } 
            });

            // 2. Commit Disbursement Node
            if (!isLocked) {
                const asset = availableAssets?.find(a => a.id === data.agreement.assetId);
                await fetchFromAdminAPI(token, 'createLendingPayment', {
                    payment: {
                        agreementId: agreementRes.data.id,
                        clientId: data.agreement.clientId,
                        clientName: clients.find((c: any) => c.id === data.agreement.clientId)?.name || 'Borrower',
                        assetId: data.agreement.assetId,
                        assetName: asset ? `${asset.year} ${asset.make} ${asset.model}` : 'Financed Asset',
                        creditorId: data.agreement.creditorId,
                        creditorName: data.agreement.creditorName,
                        amount: data.agreement.liabilityAmount,
                        amountPaid: 0,
                        status: 'pending',
                        createdAt: { _methodName: 'serverTimestamp' }
                    }
                });
            }

            toast({ title: 'Protocol Committed', description: 'Agreement and liability node successfully synchronized.' });
            onSave();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Commit Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleNext = async () => {
        const isValid = isLocked ? true : await methods.trigger(steps[currentStep].fields as any);
        if (isValid && currentStep < steps.length - 1) setCurrentStep(prev => prev + 1);
    };

    return (
        <Card className="max-w-6xl mx-auto shadow-2xl border-none overflow-hidden text-left text-foreground">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)} onKeyDown={(e) => { if(e.key === 'Enter') e.preventDefault(); }}>
                    <CardHeader className="bg-slate-900 text-white p-10 text-left text-white text-left">
                        <div className="flex justify-between items-center text-left text-white">
                            <div className="text-left text-white">
                                <CardTitle className="text-3xl font-black font-headline uppercase text-white text-left">Agreement Terminal</CardTitle>
                                <CardDescription className="text-slate-400 text-lg mt-1 text-white text-left">Current Phase: {steps[currentStep].title}</CardDescription>
                            </div>
                            <div className="flex gap-3">
                                {isLocked && <Badge variant="outline" className="h-8 border-amber-500 text-amber-500 gap-1.5 px-4 font-black uppercase tracking-widest text-left"><Lock className="h-3 w-3" /> Fiduciary Locked</Badge>}
                                <Button type="button" variant="ghost" className="text-white hover:text-primary" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Exit terminal</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] text-left">
                            <div className="bg-slate-50 border-r p-8 space-y-2 text-left">
                                {steps.map((step, index) => {
                                    const isCompleted = index < currentStep && isStepValid(index);
                                    const StepIcon = step.icon;
                                    return (
                                        <Button 
                                            key={step.id} 
                                            type="button" 
                                            variant={currentStep === index ? 'secondary' : 'ghost'} 
                                            className={cn("w-full justify-start gap-4 h-12 px-4 transition-all text-left", currentStep === index && "bg-white shadow-sm ring-1 ring-primary/20")} 
                                            onClick={() => { if(index <= currentStep) setCurrentStep(index); }}
                                        >
                                            {isCompleted ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className={cn("h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-black", currentStep >= index ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{index + 1}</div>}
                                            <StepIcon className={cn("h-5 w-5", currentStep >= index ? "text-primary" : "text-muted-foreground")} />
                                            <span className={cn("text-[10px] font-black uppercase tracking-[0.1em]", currentStep === index ? "text-primary" : "text-muted-foreground")}>{step.title.split('. ')[1]}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                            <div className="p-12 space-y-12 bg-white min-h-[550px] text-left text-foreground text-left">
                                {steps[currentStep].id === 'client' && <StepClientAsset clients={clients} availableAssets={availableAssets || []} isLoadingAssets={isLoadingAssets} isLocked={isLocked} />}
                                {steps[currentStep].id === 'details' && <StepTerms isLocked={isLocked} />}
                                {steps[currentStep].id === 'liability' && <StepDisbursement availableAssets={availableAssets || []} isLocked={isLocked} />}
                                {steps[currentStep].id === 'review' && <StepCommitmentAudit isLocked={isLocked} onRefinance={() => { setIsRefinancing(true); setCurrentStep(0); toast({ title: "Refinance Active", description: "Agreement nodes unlocked for update." }); }} />}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t p-10 flex justify-between text-left">
                        <Button type="button" variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 0 || isLoading} className="h-12 px-8 font-bold">Protocol Back</Button>
                        {currentStep < steps.length - 1 ? (
                            <Button type="button" onClick={handleNext} className="h-12 px-12 font-black uppercase text-xs text-white shadow-lg">Next Protocol Phase <ArrowRight className="ml-2 h-4 w-4"/></Button>
                        ) : (
                            <Button type="submit" disabled={isLoading || (isLocked && !isRefinancing)} className="h-14 px-16 bg-primary hover:bg-primary/90 shadow-2xl font-black uppercase tracking-tight text-white">
                                {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <ShieldCheck className="mr-2 h-6 w-6" />} Confirm & Activate Protocol
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}