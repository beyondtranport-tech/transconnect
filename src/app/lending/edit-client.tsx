'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, Landmark, ArrowLeft, ArrowRight, CheckCircle, ShieldCheck, 
    History, Package, Sparkles, Building, FileUp, Users, PlusCircle, 
    Trash2, UserCheck, Truck, FileText, Navigation, MapPin, Info, 
    ShieldAlert, Gavel, Zap, User, UserCircle, Scale, Banknote
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useUser, getClientSideAuthToken, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import { VisionOnboardingDialog } from './VisionOnboardingDialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { provinces } from '@/lib/geodata';

// --- ZOD SCHEMA (ENHANCED FOR FORENSIC INTERVIEW) ---

const contactInfoSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
});

const clientSchema = z.object({
  // Section 1: Capacity
  applyingCapacity: z.enum(['individual', 'entity']).default('entity'),
  entityType: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  registrationId: z.string().optional(),
  
  // Section 2: CIPC & VAT
  vatRegistered: z.boolean().default(false),
  vatNumber: z.string().optional(),
  vatUpToDate: z.boolean().default(true),
  cipcLevyUpToDate: z.boolean().default(true),
  
  // Section 3: Governance
  shareholderCount: z.coerce.number().min(0).default(0),
  directorCount: z.coerce.number().min(0).default(0),
  signingAuthority: z.enum(['single', 'multiple']).default('single'),
  hasSigningResolution: z.boolean().default(false),
  
  // Section 4: Financial Dates
  lastSignedAfsDate: z.string().optional(),
  lastManagementAccountsDate: z.string().optional(),

  // Section 5: NCA Compliance
  annualTurnover: z.coerce.number().min(0).default(0),
  totalAssetValue: z.coerce.number().min(0).default(0),

  // Section 6: Credit Forensic
  hasReturnedPayments: z.boolean().default(false),
  hasJudgements: z.boolean().default(false),
  hasLegalAction: z.boolean().default(false),
  
  // Section 7: Background & Fleet
  isSelfEmployed: z.boolean().default(false),
  truckCount: z.coerce.number().min(0).default(0),
  trailerCount: z.coerce.number().min(0).default(0),
  yearsInIndustry: z.coerce.number().min(0).default(0),

  // Section 8: Financial Management (Dynamic)
  bookkeepingType: z.enum(['in_house', 'external']).default('external'),
  hasInHouseBookkeeper: z.boolean().default(false),
  bookkeeperContact: contactInfoSchema.optional(),

  // Section 9: Infrastructure (Dynamic)
  ownsOperatingProperty: z.boolean().default(false),
  propertyDetails: z.object({
      address: z.string().optional(),
      marketValue: z.coerce.number().optional(),
  }).optional(),
  propertyLiability: z.object({
      bondholder: z.string().optional(),
      outstandingBalance: z.coerce.number().optional(),
  }).optional(),

  status: z.enum(['draft', 'active', 'inactive', 'suspended']).default('draft'),
});

type ClientFormValues = z.infer<typeof clientSchema>;

// --- STEP COMPONENTS ---

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

const StepCapacity = () => {
    const { control } = useFormContext<ClientFormValues>();
    return (
        <div className="space-y-6 text-left">
            <FormField control={control} name="applyingCapacity" render={({ field }) => (
                <FormItem className="space-y-3">
                    <FormLabel className="font-black uppercase text-[10px] tracking-widest text-primary">Applying Capacity</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-4">
                            <div className={cn("flex items-center space-x-3 p-4 border-2 rounded-2xl cursor-pointer transition-all", field.value === 'individual' ? "border-primary bg-primary/5" : "bg-white")}>
                                <RadioGroupItem value="individual" id="cap-ind" />
                                <Label htmlFor="cap-ind" className="cursor-pointer font-bold">Individual / Sole Prop</Label>
                            </div>
                            <div className={cn("flex items-center space-x-3 p-4 border-2 rounded-2xl cursor-pointer transition-all", field.value === 'entity' ? "border-primary bg-primary/5" : "bg-white")}>
                                <RadioGroupItem value="entity" id="cap-ent" />
                                <Label htmlFor="cap-ent" className="cursor-pointer font-bold">Legal Entity (Company/Trust)</Label>
                            </div>
                        </RadioGroup>
                    </FormControl>
                </FormItem>
            )} />
            
            <FormField control={control} name="name" render={({ field }) => (
                <FormItem className="text-left"><FormLabel>Full Legal Name</FormLabel><FormControl><Input {...field} className="h-11 border-2 bg-white font-bold" /></FormControl><FormMessage /></FormItem>
            )} />

            {control._formValues.applyingCapacity === 'entity' && (
                <FormField control={control} name="entityType" render={({ field }) => (
                    <FormItem className="text-left">
                        <FormLabel>Type of Entity</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl><SelectTrigger className="h-11 border-2 bg-white text-left"><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
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
            )}
        </div>
    );
};

const StepCompliance = () => {
    const { control, watch } = useFormContext<ClientFormValues>();
    const isVatRegistered = watch('vatRegistered');

    return (
        <div className="space-y-6 text-left">
            <div className="grid grid-cols-2 gap-8 text-left">
                <FormField control={control} name="vatRegistered" render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 border-2 rounded-2xl bg-white">
                        <FormLabel className="font-bold">VAT Registered?</FormLabel>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )} />
                {isVatRegistered && (
                    <FormField control={control} name="vatNumber" render={({ field }) => (
                        <FormItem className="text-left"><FormLabel>VAT Number</FormLabel><FormControl><Input {...field} value={field.value || ''} className="h-11 border-2" /></FormControl></FormItem>
                    )} />
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={control} name="vatUpToDate" render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 border rounded-xl bg-white">
                        <FormLabel className="text-sm font-medium">VAT Returns Up to Date?</FormLabel>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )} />
                <FormField control={control} name="cipcLevyUpToDate" render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 border rounded-xl bg-white">
                        <FormLabel className="text-sm font-medium">CIPC Annual Levy Paid?</FormLabel>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )} />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="lastSignedAfsDate" render={({ field }) => (
                    <FormItem className="text-left"><FormLabel>Last Signed AFS Date</FormLabel><FormControl><Input type="date" {...field} className="h-11 border-2" /></FormControl></FormItem>
                )} />
                <FormField control={control} name="lastManagementAccountsDate" render={({ field }) => (
                    <FormItem className="text-left"><FormLabel>Last Management Accounts Date</FormLabel><FormControl><Input type="date" {...field} className="h-11 border-2" /></FormControl></FormItem>
                )} />
            </div>
        </div>
    );
};

const StepGovernance = () => {
    const { control } = useFormContext<ClientFormValues>();
    return (
        <div className="space-y-6 text-left">
            <div className="grid grid-cols-2 gap-4">
                <FormField control={control} name="shareholderCount" render={({ field }) => (<FormItem><FormLabel>Number of Shareholders</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2" /></FormControl></FormItem>)} />
                <FormField control={control} name="directorCount" render={({ field }) => (<FormItem><FormLabel>Number of Directors</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2" /></FormControl></FormItem>)} />
            </div>
            
            <FormField control={control} name="signingAuthority" render={({ field }) => (
                <FormItem className="space-y-3">
                    <FormLabel>Signing Authority</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-6">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="single" id="auth-single" /><Label htmlFor="auth-single">Single Director</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="multiple" id="auth-mult" /><Label htmlFor="auth-mult">Multiple Directors</Label></div>
                        </RadioGroup>
                    </FormControl>
                </FormItem>
            )} />

            <FormField control={control} name="hasSigningResolution" render={({ field }) => (
                <FormItem className="flex items-center justify-between p-4 border-2 rounded-2xl bg-slate-50 border-dashed">
                    <div className="space-y-0.5">
                        <FormLabel className="font-bold">Signing Resolution on File?</FormLabel>
                        <FormDescription className="text-[10px]">Does the board have a signed resolution authorizing this application?</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
            )} />
        </div>
    );
};

const StepCreditForensic = () => {
    const { control } = useFormContext<ClientFormValues>();
    return (
        <div className="space-y-6 text-left">
            <div className="p-6 bg-destructive/5 border-2 border-destructive/10 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 text-destructive font-black uppercase text-xs">
                    <ShieldAlert className="h-5 w-5" /> Hard Risk Disclosure
                </div>
                
                <FormField control={control} name="hasReturnedPayments" render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3 bg-white rounded-xl border">
                        <FormLabel className="text-sm">Any returned payments (12 Months)?</FormLabel>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )} />

                <FormField control={control} name="hasJudgements" render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3 bg-white rounded-xl border">
                        <FormLabel className="text-sm">Any active judgements?</FormLabel>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )} />

                <FormField control={control} name="hasLegalAction" render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3 bg-white rounded-xl border">
                        <FormLabel className="text-sm">Any legal action pending/past 12mo?</FormLabel>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )} />
            </div>
        </div>
    );
};

const StepBackground = () => {
    const { control } = useFormContext<ClientFormValues>();
    return (
        <div className="space-y-6 text-left">
            <div className="grid grid-cols-2 gap-6 text-left">
                <FormField control={control} name="isSelfEmployed" render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 border rounded-2xl bg-white text-left">
                        <FormLabel className="font-bold">Self Employed?</FormLabel>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )} />
                <FormField control={control} name="yearsInIndustry" render={({ field }) => (
                    <FormItem><FormLabel>Years in Industry</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2" /></FormControl></FormItem>
                )} />
            </div>

            <div className="grid grid-cols-2 gap-6 text-left">
                <FormField control={control} name="truckCount" render={({ field }) => (
                    <FormItem className="text-left"><FormLabel>Number of Trucks Owned</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 bg-white" /></FormControl></FormItem>
                )} />
                <FormField control={control} name="trailerCount" render={({ field }) => (
                    <FormItem className="text-left"><FormLabel>Number of Trailers Owned</FormLabel><FormControl><Input type="number" {...field} className="h-11 border-2 bg-white" /></FormControl></FormItem>
                )} />
            </div>
        </div>
    );
};

const StepFinancialManagement = () => {
    const { control, watch } = useFormContext<ClientFormValues>();
    const bType = watch('bookkeepingType');
    const hasInHouse = watch('hasInHouseBookkeeper');

    return (
        <div className="space-y-8 text-left">
            <FormField control={control} name="bookkeepingType" render={({ field }) => (
                <FormItem className="space-y-4 text-left">
                    <FormLabel className="font-bold text-lg">How is your bookkeeping managed?</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-4">
                            <div className={cn("p-4 border-2 rounded-2xl cursor-pointer", field.value === 'in_house' ? "border-primary bg-primary/5" : "bg-white")}>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="in_house" id="bk-in" /><Label htmlFor="bk-in" className="cursor-pointer font-bold">In-House Team</Label></div>
                            </div>
                            <div className={cn("p-4 border-2 rounded-2xl cursor-pointer", field.value === 'external' ? "border-primary bg-primary/5" : "bg-white")}>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="external" id="bk-ex" /><Label htmlFor="bk-ex" className="cursor-pointer font-bold">External Firm</Label></div>
                            </div>
                        </RadioGroup>
                    </FormControl>
                </FormItem>
            )} />

            {bType === 'in_house' && (
                <div className="space-y-4 p-6 border rounded-2xl bg-white animate-in slide-in-from-top-2 text-left">
                    <FormField control={control} name="hasInHouseBookkeeper" render={({ field }) => (
                        <FormItem className="flex items-center justify-between mb-4">
                            <FormLabel className="font-bold">Do you have a dedicated bookkeeper?</FormLabel>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                </div>
            )}

            {(bType === 'external' || (bType === 'in_house' && hasInHouse)) && (
                <div className="space-y-4 p-6 border-2 border-dashed rounded-2xl bg-slate-50 animate-in fade-in duration-500 text-left">
                    <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Users className="h-4 w-4" /> 
                        {bType === 'external' ? 'External Accountant Details' : 'Bookkeeper Details'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <FormField control={control} name="bookkeeperContact.name" render={({ field }) => (<FormItem><FormLabel>Full Name / Firm</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl></FormItem>)} />
                        <FormField control={control} name="bookkeeperContact.email" render={({ field }) => (<FormItem><FormLabel>Direct E-mail</FormLabel><FormControl><Input type="email" {...field} className="bg-white" /></FormControl></FormItem>)} />
                        <FormField control={control} name="bookkeeperContact.phone" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Direct Phone / Mobile</FormLabel><FormControl><Input {...field} className="bg-white" /></FormControl></FormItem>)} />
                    </div>
                </div>
            )}
        </div>
    );
};

const StepInfrastructure = () => {
    const { control, watch } = useFormContext<ClientFormValues>();
    const ownsProperty = watch('ownsOperatingProperty');

    return (
        <div className="space-y-8 text-left">
             <FormField control={control} name="ownsOperatingProperty" render={({ field }) => (
                <FormItem className="flex items-center justify-between p-6 border-2 rounded-3xl bg-white shadow-sm">
                    <div className="space-y-1">
                        <FormLabel className="text-lg font-black uppercase tracking-tight text-left">Property Ownership</FormLabel>
                        <FormDescription>Do you own the property where you operate from?</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-primary" /></FormControl>
                </FormItem>
            )} />

            {ownsProperty ? (
                <div className="space-y-6 p-8 border-2 border-dashed rounded-3xl bg-primary/5 animate-in zoom-in-95 duration-500 text-left">
                    <h4 className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Operating Property Details
                    </h4>
                    <FormField control={control} name="propertyDetails.address" render={({ field }) => (<FormItem><FormLabel>Physical Site Address</FormLabel><FormControl><Textarea {...field} className="bg-white border-2" /></FormControl></FormItem>)} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        <FormField control={control} name="propertyDetails.marketValue" render={({ field }) => (<FormItem><FormLabel>Estimated Market Value (R)</FormLabel><FormControl><Input type="number" {...field} className="bg-white border-2" /></FormControl></FormItem>)} />
                        <FormField control={control} name="propertyLiability.outstandingBalance" render={({ field }) => (<FormItem><FormLabel>Outstanding Bond (R)</FormLabel><FormControl><Input type="number" {...field} className="bg-white border-2" /></FormControl></FormItem>)} />
                    </div>
                    <FormField control={control} name="propertyLiability.bondholder" render={({ field }) => (<FormItem><FormLabel>Bondholder Institution</FormLabel><FormControl><Input {...field} className="bg-white border-2" /></FormControl></FormItem>)} />
                </div>
            ) : (
                <div className="space-y-6 p-8 border-2 border-dashed rounded-3xl bg-slate-50 animate-in fade-in duration-500 text-left">
                    <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-600 flex items-center gap-2">
                        <Landmark className="h-4 w-4" /> Landlord / Lease Info
                    </h4>
                    <FormField control={control} name="propertyLiability.bondholder" render={({ field }) => (<FormItem><FormLabel>Landlord / Managing Agent Name</FormLabel><FormControl><Input {...field} className="bg-white border-2" /></FormControl></FormItem>)} />
                    <p className="text-xs text-muted-foreground italic">If the property is rented, the landlord details are required for forensic standing verification.</p>
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

    const methods = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        mode: 'onChange',
        defaultValues: client || { applyingCapacity: 'entity', status: 'draft' }
    });

    const watchedValues = methods.watch();

    const memoizedSteps = useMemo(() => {
        const base = [
            { id: 'capacity', title: 'Capacity', icon: User, fields: ['applyingCapacity', 'name', 'entityType', 'registrationId'] },
        ];

        if (watchedValues.applyingCapacity === 'entity') {
            base.push({ id: 'compliance', title: 'CIPC & VAT', icon: ShieldCheck, fields: ['vatRegistered', 'vatNumber', 'vatUpToDate', 'cipcLevyUpToDate', 'lastSignedAfsDate', 'lastManagementAccountsDate'] });
            base.push({ id: 'governance', title: 'Governance', icon: Gavel, fields: ['shareholderCount', 'directorCount', 'signingAuthority', 'hasSigningResolution'] });
        }

        base.push({ id: 'nca', title: 'NCA Data', icon: Landmark, fields: ['annualTurnover', 'totalAssetValue'] });
        base.push({ id: 'credit', title: 'Forensic Risk', icon: ShieldAlert, fields: ['hasReturnedPayments', 'hasJudgements', 'hasLegalAction'] });
        base.push({ id: 'background', title: 'Footprint', icon: Truck, fields: ['isSelfEmployed', 'yearsInIndustry', 'truckCount', 'trailerCount'] });
        base.push({ id: 'finance_mgmt', title: 'Financial Management', icon: Banknote, fields: ['bookkeepingType', 'hasInHouseBookkeeper', 'bookkeeperContact'] });
        base.push({ id: 'infrastructure', title: 'Standing', icon: Building, fields: ['ownsOperatingProperty', 'propertyDetails', 'propertyLiability'] });
        base.push({ id: 'review', title: 'Review', icon: CheckCircle, fields: [] });

        return base;
    }, [watchedValues.applyingCapacity]);

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

    const currentStepConfig = memoizedSteps[currentStep];

    return (
        <Card className="max-w-6xl mx-auto shadow-2xl border-none overflow-hidden text-left">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <CardHeader className="bg-slate-900 text-white p-8">
                        <div className="flex justify-between items-center text-left">
                            <div className="text-left text-white">
                                <CardTitle className="text-2xl font-black font-headline uppercase tracking-tight text-white text-left">Forensic Interview terminal</CardTitle>
                                <CardDescription className="text-slate-400 text-left">Step: {currentStepConfig.title}</CardDescription>
                            </div>
                            <Button type="button" variant="ghost" className="text-white hover:text-primary" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back to registry</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
                            <div className="bg-slate-50 border-r p-6 space-y-2 text-left">
                                {memoizedSteps.map((step, i) => (
                                    <Button
                                        key={step.id}
                                        type="button"
                                        variant={currentStep === i ? "secondary" : "ghost"}
                                        className={cn("w-full justify-start gap-3 h-10 px-3 transition-all text-left", currentStep === i && "bg-white shadow-sm ring-1 ring-primary/20")}
                                        onClick={() => setCurrentStep(i)}
                                    >
                                        {React.createElement(step.icon, { className: cn("h-4 w-4", currentStep >= i ? "text-primary" : "text-muted-foreground") })}
                                        <span className={cn("text-[11px] font-black uppercase tracking-widest", currentStep === i ? "text-primary" : "text-muted-foreground")}>{step.title}</span>
                                    </Button>
                                ))}
                            </div>
                            <div className="p-10 space-y-8 bg-white min-h-[500px] text-left">
                                {currentStepConfig.id !== 'review' && (
                                    <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 text-left">
                                        <div className="flex items-start gap-4 text-left">
                                            <div className="bg-primary/10 p-3 rounded-2xl shrink-0"><Zap className="h-6 w-6 text-primary" /></div>
                                            <div className="text-left">
                                                <h4 className="text-sm font-black uppercase text-primary">Forensic Verification Gateway</h4>
                                                <p className="text-[10px] text-muted-foreground leading-relaxed max-w-sm">Heal data gaps via automated Vision AI extraction.</p>
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
                                {currentStepConfig.id === 'credit' && <StepCreditForensic />}
                                {currentStepConfig.id === 'background' && <StepBackground />}
                                {currentStepConfig.id === 'finance_mgmt' && <StepFinancialManagement />}
                                {currentStepConfig.id === 'infrastructure' && <StepInfrastructure />}
                                
                                {currentStepConfig.id === 'nca' && (
                                    <div className="space-y-6 text-left">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                            <FormField control={methods.control} name="annualTurnover" render={({ field }) => (
                                                <FormItem className="text-left"><FormLabel>Annual Turnover (L12M)</FormLabel><FormControl><Input type="number" {...field} className="h-12 border-2 text-lg font-bold" /></FormControl></FormItem>
                                            )} />
                                            <FormField control={methods.control} name="totalAssetValue" render={({ field }) => (
                                                <FormItem className="text-left"><FormLabel>Total Entity Asset Value</FormLabel><FormControl><Input type="number" {...field} className="h-12 border-2 text-lg font-bold" /></FormControl></FormItem>
                                            )} />
                                        </div>
                                        <Alert className="bg-muted/50 border-none">
                                            <Info className="h-4 w-4" />
                                            <AlertDescription className="text-xs italic text-left">This data is critical for determining the applicability of the National Credit Act (NCA) to this specific transaction.</AlertDescription>
                                        </Alert>
                                    </div>
                                )}

                                {currentStepConfig.id === 'review' && (
                                    <div className="text-center py-20 space-y-6 text-center">
                                        <CheckCircle className="h-16 w-16 text-primary mx-auto opacity-40" />
                                        <div className="space-y-2 text-center">
                                            <h3 className="text-2xl font-black uppercase text-center">Audit Finalization</h3>
                                            <p className="text-sm text-muted-foreground max-sm mx-auto text-center">Please verify the integrity of the interview responses before committing the record to the forensic grid.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t p-8 flex justify-between text-left">
                        <Button type="button" variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 0} className="font-bold">Back</Button>
                        {currentStep < memoizedSteps.length - 1 ? (
                            <Button type="button" onClick={() => setCurrentStep(prev => prev + 1)} className="px-10 font-black uppercase text-xs tracking-widest text-white shadow-lg">Next Step <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        ) : (
                            <Button type="submit" disabled={isSubmitting} className="h-14 px-12 font-black uppercase tracking-tight text-lg shadow-2xl text-white">
                                {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : <Save className="mr-2 h-6 w-6" />}
                                Commit Audit Record
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
