'use client';

import React, { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, FormProvider, useFormContext, useFieldArray, UseFieldArrayReturn } from 'react-hook-form';
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
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, Landmark, ArrowLeft, ArrowRight, CheckCircle, ShieldCheck, 
    History, Package, Sparkles, Building, FileUp, Users, PlusCircle, 
    Trash2, UserCheck, Truck, FileText, Navigation, MapPin, Info, 
    ShieldAlert, Gavel, Zap, User, UserCircle, Scale, Banknote, 
    Smartphone, AlertCircle, Lock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser, getClientSideAuthToken, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { doc, serverTimestamp } from 'firebase/firestore';
import { supplierCategories } from '@/app/adminaccount/marketing/discovery-engine';
import { Label } from '@/components/ui/label';
import { VisionOnboardingDialog } from './VisionOnboardingDialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { provinces } from '@/lib/geodata';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- ZOD SCHEMA ---

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

const clientSchema = z.object({
  applyingCapacity: z.enum(['individual', 'entity']).default('entity'),
  entityType: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  registrationId: z.string().optional(),
  inceptionDate: z.string().optional(),
  vatRegistered: z.boolean().default(false),
  vatNumber: z.string().optional(),
  vatUpToDate: z.boolean().default(true),
  lastVatReturnDate: z.string().optional(),
  cipcLevyUpToDate: z.boolean().default(true),
  shareholderCount: z.coerce.number().min(0).default(0),
  directorCount: z.coerce.number().min(0).default(0),
  staffCount: z.coerce.number().min(0).default(0),
  signingAuthority: z.enum(['single', 'multiple']).default('single'),
  hasSigningResolution: z.boolean().default(false),
  shareholders: z.array(stakeholderSchema).optional().default([]),
  directors: z.array(stakeholderSchema).optional().default([]),
  staff: z.array(stakeholderSchema).optional().default([]),
  lastSignedAfsDate: z.string().optional(),
  lastManagementAccountsDate: z.string().optional(),
  annualTurnover: z.coerce.number().min(0).default(0),
  totalAssetValue: z.coerce.number().min(0).default(0),
  hasReturnedPayments: z.boolean().default(false),
  hasJudgements: z.boolean().default(false),
  hasLegalAction: z.boolean().default(false),
  isSelfEmployed: z.boolean().default(false),
  truckCount: z.coerce.number().min(0).default(0),
  trailerCount: z.coerce.number().min(0).default(0),
  yearsInIndustry: z.coerce.number().min(0).default(0),
  bookkeepingType: z.enum(['in_house', 'external']).default('external'),
  bookkeeperContact: z.object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
  }).optional(),
  ownsOperatingProperty: z.boolean().default(false),
  propertyDetails: z.object({
      address: z.string().optional(),
      marketValue: z.coerce.number().optional(),
      titleholder: z.string().optional(),
  }).optional(),
  propertyLiability: z.object({
      bondholder: z.string().optional(),
      outstandingBalance: z.coerce.number().optional(),
      term: z.coerce.number().optional(),
      rate: z.coerce.number().optional(),
      installment: z.coerce.number().optional(),
  }).optional(),
  landlordContact: z.object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
  }).optional(),
  leaseInfo: z.object({
      startDate: z.string().optional(),
      term: z.coerce.number().optional(),
      escalationRate: z.coerce.number().optional(),
      ratePerSqm: z.coerce.number().optional(),
      size: z.coerce.number().optional(),
  }).optional(),
  status: z.enum(['draft', 'active', 'inactive', 'suspended']).default('draft'),
  // --- FORENSIC DOCUMENT VAULT ---
  registrationDocUrl: z.string().optional(),
  vatCertificateUrl: z.string().optional(),
  signingResolutionUrl: z.string().optional(),
  afsDocUrl: z.string().optional(),
  bureauReportUrl: z.string().optional(),
  fleetInventoryUrl: z.string().optional(),
  mgmtAccountsUrl: z.string().optional(),
  propertyDeedUrl: z.string().optional(),
  leaseAgreementUrl: z.string().optional(),
});

const combinedSchema = clientSchema; // Simplifying for prototype

type ClientFormValues = z.infer<typeof combinedSchema>;

const staticSteps = [
  { id: 'capacity', title: 'Main', icon: User, fields: ['applyingCapacity', 'name', 'entityType', 'registrationId', 'inceptionDate', 'registrationDocUrl'] },
  { id: 'compliance', title: 'CIPC & VAT', icon: ShieldCheck, fields: ['vatRegistered', 'vatNumber', 'vatUpToDate', 'cipcLevyUpToDate', 'vatCertificateUrl'] },
  { id: 'governance', title: 'Governance', icon: Gavel, fields: ['shareholderCount', 'directorCount', 'staffCount', 'signingAuthority', 'hasSigningResolution', 'signingResolutionUrl'] },
  { id: 'nca', title: 'NCA Data', icon: Landmark, fields: ['annualTurnover', 'totalAssetValue', 'afsDocUrl'] },
  { id: 'credit', title: 'Forensic Risk', icon: ShieldAlert, fields: ['hasReturnedPayments', 'hasJudgements', 'hasLegalAction', 'bureauReportUrl'] },
  { id: 'background', title: 'Background', icon: Truck, fields: ['isSelfEmployed', 'yearsInIndustry', 'truckCount', 'trailerCount', 'fleetInventoryUrl'] },
  { id: 'finance_mgmt', title: 'Financial Management', icon: Banknote, fields: ['bookkeepingType', 'bookkeeperContact', 'mgmtAccountsUrl'] },
  { id: 'infrastructure', title: 'Standing', icon: Building, fields: ['ownsOperatingProperty', 'propertyDetails', 'propertyLiability', 'landlordContact', 'leaseInfo', 'propertyDeedUrl', 'leaseAgreementUrl'] },
  { id: 'review', title: 'Review', icon: CheckCircle, fields: [] },
];

// --- REUSABLE COMPONENTS ---

function FileUploadField({ name, label, folder, variant = 'standard' }: { name: any, label: string, folder: string, variant?: 'standard' | 'compact' }) {
    const { setValue, watch } = useFormContext<ClientFormValues>();
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
            toast({ title: `${label} Captured` });
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Upload Failed", description: err.message });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={cn("space-y-1.5 text-left", variant === 'compact' ? "flex items-center gap-2 space-y-0" : "flex flex-col")}>
            {variant === 'standard' && <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">{label}</Label>}
            <div className="flex items-center gap-2">
                <Button 
                    type="button" 
                    variant="outline" 
                    size={variant === 'compact' ? 'sm' : 'default'}
                    className={cn(
                        "h-10 gap-2 border-2 text-xs font-bold transition-all", 
                        currentUrl ? "border-green-500 bg-green-50 text-green-700" : "border-dashed hover:border-primary/50",
                        variant === 'compact' && "h-8 px-3"
                    )}
                    onClick={() => document.getElementById(`upload-${name}`)?.click()}
                    disabled={isUploading}
                >
                    {isUploading ? <Loader2 className="h-3 w-3 animate-spin"/> : currentUrl ? <CheckCircle className="h-4 w-4" /> : <FileUp className="h-4 w-4" />}
                    {currentUrl ? `Stored ${label}` : `Attach ${label}`}
                </Button>
                <input id={`upload-${name}`} type="file" className="hidden" onChange={handleUpload} />
                {currentUrl && (
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-primary">
                        <a href={currentUrl} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4" /></a>
                    </Button>
                )}
            </div>
            {isUploading && <Progress value={progress} className="h-1 mt-1" />}
        </div>
    );
}

const StepCapacity = () => {
    const { control, watch } = useFormContext<ClientFormValues>();
    const capacity = watch('applyingCapacity');
    const entityType = watch('entityType');

    return (
        <div className="space-y-8 text-left">
            <FormField control={control} name="applyingCapacity" render={({ field }) => (
                <FormItem className="space-y-3">
                    <FormLabel className="font-black uppercase text-[10px] tracking-widest text-primary">Applying Capacity</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-4">
                            <div className={cn("flex items-center space-x-3 p-4 border-2 rounded-2xl cursor-pointer transition-all", field.value === 'individual' ? "border-primary bg-primary/5" : "bg-white")}>
                                <RadioGroupItem value="individual" id="cap-ind" />
                                <Label htmlFor="cap-ind" className="cursor-pointer font-bold uppercase text-xs">Individual / Sole Prop</Label>
                            </div>
                            <div className={cn("flex items-center space-x-3 p-4 border-2 rounded-2xl cursor-pointer transition-all", field.value === 'entity' ? "border-primary bg-primary/5" : "bg-white")}>
                                <RadioGroupItem value="entity" id="cap-ent" />
                                <Label htmlFor="cap-ent" className="cursor-pointer font-bold uppercase text-xs">Legal Entity (Company/Trust)</Label>
                            </div>
                        </RadioGroup>
                    </FormControl>
                </FormItem>
            )} />
            
            <FormField control={control} name="name" render={({ field }) => (
                <FormItem className="text-left"><FormLabel>Full Legal Name</FormLabel><FormControl><Input {...field} className="h-12 border-2 bg-white font-black text-lg" /></FormControl><FormMessage /></FormItem>
            )} />

            {capacity === 'entity' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <FormField control={control} name="entityType" render={({ field }) => (
                        <FormItem className="text-left">
                            <FormLabel>Type of Entity</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl><SelectTrigger className="h-11 border-2 bg-white text-left font-bold"><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Pty Ltd">Private Company (Pty Ltd)</SelectItem>
                                    <SelectItem value="Ltd">Public Company (Ltd)</SelectItem>
                                    <SelectItem value="CC">Close Corporation (CC)</SelectItem>
                                    <SelectItem value="Trust">Trust</SelectItem>
                                    <SelectItem value="Partnership">Partnership</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />

                    {entityType && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-300 text-left">
                            <div className="space-y-4">
                                <FormField control={control} name="registrationId" render={({ field }) => (
                                    <FormItem className="text-left">
                                        <FormLabel>Registration Number</FormLabel>
                                        <FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 2024/123456/07" className="h-11 border-2 bg-white font-mono" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={control} name="inceptionDate" render={({ field }) => (
                                    <FormItem className="text-left">
                                        <FormLabel>Inception Date</FormLabel>
                                        <FormControl><Input {...field} value={field.value || ''} type="date" className="h-11 border-2 bg-white" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <div className="p-6 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20 flex flex-col justify-center">
                                <FileUploadField name="registrationDocUrl" label="Official CIPC / Registration Certificate" folder="forensic-main" />
                                <p className="text-[10px] text-muted-foreground mt-3 italic leading-tight">Must show current directors and active status.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const StepCompliance = () => {
    const { control, watch } = useFormContext<ClientFormValues>();
    const isVatRegistered = watch('vatRegistered');
    const isVatUpToDate = watch('vatUpToDate');

    return (
        <div className="space-y-10 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <FormField control={control} name="vatRegistered" render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-4 border-2 rounded-2xl bg-white text-left">
                            <FormLabel className="font-black uppercase text-xs">VAT Registered?</FormLabel>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                    {isVatRegistered && (
                        <FormField control={control} name="vatNumber" render={({ field }) => (
                            <FormItem className="text-left animate-in fade-in slide-in-from-left-2 duration-300"><FormLabel>VAT Number</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2 font-mono" /></FormControl></FormItem>
                        )} />
                    )}
                </div>
                {isVatRegistered && (
                    <div className="p-6 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20 flex flex-col justify-center animate-in zoom-in-95 duration-500">
                        <FileUploadField name="vatCertificateUrl" label="VAT Registration Certificate" folder="forensic-compliance" />
                    </div>
                )}
            </div>
            
            {isVatRegistered && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-500">
                    <FormField control={control} name="vatUpToDate" render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-4 border rounded-xl bg-white text-left">
                            <FormLabel className="text-sm font-medium">VAT Returns Up to Date?</FormLabel>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={control} name="cipcLevyUpToDate" render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-4 border rounded-xl bg-white text-left">
                            <FormLabel className="text-sm font-medium">CIPC Annual Levy Paid?</FormLabel>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                </div>
            )}

            {isVatRegistered && !isVatUpToDate && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-amber-50 p-6 rounded-2xl border border-amber-200">
                    <FormField control={control} name="lastVatReturnDate" render={({ field }) => (
                        <FormItem className="text-left max-w-sm">
                            <FormLabel className="text-amber-800 font-bold">Last VAT Return Date</FormLabel>
                            <FormControl><Input type="date" {...field} value={field.value || ''} className="h-11 border-2 border-amber-300 bg-white" /></FormControl>
                            <FormDescription className="text-left text-[10px] text-amber-600">Specify the date of the last successful filing for gap analysis.</FormDescription>
                        </FormItem>
                    )} />
                </div>
            )}
        </div>
    );
};

const StepGovernance = () => {
    const { control } = useFormContext<ClientFormValues>();
    return (
        <div className="space-y-10 text-left">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={control} name="shareholderCount" render={({ field }) => (
                  <FormItem className="text-left"><FormLabel>Shareholders</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 font-bold" /></FormControl></FormItem>
                )} />
                <FormField control={control} name="directorCount" render={({ field }) => (
                  <FormItem className="text-left"><FormLabel>Directors</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 font-bold" /></FormControl></FormItem>
                )} />
                <FormField control={control} name="staffCount" render={({ field }) => (
                  <FormItem className="text-left"><FormLabel>Key Staff</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 font-bold" /></FormControl></FormItem>
                )} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <FormField control={control} name="signingAuthority" render={({ field }) => (
                    <FormItem className="space-y-3 text-left">
                        <FormLabel className="font-black uppercase text-[10px] text-primary tracking-widest">Signing Authority</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-6">
                                <div className="flex items-center space-x-2 text-left"><RadioGroupItem value="single" id="auth-single" /><Label htmlFor="auth-single" className="cursor-pointer font-bold">Single Signature</Label></div>
                                <div className="flex items-center space-x-2 text-left"><RadioGroupItem value="multiple" id="auth-mult" /><Label htmlFor="auth-mult" className="cursor-pointer font-bold">Multiple Signatures</Label></div>
                            </RadioGroup>
                        </FormControl>
                    </FormItem>
                )} />

                <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl flex flex-col justify-center">
                    <FileUploadField name="signingResolutionUrl" label="Board Resolution / Signing Authority Doc" folder="forensic-governance" />
                </div>
            </div>

            <FormField control={control} name="hasSigningResolution" render={({ field }) => (
                <FormItem className="flex items-center justify-between p-6 border-2 rounded-3xl bg-slate-50 border-dashed text-left">
                    <div className="space-y-1 text-left">
                        <FormLabel className="font-black uppercase text-sm">Resolution Logic</FormLabel>
                        <FormDescription className="text-[10px]">Does the board have a signed resolution authorizing this specific facility application?</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-primary" /></FormControl>
                </FormItem>
            )} />
        </div>
    );
};

interface StepStakeholdersProps {
    type: 'shareholders' | 'directors' | 'staff';
    label: string;
    arrayProps: UseFieldArrayReturn<ClientFormValues, any, "id">;
    onToggleDirector?: (index: number, checked: boolean) => void;
}

const StepStakeholders = ({ type, label, arrayProps, onToggleDirector }: StepStakeholdersProps) => {
    const { control } = useFormContext<ClientFormValues>();
    const { fields } = arrayProps;

    return (
        <div className="space-y-8 text-left">
            <div className="flex items-center justify-between border-b pb-4">
                <h3 className="text-2xl font-black font-headline flex items-center gap-3 text-foreground text-left uppercase tracking-tight">
                    <Users className="h-8 w-8 text-primary" /> {label} Ledger
                </h3>
            </div>
            
            <div className="space-y-12 text-left">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-8 border-2 rounded-[2.5rem] bg-white space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><Users className="h-32 w-32" /></div>
                        
                        <div className="flex items-center justify-between border-b pb-6 text-left relative z-10">
                            <Badge className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest px-4 py-1.5 h-auto">
                                {label} NODE #{index + 1}
                            </Badge>
                            {type === 'shareholders' && (
                                <FormField 
                                    control={control} 
                                    name={`shareholders.${index}.isDirector` as any} 
                                    render={({ field: switchField }) => (
                                        <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-full border border-primary/20 text-left">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Cross-Map: Also a Director</Label>
                                            <Switch 
                                                checked={switchField.value} 
                                                onCheckedChange={(checked) => {
                                                    switchField.onChange(checked);
                                                    if (onToggleDirector) onToggleDirector(index, checked);
                                                }} 
                                                className="data-[state=checked]:bg-primary"
                                            />
                                        </div>
                                    )} 
                                />
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left relative z-10">
                            <div className="space-y-6">
                                <FormField control={control} name={`${type}.${index}.name` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>Full Legal Identity</FormLabel><FormControl><Input {...field} className="h-11 border-2 bg-white font-bold" /></FormControl></FormItem>)} />
                                <FormField control={control} name={`${type}.${index}.rsaIdNumber` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>RSA ID Number</FormLabel><FormControl><Input {...field} className="h-11 border-2 bg-white font-mono" /></FormControl></FormItem>)} />
                                <FormField control={control} name={`${type}.${index}.address` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>Residential Operational Address</FormLabel><FormControl><Textarea {...field} className="h-24 border-2 bg-white leading-relaxed" /></FormControl></FormItem>)} />
                            </div>
                            
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    <FormField control={control} name={`${type}.${index}.email` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>Primary Contact Email</FormLabel><FormControl><Input type="email" {...field} className="h-10 border-2 bg-white" /></FormControl></FormItem>)} />
                                    <FormField control={control} name={`${type}.${index}.phone` as any} render={({ field }) => (<FormItem className="text-left"><FormLabel>Direct Mobile Number</FormLabel><FormControl><Input {...field} className="h-10 border-2 bg-white" /></FormControl></FormItem>)} />
                                </div>
                                <div className="p-6 bg-slate-50 border-2 border-dashed rounded-3xl space-y-4">
                                    <FileUploadField name={`${type}.${index}.rsaIdUrl`} label="RSA ID Document" folder="stakeholder-ids" variant="compact" />
                                    <FileUploadField name={`${type}.${index}.proofAddressUrl`} label="Proof of Residence" folder="stakeholder-address" variant="compact" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StepBackground = () => {
    const { control } = useFormContext<ClientFormValues>();
    return (
        <div className="space-y-10 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <FormField control={control} name="isSelfEmployed" render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-6 border-2 rounded-3xl bg-white shadow-sm text-left">
                        <div className="space-y-0.5 text-left">
                            <FormLabel className="text-sm font-black uppercase">Employment standing</FormLabel>
                            <FormDescription className="text-xs">Is the principal self-employed?</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-primary" /></FormControl>
                    </FormItem>
                )} />
                <FormField control={control} name="yearsInIndustry" render={({ field }) => (
                    <FormItem className="text-left"><FormLabel>Years in Industry (Tenure)</FormLabel><FormControl><Input type="number" {...field} className="h-14 border-2 bg-white text-2xl font-black" /></FormControl></FormItem>
                )} />
            </div>

            <div className="p-8 border-2 border-dashed rounded-[3rem] bg-slate-50 space-y-8 text-left">
                <div className="flex items-center gap-3">
                    <Truck className="h-6 w-6 text-primary" />
                    <h4 className="text-lg font-black uppercase tracking-tight">Fleet Footprint declaration</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <FormField control={control} name="truckCount" render={({ field }) => (
                        <FormItem className="text-left"><FormLabel>Number of Verified Trucks (RC1)</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 bg-white font-bold" /></FormControl></FormItem>
                    )} />
                    <FormField control={control} name="trailerCount" render={({ field }) => (
                        <FormItem className="text-left"><FormLabel>Number of Verified Trailers</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 bg-white font-bold" /></FormControl></FormItem>
                    )} />
                </div>
                <Separator />
                <div className="flex justify-between items-center text-left">
                    <p className="text-xs text-muted-foreground italic max-w-sm">Upload the complete fleet registry / inventory list to cross-reference RC1 availability.</p>
                    <FileUploadField name="fleetInventoryUrl" label="Fleet Inventory List / RC1 Batch" folder="forensic-background" />
                </div>
            </div>
        </div>
    );
};

const StepFinancialManagement = () => {
    const { control, watch } = useFormContext<ClientFormValues>();

    return (
        <div className="space-y-12 text-left">
            <FormField control={control} name="bookkeepingType" render={({ field }) => (
                <FormItem className="space-y-6 text-left">
                    <FormLabel className="text-2xl font-black font-headline text-foreground uppercase tracking-tight">Oversight Structure</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-6 text-left">
                            <div className={cn("p-6 border-2 rounded-[2rem] cursor-pointer transition-all shadow-sm", field.value === 'in_house' ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-white hover:border-slate-300")}>
                                <div className="flex items-center space-x-3 text-left"><RadioGroupItem value="in_house" id="bk-in" /><Label htmlFor="bk-in" className="cursor-pointer font-black uppercase text-sm">In-House Team</Label></div>
                                <p className="text-[10px] text-muted-foreground mt-2 pl-7">Internal financial controllers manage the ledger.</p>
                            </div>
                            <div className={cn("p-6 border-2 rounded-[2rem] cursor-pointer transition-all shadow-sm", field.value === 'external' ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-white hover:border-slate-300")}>
                                <div className="flex items-center space-x-2 text-left"><RadioGroupItem value="external" id="bk-ex" /><Label htmlFor="bk-ex" className="cursor-pointer font-black uppercase text-sm">External Firm</Label></div>
                                <p className="text-[10px] text-muted-foreground mt-2 pl-7">Authorized external accountants manage reporting.</p>
                            </div>
                        </RadioGroup>
                    </FormControl>
                </FormItem>
            )} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                <div className="space-y-6 p-8 border-2 border-dashed rounded-[2.5rem] bg-slate-50 animate-in fade-in duration-500 text-left">
                    <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 text-left">
                        <UserCheck className="h-4 w-4" /> 
                        Financial Point of Contact
                    </h4>
                    <div className="space-y-4 text-left">
                        <FormField control={control} name="bookkeeperContact.name" render={({ field }) => (<FormItem className="text-left"><FormLabel>Full Name / Firm</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem>)} />
                        <FormField control={control} name="bookkeeperContact.email" render={({ field }) => (<FormItem className="text-left"><FormLabel>Direct E-mail</FormLabel><FormControl><Input type="email" {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem>)} />
                        <FormField control={control} name="bookkeeperContact.phone" render={({ field }) => (<FormItem className="text-left"><FormLabel>Direct Phone / Mobile</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem>)} />
                    </div>
                </div>

                <div className="flex flex-col justify-center gap-6 text-left">
                    <div className="p-6 bg-slate-900 text-white rounded-[2.5rem] shadow-xl space-y-4 text-left">
                        <div className="bg-primary/20 p-3 rounded-2xl w-fit"><FileText className="h-6 w-6 text-primary" /></div>
                        <h4 className="font-bold text-sm uppercase text-primary">Management Ledger Audit</h4>
                        <p className="text-xs text-slate-400 leading-relaxed text-left">Upload the latest management accounts (Year-to-date) for performance verification.</p>
                        <FileUploadField name="mgmtAccountsUrl" label="Management Accounts (YTD)" folder="forensic-finance" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const StepInfrastructure = () => {
    const { control, watch } = useFormContext<ClientFormValues>();
    const ownsProperty = watch('ownsOperatingProperty');

    return (
        <div className="space-y-12 text-left">
             <FormField control={control} name="ownsOperatingProperty" render={({ field }) => (
                <FormItem className="flex items-center justify-between p-8 border-2 rounded-[2.5rem] bg-white shadow-lg text-left">
                    <div className="space-y-1 text-left">
                        <FormLabel className="text-2xl font-black uppercase tracking-tight text-foreground">Infrastructure Standing</FormLabel>
                        <FormDescription className="text-base text-muted-foreground">Do you own the property where you operate from?</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="scale-125 data-[state=checked]:bg-primary" /></FormControl>
                </FormItem>
            )} />

            {ownsProperty ? (
                <div className="space-y-10 animate-in zoom-in-95 duration-500 text-left">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                        <div className="space-y-6 p-8 border-2 border-dashed rounded-3xl bg-primary/5 text-left">
                            <h4 className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2 text-left">
                                <MapPin className="h-4 w-4" /> Operating Property Details
                            </h4>
                            <div className="space-y-4 text-left">
                                <FormField control={control} name="propertyDetails.address" render={({ field }) => (<FormItem className="text-left"><FormLabel>Physical Site Address</FormLabel><FormControl><Textarea {...field} value={field.value || ''} className="bg-white border-2 h-20" /></FormControl></FormItem>)} />
                                <FormField control={control} name="propertyDetails.titleholder" render={({ field }) => (<FormItem className="text-left"><FormLabel>Registered Titleholder</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem>)} />
                                <FormField control={control} name="propertyDetails.marketValue" render={({ field }) => (<FormItem className="text-left"><FormLabel>Est. Market Value (R)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} className="bg-white border-2 font-bold" /></FormControl></FormItem>)} />
                                <Separator />
                                <FileUploadField name="propertyDeedUrl" label="Title Deed / Ownership Proof" folder="forensic-standing" />
                            </div>
                        </div>

                        <div className="space-y-8 p-8 border-2 border-dashed rounded-3xl bg-slate-900 text-white shadow-2xl text-left">
                            <h4 className="font-black uppercase text-[10px] tracking-[0.2em] text-primary flex items-center gap-2 text-left">
                                <Banknote className="h-4 w-4" /> Active Bond Ledger
                            </h4>
                            <div className="grid grid-cols-1 gap-6 text-left">
                                <FormField control={control} name="propertyLiability.bondholder" render={({ field }) => (<FormItem className="text-left"><FormLabel className="text-slate-400">Bondholder Institution</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white/5 border-white/10 text-white" /></FormControl></FormItem>)} />
                                <div className="grid grid-cols-2 gap-4 text-left">
                                    <FormField control={control} name="propertyLiability.outstandingBalance" render={({ field }) => (<FormItem className="text-left"><FormLabel className="text-slate-400">Outstanding (R)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} className="bg-white/5 border-white/10 text-white" /></FormControl></FormItem>)} />
                                    <FormField control={control} name="propertyLiability.installment" render={({ field }) => (<FormItem className="text-left"><FormLabel className="text-slate-400">Installment (R)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} className="bg-white/5 border-white/10 text-white" /></FormControl></FormItem>)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-left">
                                    <FormField control={control} name="propertyLiability.term" render={({ field }) => (<FormItem className="text-left"><FormLabel className="text-slate-400">Remaining Term</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} className="bg-white/5 border-white/10 text-white" /></FormControl></FormItem>)} />
                                    <FormField control={control} name="propertyLiability.rate" render={({ field }) => (<FormItem className="text-left text-foreground"><FormLabel className="text-slate-400">Rate (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value || ''} className="bg-white/5 border-white/10 text-white" /></FormControl></FormItem>)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-10 animate-in fade-in duration-500 text-left">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                        <div className="space-y-6 p-8 border-2 border-dashed rounded-3xl bg-slate-50 text-left">
                            <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-600 flex items-center gap-2 text-left text-foreground">
                                <UserCheck className="h-4 w-4" /> Landlord / Managing Agent
                            </h4>
                            <div className="space-y-4 text-left">
                                <FormField control={control} name="landlordContact.name" render={({ field }) => (<FormItem className="text-left"><FormLabel>Legal Entity Name</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem>)} />
                                <FormField control={control} name="landlordContact.email" render={({ field }) => (<FormItem className="text-left"><FormLabel>Direct E-mail</FormLabel><FormControl><Input type="email" {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem>)} />
                                <FormField control={control} name="landlordContact.phone" render={({ field }) => (<FormItem className="text-left"><FormLabel>Direct Phone</FormLabel><FormControl><Input {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem>)} />
                            </div>
                        </div>

                        <div className="space-y-6 p-8 border-2 border-dashed rounded-3xl bg-primary/5 text-left text-foreground">
                            <h4 className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2 text-left">
                                <FileText className="h-4 w-4" /> Active Lease parameters
                            </h4>
                            <div className="grid grid-cols-1 gap-4 text-left text-foreground">
                                <div className="grid grid-cols-2 gap-4 text-left">
                                    <FormField control={control} name="leaseInfo.startDate" render={({ field }) => (<FormItem className="text-left"><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem>)} />
                                    <FormField control={control} name="leaseInfo.term" render={({ field }) => (<FormItem className="text-left"><FormLabel>Term (Months)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem>)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-left">
                                    <FormField control={control} name="leaseInfo.size" render={({ field }) => (<FormItem className="text-left"><FormLabel>Size (sqm)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem>)} />
                                    <FormField control={control} name="leaseInfo.ratePerSqm" render={({ field }) => (<FormItem className="text-left"><FormLabel>Rate / sqm (R)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem>)} />
                                </div>
                                <FormField control={control} name="leaseInfo.escalationRate" render={({ field }) => (<FormItem className="text-left"><FormLabel>Annual Escalation (%)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} className="bg-white border-2" /></FormControl></FormItem>)} />
                                <Separator />
                                <FileUploadField name="leaseAgreementUrl" label="Signed Lease Agreement" folder="forensic-standing" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MASTER WIZARD ---

export function EditClientWizard({ client, onSave, onBack }: { client?: any, onSave: () => void, onBack: () => void }) {
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const firestore = useFirestore();

    const methods = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        mode: 'onChange',
        defaultValues: client || { applyingCapacity: 'entity', status: 'draft' }
    });

    const watchedValues = methods.watch();

    // Stakeholder Array Controllers
    const shareholdersArray = useFieldArray({ control: methods.control, name: 'shareholders' });
    const directorsArray = useFieldArray({ control: methods.control, name: 'directors' });
    const staffArray = useFieldArray({ control: methods.control, name: 'staff' });

    const handleShareholderToDirector = useCallback((shIndex: number, checked: boolean) => {
        if (!checked) return;
        
        const shData = methods.getValues(`shareholders.${shIndex}`);
        const currentDirectors = methods.getValues('directors') || [];
        const currentDirCount = Number(methods.getValues('directorCount')) || 0;

        const directorPayload = {
            name: shData.name || '',
            email: shData.email || '',
            phone: shData.phone || '',
            address: shData.address || '',
            rsaIdNumber: shData.rsaIdNumber || '',
            position: 'Director (Shareholder)',
            isDirector: true
        };

        const emptySlotIndex = currentDirectors.findIndex(d => !d.name || d.name.trim() === '');

        if (emptySlotIndex !== -1) {
            directorsArray.update(emptySlotIndex, directorPayload);
            toast({ title: "Forensic Slot Mapped", description: `${shData.name} synced to existing Director slot.` });
        } else {
            methods.setValue('directorCount', currentDirCount + 1);
            directorsArray.append(directorPayload);
            toast({ title: "Director Registry Expanded", description: `${shData.name} appended as a new Director.` });
        }
    }, [methods, directorsArray, toast]);

    const memoizedSteps = useMemo(() => {
        const base = [
            { id: 'capacity', title: 'Main', icon: User, fields: ['applyingCapacity', 'name', 'entityType', 'registrationId', 'inceptionDate', 'registrationDocUrl'] },
        ];

        if (watchedValues.applyingCapacity === 'entity') {
            base.push({ id: 'compliance', title: 'CIPC & VAT', icon: ShieldCheck, fields: ['vatRegistered', 'vatNumber', 'vatUpToDate', 'cipcLevyUpToDate', 'lastVatReturnDate', 'vatCertificateUrl'] });
            base.push({ id: 'governance', title: 'Governance', icon: Gavel, fields: ['shareholderCount', 'directorCount', 'staffCount', 'signingAuthority', 'hasSigningResolution', 'signingResolutionUrl'] });
            
            if (Number(watchedValues.shareholderCount) > 0) {
                base.push({ id: 'shareholders', title: 'Shareholders', icon: Users, fields: ['shareholders'] });
            }
            if (Number(watchedValues.directorCount) > 0) {
                base.push({ id: 'directors', title: 'Directors', icon: UserCircle, fields: ['directors'] });
            }
            if (Number(watchedValues.staffCount) > 0) {
                base.push({ id: 'staff_list', title: 'Staff', icon: Users, fields: ['staff'] });
            }
        }

        base.push({ id: 'nca', title: 'NCA Data', icon: Landmark, fields: ['annualTurnover', 'totalAssetValue', 'afsDocUrl'] });
        base.push({ id: 'credit', title: 'Forensic Risk', icon: ShieldAlert, fields: ['hasReturnedPayments', 'hasJudgements', 'hasLegalAction', 'bureauReportUrl'] });
        base.push({ id: 'background', title: 'Background', icon: Truck, fields: ['isSelfEmployed', 'yearsInIndustry', 'truckCount', 'trailerCount', 'fleetInventoryUrl'] });
        base.push({ id: 'finance_mgmt', title: 'Financial Management', icon: Banknote, fields: ['bookkeepingType', 'bookkeeperContact', 'mgmtAccountsUrl'] });
        base.push({ id: 'infrastructure', title: 'Standing', icon: Building, fields: ['ownsOperatingProperty', 'propertyDetails', 'propertyLiability', 'landlordContact', 'leaseInfo', 'propertyDeedUrl', 'leaseAgreementUrl'] });
        base.push({ id: 'review', title: 'Review', icon: CheckCircle, fields: [] });

        return base;
    }, [watchedValues.applyingCapacity, watchedValues.shareholderCount, watchedValues.directorCount, watchedValues.staffCount]);

    const handleStepTransition = async (direction: 'next' | 'back' | number) => {
        if (direction === 'next') {
            const isValid = await methods.trigger(memoizedSteps[currentStep].fields as any);
            if (!isValid) {
                toast({ variant: 'destructive', title: "Validation Error", description: "Complete all required fields in this section." });
                return;
            }
        }

        const values = methods.getValues();
        const token = await getClientSideAuthToken();
        if (token && client?.id) {
            fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    path: `lendingClients/${client.id}`, 
                    data: { ...values, updatedAt: { _methodName: 'serverTimestamp' } } 
                })
            }).catch(e => console.warn("Background autosave failure:", e));
        }

        if (typeof direction === 'number') {
            setCurrentStep(direction);
        } else if (direction === 'next') {
            setCurrentStep(prev => Math.min(prev + 1, memoizedSteps.length - 1));
        } else {
            setCurrentStep(prev => Math.max(prev - 1, 0));
        }
    };

    const handleAiExtraction = (data: any) => {
        if (data.registrationId) methods.setValue('registrationId', data.registrationId);
        if (data.name) methods.setValue('name', data.name);
        toast({ title: "Forensic Data Mapped", description: "AI extraction results committed to form." });
    };

    const onSubmit = async (values: ClientFormValues) => {
        setIsSubmitting(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");
            await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'saveLendingClient', payload: { client: { id: client?.id, ...values } } })
            });
            toast({ title: "Forensic Record Commited" });
            onSave();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Save Error", description: e.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const syncArray = (arr: any[], count: number, appendFn: any, removeFn: any) => {
            const numCount = Number(count) || 0;
            if (arr.length < numCount) {
                for (let i = arr.length; i < numCount; i++) appendFn({ name: '', email: '', position: '' });
            } else if (arr.length > numCount) {
                for (let i = arr.length - 1; i >= numCount; i--) removeFn(i);
            }
        };
        syncArray(shareholdersArray.fields, watchedValues.shareholderCount, shareholdersArray.append, shareholdersArray.remove);
        syncArray(directorsArray.fields, watchedValues.directorCount, directorsArray.append, directorsArray.remove);
        syncArray(staffArray.fields, watchedValues.staffCount, staffArray.append, staffArray.remove);
    }, [watchedValues.shareholderCount, watchedValues.directorCount, watchedValues.staffCount]);

    const currentStepConfig = memoizedSteps[currentStep];

    return (
        <Card className="max-w-6xl mx-auto shadow-2xl border-none overflow-hidden text-left text-foreground">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader className="bg-slate-900 text-white p-8 text-left text-foreground">
                        <div className="flex justify-between items-center text-left text-white">
                            <div className="text-left text-white">
                                <CardTitle className="text-2xl font-black font-headline uppercase tracking-tight text-white text-left text-foreground">Forensic Interview terminal</CardTitle>
                                <CardDescription className="text-slate-400 text-left">Step: {currentStepConfig.title}</CardDescription>
                            </div>
                            <Button type="button" variant="ghost" className="text-white hover:text-primary" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back to registry</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] text-left">
                            <div className="bg-slate-50 border-r p-6 space-y-2 text-left">
                                {memoizedSteps.map((step, i) => (
                                    <Button
                                        key={step.id}
                                        type="button"
                                        variant={currentStep === i ? "secondary" : "ghost"}
                                        className={cn("w-full justify-start gap-3 h-10 px-3 transition-all text-left", currentStep === i && "bg-white shadow-sm ring-1 ring-primary/20")}
                                        onClick={() => handleStepTransition(i)}
                                    >
                                        {React.createElement(step.icon, { className: cn("h-4 w-4", currentStep >= i ? "text-primary" : "text-muted-foreground") })}
                                        <span className={cn("text-[11px] font-black uppercase tracking-widest text-left", currentStep === i ? "text-primary" : "text-muted-foreground")}>{step.title}</span>
                                    </Button>
                                ))}
                            </div>
                            <div className="p-10 space-y-12 bg-white min-h-[500px] text-left">
                                {['capacity', 'compliance', 'governance', 'nca', 'credit', 'background', 'infrastructure'].includes(currentStepConfig.id) && (
                                    <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 text-left">
                                        <div className="flex items-start gap-4 text-left">
                                            <div className="bg-primary/10 p-3 rounded-2xl shrink-0"><Zap className="h-6 w-6 text-primary" /></div>
                                            <div className="text-left">
                                                <h4 className="text-sm font-black uppercase text-primary">Forensic Verification Gateway</h4>
                                                <p className="text-[10px] text-muted-foreground leading-relaxed max-w-sm text-left">Heal data gaps via automated Vision AI extraction from documentation.</p>
                                            </div>
                                        </div>
                                        <VisionOnboardingDialog 
                                            onExtractionComplete={handleAiExtraction}
                                            trigger={<Button className="h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl text-white">Execute AI Scan</Button>}
                                        />
                                    </div>
                                )}

                                {currentStepConfig.id === 'capacity' && <StepCapacity />}
                                {currentStepConfig.id === 'compliance' && <StepCompliance />}
                                {currentStepConfig.id === 'governance' && <StepGovernance />}
                                {currentStepConfig.id === 'shareholders' && <StepStakeholders type="shareholders" label="Shareholder" arrayProps={shareholdersArray} onToggleDirector={handleShareholderToDirector} />}
                                {currentStepConfig.id === 'directors' && <StepStakeholders type="directors" label="Director" arrayProps={directorsArray} />}
                                {currentStepConfig.id === 'staff_list' && <StepStakeholders type="staff" label="Staff" arrayProps={staffArray} />}
                                
                                {currentStepConfig.id === 'nca' && (
                                    <div className="space-y-8 text-left text-foreground">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-foreground">
                                            <div className="space-y-6">
                                                <FormField control={methods.control} name="annualTurnover" render={({ field }) => (
                                                    <FormItem className="text-left"><FormLabel>Annual Turnover (L12M)</FormLabel><FormControl><Input type="number" {...field} className="h-12 border-2 text-lg font-bold" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={methods.control} name="totalAssetValue" render={({ field }) => (
                                                    <FormItem className="text-left"><FormLabel>Total Entity Asset Value</FormLabel><FormControl><Input type="number" {...field} className="h-12 border-2 text-lg font-bold" /></FormControl></FormItem>
                                                )} />
                                            </div>
                                            <div className="p-8 bg-slate-900 text-white rounded-[2rem] shadow-xl flex flex-col justify-center gap-4">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><FileText className="h-4 w-4" /> Financial Verification</h4>
                                                <p className="text-xs text-slate-400 leading-relaxed">Evidence is mandatory for NCA applicability assessment.</p>
                                                <FileUploadField name="afsDocUrl" label="Latest Audited Financials (AFS)" folder="forensic-nca" />
                                            </div>
                                        </div>
                                        <Alert className="bg-muted/50 border-none text-left">
                                            <Info className="h-4 w-4" />
                                            <AlertDescription className="text-xs italic text-left">This data is critical for determining the applicability of the National Credit Act (NCA) to this specific transaction.</AlertDescription>
                                        </Alert>
                                    </div>
                                )}

                                {currentStepConfig.id === 'credit' && (
                                    <div className="space-y-8 text-left text-foreground">
                                        <div className="p-6 bg-destructive/5 border-2 border-destructive/10 rounded-3xl space-y-4 text-left">
                                            <div className="flex items-center gap-2 text-destructive font-black uppercase text-xs text-left">
                                                <ShieldAlert className="h-5 w-5 text-primary" /> Hard Risk Disclosure
                                            </div>
                                            <FormField control={methods.control} name="hasReturnedPayments" render={({ field }) => (
                                                <FormItem className="flex items-center justify-between p-3 bg-white rounded-xl border text-left text-foreground">
                                                    <FormLabel className="text-sm font-medium text-left">Any returned payments (12 Months)?</FormLabel>
                                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                                            )} />
                                            <FormField control={methods.control} name="hasJudgements" render={({ field }) => (
                                                <FormItem className="flex items-center justify-between p-3 bg-white rounded-xl border text-left text-foreground">
                                                    <FormLabel className="text-sm font-medium text-left">Any active judgements?</FormLabel>
                                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                                            )} />
                                            <FormField control={methods.control} name="hasLegalAction" render={({ field }) => (
                                                <FormItem className="flex items-center justify-between p-3 bg-white rounded-xl border text-left text-foreground">
                                                    <FormLabel className="text-sm font-medium text-left">Any legal action pending?</FormLabel>
                                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                                            )} />
                                        </div>
                                        <div className="p-8 bg-slate-50 border-2 border-dashed rounded-3xl flex justify-between items-center">
                                            <div className="text-left max-w-sm">
                                                <h4 className="font-bold text-sm">Credit Bureau Attachment</h4>
                                                <p className="text-xs text-muted-foreground mt-1 leading-tight">Attach settlement letters or credit bureau reports to reconcile risk declarations.</p>
                                            </div>
                                            <FileUploadField name="bureauReportUrl" label="Bureau Report / Settlement Letter" folder="forensic-risk" />
                                        </div>
                                    </div>
                                )}

                                {currentStepConfig.id === 'background' && <StepBackground />}
                                {currentStepConfig.id === 'finance_mgmt' && <StepFinancialManagement />}
                                {currentStepConfig.id === 'infrastructure' && <StepInfrastructure />}
                                
                                {currentStepConfig.id === 'review' && (
                                    <div className="text-center py-20 space-y-6 text-left">
                                        <CheckCircle className="h-16 w-16 text-primary mx-auto opacity-40" />
                                        <div className="space-y-2 text-center">
                                            <h3 className="text-2xl font-black uppercase text-center">Audit Finalization</h3>
                                            <p className="text-sm text-muted-foreground max-sm mx-auto text-center">Please verify the integrity of the interview responses and ensure all mandatory forensic documents are attached before committing the record.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t p-8 flex justify-between text-left">
                        <Button type="button" variant="outline" onClick={() => handleStepTransition('back')} disabled={currentStep === 0} className="font-bold">Back</Button>
                        {currentStep < memoizedSteps.length - 1 ? (
                            <Button type="button" onClick={() => handleStepTransition('next')} className="px-10 font-black uppercase text-xs tracking-widest text-white shadow-lg">Next Section <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        ) : (
                            <Button type="submit" disabled={isSubmitting} className="h-14 px-12 font-black uppercase tracking-tight text-lg shadow-2xl text-white">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Commit Audit Record
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
