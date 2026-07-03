
'use client';

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, Handshake, Building, FileUp, ShieldCheck, CheckCircle } from 'lucide-react';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const appointmentSchema = z.object({
  providerName: z.string().min(1, "Provider name is required."),
  providerId: z.string().optional(),
  commissionRate: z.coerce.number().min(0).max(50),
  agreementUrl: z.string().min(1, "Please upload the signed appointment letter.")
});

const steps = [
    { id: 'provider', title: 'Load Provider', icon: Building },
    { id: 'terms', title: 'Brokerage Terms', icon: Handshake },
    { id: 'document', title: 'Upload Signed Letter', icon: FileUp },
    { id: 'review', title: 'Submit for Audit', icon: CheckCircle },
];

export function BrokerAppointmentWizard({ onComplete }: { onComplete: () => void }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const methods = useForm<z.infer<typeof appointmentSchema>>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: { commissionRate: 5, agreementUrl: '' }
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setUploadProgress(10);
        try {
            const token = await getClientSideAuthToken();
            const reader = new FileReader();
            const dataUri = await new Promise<string>(res => {
                reader.onload = () => res(reader.result as string);
                reader.readAsDataURL(file);
            });
            const response = await fetch('/api/uploadImageAsset', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileDataUri: dataUri, folder: `broker-docs/${user.uid}`, fileName: `appointment_${Date.now()}_${file.name}` })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            methods.setValue('agreementUrl', result.url, { shouldValidate: true });
            setUploadProgress(100);
            toast({ title: "Letter Uploaded" });
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Upload Failed", description: e.message });
        } finally {
            setUploadProgress(0);
        }
    };

    const onSubmit = async (values: z.infer<typeof appointmentSchema>) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            const res = await fetch('/api/addUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    collectionPath: `companies/${user!.companyId}/brokerAgreements`,
                    data: { ...values, brokerId: user!.companyId, status: 'pending', createdAt: { _methodName: 'serverTimestamp' } }
                })
            });
            if (!res.ok) throw new Error("Failed to save agreement.");
            toast({ title: "Appointment Logged", description: "Awaiting platform admin verification." });
            onComplete();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="max-w-4xl mx-auto shadow-2xl border-none text-left">
            <CardHeader className="bg-slate-900 text-white rounded-t-xl p-8">
                <CardTitle className="text-2xl font-black font-headline flex items-center gap-3">
                    <Handshake className="h-6 w-6 text-primary" />
                    Subcontractor Authorization
                </CardTitle>
                <CardDescription className="text-slate-400">Formalize your brokerage relationship with a Load Provider.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
                    <div className="space-y-2 border-r pr-4">
                        {steps.map((step, i) => (
                            <Button key={step.id} variant={currentStep === i ? "secondary" : "ghost"} className="w-full justify-start gap-2 h-10" onClick={() => i < currentStep && setCurrentStep(i)}>
                                <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold", currentStep >= i ? "bg-primary text-white" : "bg-muted")}>{i+1}</div>
                                {step.title}
                            </Button>
                        ))}
                    </div>
                    <FormProvider {...methods}>
                        <div className="space-y-6 min-h-[300px] text-left text-foreground">
                            {currentStep === 0 && (
                                <div className="space-y-4 text-left">
                                    <h3 className="font-bold text-lg">Who is providing the work?</h3>
                                    <FormField control={methods.control} name="providerName" render={({ field }) => (
                                        <FormItem className="text-left text-foreground">
                                            <FormLabel>Provider Company Name</FormLabel>
                                            <FormControl><Input placeholder="Legal name as per contract..." {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            )}
                            {currentStep === 1 && (
                                <div className="space-y-4 text-left text-foreground">
                                    <h3 className="font-bold text-lg">What is your brokerage split?</h3>
                                    <FormField control={methods.control} name="commissionRate" render={({ field }) => (
                                        <FormItem className="text-left">
                                            <FormLabel>Agreed Commission Rate (%)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormDescription>Your markup or management fee per load.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            )}
                            {currentStep === 2 && (
                                <div className="space-y-4 text-left">
                                    <h3 className="font-bold text-lg">Evidence of Appointment</h3>
                                    <div className="p-8 border-2 border-dashed rounded-xl bg-slate-50 text-center space-y-4">
                                        <FileUp className="h-10 w-10 mx-auto text-muted-foreground opacity-30" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-foreground">Upload Signed Appointment Letter</p>
                                            <p className="text-xs text-muted-foreground">PDF or JPG accepted.</p>
                                        </div>
                                        <input type="file" id="doc-up" className="hidden" onChange={handleFileUpload} />
                                        <Button variant="outline" type="button" onClick={() => document.getElementById('doc-up')?.click()} disabled={uploadProgress > 0}>
                                            {uploadProgress > 0 ? `Uploading ${uploadProgress}%` : "Select File"}
                                        </Button>
                                        {methods.watch('agreementUrl') && <div className="flex items-center justify-center gap-2 text-green-600 text-xs font-bold"><ShieldCheck className="h-4 w-4"/> Document Attached</div>}
                                    </div>
                                </div>
                            )}
                            {currentStep === 3 && (
                                <div className="text-center py-12 space-y-4">
                                    <CheckCircle className="h-16 w-16 mx-auto text-primary" />
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold">Ready for Audit</h3>
                                        <p className="text-sm text-muted-foreground">Confirm all details and submit. An admin will verify the appointment letter.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </FormProvider>
                </div>
            </CardContent>
            <CardFooter className="p-8 bg-slate-50 border-t flex justify-between">
                <Button variant="ghost" onClick={currentStep === 0 ? onComplete : () => setCurrentStep(prev => prev - 1)}><ArrowLeft className="mr-2 h-4 w-4"/> {currentStep === 0 ? 'Cancel' : 'Back'}</Button>
                {currentStep < 3 ? (
                    <Button onClick={() => setCurrentStep(prev => prev + 1)}>Next <ArrowRight className="ml-2 h-4 w-4"/></Button>
                ) : (
                    <Button onClick={methods.handleSubmit(onSubmit)} disabled={isLoading} className="gap-2 font-black uppercase shadow-lg h-12 px-8">
                        {isLoading ? <Loader2 className="animate-spin h-4 w-4"/> : <Save className="h-4 w-4" />}
                        Submit Appointment
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
