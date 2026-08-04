
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, useFormContext, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, Landmark, ArrowLeft, ArrowRight, CheckCircle, ShieldCheck, 
    History, Building, FileUp, Users, UserCircle, ShieldAlert, CheckCircle2, 
    ListChecks, Save, User, UserCheck, Gavel, Scale, Info, Trash2, UserPlus,
    FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getClientSideAuthToken, useFirestore } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

// --- SCHEMAS ---

const stakeholderSchema = z.object({
    name: z.string().min(1, "Full name required."),
    rsaIdNumber: z.string().optional(),
    rsaIdUrl: z.string().optional(),
});

const clientWizardSchema = z.object({
  applyingCapacity: z.enum(['individual', 'entity']).default('entity'),
  entityType: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  registrationId: z.string().optional(),
  vatRegistered: z.boolean().default(false),
  vatNumber: z.string().optional(),
  globalFacilityLimit: z.coerce.number().min(0).default(0),
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

type ClientFormValues = z.infer<typeof clientWizardSchema>;

// --- HELPER COMPONENTS ---

function FileUploadField({ name, label, folder }: { name: any, label: string, folder: string }) {
    const { setValue, watch } = useFormContext<ClientFormValues>();
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
            setValue(name, result.url, { shouldValidate: true, shouldDirty: true });
            toast({ title: "Document Attached" });
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Upload Failed", description: err.message });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-1.5 text-left text-foreground">
            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">{label}</Label>
            <Button 
                type="button" 
                variant="outline" 
                className={cn("w-full h-11 border-2 border-dashed gap-2 font-bold", currentUrl && "border-green-50 bg-green-50 text-green-700")}
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

const StakeholderNode = ({ index, type, onRemove }: { index: number, type: 'shareholders' | 'directors', onRemove: () => void }) => {
    const { control } = useFormContext<ClientFormValues>();
    return (
        <div className="p-6 border-2 rounded-2xl bg-white shadow-sm space-y-4 relative text-left text-foreground">
            <div className="flex justify-between items-center text-left text-foreground">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <UserCircle className="h-4 w-4" /> {type.slice(0, -1)} #{index + 1}
                </h4>
                <Button variant="ghost" size="icon" onClick={onRemove} className="text-destructive h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-foreground">
                <FormField control={control} name={`${type}.${index}.name` as any} render={({ field }) => (<FormItem className="text-left text-foreground"><FormLabel>Full Name</FormLabel><FormControl><Input {...field} className="h-10 border-2" /></FormControl></FormItem>)} />
                <FormField control={control} name={`${type}.${index}.rsaIdNumber` as any} render={({ field }) => (<FormItem className="text-left text-foreground"><FormLabel>RSA ID Number</FormLabel><FormControl><Input {...field} className="h-10 border-2 font-mono" /></FormControl></FormItem>)} />
            </div>
            <FileUploadField name={`${type}.${index}.rsaIdUrl`} label="Attach Identity Scan" folder={`clients-${type}`} />
        </div>
    );
};

// --- WIZARD TERMINAL ---

export function EditClientWizard({ client, onSave, onBack, targetCollection = 'lendingClients' }: { client?: any, onSave: () => void, onBack: () => void, targetCollection?: string }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const methods = useForm<ClientFormValues>({
    resolver: zodResolver(clientWizardSchema),
    mode: 'onChange',
    defaultValues: client || { applyingCapacity: 'entity', status: 'draft', shareholderCount: 0, directorCount: 0, shareholders: [], directors: [] }
  });

  const { fields: shareholderFields, append: appendShareholder, remove: removeShareholder } = useFieldArray({ control: methods.control, name: 'shareholders' });
  const { fields: directorFields, append: appendDirector, remove: removeDirector } = useFieldArray({ control: methods.control, name: 'directors' });

  const steps = [
    { id: 'main', title: '1. Identity', icon: User, fields: ['applyingCapacity', 'name', 'userIdUrl'] },
    { id: 'entity', title: '2. Entity', icon: Building, fields: ['entityType', 'registrationId', 'registrationDocUrl', 'globalFacilityLimit'] },
    { id: 'standing', title: '3. Standing', icon: Landmark, fields: ['ownsOperatingProperty', 'ficaDocUrl'] },
    { id: 'governance', title: '4. Governance', icon: Gavel, fields: ['shareholderCount', 'directorCount'] },
    { id: 'shareholders', title: '5. Shareholders', icon: Users, fields: ['shareholders'] },
    { id: 'directors', title: '6. Directors', icon: UserCheck, fields: ['directors'] },
    { id: 'review', title: 'Audit Check', icon: ShieldCheck, fields: [] },
  ];

  const handleStepTransition = async (direction: 'next' | 'back' | number) => {
    const isMovingForward = direction === 'next' || (typeof direction === 'number' && direction > currentStep);

    if (isMovingForward) {
        const isValid = await methods.trigger(steps[currentStep].fields as any);
        if (!isValid) return;

        // EVENT-DRIVEN STAKEHOLDER SYNC
        if (steps[currentStep].id === 'governance') {
            const sCount = Number(methods.getValues('shareholderCount')) || 0;
            const dCount = Number(methods.getValues('directorCount')) || 0;
            
            const curS = shareholderFields.length;
            if (sCount > curS) {
                for (let i = 0; i < sCount - curS; i++) appendShareholder({ name: '' });
            } else if (sCount < curS) {
                for (let i = 0; i < curS - sCount; i++) removeShareholder(curS - 1 - i);
            }

            const curD = directorFields.length;
            if (dCount > curD) {
                for (let i = 0; i < dCount - curD; i++) appendDirector({ name: '' });
            } else if (dCount < curD) {
                for (let i = 0; i < curD - dCount; i++) removeDirector(curD - 1 - i);
            }
        }
    }

    // PERVASIVE DATA SYNC: Autosave on transition
    if (methods.formState.isDirty && client?.id) {
        const token = await getClientSideAuthToken();
        if (token) {
            const values = methods.getValues();
            setDoc(doc(firestore, targetCollection, client.id), { ...values, updatedAt: serverTimestamp() }, { merge: true }).catch(console.error);
        }
    }

    if (typeof direction === 'number') {
        setCurrentStep(direction);
    } else if (direction === 'next') {
        setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    }
  };

  const onSubmit = async (values: ClientFormValues) => {
    setIsSubmitting(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Auth failed.");
        const ref = client?.id ? doc(firestore, targetCollection, client.id) : doc(collection(firestore, targetCollection));
        await setDoc(ref, { ...values, id: ref.id, updatedAt: serverTimestamp() }, { merge: true });
        toast({ title: 'Client Record Saved' });
        onSave();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Commit Failed', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const currentStepConfig = steps[currentStep];
  const watchedValues = methods.watch();

  return (
    <Card className="max-w-6xl mx-auto shadow-2xl border-none overflow-hidden text-left text-foreground">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} onKeyDown={(e) => { if(e.key === 'Enter') e.preventDefault(); }}>
          <CardHeader className="bg-slate-900 text-white p-8 text-left">
            <div className="flex justify-between items-center text-left text-white">
              <div className="text-left text-white">
                <CardTitle className="text-2xl font-black font-headline uppercase text-white text-left">Client Protocol Terminal</CardTitle>
                <CardDescription className="text-slate-400">Section: {currentStepConfig.title}</CardDescription>
              </div>
              <Button type="button" variant="ghost" className="text-white hover:text-primary" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Exit Terminal</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 text-left text-foreground">
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] text-left">
              <div className="bg-slate-50 border-r p-6 space-y-2 text-left text-foreground">
                {steps.map((step, i) => (
                  <Button key={step.id} type="button" variant={currentStep === i ? "secondary" : "ghost"} className={cn("w-full justify-start gap-3 h-10 px-3 transition-all text-left", currentStep === i && "bg-white shadow-sm ring-1 ring-primary/20")} onClick={() => handleStepTransition(i)}>
                    {React.createElement(step.icon, { className: cn("h-4 w-4", currentStep >= i ? "text-primary" : "text-muted-foreground") })}
                    <span className={cn("text-[11px] font-black uppercase text-left text-foreground", currentStep === i ? "text-primary" : "text-muted-foreground")}>{step.title.split('. ')[1]}</span>
                  </Button>
                ))}
              </div>
              <div className="p-10 min-h-[500px] text-left text-foreground">
                {currentStepConfig.id === 'main' && (
                    <div className="space-y-8 text-left animate-in fade-in duration-500">
                        <FormField control={methods.control} name="applyingCapacity" render={({ field }) => (
                            <FormItem className="space-y-4 text-left">
                                <FormLabel className="font-black uppercase text-[10px] tracking-widest text-primary">Applying Capacity</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                        <div className={cn("p-4 border-2 rounded-2xl cursor-pointer", field.value === 'individual' ? "border-primary bg-primary/5 shadow-md" : "bg-white")}><RadioGroupItem value="individual" id="cap-ind" /><Label htmlFor="cap-ind" className="cursor-pointer font-bold uppercase text-xs">Individual</Label></div>
                                        <div className={cn("flex items-center space-x-3 p-4 border-2 rounded-2xl cursor-pointer", field.value === 'entity' ? "border-primary bg-primary/5 shadow-md" : "bg-white")}><RadioGroupItem value="entity" id="cap-ent" /><Label htmlFor="cap-ent" className="cursor-pointer font-bold uppercase text-xs">Legal Entity</Label></div>
                                    </RadioGroup>
                                </FormControl>
                            </FormItem>
                        )} />
                        <FormField control={methods.control} name="name" render={({ field }) => (<FormItem className="text-left"><FormLabel>Client Full Name / Label</FormLabel><FormControl><Input {...field} className="h-12 border-2 bg-white font-black text-lg" /></FormControl></FormItem>)} />
                        <div className="p-8 bg-slate-900 text-white rounded-[2rem] shadow-xl space-y-4 text-left">
                            <h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2"><UserCheck className="h-4 w-4" /> Principal Identity Node</h4>
                            <FileUploadField name="userIdUrl" label="Principal RSA ID / Passport" folder="lending-identity" />
                        </div>
                    </div>
                )}
                {currentStepConfig.id === 'entity' && (
                    <div className="space-y-8 text-left animate-in fade-in duration-500">
                        <FormField control={methods.control} name="entityType" render={({ field }) => (
                            <FormItem className="text-left"><FormLabel>Entity Type</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger className="h-11 border-2 bg-white font-bold"><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl><SelectContent>{['Pty Ltd', 'Ltd', 'CC', 'Sole Prop', 'Trust'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></FormItem>
                        )} />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                            <div className="space-y-6 text-left">
                                <FormField control={methods.control} name="registrationId" render={({ field }) => (<FormItem className="text-left"><FormLabel>Registration #</FormLabel><FormControl><Input {...field} value={field.value || ''} className="h-11 border-2 font-mono bg-white" /></FormControl></FormItem>)} />
                                <FormField control={methods.control} name="globalFacilityLimit" render={({ field }) => (
                                    <FormItem className="text-left">
                                        <FormLabel className="text-primary font-black uppercase text-[10px]">Global Facility Limit (ZAR)</FormLabel>
                                        <FormControl><Input type="number" {...field} className="h-11 border-2 bg-white font-black text-lg" /></FormControl>
                                    </FormItem>
                                )} />
                            </div>
                            <div className="p-8 bg-slate-900 text-white rounded-[2rem] shadow-xl flex flex-col justify-center gap-4 text-left text-white">
                                <h4 className="text-[10px] font-black uppercase text-primary flex items-center gap-2"><FileText className="h-4 w-4" /> Founding Evidence</h4>
                                <FileUploadField name="registrationDocUrl" label="CIPC / Founding Document" folder="lending-legal" />
                            </div>
                        </div>
                    </div>
                )}
                {currentStepConfig.id === 'standing' && (
                    <div className="space-y-12 text-left animate-in fade-in duration-500">
                         <FormField control={methods.control} name="ownsOperatingProperty" render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-8 border-2 rounded-[2.5rem] bg-white shadow-lg text-left text-foreground">
                                <div className="space-y-1 text-left text-foreground">
                                    <span className="text-2xl font-black font-headline uppercase tracking-tight text-left">Infrastructure Standing</span>
                                    <p className="text-base text-muted-foreground text-left">Does the client own their operating premises?</p>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="scale-125" /></FormControl>
                            </FormItem>
                        )} />
                        <div className="grid grid-cols-1 gap-6 text-left text-foreground">
                            <FileUploadField name="ficaDocUrl" label={methods.watch('ownsOperatingProperty') ? "Title Deed / Bond Statement" : "Signed Lease Agreement"} folder="lending-standing" />
                        </div>
                    </div>
                )}
                 {currentStepConfig.id === 'governance' && (
                    <div className="space-y-10 text-left animate-in fade-in duration-500 text-foreground">
                        <div className="grid grid-cols-2 gap-8 text-left text-foreground">
                            <FormField control={methods.control} name="shareholderCount" render={({ field }) => (
                                <FormItem className="text-left text-foreground"><FormLabel>Confirmed Shareholders</FormLabel><FormControl><Input type="number" {...field} className="h-12 border-2 bg-white font-black text-xl" /></FormControl></FormItem>
                            )} />
                            <FormField control={methods.control} name="directorCount" render={({ field }) => (
                                <FormItem className="text-left text-foreground"><FormLabel>Confirmed Directors</FormLabel><FormControl><Input type="number" {...field} className="h-12 border-2 bg-white font-black text-xl" /></FormControl></FormItem>
                            )} />
                        </div>
                        <Alert className="bg-primary/5 border-primary/20 text-left text-foreground"><Info className="h-4 w-4 text-primary" /><AlertDescription className="text-xs text-muted-foreground">Updating these counts will synchronize the registry nodes in the next section.</AlertDescription></Alert>
                    </div>
                )}
                {currentStepConfig.id === 'shareholders' && (
                    <div className="space-y-6 text-left text-foreground">
                        {shareholderFields.map((field, index) => (
                            <StakeholderNode key={field.id} index={index} type="shareholders" onRemove={() => { removeShareholder(index); methods.setValue('shareholderCount', shareholderFields.length - 1); }} />
                        ))}
                    </div>
                )}
                {currentStepConfig.id === 'directors' && (
                    <div className="space-y-6 text-left text-foreground">
                        {directorFields.map((field, index) => (
                            <StakeholderNode key={field.id} index={index} type="directors" onRemove={() => { removeDirector(index); methods.setValue('directorCount', directorFields.length - 1); }} />
                        ))}
                    </div>
                )}
                {currentStepConfig.id === 'review' && (
                    <div className="text-center py-24 space-y-6 animate-in zoom-in-95 duration-500 text-left text-foreground">
                        <CheckCircle2 className="h-20 w-20 text-primary mx-auto opacity-30" />
                        <div className="space-y-2 text-center text-foreground">
                            <h3 className="text-3xl font-black uppercase text-center">Audit Ready</h3>
                            <p className="text-sm text-muted-foreground max-sm mx-auto leading-relaxed text-center">Verify data integrity before committing this client node to the grid.</p>
                        </div>
                    </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t p-8 flex justify-between text-left text-foreground">
            <Button type="button" variant="outline" onClick={() => handleStepTransition('back')} className="font-bold h-12 px-8">Back</Button>
            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={() => handleStepTransition('next')} className="px-10 font-black uppercase text-xs tracking-widest text-white shadow-lg h-12">Next Protocol Stage <ArrowRight className="ml-2 h-4 w-4" /></Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="h-14 px-16 bg-primary font-black uppercase tracking-tight text-white shadow-2xl">{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Commit Node</Button>
            )}
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
}
