
'use client';

import React, { useState, useMemo } from 'react';
import { useForm, FormProvider, useFormContext, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, Save, ArrowLeft, ArrowRight, User, Building, ShieldCheck, Gavel, 
    Users, UserCircle, ShieldAlert, CheckCircle2, ListChecks, FileUp, Sparkles, FileText, Info
} from 'lucide-react';
import { getClientSideAuthToken, useFirestore } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { VisionOnboardingDialog } from './VisionOnboardingDialog';

// --- SCHEMAS ---

const stakeholderSchema = z.object({
    name: z.string().min(1, "Full name required."),
    rsaIdNumber: z.string().optional(),
    rsaIdUrl: z.string().optional(),
    proofAddressUrl: z.string().optional(),
});

const supplierWizardSchema = z.object({
  name: z.string().min(1, 'Entity name is required'),
  category: z.string().min(1, 'Category is required'),
  registrationId: z.string().optional(),
  vatRegistered: z.boolean().default(false),
  vatNumber: z.string().optional(),
  shareholderCount: z.coerce.number().min(0).default(0),
  directorCount: z.coerce.number().min(0).default(0),
  shareholders: z.array(stakeholderSchema).optional().default([]),
  directors: z.array(stakeholderSchema).optional().default([]),
  hasJudgements: z.boolean().default(false),
  hasDefaults: z.boolean().default(false),
  ownsOperatingProperty: z.boolean().default(false),
  userIdUrl: z.string().optional(),
  registrationDocUrl: z.string().optional(),
  ficaDocUrl: z.string().optional(),
  afsDocUrl: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierWizardSchema>;

// --- HELPER COMPONENTS ---

function FileUploadField({ name, label, folder }: { name: any, label: string, folder: string }) {
    const { setValue, watch } = useFormContext<SupplierFormValues>();
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
    const currentUrl = watch(name);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const token = await getClientSideAuthToken();
            const reader = new FileReader();
            const dataUri = await new Promise<string>((res) => {
                reader.onload = () => res(reader.result as string);
                reader.readAsDataURL(file);
            });
            const response = await fetch('/api/uploadImageAsset', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileDataUri: dataUri, folder: `${folder}`, fileName: `${name}_${Date.now()}_${file.name}` })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            setValue(name, result.url, { shouldValidate: true });
            toast({ title: "Document Attached" });
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Upload Failed", description: err.message });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-1.5 text-left">
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{label}</Label>
            <Button 
                type="button" 
                variant="outline" 
                className={cn("w-full h-11 border-2 border-dashed gap-2", currentUrl && "border-green-500 bg-green-50 text-green-700")}
                onClick={() => document.getElementById(`upload-${name}`)?.click()}
                disabled={isUploading}
            >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin"/> : currentUrl ? <CheckCircle2 className="h-4 w-4" /> : <FileUp className="h-4 w-4" />}
                {currentUrl ? `Update ${label}` : `Attach ${label}`}
            </Button>
            <input id={`upload-${name}`} type="file" className="hidden" onChange={handleUpload} />
        </div>
    );
}

// --- STEP COMPONENTS ---

function StepMain() {
    const { control } = useFormContext<SupplierFormValues>();
    return (
        <div className="space-y-8 text-left">
            <FormField control={control} name="name" render={({ field }) => (<FormItem className="text-left"><FormLabel>Legal Trading Name</FormLabel><FormControl><Input {...field} className="h-12 border-2 bg-white font-black text-lg" /></FormControl></FormItem>)} />
            <FormField control={control} name="category" render={({ field }) => (<FormItem className="text-left"><FormLabel>Industrial Trade (e.g. Scania Dealer)</FormLabel><FormControl><Input {...field} className="h-11 border-2 bg-white" /></FormControl></FormItem>)} />
            <div className="p-8 bg-slate-900 text-white rounded-[2rem] shadow-xl space-y-4 text-left">
                <h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2 text-left"><User className="h-4 w-4" /> Principal Identity</h4>
                <p className="text-xs text-slate-400">Attach proof of identity for the primary dealer principal.</p>
                <FileUploadField name="userIdUrl" label="Principal RSA ID / Passport" folder="suppliers-identity" />
            </div>
        </div>
    );
}

function StepEntity() {
    const { control, watch } = useFormContext<SupplierFormValues>();
    const watchedValues = watch();
    return (
        <div className="space-y-8 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="space-y-6 text-left">
                    <FormField control={control} name="registrationId" render={({ field }) => (<FormItem className="text-left"><FormLabel>CIPC Registration Number</FormLabel><FormControl><Input {...field} placeholder="20XX/XXXXXX/07" className="h-11 border-2" /></FormControl></FormItem>)} />
                    <FormField control={control} name="vatRegistered" render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-4 border-2 rounded-2xl bg-white text-left">
                            <FormLabel className="font-black uppercase text-xs">VAT Registered?</FormLabel>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                    {watchedValues.vatRegistered && (
                        <FormField control={control} name="vatNumber" render={({ field }) => (<FormItem className="text-left animate-in slide-in-from-left-2"><FormLabel>VAT Number</FormLabel><FormControl><Input {...field} className="h-11 border-2 font-mono" /></FormControl></FormItem>)} />
                    )}
                </div>
                <div className="p-8 bg-slate-900 text-white rounded-[2rem] shadow-xl flex flex-col justify-center gap-4 text-left">
                    <h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2 text-left"><Building className="h-4 w-4" /> Founding Evidence</h4>
                    <FileUploadField name="registrationDocUrl" label="Registration Document" folder="suppliers-legal" />
                </div>
            </div>
        </div>
    );
}

function StepStanding() {
    const { control, watch } = useFormContext<SupplierFormValues>();
    const watchedValues = watch();
    return (
        <div className="space-y-12 text-left">
            <FormField control={control} name="ownsOperatingProperty" render={({ field }) => (
                <FormItem className="flex items-center justify-between p-8 border-2 rounded-[2.5rem] bg-white shadow-lg text-left">
                    <div className="space-y-1 text-left">
                        <span className="text-2xl font-black font-headline uppercase tracking-tight">Infrastructure Standing</span>
                        <p className="text-base text-muted-foreground">Does this supplier own the property they operate from?</p>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="scale-125" /></FormControl>
                </FormItem>
            )} />
            <div className="grid grid-cols-1 gap-6 text-left">
                <FileUploadField 
                    name={watchedValues.ownsOperatingProperty ? "ficaDocUrl" : "ficaDocUrl"} 
                    label={watchedValues.ownsOperatingProperty ? "Title Deed / Bond Statement" : "Signed Lease Agreement"} 
                    folder="suppliers-standing" 
                />
            </div>
        </div>
    );
}

// --- WIZARD TERMINAL ---

export function EditSupplierWizard({ supplier, onSave, onBack }: { supplier?: any, onSave: () => void, onBack: () => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const methods = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierWizardSchema),
    mode: 'onChange',
    defaultValues: supplier || { status: 'draft', shareholderCount: 0, directorCount: 0, shareholders: [], directors: [] }
  });

  const { fields: shareholderFields, append: appendShareholder, remove: removeShareholder } = useFieldArray({ control: methods.control, name: 'shareholders' });
  const { fields: directorFields, append: appendDirector, remove: removeDirector } = useFieldArray({ control: methods.control, name: 'directors' });

  const memoizedSteps = [
    { id: 'main', title: '1. Identity', icon: User, fields: ['name', 'category', 'userIdUrl'] },
    { id: 'entity', title: '2. Entity', icon: Building, fields: ['registrationId', 'vatRegistered', 'registrationDocUrl'] },
    { id: 'standing', title: '3. Standing', icon: Landmark, fields: ['ownsOperatingProperty', 'ficaDocUrl'] },
    { id: 'governance', title: '4. Governance', icon: Gavel, fields: ['shareholderCount', 'directorCount'] },
    { id: 'review', title: 'Audit Check', icon: ShieldCheck, fields: [] },
  ];

  const currentStepConfig = memoizedSteps[currentStep];

  const handleStepTransition = async (direction: 'next' | 'back' | number) => {
    if (direction === 'next') {
        const isValid = await methods.trigger(memoizedSteps[currentStep].fields as any);
        if (!isValid) return;
    }

    // CONTROLLED PERSISTENCE: Save only on explicit transition if form is modified
    if (methods.formState.isDirty && supplier?.id) {
        const values = methods.getValues();
        const token = await getClientSideAuthToken();
        if (token) {
            const ref = doc(firestore, 'lendingSuppliers', supplier.id);
            setDoc(ref, { ...values, updatedAt: serverTimestamp() }, { merge: true }).catch(console.error);
        }
    }

    if (typeof direction === 'number') {
        if (direction <= currentStep || (await methods.trigger(memoizedSteps[currentStep].fields as any))) {
            setCurrentStep(direction);
        }
    } else if (direction === 'next') {
        setCurrentStep(prev => Math.min(prev + 1, memoizedSteps.length - 1));
    } else {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    }
  };

  const onSubmit = async (values: SupplierFormValues) => {
    setIsSubmitting(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Auth failed.");
        const ref = supplier?.id ? doc(firestore, 'lendingSuppliers', supplier.id) : doc(collection(firestore, 'lendingSuppliers'));
        await setDoc(ref, { ...values, id: ref.id, updatedAt: serverTimestamp() }, { merge: true });
        toast({ title: 'Supplier Node Committed' });
        onSave();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Commit Failed', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isSubmitting) return <div className="flex justify-center p-40"><Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" /></div>;

  return (
    <Card className="max-w-6xl mx-auto shadow-2xl border-none overflow-hidden text-left text-foreground">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} onKeyDown={(e) => { if(e.key === 'Enter') e.preventDefault(); }}>
          <CardHeader className="bg-slate-900 text-white p-8">
            <div className="flex justify-between items-center">
              <div className="text-left text-white">
                <CardTitle className="text-2xl font-black font-headline uppercase">Supplier Protocol Node</CardTitle>
                <CardDescription className="text-slate-400">Stage: {currentStepConfig.title}</CardDescription>
              </div>
              <Button type="button" variant="ghost" className="text-white hover:text-primary" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Exit Wizard</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 text-left">
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
              <div className="bg-slate-50 border-r p-6 space-y-2">
                {memoizedSteps.map((step, i) => (
                  <Button key={step.id} type="button" variant={currentStep === i ? "secondary" : "ghost"} className={cn("w-full justify-start gap-3 h-10 px-3 transition-all", currentStep === i && "bg-white shadow-sm ring-1 ring-primary/20")} onClick={() => handleStepTransition(i)}>
                    {React.createElement(step.icon, { className: cn("h-4 w-4", currentStep >= i ? "text-primary" : "text-muted-foreground") })}
                    <span className={cn("text-[11px] font-black uppercase", currentStep === i ? "text-primary" : "text-muted-foreground")}>{step.title.split('. ')[1]}</span>
                  </Button>
                ))}
              </div>
              <div className="p-10 min-h-[500px]">
                {currentStepConfig.id === 'main' && <StepMain />}
                {currentStepConfig.id === 'entity' && <StepEntity />}
                {currentStepConfig.id === 'standing' && <StepStanding />}
                {currentStepConfig.id === 'governance' && (
                    <div className="space-y-6 text-left">
                        <div className="grid grid-cols-2 gap-8 text-left">
                            <FormField control={methods.control} name="shareholderCount" render={({ field }) => (
                                <FormItem><FormLabel>Confirmed Shareholders</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 font-bold" /></FormControl></FormItem>
                            )} />
                            <FormField control={methods.control} name="directorCount" render={({ field }) => (
                                <FormItem><FormLabel>Confirmed Directors</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 font-bold" /></FormControl></FormItem>
                            )} />
                        </div>
                        <Alert className="bg-primary/5 border-primary/20"><Info className="h-4 w-4 text-primary" /><AlertDescription className="text-xs">Updating these counts will instantly initialize new stakeholder nodes in the registry.</AlertDescription></Alert>
                    </div>
                )}
                {currentStepConfig.id === 'review' && (
                    <div className="text-center py-20 space-y-4">
                        <CheckCircle2 className="h-16 w-16 text-primary mx-auto opacity-30" />
                        <h3 className="text-2xl font-black uppercase text-foreground">Audit Ready</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">Verify data integrity before committing this supplier node to the grid.</p>
                    </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t p-8 flex justify-between">
            <Button type="button" variant="outline" onClick={() => handleStepTransition('back')} disabled={currentStep === 0}>Back</Button>
            {currentStep < memoizedSteps.length - 1 ? (
              <Button type="button" onClick={() => handleStepTransition('next')} className="px-10 font-bold text-white">Next Stage <ArrowRight className="ml-2 h-4 w-4" /></Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="h-12 px-16 bg-primary font-black uppercase tracking-tight text-white shadow-xl">{isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} Commit Node</Button>
            )}
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
}

