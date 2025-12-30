
'use client';

import { Suspense, useState } from 'react';
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
import { useUser, getClientSideAuthToken } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

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

const step1Schema = z.object({
  fundingNeed: z.string().min(1, 'Please select what you need funds for.'),
});
const step2Schema = z.object({
  fundingReason: z.string().min(1, 'Please select a reason.'),
  purpose: z.string().min(10, 'Please provide more detail.'),
});
const step3Schema = z.object({
    amountRequested: z.coerce.number().positive('Please enter a valid amount.'),
});

const combinedSchema = step1Schema.merge(step2Schema).merge(step3Schema);

type ApplicationFormValues = z.infer<typeof combinedSchema>;

const steps = [
  { id: 'Need', name: 'Step 1: Your Need', fields: ['fundingNeed'] },
  { id: 'Reason', name: 'Step 2: The Reason', fields: ['fundingReason', 'purpose'] },
  { id: 'Amount', name: 'Step 3: The Amount', fields: ['amountRequested'] },
  { id: 'Submit', name: 'Step 4: Review & Submit' },
];


function ApplyForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const methods = useForm<ApplicationFormValues>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      fundingNeed: searchParams.get('type') || '',
      fundingReason: '',
      purpose: '',
      amountRequested: Number(searchParams.get('amount')) || 0,
    },
  });
  
  const processStep = async () => {
    let isValid = false;
    if (currentStep === 0) {
        isValid = await methods.trigger("fundingNeed");
    } else if (currentStep === 1) {
        isValid = await methods.trigger(["fundingReason", "purpose"]);
    } else if (currentStep === 2) {
        isValid = await methods.trigger("amountRequested");
    }

    if (isValid && currentStep < steps.length - 1) {
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
        
        const enquiryData = {
            applicantId: user.uid,
            status: 'pending',
            fundingType: methods.getValues('fundingNeed'),
            agreementType: getAgreementType(methods.getValues('fundingNeed')),
            amountRequested: values.amountRequested,
            purpose: values.purpose,
            fundingReason: values.fundingReason,
            createdAt: { _methodName: 'serverTimestamp' },
        };

        const response = await fetch('/api/createEnquiry', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: enquiryData }),
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to submit enquiry.');

        toast({
            title: 'Enquiry Submitted!',
            description: 'Thank you. A funding specialist will be in touch shortly.',
        });
        router.push('/account?view=dashboard');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (isUserLoading || !user) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Landmark /> Funding Application</CardTitle>
        <CardDescription>
          {steps[currentStep].name}
        </CardDescription>
        
        <div className="flex items-center pt-4">
            {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center">
                        <div
                            className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center font-bold",
                                currentStep > index ? "bg-primary text-primary-foreground" :
                                currentStep === index ? "bg-primary text-primary-foreground border-2 border-primary-foreground ring-2 ring-primary" :
                                "bg-muted text-muted-foreground"
                            )}
                        >
                            {currentStep > index ? <CheckCircle className="h-5 w-5" /> : index + 1}
                        </div>
                         <p className={cn("text-xs mt-1", currentStep >= index ? "text-primary font-semibold" : "text-muted-foreground")}>{step.id}</p>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={cn("flex-1 h-1 mb-4", currentStep > index ? "bg-primary" : "bg-muted")} />
                    )}
                </React.Fragment>
            ))}
        </div>

      </CardHeader>
      <CardContent>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
            
            {currentStep === 0 && (
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

            {currentStep === 1 && (
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
            
            {currentStep === 2 && (
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
            
            {currentStep === 3 && (
                <div className="text-center py-4">
                    <h3 className="text-xl font-semibold">Ready to Submit?</h3>
                    <p className="text-muted-foreground mt-2">Please review your information before submitting the enquiry. A funding specialist will contact you shortly to discuss the next steps.</p>
                </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={processStep}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Enquiry <Send className="ml-2 h-4 w-4" />
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
