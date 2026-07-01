'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Landmark, ArrowLeft, ArrowRight, Send, CheckCircle, ShieldCheck, Briefcase, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, getClientSideAuthToken, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { doc } from 'firebase/firestore';

const fundingNeeds = {
  'business': 'Working Capital / Business Loan',
  'equipment': 'Equipment Finance (Production, CNC, Printing, etc.)',
  'vehicles': 'Vehicle Finance (Truck, Trailer, Bus, Car)',
  'cashflow': 'Cashflow Support (Factoring, Discounting)',
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

const baseSchema = z.object({
  fundingNeed: z.string().min(1, 'Please select what you need funds for.'),
  fundingReason: z.string().min(1, 'Please select a reason.'),
  purpose: z.string().min(10, 'Please provide more detail.'),
  amountRequested: z.coerce.number().positive('Please enter a valid amount.'),
  
  // Forensic Variables for Matching
  entityType: z.string().min(1, 'Please select your entity type.'),
  yearsInBusiness: z.coerce.number().min(0, 'Required.'),
  annualTurnover: z.coerce.number().min(0, 'Required.'),
  creditRating: z.string().min(1, 'Required.'),
  
  hasJudgements: z.boolean().default(false),
  hasDefaults: z.boolean().default(false),
  hasArrears: z.boolean().default(false),

  foundVehicle: z.enum(['yes', 'no']).optional(),
  vehicleType: z.enum(['powered', 'trailer']).optional(),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.string().optional(),
  vehicleVin: z.string().optional(),
  engineNumber: z.string().optional(),
  supplierName: z.string().optional(),
  supplierContact: z.string().optional(),
  supplierPhone: z.string().optional(),
  supplierEmail: z.string().email().optional().or(z.literal('')),
});

const combinedSchema = baseSchema.superRefine((data, ctx) => {
    if (data.fundingNeed === 'vehicles' && data.foundVehicle === 'yes') {
        if (!data.vehicleMake) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required.", path: ["vehicleMake"] });
        if (!data.vehicleModel) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required.", path: ["vehicleModel"] });
    }
});

type ApplicationFormValues = z.infer<typeof combinedSchema>;

const staticSteps = [
  { id: 'Need', name: 'Step 1: Your Need', fields: ['fundingNeed'] },
  { id: 'Profile', name: 'Step 2: Business Profile', fields: ['entityType', 'yearsInBusiness', 'annualTurnover', 'creditRating'] },
  { id: 'History', name: 'Step 3: Credit History', fields: ['hasJudgements', 'hasDefaults', 'hasArrears'] },
  { id: 'Reason', name: 'Step 4: The Reason', fields: ['fundingReason', 'purpose'] },
  { id: 'Amount', name: 'Step 5: The Amount', fields: ['amountRequested'] },
  { id: 'Submit', name: 'Final Step: Review' },
];

function ApplyForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const enquiryId = searchParams.get('enquiryId');

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc(userDocRef);

  const enquiryRef = useMemoFirebase(() => {
    if (!firestore || !userData?.companyId || !enquiryId) return null;
    return doc(firestore, `companies/${userData.companyId}/enquiries`, enquiryId);
  }, [firestore, userData, enquiryId]);

  const { data: existingEnquiry, isLoading: isEnquiryLoading } = useDoc(enquiryRef);

  const methods = useForm<ApplicationFormValues>({
    resolver: zodResolver(combinedSchema),
    mode: 'onChange',
    defaultValues: {
      fundingNeed: searchParams.get('type') || '',
      amountRequested: Number(searchParams.get('amount')) || 0,
      yearsInBusiness: 0,
      annualTurnover: 0,
      hasJudgements: false,
      hasDefaults: false,
      hasArrears: false,
    },
  });

  useEffect(() => {
    if (existingEnquiry) {
      methods.reset(existingEnquiry);
    }
  }, [existingEnquiry, methods]);

  const fundingNeed = methods.watch('fundingNeed');

  const dynamicSteps = React.useMemo(() => {
    const steps = [...staticSteps];
    if (fundingNeed === 'vehicles') {
        const vehicleSteps = [{ id: 'Vehicle', name: 'Step 3: Vehicle Status', fields: ['foundVehicle'] }];
        steps.splice(2, 0, ...vehicleSteps);
    }
    return steps.map((step, index) => ({...step, name: step.name.replace(/Step \d+|Final Step/, `Step ${index + 1}`)}));
  }, [fundingNeed]);

  const processStep = async () => {
    const isValid = await methods.trigger(dynamicSteps[currentStep].fields as any);
    if (isValid && currentStep < dynamicSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const onSubmit = async (values: ApplicationFormValues) => {
    setIsSubmitting(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Auth failed.");
        
        const path = enquiryId ? `companies/${userData?.companyId}/enquiries/${enquiryId}` : `companies/${userData?.companyId}/enquiries`;
        const data = { ...values, status: 'pending', updatedAt: { _methodName: 'serverTimestamp' } };

        await fetch(enquiryId ? '/api/updateUserDoc' : '/api/addUserDoc', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(enquiryId ? { path, data } : { collectionPath: path, data }),
        });

        toast({ title: 'Application Processed', description: 'Our matching engine is identifying suitable lenders.' });
        router.push('/account?view=dashboard');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (isUserLoading || (enquiryId && isEnquiryLoading)) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  const currentStepConfig = dynamicSteps[currentStep];

  return (
    <Card className="w-full max-w-2xl shadow-xl text-left">
      <CardHeader className="bg-slate-900 text-white rounded-t-xl p-8 text-left">
        <CardTitle className="flex items-center gap-2 text-left text-white"><Landmark className="text-primary"/> Forensic Funding Application</CardTitle>
        <CardDescription className="text-slate-400 text-left">{currentStepConfig.name}</CardDescription>
      </CardHeader>
      <CardContent className="p-8 text-left">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8 text-left">
            
            {currentStepConfig.id === 'Need' && (
                 <FormField control={methods.control} name="fundingNeed" render={({ field }) => (
                    <FormItem className="text-left">
                      <FormLabel className="font-bold">I require capital for:</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="h-12"><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          {Object.entries(fundingNeeds).map(([id, name]) => (<SelectItem key={id} value={id}>{name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
            )}

            {currentStepConfig.id === 'Profile' && (
                <div className="space-y-6 text-left">
                    <FormField control={methods.control} name="entityType" render={({ field }) => (
                        <FormItem className="text-left"><FormLabel>Entity Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl><SelectContent>{entityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <FormField control={methods.control} name="yearsInBusiness" render={({ field }) => (<FormItem><FormLabel>Years in Business</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                        <FormField control={methods.control} name="annualTurnover" render={({ field }) => (<FormItem><FormLabel>Annual Turnover (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                    </div>
                    <FormField control={methods.control} name="creditRating" render={({ field }) => (
                        <FormItem className="text-left"><FormLabel>Self-Assessed Credit Standing</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Rate yourself..." /></SelectTrigger></FormControl><SelectContent>{creditRatings.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></FormItem>
                    )} />
                </div>
            )}

            {currentStepConfig.id === 'History' && (
                <div className="space-y-4 text-left">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-foreground"><History className="h-5 w-5 text-primary"/> Forensic Disclosure</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-left">Please disclose any active or previous credit constraints. Our matching engine selects lenders based on this criteria.</p>
                    <FormField control={methods.control} name="hasJudgements" render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md text-left">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="font-medium text-xs cursor-pointer text-left">Do you have active judgements?</FormLabel>
                        </FormItem>
                    )} />
                    <FormField control={methods.control} name="hasDefaults" render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md text-left">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="font-medium text-xs cursor-pointer text-left">Do you have active defaults?</FormLabel>
                        </FormItem>
                    )} />
                    <FormField control={methods.control} name="hasArrears" render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md text-left">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="font-medium text-xs cursor-pointer text-left">Do you have accounts currently in arrears?</FormLabel>
                        </FormItem>
                    )} />
                </div>
            )}

            {currentStepConfig.id === 'Reason' && (
                <div className="space-y-6 text-left">
                    <FormField control={methods.control} name="fundingReason" render={({ field }) => (
                        <FormItem className="space-y-3 text-left">
                          <FormLabel className="font-bold">Is this to solve a problem or capture an opportunity?</FormLabel>
                          <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1 text-left">
                                <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="problem" /></FormControl><FormLabel className="font-normal cursor-pointer">Problem / Recovery</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="opportunity" /></FormControl><FormLabel className="font-normal cursor-pointer">Growth / Opportunity</FormLabel></FormItem>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )} />
                    <FormField control={methods.control} name="purpose" render={({ field }) => (<FormItem className="text-left"><FormLabel>Brief Technical Summary</FormLabel><FormControl><Textarea placeholder="Explain exactly how these funds will be deployed..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
            )}

            {currentStepConfig.id === 'Amount' && (
                 <FormField control={methods.control} name="amountRequested" render={({ field }) => (
                    <FormItem className="text-left">
                      <FormLabel className="text-lg font-bold">Estimated Amount (ZAR)</FormLabel>
                      <FormControl><Input type="number" className="h-12 text-xl font-mono" placeholder="500000" {...field} /></FormControl>
                      <FormDescription>This drives the initial lender pool selection.</FormDescription>
                    </FormItem>
                  )} />
            )}
            
            <div className="flex justify-between items-center pt-6 border-t text-left">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 0}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
              {currentStep < dynamicSteps.length - 1 ? (
                <Button type="button" onClick={processStep}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 shadow-lg">
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
        <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-20 text-left">
            <Suspense fallback={<Loader2 className="animate-spin" />}><ApplyForm /></Suspense>
        </div>
    )
}
