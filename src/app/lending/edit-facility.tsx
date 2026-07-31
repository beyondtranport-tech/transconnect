'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft, ArrowRight, Banknote, Landmark, Building, Info, ShieldCheck, Zap, CheckCircle, Gavel, UserCheck, Scale, FileText, CheckCircle2 } from 'lucide-react';
import { getClientSideAuthToken, useUser, useFirestore } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { cn, formatCurrency, fetchFromAdminAPI } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const facilitySchema = z.object({
  id: z.string().optional(),
  parentId: z.string().optional().nullable(),
  ownerType: z.enum(['client', 'debtor']).default('client'),
  facilityClass: z.enum(['global', 'sub']).default('global'),
  clientId: z.string().optional().nullable(),
  debtorId: z.string().optional().nullable(),
  associatedClientId: z.string().optional().nullable(), 
  agreementType: z.string().optional().nullable(), 
  type: z.string().min(1, 'Product type is required'),
  limit: z.coerce.number().positive('Limit must be a positive number'),
  status: z.string().default('active'),
});

type FacilityFormValues = z.infer<typeof facilitySchema>;

const allSteps = [
    { id: 'type', title: 'Context & Branch', icon: Landmark, fields: ['ownerType'] },
    { id: 'association', title: 'Global Limit', icon: Building, fields: ['clientId', 'debtorId', 'limit'] },
    { id: 'agreement_limit', title: 'Agreement Limit', icon: Gavel, fields: ['facilityClass', 'associatedClientId', 'agreementType'] },
    { id: 'details', title: 'Facility Metrics', icon: Banknote, fields: ['type'] },
    { id: 'review', title: 'Audit Readiness', icon: ShieldCheck, fields: [] },
];

interface EditFacilityWizardProps {
  facility?: any;
  parentFacility?: any; 
  clients: any[];
  debtors: any[];
  onSave: () => void;
  onBack: () => void;
  initialOwnerType?: 'client' | 'debtor';
  initialFacilityClass?: 'global' | 'sub';
}

export function EditFacilityWizard({ 
    facility, 
    parentFacility, 
    clients, 
    debtors, 
    onSave, 
    onBack,
    initialOwnerType,
    initialFacilityClass
}: EditFacilityWizardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [internalId, setInternalId] = useState<string | null>(facility?.id || null);
    const { toast } = useToast();
    const firestore = useFirestore();
    
    const isSubLimitMode = !!parentFacility;

    const methods = useForm<FacilityFormValues>({
        resolver: zodResolver(facilitySchema),
        mode: 'onChange',
        defaultValues: facility || { 
            ownerType: initialOwnerType || parentFacility?.ownerType || 'client', 
            facilityClass: initialFacilityClass || (isSubLimitMode ? 'sub' : 'global'),
            parentId: parentFacility?.id || null,
            clientId: parentFacility?.clientId || null,
            debtorId: parentFacility?.debtorId || null,
            limit: 0, 
            status: 'active',
            type: ''
        }
    });

    const watched = methods.watch();

    // DYNAMIC STEP FILTERING
    const steps = useMemo(() => {
        return allSteps.filter(step => {
            if (step.id === 'type' && (initialOwnerType || isSubLimitMode)) return false;
            if (step.id === 'association' && (initialFacilityClass === 'sub' || isSubLimitMode)) return false;
            if (step.id === 'agreement_limit' && initialFacilityClass === 'global' && !isSubLimitMode) return false;
            return true;
        });
    }, [initialOwnerType, initialFacilityClass, isSubLimitMode]);

    useEffect(() => {
        if (facility) {
            methods.reset(facility);
            setInternalId(facility.id);
        } else if (parentFacility) {
            methods.reset({
                ...methods.getValues(),
                ownerType: parentFacility.ownerType,
                facilityClass: 'sub',
                parentId: parentFacility.id,
                clientId: parentFacility.clientId,
                debtorId: parentFacility.debtorId,
            });
        }
    }, [facility, parentFacility, methods]);

    const autosave = async (values: FacilityFormValues) => {
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            const res = await fetchFromAdminAPI(token, 'saveLendingFacility', { 
                facility: { ...values, id: internalId || undefined } 
            });
            if (!internalId && res.id) {
                setInternalId(res.id);
                methods.setValue('id', res.id);
            }
        } catch (e) {
            console.warn("Autosave standby", e);
        }
    };

    const handleNext = async () => {
        const stepFields = steps[currentStep].fields;
        const isValid = await methods.trigger(stepFields as any);
        if (isValid) {
            await autosave(methods.getValues());
            if (currentStep < steps.length - 1) setCurrentStep(prev => prev + 1);
        } else {
            toast({ variant: "destructive", title: "Complete all fields to proceed." });
        }
    };
    
    const handleBackStep = async () => {
        await autosave(methods.getValues());
        if (currentStep === 0) {
            onBack();
            return;
        }
        setCurrentStep(prev => prev - 1);
    };

    const onSubmit = async (values: FacilityFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await fetchFromAdminAPI(token, 'saveLendingFacility', { 
                facility: { ...values, id: internalId || undefined } 
            });
            toast({ title: 'Authority Node Committed' });
            onSave();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    const isStepValid = (stepIndex: number) => {
        if (stepIndex < 0 || stepIndex >= steps.length) return true;
        const step = steps[stepIndex];
        if (!step.fields || step.fields.length === 0) return true;
        return step.fields.every(field => !methods.formState.errors[field as keyof typeof methods.formState.errors]);
    };

    const handleStepTransition = async (index: number) => {
        if (index > currentStep) {
            const stepFields = steps[currentStep].fields;
            const isValid = await methods.trigger(stepFields as any);
            if (!isValid) return;
        }
        await autosave(methods.getValues());
        setCurrentStep(index);
    };

    const resolvedTargetName = useMemo(() => {
        if (watched.ownerType === 'client') return clients.find(c => c.id === watched.clientId)?.name || 'Unassigned Client';
        return debtors.find(d => d.id === watched.debtorId)?.name || 'Unassigned Debtor';
    }, [watched.ownerType, watched.clientId, watched.debtorId, clients, debtors]);
    
    const renderStepContent = () => {
        const stepId = steps[currentStep]?.id;
        switch (stepId) {
            case 'type': return (
                 <div className="space-y-6 text-left">
                    <FormField control={methods.control} name="ownerType" render={({ field }) => (
                        <FormItem className="space-y-4">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Identify Authority Branch</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                    <div className={cn("p-6 border-2 rounded-[2rem] cursor-pointer transition-all", field.value === 'client' ? "border-primary bg-primary/5 shadow-md" : "bg-white")}>
                                        <div className="flex items-center gap-3 text-left"><RadioGroupItem value="client" id="type-client" /><Label htmlFor="type-client" className="font-black text-xs uppercase cursor-pointer text-left">Client Branch</Label></div>
                                        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed text-left">Exposure limits for borrowing member nodes.</p>
                                    </div>
                                    <div className={cn("p-6 border-2 rounded-[2rem] cursor-pointer transition-all", field.value === 'debtor' ? "border-primary bg-primary/5 shadow-md" : "bg-white")}>
                                        <div className="flex items-center gap-3 text-left"><RadioGroupItem value="debtor" id="type-debtor" /><Label htmlFor="type-debtor" className="font-black text-xs uppercase cursor-pointer text-left">Debtor Branch</Label></div>
                                        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed text-left">Exposure limits for cessionary load providers.</p>
                                    </div>
                                </RadioGroup>
                            </FormControl>
                        </FormItem>
                    )} />
                </div>
            );
            case 'association': return (
                <div className="space-y-8 animate-in fade-in duration-500 text-left">
                    {watched.ownerType === 'client' ? (
                        <FormField control={methods.control} name="clientId" render={({ field }) => (
                            <FormItem className="text-left"><FormLabel>Select Member Client</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger className="h-12 border-2 bg-white font-bold text-left"><SelectValue placeholder="Choose client..." /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></FormItem>
                        )} />
                    ) : (
                        <FormField control={methods.control} name="debtorId" render={({ field }) => (
                            <FormItem className="text-left"><FormLabel>Select Debtor (Cessionary)</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger className="h-12 border-2 bg-white font-bold text-left"><SelectValue placeholder="Choose debtor..." /></SelectTrigger></FormControl><SelectContent>{debtors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></FormItem>
                        )} />
                    )}

                    <FormField control={methods.control} name="limit" render={({ field }) => (
                        <FormItem className="text-left">
                            <FormLabel className="text-primary font-black uppercase text-[10px] text-left">Authorized Limit Ceiling (ZAR)</FormLabel>
                            <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} className="h-11 border-2 bg-white text-lg font-black" /></FormControl>
                        </FormItem>
                    )} />
                </div>
            );
            case 'agreement_limit': return (
                <div className="space-y-8 animate-in fade-in duration-500 text-left">
                    <div className="p-8 border-2 rounded-[2.5rem] bg-white space-y-6 shadow-sm text-left">
                        <Badge className="bg-primary text-white border-none uppercase font-black text-[10px] tracking-widest px-3 h-5 mb-2">Sub-Limit Initialization</Badge>
                        {watched.ownerType === 'client' ? (
                            <>
                                <FormField control={methods.control} name="clientId" render={({ field }) => (
                                    <FormItem className="text-left"><FormLabel>Target Member Client</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger className="h-12 border-2 bg-white font-bold text-left"><SelectValue placeholder="Choose client..." /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></FormItem>
                                )} />
                                <FormField control={methods.control} name="agreementType" render={({ field }) => (
                                    <FormItem className="text-left">
                                        <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Target Product Agreement</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ''}>
                                            <FormControl><SelectTrigger className="h-12 border-2 bg-white text-left font-bold"><SelectValue placeholder="Select Product..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="factoring">Factoring</SelectItem>
                                                <SelectItem value="asset_finance">Asset Finance</SelectItem>
                                                <SelectItem value="working_capital">Working Capital</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                            </>
                        ) : (
                            <>
                                <FormField control={methods.control} name="debtorId" render={({ field }) => (
                                    <FormItem className="text-left"><FormLabel>Target Debtor</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger className="h-12 border-2 bg-white font-bold text-left"><SelectValue placeholder="Choose debtor..." /></SelectTrigger></FormControl><SelectContent>{debtors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></FormItem>
                                )} />
                                <FormField control={methods.control} name="associatedClientId" render={({ field }) => (
                                    <FormItem className="text-left">
                                        <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Authorize for Specific Member Client</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ''}>
                                            <FormControl><SelectTrigger className="h-12 border-2 bg-white text-left font-bold"><SelectValue placeholder="Choose member..." /></SelectTrigger></FormControl>
                                            <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                            </>
                        )}

                        <FormField control={methods.control} name="limit" render={({ field }) => (
                            <FormItem className="text-left">
                                <FormLabel className="text-[10px] font-black uppercase text-primary ml-1">Authorized Sub-Node Limit (ZAR)</FormLabel>
                                <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} className="h-11 border-2 bg-white text-lg font-black" /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                </div>
            );
             case 'details': return (
                <div className="space-y-6 text-left">
                    <FormField control={methods.control} name="type" render={({ field }) => (
                        <FormItem className="text-left">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 text-left">Lending Group Classification</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl><SelectTrigger className="h-12 border-2 bg-white text-left font-bold"><SelectValue placeholder="Select group..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="factoring">Factoring (Discounting)</SelectItem>
                                    <SelectItem value="asset_finance">Asset Finance (Lease/Sale)</SelectItem>
                                    <SelectItem value="working_capital">Working Capital (Loan)</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />

                    <div className="p-8 bg-slate-900 text-white rounded-[2rem] shadow-xl space-y-4 text-left">
                        <div className="flex items-center gap-3 text-left">
                            <Info className="h-5 w-5 text-primary text-left" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary text-left">Authority Context</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed text-left">
                            This classification determines the functional matching logic. Only enquiries of this group will be matched against this authority node.
                        </p>
                    </div>
                </div>
            );
            case 'review': return (
                <div className="space-y-8 animate-in zoom-in-95 duration-500 text-left text-foreground">
                    <div className="text-center space-y-2 mb-8 text-foreground">
                        <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-2" />
                        <h3 className="text-2xl font-black uppercase">Final Protocol Check</h3>
                        <p className="text-sm text-muted-foreground">Verify authority boundaries before registry commit.</p>
                    </div>

                    <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] space-y-6 shadow-2xl text-left">
                        <div className="flex justify-between items-baseline text-left">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Authorized Limit Ceiling</span>
                            <span className="text-4xl font-black text-primary">{formatCurrency(watched.limit)}</span>
                        </div>
                        
                        <Separator className="bg-white/10" />
                        
                        <div className="grid grid-cols-2 gap-6 text-left">
                            <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-slate-500">Target Entity</Label>
                                <p className="font-bold text-sm text-white">{resolvedTargetName}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <Label className="text-[9px] font-black uppercase text-slate-500">Node Class</Label>
                                <p className="font-bold text-sm text-white capitalize">{watched.facilityClass} {watched.ownerType}</p>
                            </div>
                        </div>

                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Landmark className="h-4 w-4 text-primary" />
                                <span className="text-[10px] font-bold uppercase text-slate-400">Functional Group</span>
                            </div>
                            <Badge variant="outline" className="text-primary border-primary/40 capitalize">{watched.type?.replace('_', ' ') || 'General'}</Badge>
                        </div>
                    </div>
                </div>
            );
            default: return null;
        }
    };
    
    return (
        <Card className="max-w-6xl mx-auto shadow-2xl border-none overflow-hidden text-left text-foreground">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader className="bg-slate-900 text-white p-10 border-b border-white/5 text-left">
                        <div className="flex justify-between items-center text-left text-white">
                            <div className="text-left text-white">
                                <CardTitle className="text-3xl font-black font-headline uppercase text-left text-white text-left">Authority Node Terminal</CardTitle>
                                <CardDescription className="text-slate-400 text-lg mt-1 text-left">Registry: {steps[currentStep]?.title || 'Audit'}</CardDescription>
                            </div>
                            <Button type="button" variant="ghost" className="text-white hover:text-primary" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Ledger</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] text-left">
                             <div className="bg-slate-50 border-r p-8 space-y-2 text-left">
                                {steps.map((step, index) => {
                                    const Icon = step.icon;
                                    const isCompleted = index < currentStep && isStepValid(index);
                                    
                                    return (
                                        <Button 
                                            key={step.id} 
                                            type="button" 
                                            variant={currentStep === index ? 'secondary' : 'ghost'} 
                                            className={cn("w-full justify-start gap-4 h-12 px-4 transition-all text-left", currentStep === index && "bg-white shadow-sm ring-1 ring-primary/20")} 
                                            onClick={() => handleStepTransition(index)}
                                        >
                                            {isCompleted ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className={cn("h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-black", currentStep >= index ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{index + 1}</div>}
                                            <Icon className={cn("h-5 w-5", currentStep >= index ? "text-primary" : "text-muted-foreground")} />
                                            <span className={cn("text-[10px] font-black uppercase tracking-[0.1em]", currentStep === index ? "text-primary" : "text-muted-foreground")}>{step.title}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                             <div className="p-12 space-y-12 bg-white min-h-[550px] text-left">
                                {renderStepContent()}
                             </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t p-10 flex justify-between text-left">
                        <Button type="button" variant="outline" onClick={handleBackStep} className="font-bold h-12 px-8">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        {currentStep < steps.length - 1 ? (
                            <Button type="button" onClick={handleNext} className="h-12 px-12 font-black uppercase text-xs text-white shadow-lg text-left">
                                Next Protocol Stage <ArrowRight className="ml-2 h-4 w-4"/>
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isLoading} className="h-14 px-16 bg-primary hover:bg-primary/90 shadow-2xl font-black uppercase tracking-tight text-white text-left">
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                                Commit Node to Ledger
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
