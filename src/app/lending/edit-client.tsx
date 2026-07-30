'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, useFormContext, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, Landmark, ArrowLeft, ArrowRight, CheckCircle, ShieldCheck, 
    History, Package, Sparkles, Building, FileUp, Users, PlusCircle, 
    Trash2, UserCheck, Truck, FileText, Navigation, MapPin, Info, 
    ShieldAlert, Gavel, Zap, User, UserCircle, Scale, Banknote, 
    Smartphone, AlertCircle, Lock, SearchCode, Camera, Wrench,
    CheckCircle2, ListChecks
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser, getClientSideAuthToken, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { doc, serverTimestamp, setDoc, collection } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { provinces } from '@/lib/geodata';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- SCHEMAS ---

const stakeholderSchema = z.object({
    name: z.string().min(1, "Full name required."),
    email: z.string().email("Valid email required.").optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    rsaIdNumber: z.string().optional(),
    position: z.string().optional(),
    shareholdingPercent: z.coerce.number().min(0).max(100).optional(),
    isDirector: z.boolean().default(false),
    rsaIdUrl: z.string().optional(),
    proofAddressUrl: z.string().optional(),
});

const baseSchema = z.object({
  applyingCapacity: z.enum(['individual', 'entity']).default('entity'),
  entityType: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  registrationId: z.string().optional(),
  inceptionDate: z.string().optional(),
  vatRegistered: z.boolean().default(false),
  vatNumber: z.string().optional(),
  vatUpToDate: z.boolean().default(true),
  cipcLevyUpToDate: z.boolean().default(true),
  shareholderCount: z.coerce.number().min(0).default(0),
  directorCount: z.coerce.number().min(0).default(0),
  signingAuthority: z.enum(['single', 'multiple']).default('single'),
  shareholders: z.array(stakeholderSchema).optional().default([]),
  directors: z.array(stakeholderSchema).optional().default([]),
  annualTurnover: z.coerce.number().min(0).default(0),
  totalAssetValue: z.coerce.number().min(0).default(0),
  hasJudgements: z.boolean().default(false),
  hasDefaults: z.boolean().default(false),
  hasArrears: z.boolean().default(false),
  truckCount: z.coerce.number().min(0).default(0),
  trailerCount: z.coerce.number().min(0).default(0),
  bookkeepingType: z.enum(['in_house', 'external']).default('external'),
  ownsOperatingProperty: z.boolean().default(false),
  status: z.enum(['draft', 'active', 'inactive', 'suspended']).default('draft'),
  userIdUrl: z.string().optional(),
  registrationDocUrl: z.string().optional(),
  vatCertificateUrl: z.string().optional(),
  ficaDocUrl: z.string().optional(),
  signingResolutionUrl: z.string().optional(),
  afsDocUrl: z.string().optional(),
  bureauReportUrl: z.string().optional(),
  fleetInventoryUrl: z.string().optional(),
  mgmtAccountsUrl: z.string().optional(),
  propertyDeedUrl: z.string().optional(),
  leaseAgreementUrl: z.string().optional(),
  industrial_tags: z.array(z.string()).default([]),
});

const combinedSchema = baseSchema.superRefine((data, ctx) => {
    if (data.applyingCapacity === 'entity' && data.entityType === 'Private Company (Pty Ltd)') {
        if (!data.registrationId) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required for entities.", path: ["registrationId"] });
        }
    }
});

export type ApplicationFormValues = z.infer<typeof combinedSchema>;

const entityTypesList = [
    "Ltd", "Private Company (Pty Ltd)", "Sole Proprietorship", "Close Corporation (CC)", 
    "Trust", "Individual", "Partnership"
];

// --- HELPER COMPONENTS ---

function FileUploadField({ name, label, folder, variant = 'standard' }: { name: any, label: string, folder: string, variant?: 'standard' | 'compact' }) {
    const { setValue, watch } = useFormContext<ApplicationFormValues>();
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const { user } = useUser();
    const { toast } = useToast();
    const currentUrl = watch(name);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        setProgress(10);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");

            const reader = new FileReader();
            const dataUri = await new Promise<string>((resolve) => {
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });

            setProgress(30);
            const fileName = `${name.replace(/\./g, '_')}_${Date.now()}_${file.name}`;
            const res = await fetch('/api/uploadImageAsset', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileDataUri: dataUri, folder: `${folder}/${user.uid}`, fileName, contentType: file.type })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error);

            setValue(name, result.url, { shouldValidate: true });
            setProgress(100);
            toast({ title: `${label} Attached` });
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Upload Failed", description: err.message });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-1.5 text-left">
            {variant === 'standard' && <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">{label}</Label>}
            <div className="flex items-center gap-2">
                <Button 
                    type="button" 
                    variant="outline" 
                    size={variant === 'compact' ? 'sm' : 'default'}
                    className={cn(
                        "h-10 gap-2 border-2 text-xs font-bold", 
                        currentUrl ? "border-green-50 text-green-700" : "border-dashed",
                        variant === 'compact' && "h-8 px-3"
                    )}
                    onClick={() => document.getElementById(`upload-${name}`)?.click()}
                    disabled={isUploading}
                >
                    {isUploading ? <Loader2 className="h-3 w-3 animate-spin"/> : currentUrl ? <CheckCircle2 className="h-4 w-4" /> : <FileUp className="h-4 w-4" />}
                    {currentUrl ? `Update ${label}` : `Attach ${label}`}
                </Button>
                <input id={`upload-${name}`} type="file" className="hidden" onChange={handleUpload} />
            </div>
            {isUploading && <Progress value={progress} className="h-1 mt-1" />}
        </div>
    );
}

function StakeholderForm({ type, label }: { type: 'shareholders' | 'directors', label: string }) {
    const { control } = useFormContext<ApplicationFormValues>();
    const { fields, remove } = useFieldArray({ control, name: type });

    return (
        <div className="space-y-6 text-left">
            {fields.map((field, index) => (
                <div key={field.id} className="p-6 border-2 border-dashed rounded-2xl bg-white space-y-6 animate-in fade-in slide-in-from-top-2 text-left">
                    <div className="flex items-center justify-between border-b pb-4 text-left">
                        <Badge variant="secondary" className="font-black uppercase text-[10px] tracking-widest">{label} {index + 1}</Badge>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-foreground">
                        <FormField control={control} name={`${type}.${index}.name` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>Full Legal Name</FormLabel><FormControl><Input {...field} className="h-9 border-2" /></FormControl></FormItem>)} />
                        <FormField control={control} name={`${type}.${index}.rsaIdNumber` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>RSA ID Number</FormLabel><FormControl><Input {...field} className="h-9 border-2 font-mono" /></FormControl></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-left">
                        <FileUploadField name={`${type}.${index}.rsaIdUrl`} label="RSA Identity Document" folder="stakeholder-ids" variant="standard" />
                        <FileUploadField name={`${type}.${index}.proofAddressUrl`} label="Proof of Residential Address" folder="stakeholder-address" variant="standard" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- STEP COMPONENTS ---

const StepMain = () => {
    const { control } = useFormContext<ApplicationFormValues>();
    return (
        <div className="space-y-8 text-left text-foreground">
             <FormField control={control} name="applyingCapacity" render={({ field }) => (
                <FormItem className="space-y-4 text-left">
                    <FormLabel className="font-black uppercase text-[10px] tracking-widest text-primary text-left">Applying Capacity</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4 text-left">
                            <div className={cn("flex items-center space-x-3 p-4 border-2 rounded-2xl cursor-pointer", field.value === 'individual' ? "border-primary bg-primary/5" : "bg-white")}><RadioGroupItem value="individual" id="cap-ind" /><Label htmlFor="cap-ind" className="cursor-pointer font-bold uppercase text-xs">Individual</Label></div>
                            <div className={cn("flex items-center space-x-3 p-4 border-2 rounded-2xl cursor-pointer", field.value === 'entity' ? "border-primary bg-primary/5" : "bg-white")}><RadioGroupItem value="entity" id="cap-ent" /><Label htmlFor="cap-ent" className="cursor-pointer font-bold uppercase text-xs">Legal Entity</Label></div>
                        </RadioGroup>
                    </FormControl>
                </FormItem>
            )} />
            <FormField control={control} name="name" render={({ field }) => (<FormItem className="text-left"><FormLabel>Primary Operational Name</FormLabel><FormControl><Input {...field} className="h-12 border-2 bg-white font-black text-lg" /></FormControl></FormItem>)} />
            <div className="p-8 bg-slate-900 text-white rounded-[2rem] shadow-xl space-y-4 text-left">
                <h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2 text-left"><UserCheck className="h-4 w-4" /> Principal Identity Node</h4>
                <p className="text-xs text-slate-400 text-left">Attach proof of identity for the primary applicant/owner.</p>
                <FileUploadField name="userIdUrl" label="Principal RSA ID / Passport" folder="forensic-main" />
            </div>
        </div>
    );
};

const StepEntity = () => {
    const { control, watch } = useFormContext<ApplicationFormValues>();
    const entType = watch('entityType');
    
    return (
        <div className="space-y-8 text-left text-foreground">
            <h3 className="text-2xl font-black font-headline uppercase tracking-tight text-left">Legal Registration Details</h3>
            <FormField control={control} name="entityType" render={({ field }) => (
                <FormItem className="text-left"><FormLabel>Type of Entity</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger className="h-11 border-2 bg-white font-bold"><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl><SelectContent>{entityTypesList.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</Select></FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="space-y-6 text-left">
                    <FormField control={control} name="registrationId" render={({ field }) => (<FormItem className="text-left"><FormLabel>Registration Number</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 2024/123456/07" className="h-11 border-2 font-mono" /></FormControl></FormItem>)} />
                    <FormField control={control} name="inceptionDate" render={({ field }) => (<FormItem className="text-left text-foreground"><FormLabel>Inception Date</FormLabel><FormControl><Input {...field} value={field.value || ''} type="date" className="h-11 border-2" /></FormControl></FormItem>)} />
                </div>
                <div className="p-8 bg-slate-900 text-white rounded-[2rem] shadow-xl flex flex-col justify-center gap-4 text-left">
                    <h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2 text-left"><FileText className="h-4 w-4" /> Founding Evidence</h4>
                    <p className="text-xs text-slate-400 text-left">Upload official CIPC, CM or Trust documentation.</p>
                    <FileUploadField 
                        name="registrationDocUrl" 
                        label={entType === 'Trust' ? 'Trust Deed' : 'CIPC / Founding Document'} 
                        folder="forensic-entity" 
                    />
                </div>
            </div>
        </div>
    );
};

const StepDocumentSummary = () => {
    const { watch } = useFormContext<ApplicationFormValues>();
    const values = watch();
    
    const requiredDocs = useMemo(() => {
        const docs = [];
        docs.push({ name: 'RSA ID / Passport', attached: !!values.userIdUrl });
        
        if (values.applyingCapacity === 'entity') {
            docs.push({ name: 'Founding Document (CIPC/Trust)', attached: !!values.registrationDocUrl });
            if (values.vatRegistered) docs.push({ name: 'VAT Registration Certificate', attached: !!values.vatCertificateUrl });
            docs.push({ name: 'FICA / Proof of Business Address', attached: !!values.ficaDocUrl });
            docs.push({ name: 'Board/Signing Resolution', attached: !!values.signingResolutionUrl });
        }

        docs.push({ name: 'Latest Audited Financials (AFS)', attached: !!values.afsDocUrl });
        docs.push({ name: 'Credit Bureau Report', attached: !!values.bureauReportUrl });
        
        if (values.truckCount > 0 || values.trailerCount > 0) {
            docs.push({ name: 'Fleet Inventory / RC1 Batch', attached: !!values.fleetInventoryUrl });
        }

        docs.push({ name: 'Management Accounts (YTD)', attached: !!values.mgmtAccountsUrl });

        if (values.ownsOperatingProperty) docs.push({ name: 'Title Deed / Bond Statement', attached: !!values.propertyDeedUrl });
        else docs.push({ name: 'Signed Lease Agreement', attached: !!values.leaseAgreementUrl });

        return docs;
    }, [values]);

    return (
        <div className="space-y-8 text-left text-foreground">
            <div className="space-y-2 text-left">
                <h3 className="text-2xl font-black font-headline uppercase tracking-tight text-left">Forensic Document Summary</h3>
                <p className="text-muted-foreground text-sm text-left">Review your evidence nodes. Green indicators confirm the handshake is backed by documentation.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 text-left">
                {requiredDocs.map((doc, i) => (
                    <div key={i} className={cn(
                        "flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                        doc.attached ? "bg-green-50 border-green-100" : "bg-white border-slate-100 opacity-60"
                    )}>
                        <div className="flex items-center gap-4 text-left">
                            <div className={cn("p-2 rounded-lg text-left", doc.attached ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400")}>
                                {doc.attached ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                            </div>
                            <div className="text-left">
                                <p className={cn("font-bold text-sm text-left", doc.attached ? "text-green-900" : "text-slate-600")}>{doc.name}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 text-left">Evidentiary Requirement</p>
                            </div>
                        </div>
                        {!doc.attached && <Badge variant="outline" className="text-[9px] font-black uppercase">Missing Evidence</Badge>}
                    </div>
                ))}
            </div>

            {requiredDocs.some(d => !d.attached) && (
                <Alert className="bg-amber-50 border-amber-200 text-left">
                    <Info className="h-5 w-5 text-amber-600" />
                    <div className="ml-2 text-left">
                        <AlertTitle className="text-amber-800 font-bold">Incomplete Handshake</AlertTitle>
                        <AlertDescription className="text-amber-700 text-xs text-left">
                            The credit vetting division requires all high-fidelity documents to be attached before formal matching can commence.
                        </AlertDescription>
                    </div>
                </Alert>
            )}
        </div>
    );
};

// --- MAIN WIZARD COMPONENT ---

export function EditClientWizard({ client, onSave, onBack }: { client?: any, onSave: () => void, onBack: () => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const methods = useForm<ApplicationFormValues>({
    resolver: zodResolver(combinedSchema),
    mode: 'onChange',
    defaultValues: client || { applyingCapacity: 'entity', status: 'draft', shareholderCount: 0, directorCount: 0 }
  });

  const watchedValues = methods.watch();

  const memoizedSteps = useMemo(() => {
    const base = [
        { id: 'main', title: '1. Identity', icon: User, fields: ['applyingCapacity', 'name', 'userIdUrl'] },
        { id: 'entity', title: '2. Entity', icon: Building, fields: ['entityType', 'registrationId', 'inceptionDate', 'registrationDocUrl'] },
    ];
    if (watchedValues.applyingCapacity === 'entity') {
        base.push({ id: 'compliance', title: '3. Compliance', icon: ShieldCheck, fields: ['vatRegistered', 'vatNumber', 'ficaDocUrl'] });
        base.push({ id: 'governance', title: '4. Governance', icon: Gavel, fields: ['shareholderCount', 'directorCount', 'signingAuthority', 'signingResolutionUrl'] });
        if (Number(watchedValues.shareholderCount) > 0) base.push({ id: 'shareholders', title: 'Shareholders', icon: Users, fields: ['shareholders'] });
        if (Number(watchedValues.directorCount) > 0) base.push({ id: 'directors', title: 'Directors', icon: UserCircle, fields: ['directors'] });
    }
    base.push({ id: 'nca', title: 'NCA Data', icon: Landmark, fields: ['annualTurnover', 'afsDocUrl'] });
    base.push({ id: 'credit', title: 'Forensic Risk', icon: ShieldAlert, fields: ['hasJudgements', 'hasDefaults', 'hasArrears', 'bureauReportUrl'] });
    base.push({ id: 'background', title: 'Footprint', icon: Truck, fields: ['truckCount', 'trailerCount', 'fleetInventoryUrl'] });
    base.push({ id: 'finance_mgmt', title: 'Management', icon: Banknote, fields: ['bookkeepingType', 'mgmtAccountsUrl'] });
    base.push({ id: 'infrastructure', title: 'Infrastructure', icon: Building, fields: ['ownsOperatingProperty', 'propertyDeedUrl', 'leaseAgreementUrl'] });
    base.push({ id: 'review', title: 'Review', icon: CheckCircle, fields: [] });
    base.push({ id: 'doc_summary', title: 'Doc Summary', icon: ListChecks, fields: [] });
    return base;
  }, [watchedValues.applyingCapacity, watchedValues.shareholderCount, watchedValues.directorCount]);

  const handleStepTransition = async (direction: 'next' | 'back' | number) => {
    if (direction === 'next') {
        const isValid = await methods.trigger(memoizedSteps[currentStep].fields as any);
        if (!isValid) return;
    }

    // AUTOSAVE PERSISTENCE
    const values = methods.getValues();
    const token = await getClientSideAuthToken();
    if (token && client?.id) {
        const clientRef = doc(firestore, 'lendingClients', client.id);
        setDoc(clientRef, { ...values, updatedAt: serverTimestamp() }, { merge: true }).catch(e => console.warn("Autosave failed", e));
    }

    if (typeof direction === 'number') setCurrentStep(direction);
    else if (direction === 'next') setCurrentStep(prev => Math.min(prev + 1, memoizedSteps.length - 1));
    else setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const onSubmit = async (values: ApplicationFormValues) => {
    setIsSubmitting(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Auth failed.");
        
        const clientRef = client?.id ? doc(firestore, 'lendingClients', client.id) : doc(collection(firestore, 'lendingClients'));
        await setDoc(clientRef, { ...values, id: clientRef.id, updatedAt: serverTimestamp() }, { merge: true });

        toast({ title: 'Application Processed' });
        onSave();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (isUserLoading) return <div className="flex justify-center p-20 text-center"><Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" /></div>;

  const currentStepConfig = memoizedSteps[currentStep];

  return (
    <Card className="max-w-6xl mx-auto shadow-2xl border-none overflow-hidden text-left text-foreground">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <CardHeader className="bg-slate-900 text-white p-8 text-left">
            <div className="flex justify-between items-center text-left">
              <div className="text-left text-white">
                <CardTitle className="text-2xl font-black font-headline uppercase text-white text-left">Forensic Onboarding Terminal</CardTitle>
                <CardDescription className="text-slate-400 text-left">Section: {currentStepConfig.title}</CardDescription>
              </div>
              <Button type="button" variant="ghost" className="text-white hover:text-primary text-left" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Registry</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 text-left text-foreground">
            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] text-left">
              <div className="bg-slate-50 border-r p-6 space-y-2 text-left">
                {memoizedSteps.map((step, i) => (
                  <Button key={step.id} type="button" variant={currentStep === i ? "secondary" : "ghost"} className={cn("w-full justify-start gap-3 h-10 px-3 transition-all text-left text-foreground", currentStep === i && "bg-white shadow-sm ring-1 ring-primary/20")} onClick={() => handleStepTransition(i)}>
                    {React.createElement(step.icon, { className: cn("h-4 w-4", currentStep >= i ? "text-primary" : "text-muted-foreground") })}
                    <span className={cn("text-[11px] font-black uppercase text-left", currentStep === i ? "text-primary" : "text-muted-foreground")}>{step.title}</span>
                  </Button>
                ))}
              </div>
              <div className="p-10 space-y-12 bg-white min-h-[600px] text-left text-foreground">
                {currentStepConfig.id === 'main' && <StepMain />}
                {currentStepConfig.id === 'entity' && <StepEntity />}
                {currentStepConfig.id === 'compliance' && (
                    <div className="space-y-10 text-left text-foreground">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                            <div className="space-y-6 text-left text-foreground">
                                <FormField control={methods.control} name="vatRegistered" render={({ field }) => (
                                    <FormItem className="flex items-center justify-between p-4 border-2 rounded-2xl bg-white text-left">
                                        <FormLabel className="font-black uppercase text-xs text-left">VAT Registered?</FormLabel>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )} />
                                {watchedValues.vatRegistered && (
                                    <FormField control={methods.control} name="vatNumber" render={({ field }) => (<FormItem className="text-left animate-in fade-in slide-in-from-left-2 text-foreground"><FormLabel>VAT Number</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2 font-mono" /></FormControl></FormItem>)} />
                                )}
                            </div>
                            <div className="p-8 bg-slate-900 text-white rounded-[2rem] shadow-xl flex flex-col justify-center gap-4 text-left">
                                <h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2 text-left"><CheckCircle className="h-4 w-4" /> Compliance Node</h4>
                                <FileUploadField name="vatCertificateUrl" label="VAT Certificate / Tax Clearance" folder="forensic-compliance" />
                                <FileUploadField name="ficaDocUrl" label="FICA Proof of Business Address" folder="forensic-compliance" />
                            </div>
                        </div>
                    </div>
                )}
                {currentStepConfig.id === 'governance' && (
                    <div className="space-y-8 text-left text-foreground">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left text-foreground">
                            <div className="space-y-6 text-left">
                                <div className="grid grid-cols-2 gap-6 text-left">
                                    <FormField control={methods.control} name="shareholderCount" render={({ field }) => (<FormItem className="text-left"><FormLabel>Shareholders</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 font-bold" /></FormControl></FormItem>)} />
                                    <FormField control={methods.control} name="directorCount" render={({ field }) => (<FormItem className="text-left"><FormLabel>Directors</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 font-bold" /></FormControl></FormItem>)} />
                                </div>
                                <FormField control={methods.control} name="signingAuthority" render={({ field }) => (
                                    <FormItem className="space-y-3 text-left text-foreground">
                                        <FormLabel className="font-black uppercase text-[10px] text-primary tracking-widest text-left">Signing Authority</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-6">
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="single" id="auth-single" /><Label htmlFor="auth-single" className="cursor-pointer font-bold">Single</Label></div>
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="multiple" id="auth-mult" /><Label htmlFor="auth-mult" className="cursor-pointer font-bold">Multiple</Label></div>
                                            </RadioGroup>
                                        </FormControl>
                                    </FormItem>
                                )} />
                            </div>
                            <div className="p-8 bg-slate-900 text-white rounded-[2rem] shadow-xl flex flex-col justify-center gap-4 text-left text-white">
                                <h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2 text-left text-white"><Gavel className="h-4 w-4" /> Authority Node</h4>
                                <FileUploadField name="signingResolutionUrl" label="Signing Resolution / Authorization" folder="forensic-governance" />
                            </div>
                        </div>
                    </div>
                )}
                {currentStepConfig.id === 'shareholders' && <StakeholderForm type="shareholders" label="Shareholder" />}
                {currentStepConfig.id === 'directors' && <StakeholderForm type="directors" label="Director" />}
                {currentStepConfig.id === 'nca' && (
                    <div className="space-y-8 text-left text-foreground">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-foreground">
                            <div className="space-y-6 text-left">
                                <FormField control={methods.control} name="annualTurnover" render={({ field }) => (
                                    <FormItem className="text-left">
                                        <FormLabel>Annual Turnover (L12M)</FormLabel>
                                        <FormControl><Input type="number" {...field} className="h-12 border-2 text-lg font-bold" /></FormControl>
                                    </FormItem>
                                )} />
                            </div>
                            <div className="p-8 bg-slate-900 text-white rounded-[2rem] shadow-xl flex flex-col justify-center gap-4 text-left">
                                <h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2 text-left"><FileText className="h-4 w-4" /> Financial Evidence</h4>
                                <FileUploadField name="afsDocUrl" label="Latest Audited Financials (AFS)" folder="forensic-nca" />
                            </div>
                        </div>
                    </div>
                )}
                {currentStepConfig.id === 'credit' && (
                    <div className="space-y-8 text-left text-foreground">
                        <div className="p-6 bg-destructive/5 border-2 border-destructive/10 rounded-3xl space-y-4 text-left">
                            <div className="flex items-center gap-2 text-destructive font-black uppercase text-xs text-left text-foreground"><ShieldAlert className="h-5 w-5" /> Hard Risk Disclosure</div>
                            <FormField control={methods.control} name="hasJudgements" render={({ field }) => (<FormItem className="flex items-center justify-between p-3 bg-white rounded-xl border text-left text-foreground"><FormLabel className="text-sm font-medium text-left">Any active judgements?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                        </div>
                        <div className="p-8 bg-slate-900 text-white rounded-[2rem] shadow-xl flex justify-between items-center text-left">
                            <div className="space-y-1 text-left"><h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2 text-left text-foreground"><Scale className="h-4 w-4" /> Credit Intelligence</h4><p className="text-xs text-slate-400 text-left">Upload bureau evidence or settlement letters.</p></div>
                            <FileUploadField name="bureauReportUrl" label="Bureau Report / Settlement Letter" folder="forensic-risk" />
                        </div>
                    </div>
                )}
                {currentStepConfig.id === 'background' && (
                     <div className="space-y-10 text-left text-foreground">
                        <div className="grid grid-cols-2 gap-8 text-left text-foreground">
                            <FormField control={methods.control} name="truckCount" render={({ field }) => (<FormItem className="text-left text-foreground"><FormLabel>Truck Nodes (RC1)</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 bg-white font-bold" /></FormControl></FormItem>)} />
                            <FormField control={methods.control} name="trailerCount" render={({ field }) => (<FormItem className="text-left text-foreground"><FormLabel>Trailer Nodes</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 bg-white font-bold" /></FormControl></FormItem>)} />
                        </div>
                        <div className="p-8 border-2 border-dashed rounded-[3rem] bg-slate-50 flex justify-between items-center text-left text-foreground">
                            <div className="space-y-1 text-left">
                                <p className="text-sm font-bold flex items-center gap-2 text-left"><Truck className="h-4 w-4 text-primary"/> Fleet Register Audit</p>
                                <p className="text-xs text-muted-foreground italic max-w-xs text-left">Upload fleet inventory list for RC1 cross-referencing.</p>
                            </div>
                            <FileUploadField name="fleetInventoryUrl" label="Fleet Inventory / RC1 Batch" folder="forensic-background" />
                        </div>
                    </div>
                )}
                {currentStepConfig.id === 'finance_mgmt' && (
                    <div className="space-y-12 text-left text-foreground">
                        <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-xl flex justify-between items-center text-left">
                            <div className="space-y-1 text-left text-foreground">
                                <div className="bg-primary/20 p-2 rounded-lg w-fit text-left"><FileText className="h-5 w-5 text-primary" /></div>
                                <h4 className="font-bold text-sm uppercase text-primary text-left">Ledger Evidence</h4>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-sm text-left">Upload latest management accounts (YTD) for audit.</p>
                            </div>
                            <FileUploadField name="mgmtAccountsUrl" label="Management Accounts (YTD)" folder="forensic-finance" />
                        </div>
                    </div>
                )}
                {currentStepConfig.id === 'infrastructure' && (
                    <div className="space-y-12 text-left text-foreground">
                        <FormField control={methods.control} name="ownsOperatingProperty" render={({ field }) => (
                           <FormItem className="flex items-center justify-between p-8 border-2 rounded-[2.5rem] bg-white shadow-lg text-left">
                               <div className="space-y-1 text-left">
                                   <span className="text-2xl font-black font-headline uppercase tracking-tight text-left">Infrastructure Standing</span>
                                   <p className="text-base text-muted-foreground text-left">Do you own the property where you operate from?</p>
                               </div>
                               <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="scale-125" /></FormControl>
                           </FormItem>
                       )} />
                       <div className="grid grid-cols-1 gap-6 text-left">
                            <FileUploadField name={watchedValues.ownsOperatingProperty ? "propertyDeedUrl" : "leaseAgreementUrl"} label={watchedValues.ownsOperatingProperty ? "Title Deed / Bond Statement" : "Signed Lease Agreement"} folder="forensic-standing" />
                       </div>
                    </div>
                )}
                {currentStepConfig.id === 'review' && (
                    <div className="text-center py-20 space-y-6 text-left text-foreground">
                        <CheckCircle className="h-16 w-16 text-primary mx-auto opacity-40 text-center" />
                        <h3 className="text-2xl font-black uppercase text-center">Audit Finalization</h3>
                        <p className="text-sm text-muted-foreground max-sm mx-auto leading-relaxed text-center">Verify data integrity before formally committing this node to the registry.</p>
                    </div>
                )}
                {currentStepConfig.id === 'doc_summary' && <StepDocumentSummary />}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t p-8 flex justify-between text-left">
            <Button type="button" variant="outline" onClick={() => handleStepTransition('back')} disabled={currentStep === 0}>Back</Button>
            {currentStep < memoizedSteps.length - 1 ? (
              <Button type="button" onClick={() => handleStepTransition('next')} className="px-10 font-black uppercase text-xs text-white">Next Section <ArrowRight className="ml-2 h-4 w-4" /></Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="h-14 px-12 font-black uppercase shadow-2xl bg-primary hover:bg-primary/90 text-white text-left">{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-left" /> : <Save className="mr-2 h-4 w-4 text-left" />} Commit Record</Button>
            )}
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
}