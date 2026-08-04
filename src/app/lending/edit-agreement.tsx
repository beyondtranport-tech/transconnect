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
    Loader2, Save, ArrowLeft, ArrowRight, CheckCircle, FileSignature, 
    Truck, Building, User, Banknote, Database, Info, Search, 
    CheckCircle2, Scale, UserCheck, Zap, Handshake, ShieldCheck 
} from 'lucide-react';
import { getClientSideAuthToken, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { cn, fetchFromAdminAPI, formatCurrency } from '@/lib/utils';
import { doc, collection, query, where, setDoc, serverTimestamp } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// --- SCHEMA ---
const agreementSubSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  assetId: z.string().optional().nullable(),
  type: z.string().min(1, 'Agreement type is required'),
  description: z.string().min(1, 'Description is required'),
  totalAdvanced: z.coerce.number().positive('Amount must be positive'),
  interestRate: z.coerce.number().min(0, "Rate can't be negative"),
  numberOfInstallments: z.coerce.number().int().positive('Term must be a positive integer'),
  // Liability fields
  creditorId: z.string().optional().nullable(),
  creditorName: z.string().optional().nullable(),
  liabilityAmount: z.coerce.number().min(0).optional(),
});

const wizardSchema = z.object({
  agreement: agreementSubSchema,
});

type WizardFormValues = z.infer<typeof wizardSchema>;

// --- STEP COMPONENTS ---

function StepDisbursement({ availableAssets }: { availableAssets: any[] }) {
    const { watch, setValue } = useFormContext<WizardFormValues>();
    const assetId = watch('agreement.assetId');
    const asset = useMemo(() => availableAssets?.find(a => a.id === assetId), [availableAssets, assetId]);

    useEffect(() => {
        if (asset) {
            // Determine creditor name based on asset source
            const creditorName = asset.sourceType === 'dealer' ? asset.sourceDealerName : (asset.sourceType === 'client' ? asset.sourceClientName : 'Internal');
            setValue('agreement.creditorId', asset.sourceDealerId || asset.sourceClientId || 'internal');
            setValue('agreement.creditorName', creditorName);
            setValue('agreement.liabilityAmount', asset.costOfSale || 0);
        }
    }, [asset, setValue]);

    return (
        <div className="space-y-10 animate-in fade-in duration-500 text-left text-foreground">
            <div className="bg-primary/5 p-8 rounded-[2.5rem] border-2 border-primary/20 space-y-6 text-left">
                <div className="flex items-center gap-3 text-left">
                    <div className="bg-primary p-2 rounded-lg text-white"><Scale className="h-6 w-6" /></div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Liability Recognition Node</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed text-left">The platform will create a <strong>Creditor Record</strong> for the amount below. This liability must be cleared in the Payments module to finalize ownership.</p>
                
                <Separator className="bg-primary/10" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div className="space-y-1 text-left">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Recipient Creditor</Label>
                        <p className="text-lg font-bold text-slate-900 border-b-2 pb-1 border-primary/10">{watch('agreement.creditorName') || 'Auto-resolving from asset...'}</p>
                    </div>
                    <div className="space-y-1 text-left">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Disbursement Liability (ZAR)</Label>
                        <p className="text-3xl font-black text-primary">{formatCurrency(watch('agreement.liabilityAmount'))}</p>
                    </div>
                </div>
            </div>

            <Alert className="bg-slate-900 text-white border-none shadow-xl rounded-3xl p-6 text-left">
                <Info className="h-5 w-5 text-primary" />
                <div className="ml-2 text-left">
                    <AlertTitle className="font-bold text-xs uppercase tracking-widest text-primary">Fiduciary Handshake</AlertTitle>
                    <AlertDescription className="text-xs text-slate-400 mt-1">
                        Committing this agreement will move this amount into the **Pending Disbursements** registry for authorized settlement.
                    </AlertDescription>
                </div>
            </Alert>
        </div>
    );
}

// --- WIZARD TERMINAL ---

export function AgreementWizard({ agreement, clients, onSave, onBack }: any) {
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const { toast } = useToast();
    const firestore = useFirestore();

    const methods = useForm<WizardFormValues>({
        resolver: zodResolver(wizardSchema),
        mode: 'onChange',
        defaultValues: agreement ? { agreement } : { agreement: { totalAdvanced: 0, interestRate: 15, numberOfInstallments: 60 } }
    });
    
    const assetsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'lendingAssets'), where('status', '==', 'available'));
    }, [firestore]);
    const { data: availableAssets, isLoading: isLoadingAssets } = useCollection(assetsQuery);

    const steps = [
        { id: 'client', title: 'Client & Asset', icon: User, fields: ['agreement.clientId', 'agreement.assetId', 'agreement.type'] },
        { id: 'details', title: 'Terms Node', icon: FileSignature, fields: ['agreement.description', 'agreement.totalAdvanced', 'agreement.interestRate', 'agreement.numberOfInstallments'] },
        { id: 'liability', title: 'Financial Lock', icon: Scale, fields: ['agreement.creditorId', 'agreement.liabilityAmount'] },
        { id: 'review', title: 'Audit Check', icon: ShieldCheck, fields: [] },
    ];

    const isStepValid = (index: number) => {
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

            // 1. Commit Agreement
            const agreementRes = await fetchFromAdminAPI(token, 'saveLendingAgreement', { 
                agreement: { ...data.agreement, status: 'active' } 
            });

            // 2. Create Disbursement Node
            await fetchFromAdminAPI(token, 'createLendingPayment', {
                payment: {
                    agreementId: agreementRes.data.id,
                    clientId: data.agreement.clientId,
                    clientName: clients.find((c: any) => c.id === data.agreement.clientId)?.name || 'Member',
                    assetId: data.agreement.assetId,
                    assetName: availableAssets?.find(a => a.id === data.agreement.assetId)?.make || 'Asset',
                    creditorId: data.agreement.creditorId,
                    creditorName: data.agreement.creditorName,
                    amount: data.agreement.liabilityAmount,
                    status: 'pending',
                    createdAt: { _methodName: 'serverTimestamp' }
                }
            });

            // 3. Mark Asset as Financed
            if (data.agreement.assetId) {
                const assetRef = doc(firestore, 'lendingAssets', data.agreement.assetId);
                await setDoc(assetRef, { status: 'financed', agreementId: agreementRes.data.id, updatedAt: serverTimestamp() }, { merge: true });
            }

            toast({ title: 'Protocol Committed', description: 'Agreement active and liability recognized.' });
            onSave();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Commit Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleNext = async () => {
        const isValid = await methods.trigger(steps[currentStep].fields as any);
        if (isValid && currentStep < steps.length - 1) setCurrentStep(prev => prev + 1);
    };

    return (
        <Card className="max-w-6xl mx-auto shadow-2xl border-none overflow-hidden text-left text-foreground">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader className="bg-slate-900 text-white p-10 text-left">
                        <div className="flex justify-between items-center text-left">
                            <div className="text-left text-white">
                                <CardTitle className="text-3xl font-black font-headline uppercase text-white text-left">Agreement Authority Terminal</CardTitle>
                                <CardDescription className="text-slate-400 text-lg mt-1 text-white">Stage: {steps[currentStep].title}</CardDescription>
                            </div>
                            <Button type="button" variant="ghost" className="text-white hover:text-primary" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Ledger</Button>
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
                                            className={cn("w-full justify-start gap-4 h-12 px-4 transition-all text-left text-foreground", currentStep === index && "bg-white shadow-sm ring-1 ring-primary/20")} 
                                            onClick={() => { if(index <= currentStep) setCurrentStep(index); }}
                                        >
                                            {isCompleted ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className={cn("h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-black", currentStep >= index ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{index + 1}</div>}
                                            <StepIcon className={cn("h-5 w-5", currentStep >= index ? "text-primary" : "text-muted-foreground")} />
                                            <span className={cn("text-[10px] font-black uppercase tracking-[0.1em]", currentStep === index ? "text-primary" : "text-muted-foreground")}>{step.title}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                            <div className="p-12 space-y-12 bg-white min-h-[500px] text-left text-foreground">
                                {steps[currentStep].id === 'client' && (
                                    <div className="space-y-10 animate-in fade-in duration-500 text-left">
                                        <FormField control={methods.control} name="agreement.clientId" render={({ field }) => (
                                            <FormItem className="text-left text-foreground"><FormLabel>Target Member Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-12 border-2 bg-white font-bold text-left"><SelectValue placeholder="Choose client..." /></SelectTrigger></FormControl><SelectContent>{clients.map((c:any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></FormItem>
                                        )} />
                                        <FormField control={methods.control} name="agreement.type" render={({ field }) => (
                                            <FormItem className="text-left text-foreground"><FormLabel>Facility Protocol</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-12 border-2 bg-white font-black text-left"><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="loan-pv-term">Loan / Working Capital</SelectItem><SelectItem value="installment-sale-term">Installment Sale</SelectItem><SelectItem value="rental-term">Lease / Rental</SelectItem></SelectContent></Select></FormItem>
                                        )} />
                                        <div className="p-8 border-2 border-dashed rounded-3xl bg-slate-50 space-y-4 text-left">
                                            <h4 className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2 text-left"><Truck className="h-4 w-4" /> Physical Asset Bind</h4>
                                            <FormField control={methods.control} name="agreement.assetId" render={({ field }) => (
                                                <FormItem className="text-left"><Select onValueChange={field.onChange} defaultValue={field.value || ''}><FormControl><SelectTrigger className="h-14 border-2 bg-white font-bold text-left"><SelectValue placeholder={isLoadingAssets ? "Scanning Register..." : "Select from available assets..."} /></SelectTrigger></FormControl><SelectContent>{availableAssets?.map((a:any) => <SelectItem key={a.id} value={a.id}>{a.year} {a.make} {a.model} - {formatCurrency(a.costOfSale)}</SelectItem>)}</SelectContent></Select></FormItem>
                                            )} />
                                        </div>
                                    </div>
                                )}
                                {steps[currentStep].id === 'details' && (
                                    <div className="space-y-6 animate-in fade-in duration-500 text-left text-foreground">
                                        <FormField control={methods.control} name="agreement.description" render={({ field }) => (<FormItem className="text-left"><FormLabel>Deal Descriptor</FormLabel><FormControl><Textarea {...field} className="h-24 border-2 bg-white font-bold" /></FormControl></FormItem>)} />
                                        <div className="grid grid-cols-3 gap-6 text-left">
                                            <FormField control={methods.control} name="agreement.totalAdvanced" render={({ field }) => (<FormItem className="text-left text-foreground"><FormLabel>Principal Advanced</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 bg-white font-black" /></FormControl></FormItem>)} />
                                            <FormField control={methods.control} name="agreement.interestRate" render={({ field }) => (<FormItem className="text-left text-foreground"><FormLabel>Rate (% p.a.)</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 bg-white" /></FormControl></FormItem>)} />
                                            <FormField control={methods.control} name="agreement.numberOfInstallments" render={({ field }) => (<FormItem className="text-left text-foreground"><FormLabel>Term (Months)</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 bg-white" /></FormControl></FormItem>)} />
                                        </div>
                                    </div>
                                )}
                                {steps[currentStep].id === 'liability' && <StepDisbursement availableAssets={availableAssets || []} />}
                                {steps[currentStep].id === 'review' && (
                                    <div className="text-center py-24 space-y-6 animate-in zoom-in-95 duration-500 text-left">
                                        <ShieldCheck className="h-20 w-20 text-primary mx-auto opacity-20" />
                                        <h3 className="text-3xl font-black uppercase text-foreground text-center">Audit Verified</h3>
                                        <p className="text-sm text-muted-foreground max-sm mx-auto leading-relaxed text-center">Verify data integrity before committing this agreement node to the grid. This will instantly recognize the liability for disbursement.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t p-10 flex justify-between text-left text-foreground">
                        <Button type="button" variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 0 || isLoading} className="h-12 px-8 font-bold">Back</Button>
                        {currentStep < steps.length - 1 ? (
                            <Button type="button" onClick={handleNext} className="h-12 px-12 font-black uppercase text-xs text-white shadow-lg">Next protocol Stage <ArrowRight className="ml-2 h-4 w-4"/></Button>
                        ) : (
                            <Button type="submit" disabled={isLoading} className="h-14 px-16 bg-primary hover:bg-primary/90 shadow-2xl font-black uppercase tracking-tight text-white">
                                {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />} Commit Agreement Node
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
