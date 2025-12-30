
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Landmark, ArrowLeft, ArrowRight, Send, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, getClientSideAuthToken, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { doc } from 'firebase/firestore';


const fundingNeeds = {
  'business': 'My business',
  'equipment': 'To finance equipment',
  'vehicles': 'To finance vehicles',
  'cashflow': 'Support my cashflow',
};

const fundingReasons = {
    problem: 'I have a problem (e.g., breakdown, bad debt)',
    opportunity: 'I have an opportunity (e.g., new contract, growth)',
}

const baseSchema = z.object({
  fundingNeed: z.string().min(1, 'Please select what you need funds for.'),
  fundingReason: z.string().min(1, 'Please select a reason.'),
  purpose: z.string().min(10, 'Please provide more detail.'),
  amountRequested: z.coerce.number().positive('Please enter a valid amount.'),
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
  supplierAddress: z.string().optional(),
});

// Create a refined schema that makes vehicle fields required if foundVehicle is 'yes'
const combinedSchema = baseSchema.superRefine((data, ctx) => {
    if (data.fundingNeed === 'vehicles' && data.foundVehicle === 'yes') {
        if (!data.vehicleType) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select a vehicle type.", path: ["vehicleType"] });
        }
        if (!data.vehicleMake) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vehicle make is required.", path: ["vehicleMake"] });
        }
        if (!data.vehicleModel) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vehicle model is required.", path: ["vehicleModel"] });
        }
        if (!data.vehicleYear) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vehicle year is required.", path: ["vehicleYear"] });
        }
        if (data.vehicleType === 'powered' && !data.engineNumber) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Engine number is required for powered vehicles.", path: ["engineNumber"] });
        }
        if (!data.supplierName) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Supplier name is required.", path: ["supplierName"] });
        }
    }
});


type ApplicationFormValues = z.infer<typeof combinedSchema>;

const staticSteps = [
  { id: 'Need', name: 'Step 1: Your Need', fields: ['fundingNeed'] },
  { id: 'Reason', name: 'Step 2: The Reason', fields: ['fundingReason', 'purpose'] },
  // Conditional steps will be inserted here
  { id: 'Amount', name: 'Final Step: The Amount', fields: ['amountRequested'] },
  { id: 'Submit', name: 'Final Step: Review & Submit' },
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

  const enquiryRef = useMemoFirebase(() => {
    if (!firestore || !user || !enquiryId) return null;
    return doc(firestore, `members/${user.uid}/enquiries`, enquiryId);
  }, [firestore, user, enquiryId]);

  const { data: existingEnquiry, isLoading: isEnquiryLoading } = useDoc(enquiryRef);

  const methods = useForm<ApplicationFormValues>({
    resolver: zodResolver(combinedSchema),
    mode: 'onChange',
    defaultValues: {
      fundingNeed: searchParams.get('type') || '',
      fundingReason: '',
      purpose: '',
      amountRequested: Number(searchParams.get('amount')) || 0,
      foundVehicle: undefined,
      vehicleType: undefined,
      vehicleMake: '',
      vehicleModel: '',
      vehicleYear: '',
      vehicleVin: '',
      engineNumber: '',
      supplierName: '',
      supplierContact: '',
      supplierPhone: '',
      supplierEmail: '',
      supplierAddress: '',
    },
  });

  // Effect to populate form with existing enquiry data when editing
  useEffect(() => {
    if (existingEnquiry) {
      methods.reset(existingEnquiry);
    }
  }, [existingEnquiry, methods]);


  const fundingNeed = methods.watch('fundingNeed');
  const foundVehicle = methods.watch('foundVehicle');
  const vehicleType = methods.watch('vehicleType');

  const dynamicSteps = React.useMemo(() => {
    const steps = [...staticSteps];
    if (fundingNeed === 'vehicles') {
        const vehicleSteps = [
            { id: 'Found', name: 'Step 3: Vehicle Status', fields: ['foundVehicle'] },
        ];
        if (foundVehicle === 'yes') {
            vehicleSteps.push(
                { id: 'Vehicle', name: 'Step 4: Vehicle Info', fields: ['vehicleType', 'vehicleMake', 'vehicleModel', 'vehicleYear', 'vehicleVin', 'engineNumber'] },
                { id: 'Supplier', name: 'Step 5: Supplier Info', fields: ['supplierName', 'supplierContact', 'supplierPhone', 'supplierEmail', 'supplierAddress'] }
            );
        }
        // Insert the new steps after the "Reason" step (index 2)
        steps.splice(2, 0, ...vehicleSteps);
    }
    // Re-label step numbers
    return steps.map((step, index) => ({...step, name: step.name.replace(/Step \d+|Final Step/, `Step ${index + 1}`)}));
  }, [fundingNeed, foundVehicle]);


  const processStep = async () => {
    const currentStepConfig = dynamicSteps[currentStep];
    let isValid = false;
    if (currentStepConfig.fields) {
        isValid = await methods.trigger(currentStepConfig.fields as (keyof ApplicationFormValues)[]);
    } else {
        isValid = true; // For review step
    }

    if (isValid && currentStep < dynamicSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const onSubmit = async (values: ApplicationFormValues) => {
    setIsSubmitting(true);
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      setIsSubmitting(false);
      return;
    }
    
    const getAgreementType = (need: string) => {
        switch(need) {
            case 'business': return 'loan';
            case 'equipment':
            case 'vehicles':
                return 'installment-sale';
            case 'cashflow': return 'discounting';
            default: return 'loan';
        }
    }

    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication token not found.");
        
        let response;
        if (enquiryId) { // This is an update
            const enquiryData = {
                ...values,
                updatedAt: { _methodName: 'serverTimestamp' },
            };
            response = await fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: `members/${user.uid}/enquiries/${enquiryId}`,
                    data: enquiryData
                }),
            });
            if (response.ok) toast({ title: 'Enquiry Updated!' });
        } else { // This is a new enquiry
             const enquiryData = {
                ...values,
                applicantId: user.uid,
                status: 'pending',
                agreementType: getAgreementType(values.fundingNeed),
                createdAt: { _methodName: 'serverTimestamp' },
            };
            response = await fetch('/api/createEnquiry', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: enquiryData }),
            });
            if (response.ok) toast({ title: 'Enquiry Submitted!' });
        }
        
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Failed to save enquiry.');
        }

        router.push('/account?view=dashboard');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const isLoading = isUserLoading || (enquiryId && isEnquiryLoading);

  if (isLoading || !user) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  const currentStepConfig = dynamicSteps[currentStep];

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Landmark /> {enquiryId ? 'Edit' : 'New'} Funding Application</CardTitle>
        <CardDescription>
          {currentStepConfig.name}
        </CardDescription>
        
        <div className="flex items-center pt-4">
            {dynamicSteps.map((step, index) => (
                <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center">
                        <div
                            className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center font-bold transition-all",
                                currentStep > index ? "bg-primary text-primary-foreground" :
                                currentStep === index ? "bg-primary text-primary-foreground border-2 border-primary-foreground ring-2 ring-primary" :
                                "bg-muted text-muted-foreground"
                            )}
                        >
                            {currentStep > index ? <CheckCircle className="h-5 w-5" /> : index + 1}
                        </div>
                         <p className={cn("text-xs mt-1 transition-colors", currentStep >= index ? "text-primary font-semibold" : "text-muted-foreground")}>{step.id}</p>
                    </div>
                    {index < dynamicSteps.length - 1 && (
                        <div className={cn("flex-1 h-1 mb-4 transition-colors", currentStep > index ? "bg-primary" : "bg-muted")} />
                    )}
                </React.Fragment>
            ))}
        </div>

      </CardHeader>
      <CardContent>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
            
            {currentStepConfig.id === 'Need' && (
                 <FormField
                  control={methods.control}
                  name="fundingNeed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">I need funds for:</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a reason..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(fundingNeeds).map(([id, name]) => (
                            <SelectItem key={id} value={id}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}

            {currentStepConfig.id === 'Reason' && (
                <div className="space-y-6">
                    <FormField
                      control={methods.control}
                      name="fundingReason"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-lg font-semibold">What is the primary reason for this funding?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                               {Object.entries(fundingReasons).map(([id, name]) => (
                                <FormItem key={id} className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                        <RadioGroupItem value={id} />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        {name}
                                    </FormLabel>
                                </FormItem>
                               ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={methods.control}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Please provide more detail</FormLabel>
                          <FormControl>
                            <Textarea placeholder="e.g., To purchase a new 2022 Scania R 560 for a new long-term contract with XYZ Logistics." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
            )}
            
            {currentStepConfig.id === 'Found' && (
                 <FormField
                  control={methods.control}
                  name="foundVehicle"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-lg font-semibold">Have you found the vehicle you want to finance yet?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex items-center space-x-4"
                        >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="yes" /></FormControl>
                                <FormLabel className="font-normal">Yes</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="no" /></FormControl>
                                <FormLabel className="font-normal">No</FormLabel>
                            </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}

            {currentStepConfig.id === 'Vehicle' && (
                <div className="space-y-6">
                     <FormField
                        control={methods.control}
                        name="vehicleType"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel className="text-lg font-semibold">What type of vehicle is it?</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4">
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl><RadioGroupItem value="powered" /></FormControl>
                                            <FormLabel className="font-normal">Powered Vehicle (Truck, etc.)</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl><RadioGroupItem value="trailer" /></FormControl>
                                            <FormLabel className="font-normal">Trailer</FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-base font-semibold">Vehicle Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={methods.control} name="vehicleMake" render={({ field }) => (<FormItem><FormLabel>Make</FormLabel><FormControl><Input placeholder="e.g., Scania" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="vehicleModel" render={({ field }) => (<FormItem><FormLabel>Model</FormLabel><FormControl><Input placeholder="e.g., R 560" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="vehicleYear" render={({ field }) => (<FormItem><FormLabel>Year</FormLabel><FormControl><Input placeholder="e.g., 2022" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={methods.control} name="vehicleVin" render={({ field }) => (<FormItem><FormLabel>VIN (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            
                            {vehicleType === 'powered' && (
                                <FormField control={methods.control} name="engineNumber" render={({ field }) => (<FormItem><FormLabel>Engine Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {currentStepConfig.id === 'Supplier' && (
                <div className="space-y-6">
                     <h3 className="text-lg font-semibold">Supplier Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={methods.control} name="supplierName" render={({ field }) => (<FormItem><FormLabel>Supplier/Dealership Name</FormLabel><FormControl><Input placeholder="e.g., Global Trucks" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={methods.control} name="supplierContact" render={({ field }) => (<FormItem><FormLabel>Contact Person (Optional)</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={methods.control} name="supplierPhone" render={({ field }) => (<FormItem><FormLabel>Supplier Phone (Optional)</FormLabel><FormControl><Input placeholder="e.g., 011 123 4567" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={methods.control} name="supplierEmail" render={({ field }) => (<FormItem><FormLabel>Supplier Email (Optional)</FormLabel><FormControl><Input placeholder="e.g., sales@globaltrucks.co.za" {...field} /></FormControl><FormMessage /></FormItem>)} />
                         <div className="md:col-span-2">
                           <FormField control={methods.control} name="supplierAddress" render={({ field }) => (<FormItem><FormLabel>Supplier Address (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., 123 Industrial Rd, Johannesburg" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </div>
                </div>
            )}

            {currentStepConfig.id === 'Amount' && (
                 <FormField
                  control={methods.control}
                  name="amountRequested"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">Approximately how much funding do you need?</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="500000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}
            
            {currentStepConfig.id === 'Submit' && (
                <div className="text-center py-4">
                    <h3 className="text-xl font-semibold">Ready to Submit?</h3>
                    <p className="text-muted-foreground mt-2">Please review your information before submitting the enquiry. A funding specialist will contact you shortly to discuss the next steps.</p>
                </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              
              {currentStep < dynamicSteps.length - 1 ? (
                <Button type="button" onClick={processStep}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {enquiryId ? 'Update Enquiry' : 'Submit Enquiry'} <Send className="ml-2 h-4 w-4" />
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
        <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
            <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
                <ApplyForm />
            </Suspense>
        </div>
    )
}
