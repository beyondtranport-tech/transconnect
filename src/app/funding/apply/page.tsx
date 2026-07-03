'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, useFormContext, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import { Loader2, Landmark, ArrowLeft, ArrowRight, CheckCircle, ShieldCheck, History, Package, Sparkles, Building, FileUp, Users, PlusCircle, Trash2, UserCheck, Truck, FileText, Navigation, MapPin, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useUser, getClientSideAuthToken, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { doc, serverTimestamp } from 'firebase/firestore';
import { supplierCategories } from '@/app/adminaccount/marketing/discovery-engine';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { provinces } from '@/lib/geodata';

const fundingNeeds = {
  'loan-pv-term': 'Working Capital / Business Loan',
  'installment-sale-term': 'Equipment Finance (Production, CNC, etc.)',
  'vehicles': 'Vehicle Finance (Truck, Trailer, Bus, Car)',
  'disclosed-confirmed-factoring': 'Cashflow Support (Factoring, Discounting)',
};

const entityTypes = [
    "Ltd",
    "Private Company (Pty Ltd)",
    "Sole Proprietorship",
    "Close Corporation (CC)",
    "Trust",
    "Individual",
    "Partnership"
];

const creditRatings = [
    { value: 'excellent', label: 'Excellent (No defaults, strong history)' },
    { value: 'good', label: 'Good (Occasional late payments)' },
    { value: 'fair', label: 'Fair (Previous defaults settled)' },
    { value: 'poor', label: 'Poor (Active judgments or defaults)' },
];

const vehicleClasses = ["Heavy Truck (Horse)", "Trailer", "Rigid Truck (8t-14t)", "Light Commercial (Bakkie)", "Bus", "Passenger Vehicle", "Other"];
const termOptions = ['1-12 Months', '12-24 Months', '24-36 Months', '36-48 Months', '48-60 Months', '60-72+ Months'];

const stakeholderSchema = z.object({
    name: z.string().min(1, "Full Name required."),
    position: z.string().min(1, "Position required."),
    since: z.string().min(1, "Date or Year required."),
    rsaIdUrl: z.string().optional(),
    proofAddressUrl: z.string().optional(),
});

const assetDetailSchema = z.object({
    vehicleClass: z.string().optional(),
    vehicleMake: z.string().optional(),
    vehicleModel: z.string().optional(),
    vehicleYear: z.string().optional(),
    vehicleVin: z.string().optional(),
    engineNumber: z.string().optional(),
    rc1DocUrl: z.string().optional(),
    vehicleRegisterNumber: z.string().optional(),
    titleholder: z.string().optional(),
    owner: z.string().optional(),
    assetCategory: z.string().optional(),
    assetBrand: z.string().optional(),
    assetModel: z.string().optional(),
    assetYear: z.string().optional(),
    assetSerialNumber: z.string().optional(),
    assetSpecUrl: z.string().optional(),
});

const baseSchema = z.object({
  fundingNeed: z.string().min(1, 'Please select what you need funds for.'),
  primaryRegion: z.string().min(1, 'Please select your primary operating region.'),
  fundingReason: z.string().min(1, 'Please select a reason.'),
  purpose: z.string().min(10, 'Please provide more detail.'),
  amountRequested: z.coerce.number().positive('Please enter a valid amount.'),
  preferredTerm: z.string().min(1, 'Required.'),
  entityType: z.string().min(1, 'Please select your entity type.'),
  yearsInBusiness: z.coerce.number().min(0, 'Required.'),
  annualTurnover: z.coerce.number().min(0, 'Required.'),
  creditRating: z.string().min(1, 'Required.'),
  registrationNumber: z.string().optional(),
  companyLegalName: z.string().optional(),
  registeredAddress: z.string().optional(),
  directors: z.array(stakeholderSchema).optional().default([]),
  shareholders: z.array(stakeholderSchema).optional().default([]),
  assets: z.array(assetDetailSchema).optional().default([]),
  registrationDocUrl: z.string().optional(),
  ficaDocUrl: z.string().optional(),
  hasJudgements: z.boolean().default(false),
  hasDefaults: z.boolean().default(false),
  hasArrears: z.boolean().default(false),
  apiConsent: z.boolean().default(false),
  originationType: z.enum(['direct', 'market']).default('market'),
  industrial_tags: z.array(z.string()).default([]),
});

const combinedSchema = baseSchema.superRefine((data, ctx) => {
    if (data.entityType === 'Private Company (Pty Ltd)') {
        if (!data.registrationNumber) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required.", path: ["registrationNumber"] });
        if (!data.companyLegalName) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required.", path: ["companyLegalName"] });
    }
});

type ApplicationFormValues = z.infer<typeof combinedSchema>;

const staticSteps = [
  { id: 'Need', name: 'Step 1: Need & Location', fields: ['fundingNeed', 'primaryRegion'] },
  { id: 'Profile', name: 'Step 2: Business Profile', fields: ['entityType', 'yearsInBusiness', 'annualTurnover', 'creditRating', 'registrationNumber', 'companyLegalName', 'directors', 'shareholders'] },
  { id: 'History', name: 'Step 3: Credit History', fields: ['hasJudgements', 'hasDefaults', 'hasArrears', 'apiConsent'] },
  { id: 'Asset', name: 'Step 4: Asset Specifics', fields: ['assets'] },
  { id: 'Reason', name: 'Step 5: The Reason', fields: ['fundingReason', 'purpose'] },
  { id: 'Amount', name: 'Step 6: Amount & Terms', fields: ['amountRequested', 'preferredTerm'] },
  { id: 'Submit', name: 'Final Step: Review' },
];

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
                        currentUrl ? "border-green-500 bg-green-50 text-green-700" : "border-dashed",
                        variant === 'compact' && "h-8 px-3"
                    )}
                    onClick={() => document.getElementById(`upload-${name}`)?.click()}
                    disabled={isUploading}
                >
                    {isUploading ? <Loader2 className="h-3 w-3 animate-spin"/> : currentUrl ? <UserCheck className="h-4 w-4" /> : <FileUp className="h-4 w-4" />}
                    {currentUrl ? `Update ${label}` : `Attach ${label}`}
                </Button>
                <input id={`upload-${name}`} type="file" className="hidden" onChange={handleUpload} />
            </div>
            {isUploading && <Progress value={progress} className="h-1 mt-1" />}
        </div>
    );
}

function StakeholderForm({ type, label }: { type: 'directors' | 'shareholders', label: string }) {
    const { control } = useFormContext<ApplicationFormValues>();
    const { fields, append, remove } = useFieldArray({ control, name: type });
    const [count, setCount] = useState(fields.length || 0);

    const handleCountChange = (val: string) => {
        const num = parseInt(val, 10) || 0;
        setCount(num);
        const currentItems = [...fields];
        if (num > currentItems.length) {
            for (let i = currentItems.length; i < num; i++) append({ name: '', position: '', since: '', rsaIdUrl: '', proofAddressUrl: '' });
        } else if (num < currentItems.length) {
            for (let i = currentItems.length - 1; i >= num; i--) remove(i);
        }
    };

    return (
        <div className="space-y-6 text-left">
            <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
                <Label className="font-bold flex items-center gap-2 text-left">
                    <Users className="h-4 w-4 text-primary" />
                    Number of {label}
                </Label>
                <Select value={String(count)} onValueChange={handleCountChange}>
                    <SelectTrigger className="w-24 bg-white border-2 text-left"><SelectValue placeholder="0" /></SelectTrigger>
                    <SelectContent>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {fields.map((field, index) => (
                <div key={field.id} className="p-6 border-2 border-dashed rounded-2xl bg-white space-y-6 animate-in fade-in slide-in-from-top-2 text-left">
                    <div className="flex items-center justify-between border-b pb-4 text-left">
                        <Badge variant="secondary" className="font-black uppercase text-[10px] tracking-widest">
                            {label} {index + 1}
                        </Badge>
                        <Button type="button" variant="ghost" size="icon" onClick={() => { remove(index); setCount(count - 1); }} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                        <FormField control={control} name={`${type}.${index}.name` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>Full Legal Name</FormLabel><FormControl><Input {...field} className="h-9 border-2" /></FormControl></FormItem>)} />
                        <FormField control={control} name={`${type}.${index}.position` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>Position / Role</FormLabel><FormControl><Input {...field} className="h-9 border-2" /></FormControl></FormItem>)} />
                        <FormField control={control} name={`${type}.${index}.since` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>Member Since</FormLabel><FormControl><Input {...field} className="h-9 border-2" placeholder="e.g. 2018" /></FormControl></FormItem>)} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 text-left">
                        <FileUploadField name={`${type}.${index}.rsaIdUrl`} label="RSA Identity Document" folder="stakeholder-ids" variant="standard" />
                        <FileUploadField name={`${type}.${index}.proofAddressUrl`} label="Proof of Residential Address" folder="stakeholder-address" variant="standard" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function ApplyForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const enquiryId = searchParams.get('enquiryId');
  const origination = searchParams.get('origination') as 'direct' | 'market' || 'market';

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc(userDocRef);

  const methods = useForm<ApplicationFormValues>({
    resolver: zodResolver(combinedSchema),
    mode: 'onChange',
    defaultValues: {
      fundingNeed: searchParams.get('type') || '',
      primaryRegion: '',
      amountRequested: Number(searchParams.get('amount')) || 0,
      preferredTerm: '',
      yearsInBusiness: 0,
      annualTurnover: 0,
      hasJudgements: false,
      hasDefaults: false,
      hasArrears: false,
      apiConsent: false,
      directors: [],
      shareholders: [],
      assets: [{ vehicleClass: '', assetCategory: '' }],
      originationType: origination,
      industrial_tags: [],
    },
  });

  const { fields: assetFields, append: appendAsset, remove: removeAsset } = useFieldArray({
      control: methods.control,
      name: 'assets'
  });

  const fundingNeed = methods.watch('fundingNeed');

  // DERIVE INDUSTRIAL TAGS FOR LENDER MATCHING
  useEffect(() => {
    const tags = [];
    if (fundingNeed === 'vehicles' || fundingNeed === 'installment-sale-term') tags.push('Asset Finance');
    if (fundingNeed === 'loan-pv-term') tags.push('Working Capital');
    if (fundingNeed === 'disclosed-confirmed-factoring') tags.push('Factoring');
    
    // Add additional forensic tags based on turnover or maturity
    const turnover = methods.watch('annualTurnover');
    if (turnover > 10000000) tags.push('Institutional');
    
    methods.setValue('industrial_tags', tags);
  }, [fundingNeed, methods.watch('annualTurnover')]);

  const processStep = async () => {
    const isValid = await methods.trigger(staticSteps[currentStep].fields as any);
    if (isValid && currentStep < staticSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const onSubmit = async (values: ApplicationFormValues) => {
    setIsSubmitting(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Auth failed.");
        
        const companyId = userData?.companyId;
        if (!companyId) throw new Error("User company profile not found.");

        const path = enquiryId ? `companies/${companyId}/enquiries/${enquiryId}` : `companies/${companyId}/enquiries`;
        const data = { 
            ...values, 
            companyId,
            status: 'pending', 
            updatedAt: { _methodName: 'serverTimestamp' } 
        };

        const response = await fetch(enquiryId ? '/api/updateUserDoc' : '/api/addUserDoc', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(enquiryId ? { path, data } : { collectionPath: path, data }),
        });

        if (!response.ok) throw new Error("Server failed to save enquiry.");

        const successMsg = values.originationType === 'direct' 
            ? 'Application submitted directly to platform finance.'
            : 'Enquiry broadcasted to the finance mall network.';

        toast({ title: 'Application Processed', description: successMsg });
        router.push('/account?view=dashboard');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (isUserLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  const currentStepConfig = staticSteps[currentStep];

  return (
    <Card className="w-full max-w-3xl shadow-xl text-left border-none overflow-hidden">
      <CardHeader className="bg-slate-900 text-white rounded-t-xl p-8 text-left">
        <div className="flex items-center justify-between text-left">
            <div className="text-left">
                <CardTitle className="flex items-center gap-2 text-left text-white"><Landmark className="text-primary"/> Forensic Funding Application</CardTitle>
                <CardDescription className="text-slate-400 text-left">{currentStepConfig.name}</CardDescription>
            </div>
            <Badge variant="outline" className="border-primary/50 text-primary uppercase font-black text-[10px] tracking-widest px-3 h-6">
                {methods.watch('originationType') === 'direct' ? 'Direct to Platform' : 'Market Broadcast'}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-8 text-left bg-white text-foreground">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8 text-left">
            
            {currentStepConfig.id === 'Need' && (
                <div className="space-y-6 text-left text-foreground">
                    <FormField control={methods.control} name="fundingNeed" render={({ field }) => (
                        <FormItem className="text-left">
                        <FormLabel className="font-bold text-foreground">I require capital for:</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="h-12 border-2 text-left"><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
                            <SelectContent>
                            {Object.entries(fundingNeeds).map(([id, name]) => (<SelectItem key={id} value={id}>{name}</SelectItem>))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={methods.control} name="primaryRegion" render={({ field }) => (
                        <FormItem className="text-left">
                            <FormLabel className="font-bold text-foreground">Primary Operating Region</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger className="h-12 border-2 text-left"><SelectValue placeholder="Select province..." /></SelectTrigger></FormControl>
                                <SelectContent>{provinces.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            )}

            {currentStepConfig.id === 'Profile' && (
                <div className="space-y-8 text-left text-foreground">
                    <FormField control={methods.control} name="entityType" render={({ field }) => (
                        <FormItem className="text-left"><FormLabel>Entity Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="border-2 text-left text-foreground"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl><SelectContent>{entityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></FormItem>
                    )} />

                    {methods.watch('entityType') === 'Private Company (Pty Ltd)' && (
                        <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed space-y-10 animate-in fade-in slide-in-from-top-4 duration-500 text-left text-foreground">
                             <div className="flex items-center gap-2 text-primary font-bold text-sm mb-4">
                                <Building className="h-4 w-4" /> Corporate Discovery Module
                             </div>
                             
                             <div className="space-y-6 text-left">
                                <FormField control={methods.control} name="companyLegalName" render={({ field }) => (<FormItem className="text-left"><FormLabel>Registered Company Name</FormLabel><FormControl><Input placeholder="Legal name as per CIPC" {...field} className="bg-white border-2" /></FormControl></FormItem>)} />
                                <div className="grid grid-cols-2 gap-4 text-left">
                                    <FormField control={methods.control} name="registrationNumber" render={({ field }) => (<FormItem className="text-left"><FormLabel>Registration Number</FormLabel><FormControl><Input placeholder="20XX/XXXXXX/07" {...field} className="bg-white border-2" /></FormControl></FormItem>)} />
                                    <FileUploadField name="registrationDocUrl" label="Registration Doc (CK)" folder="enquiry-docs" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                                    <FormField control={methods.control} name="registeredAddress" render={({ field }) => (<FormItem className="text-left"><FormLabel>Registered Address</FormLabel><FormControl><Textarea placeholder="Full address..." {...field} className="bg-white border-2" /></FormControl></FormItem>)} />
                                    <FileUploadField name="ficaDocUrl" label="Company FICA / Proof of Address" folder="enquiry-docs" />
                                </div>
                             </div>

                             <Separator />

                             <div className="space-y-8 text-left">
                                <div className="space-y-2 text-left">
                                    <h4 className="font-black uppercase text-[10px] tracking-[0.2em] text-primary">Governance: Key Directors</h4>
                                    <StakeholderForm type="directors" label="Directors" />
                                </div>

                                <Separator />

                                <div className="space-y-2 text-left">
                                    <h4 className="font-black uppercase text-[10px] tracking-[0.2em] text-primary">Equity: Major Shareholders</h4>
                                    <StakeholderForm type="shareholders" label="Shareholders" />
                                </div>
                             </div>
                        </div>
                    )}

                    <FormField control={methods.control} name="creditRating" render={({ field }) => (
                        <FormItem className="text-left"><FormLabel>Self-Assessed Credit Standing</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="border-2 text-left"><SelectValue placeholder="Rate yourself..." /></SelectTrigger></FormControl><SelectContent>{creditRatings.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></FormItem>
                    )} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <FormField control={methods.control} name="yearsInBusiness" render={({ field }) => (<FormItem className="text-left"><FormLabel>Years in Business</FormLabel><FormControl><Input type="number" {...field} className="border-2"/></FormControl></FormItem>)} />
                        <FormField control={methods.control} name="annualTurnover" render={({ field }) => (<FormItem className="text-left"><FormLabel>Annual Turnover (R)</FormLabel><FormControl><Input type="number" {...field} className="border-2" /></FormControl></FormItem>)} />
                    </div>
                </div>
            )}

            {currentStepConfig.id === 'History' && (
                <div className="space-y-6 text-left">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-foreground text-left"><History className="h-5 w-5 text-primary"/> Forensic Disclosure</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-left">Please provide a clear declaration regarding your business's credit history.</p>
                    
                    <div className="space-y-4 text-left">
                        <FormField control={methods.control} name="hasJudgements" render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors text-left">
                                <FormLabel className="font-bold cursor-pointer text-left">Do you have any active judgements?</FormLabel>
                                <FormControl><RadioGroup onValueChange={(val) => field.onChange(val === 'yes')} value={field.value ? 'yes' : 'no'} className="flex gap-4"><div className="flex items-center gap-1.5"><RadioGroupItem value="yes" id="j-yes" /><Label htmlFor="j-yes" className="cursor-pointer">Yes</Label></div><div className="flex items-center gap-1.5"><RadioGroupItem value="no" id="j-no" /><Label htmlFor="j-no" className="cursor-pointer">No</Label></div></RadioGroup></FormControl>
                            </FormItem>
                        )} />

                        <FormField control={methods.control} name="hasDefaults" render={({ field }) => (
                             <FormItem className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors text-left">
                                <FormLabel className="font-bold cursor-pointer text-left">Do you have any active defaults?</FormLabel>
                                <FormControl><RadioGroup onValueChange={(val) => field.onChange(val === 'yes')} value={field.value ? 'yes' : 'no'} className="flex gap-4"><div className="flex items-center gap-1.5"><RadioGroupItem value="yes" id="d-yes" /><Label htmlFor="d-yes" className="cursor-pointer">Yes</Label></div><div className="flex items-center gap-1.5"><RadioGroupItem value="no" id="d-no" /><Label htmlFor="d-no" className="cursor-pointer">No</Label></div></RadioGroup></FormControl>
                            </FormItem>
                        )} />
                        
                        <FormField control={methods.control} name="hasArrears" render={({ field }) => (
                             <FormItem className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors text-left">
                                <FormLabel className="font-bold cursor-pointer text-left">Are any accounts in arrears?</FormLabel>
                                <FormControl><RadioGroup onValueChange={(val) => field.onChange(val === 'yes')} value={field.value ? 'yes' : 'no'} className="flex gap-4"><div className="flex items-center gap-1.5"><RadioGroupItem value="yes" id="a-yes" /><Label htmlFor="a-yes" className="cursor-pointer">Yes</Label></div><div className="flex items-center gap-1.5"><RadioGroupItem value="no" id="a-no" /><Label htmlFor="a-no" className="cursor-pointer">No</Label></div></RadioGroup></FormControl>
                            </FormItem>
                        )} />
                    </div>

                    <Separator />
                    
                    <div className="bg-primary/5 p-6 rounded-2xl border-2 border-primary/20 space-y-4 text-left">
                         <div className="flex items-center gap-2">
                             <Sparkles className="h-5 w-5 text-primary" />
                             <h4 className="font-bold text-primary">Automated Credit Analysis</h4>
                         </div>
                         <p className="text-xs text-muted-foreground leading-relaxed text-left text-foreground">By authorising a credit check, you significantly increase the speed of matching and the likelihood of approval. Our system will securely connect to our credit bureau partners.</p>
                         <FormField control={methods.control} name="apiConsent" render={({ field }) => (
                            <FormItem className="flex items-center space-x-3 space-y-0 text-left">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange}/></FormControl>
                                <FormLabel className="text-sm font-bold text-slate-800 cursor-pointer text-left">Authorise Logistics Flow to fetch credit data via API</FormLabel>
                            </FormItem>
                         )} />
                    </div>
                </div>
            )}

            {currentStepConfig.id === 'Asset' && (
                <div className="space-y-6 text-left text-foreground">
                    <div className="flex items-center justify-between border-b pb-4 text-left">
                        <div className="text-left">
                            <h3 className="text-xl font-black font-headline flex items-center gap-2 text-left">
                                {fundingNeed === 'vehicles' ? <Truck className="h-6 w-6 text-primary" /> : <Package className="h-6 w-6 text-primary" />}
                                Asset Portfolio Details
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 text-left">Specify all items requiring finance in this batch.</p>
                        </div>
                        <Button type="button" size="sm" onClick={() => appendAsset({ vehicleClass: '', assetCategory: '' })} className="gap-2 font-bold h-9">
                            <PlusCircle className="h-4 w-4" />
                            Add Another Asset
                        </Button>
                    </div>

                    {assetFields.map((field, index) => {
                        const vClass = methods.watch(`assets.${index}.vehicleClass`);
                        const aCategory = methods.watch(`assets.${index}.assetCategory`);
                        const isTrailer = vClass === 'Trailer';

                        return (
                            <div key={field.id} className="p-6 border-2 rounded-2xl bg-slate-50 space-y-6 relative animate-in fade-in zoom-in-95 duration-300 text-left text-foreground">
                                {index > 0 && (
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAsset(index)} className="absolute top-2 right-2 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                )}
                                
                                <Badge variant="secondary" className="font-black text-[10px] tracking-widest uppercase text-left">Asset {index + 1}</Badge>

                                {fundingNeed === 'vehicles' ? (
                                    <div className="space-y-6 text-left">
                                        <FormField control={methods.control} name={`assets.${index}.vehicleClass` as any} render={({ field }) => (
                                            <FormItem className="text-left">
                                                <FormLabel className="font-bold text-foreground">Select Vehicle Class</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger className="h-11 border-2 bg-white text-left"><SelectValue placeholder="Choose class..." /></SelectTrigger></FormControl>
                                                    <SelectContent>{vehicleClasses.map(vc => <SelectItem key={vc} value={vc}>{vc}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                        
                                        {vClass && (
                                            <div className="space-y-6 animate-in slide-in-from-top-2 duration-300 text-left">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                                    <FormField control={methods.control} name={`assets.${index}.vehicleMake` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>Make / Brand</FormLabel><FormControl><Input placeholder="e.g. Scania" {...field} className="h-10 border-2 bg-white" /></FormControl></FormItem>)} />
                                                    <FormField control={methods.control} name={`assets.${index}.vehicleModel` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>Model / Series</FormLabel><FormControl><Input placeholder="e.g. R560" {...field} className="h-10 border-2 bg-white" /></FormControl></FormItem>)} />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                                                    <FormField control={methods.control} name={`assets.${index}.vehicleYear` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>Year</FormLabel><FormControl><Input type="number" placeholder="20XX" {...field} className="h-10 border-2 bg-white" /></FormControl></FormItem>)} />
                                                    <FormField control={methods.control} name={`assets.${index}.vehicleVin` as any} render={({ field }) => (<FormItem className="text-left md:col-span-2"><FormLabel>VIN / Chassis #</FormLabel><FormControl><Input placeholder="Serial Number" {...field} className="h-10 border-2 bg-white" /></FormControl></FormItem>)} />
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                                     <FormField control={methods.control} name={`assets.${index}.vehicleRegisterNumber` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>Vehicle Register #</FormLabel><FormControl><Input placeholder="As per RC1" {...field} className="h-10 border-2 bg-white" /></FormControl></FormItem>)} />
                                                     {!isTrailer && (
                                                        <FormField control={methods.control} name={`assets.${index}.engineNumber` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>Engine Number</FormLabel><FormControl><Input {...field} className="h-10 border-2 bg-white" /></FormControl></FormItem>)} />
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                                    <FormField control={methods.control} name={`assets.${index}.titleholder` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>Titleholder</FormLabel><FormControl><Input placeholder="Entity that holds title" {...field} className="h-10 border-2 bg-white" /></FormControl></FormItem>)} />
                                                    <FormField control={methods.control} name={`assets.${index}.owner` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>Registered Owner</FormLabel><FormControl><Input placeholder="Registered owner" {...field} className="h-10 border-2 bg-white" /></FormControl></FormItem>)} />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-left">
                                                    <FileUploadField name={`assets.${index}.rc1DocUrl`} label="Attach RC1 / Registration Doc" folder="enquiry-assets" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-6 text-left">
                                        <FormField control={methods.control} name={`assets.${index}.assetCategory` as any} render={({ field }) => (
                                            <FormItem className="text-left">
                                                <FormLabel className="font-bold text-foreground">Equipment Category</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger className="h-11 border-2 bg-white text-left"><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
                                                    <SelectContent>{supplierCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />

                                        {aCategory && (
                                            <div className="space-y-6 animate-in slide-in-from-top-2 duration-300 text-left">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                                    <FormField control={methods.control} name={`assets.${index}.assetBrand` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>Manufacturer / Brand</FormLabel><FormControl><Input placeholder="e.g. Caterpillar" {...field} className="h-10 border-2 bg-white" /></FormControl></FormItem>)} />
                                                    <FormField control={methods.control} name={`assets.${index}.assetModel` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>Model / Type</FormLabel><FormControl><Input placeholder="e.g. R560" {...field} className="h-10 border-2 bg-white" /></FormControl></FormItem>)} />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                                                     <FormField control={methods.control} name={`assets.${index}.assetYear` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>Manufacture Year</FormLabel><FormControl><Input type="number" placeholder="20XX" {...field} className="h-10 border-2 bg-white" /></FormControl></FormItem>)} />
                                                     <FormField control={methods.control} name={`assets.${index}.assetSerialNumber` as any} render={({ field }) => (<FormItem className="text-left md:col-span-2"><FormLabel>Serial / Asset Number</FormLabel><FormControl><Input placeholder="Asset unique ID" {...field} className="h-10 border-2 bg-white" /></FormControl></FormItem>)} />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-left">
                                                    <FormField control={methods.control} name={`assets.${index}.owner` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>Current/Target Owner</FormLabel><FormControl><Input placeholder="Owner entity" {...field} className="h-10 border-2 bg-white" /></FormControl></FormItem>)} />
                                                    <FileUploadField name={`assets.${index}.assetSpecUrl`} label="Attach Spec Sheet / Quote" folder="enquiry-assets" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    
                    <div className="flex justify-center py-4">
                        <Button type="button" variant="outline" size="lg" onClick={() => appendAsset({ vehicleClass: '', assetCategory: '' })} className="gap-2 font-bold border-2 border-primary/20 text-primary">
                            <PlusCircle className="h-5 w-5" />
                            Add Another Asset to Batch
                        </Button>
                    </div>
                </div>
            )}

            {currentStepConfig.id === 'Reason' && (
                <div className="space-y-6 text-left text-foreground">
                    <FormField control={methods.control} name="fundingReason" render={({ field }) => (
                        <FormItem className="space-y-3 text-left">
                          <FormLabel className="font-bold text-foreground">Is this for problem solving or capturing opportunity?</FormLabel>
                          <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-2 text-left">
                                <div className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-left">
                                    <RadioGroupItem value="problem" id="r-prob" /> 
                                    <Label htmlFor="r-prob" className="cursor-pointer flex-1 font-medium text-left">Problem / Recovery</Label>
                                </div>
                                <div className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-left">
                                    <RadioGroupItem value="opportunity" id="r-opp" /> 
                                    <Label htmlFor="r-opp" className="cursor-pointer flex-1 font-medium text-left">Growth / Opportunity</Label>
                                </div>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )} />
                    <FormField control={methods.control} name="purpose" render={({ field }) => (<FormItem className="text-left"><FormLabel>Brief Technical Summary</FormLabel><FormControl><Textarea placeholder="Explain exactly how these funds will be deployed..." {...field} className="border-2 min-h-[120px]" /></FormControl><FormMessage /></FormItem>)} />
                </div>
            )}

            {currentStepConfig.id === 'Amount' && (
                <div className="space-y-6 text-left text-foreground">
                    <FormField control={methods.control} name="amountRequested" render={({ field }) => (
                        <FormItem className="text-left">
                        <FormLabel className="text-lg font-bold text-foreground">Estimated Amount (ZAR)</FormLabel>
                        <FormControl><Input type="number" className="h-14 text-2xl font-black font-mono border-primary/20" placeholder="500000" {...field} /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={methods.control} name="preferredTerm" render={({ field }) => (
                        <FormItem className="text-left">
                            <FormLabel className="text-foreground">Preferred Repayment Term</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger className="border-2 text-left"><SelectValue placeholder="Select term..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {termOptions.map(term => <SelectItem key={term} value={term}>{term}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                </div>
            )}
            
            <div className="flex justify-between items-center pt-8 border-t text-left text-foreground">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 0} className="h-12 px-8 font-bold"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
              {currentStep < staticSteps.length - 1 ? (
                <Button type="button" onClick={processStep} className="h-12 px-10 font-bold text-left">Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="h-12 bg-primary hover:bg-primary/90 shadow-lg font-black uppercase tracking-tight text-left">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    Analyze & Match Application
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}

export default function ApplyPage() {
    return (
        <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-20 text-left bg-slate-50">
            <Suspense fallback={<Loader2 className="animate-spin h-12 w-12 text-primary" />}><ApplyForm /></Suspense>
        </div>
    )
}