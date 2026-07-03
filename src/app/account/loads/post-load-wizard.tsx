
'use client';

import React, { useState, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, Save, Truck, MapPin, Package, DollarSign, ShieldCheck, CheckCircle } from 'lucide-react';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { provinces } from '@/lib/geodata';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const loadSchema = z.object({
  agreementId: z.string().min(1, "Please select an authorized appointment."),
  origin: z.string().min(1, "Origin is required."),
  destination: z.string().min(1, "Destination is required."),
  cargoType: z.string().min(1, "Cargo type is required."),
  requiredEquipment: z.array(z.string()).min(1, "Select at least one equipment type."),
  weight: z.coerce.number().positive(),
  totalValue: z.coerce.number().positive("What is the total value of this load?"),
  brokerMargin: z.coerce.number().min(0).max(50, "Margin capped at 50%"),
});

const cargoOptions = ["Containers", "Refrigerated", "General Freight", "Bulk Aggregates", "FMCG", "Hazmat"];
const equipmentOptions = ["Skeletal", "Skeletal + Genset", "Tautliner", "Flatbed", "Tipper", "Reefer"];
const locations = provinces.flatMap(p => p.cities.map(c => `${c}, ${p.name}`));

const steps = [
    { id: 'logistics', title: 'Logistics', icon: MapPin },
    { id: 'cargo', title: 'Cargo & Specs', icon: Package },
    { id: 'commercials', title: 'Commercials', icon: DollarSign },
    { id: 'review', title: 'Publish', icon: ShieldCheck },
];

export function PostLoadWizard({ agreements, onComplete }: { agreements: any[], onComplete: () => void }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const methods = useForm<z.infer<typeof loadSchema>>({
        resolver: zodResolver(loadSchema),
        defaultValues: { 
            requiredEquipment: [],
            brokerMargin: agreements.find(a => a.status === 'verified')?.commissionRate || 5
        }
    });

    const commercials = useMemo(() => {
        const total = methods.watch('totalValue') || 0;
        const margin = methods.watch('brokerMargin') || 0;
        const brokerEarn = total * (margin / 100);
        const platformFee = total * 0.025; // 2.5%
        const haulierPayout = total - brokerEarn - platformFee;

        return { brokerEarn, platformFee, haulierPayout };
    }, [methods.watch('totalValue'), methods.watch('brokerMargin')]);

    const onSubmit = async (values: z.infer<typeof loadSchema>) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            const res = await fetch('/api/addUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    collectionPath: `companies/${user!.companyId}/loadBoard/loads`,
                    data: { 
                        ...values, 
                        brokerId: user!.companyId,
                        ...commercials,
                        status: 'active',
                        createdAt: { _methodName: 'serverTimestamp' } 
                    }
                })
            });
            if (!res.ok) throw new Error("Failed to post load.");
            toast({ title: "Load Posted Successfully" });
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
                    <Truck className="h-6 w-6 text-primary" />
                    Load Distribution Wizard
                </CardTitle>
                <CardDescription className="text-slate-400">Post verified freight to the national haulier network.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
                    <div className="space-y-2 border-r pr-4">
                        {steps.map((step, i) => (
                            <Button key={step.id} variant={currentStep === i ? "secondary" : "ghost"} className="w-full justify-start gap-3 h-12" onClick={() => i < currentStep && setCurrentStep(i)}>
                                <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold", currentStep >= i ? "bg-primary text-white" : "bg-muted")}>{i+1}</div>
                                <span className="font-bold">{step.title}</span>
                            </Button>
                        ))}
                    </div>
                    <FormProvider {...methods}>
                        <div className="space-y-8 min-h-[400px] text-left text-foreground">
                            {currentStep === 0 && (
                                <div className="space-y-6 text-left">
                                    <FormField control={methods.control} name="agreementId" render={({ field }) => (
                                        <FormItem className="text-left text-foreground">
                                            <FormLabel className="font-bold">Authorized Subcontractor Agreement</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger className="h-11 border-2"><SelectValue placeholder="Select verified provider..." /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {agreements.filter(a => a.status === 'verified').map(a => <SelectItem key={a.id} value={a.id}>{a.providerName}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="grid grid-cols-2 gap-4 text-left">
                                        <FormField control={methods.control} name="origin" render={({ field }) => (
                                            <FormItem className="text-left">
                                                <FormLabel>Origin City</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="bg-white"><SelectValue/></SelectTrigger></FormControl><SelectContent>{locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
                                            </FormItem>
                                        )} />
                                        <FormField control={methods.control} name="destination" render={({ field }) => (
                                            <FormItem className="text-left">
                                                <FormLabel>Destination City</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="bg-white"><SelectValue/></SelectTrigger></FormControl><SelectContent>{locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>
                            )}

                            {currentStep === 1 && (
                                <div className="space-y-6 text-left text-foreground">
                                    <div className="grid grid-cols-2 gap-4 text-left">
                                        <FormField control={methods.control} name="cargoType" render={({ field }) => (
                                            <FormItem className="text-left">
                                                <FormLabel>Cargo Classification</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="bg-white"><SelectValue/></SelectTrigger></FormControl><SelectContent>{cargoOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                                            </FormItem>
                                        )} />
                                        <FormField control={methods.control} name="weight" render={({ field }) => (<FormItem className="text-left"><FormLabel>Tonnage (Tons)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                    </div>
                                    <div className="space-y-3 text-left">
                                        <Label className="font-bold">Required Haulier Equipment</Label>
                                        <div className="grid grid-cols-2 gap-2 text-left">
                                            {equipmentOptions.map(opt => (
                                                <FormField key={opt} control={methods.control} name="requiredEquipment" render={({ field }) => (
                                                    <div className="flex items-center space-x-2 p-2 border rounded-md text-left">
                                                        <input type="checkbox" checked={field.value.includes(opt)} onChange={e => e.target.checked ? field.onChange([...field.value, opt]) : field.onChange(field.value.filter((v:any) => v !== opt))} className="h-4 w-4" />
                                                        <span className="text-xs">{opt}</span>
                                                    </div>
                                                )} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-8 text-left text-foreground">
                                    <div className="grid grid-cols-2 gap-6 text-left">
                                        <FormField control={methods.control} name="totalValue" render={({ field }) => (<FormItem className="text-left"><FormLabel className="font-black text-primary">Gross Load Value (ZAR)</FormLabel><FormControl><Input type="number" className="h-12 text-xl font-mono" {...field} /></FormControl><FormDescription>Total payout from provider.</FormDescription></FormItem>)} />
                                        <FormField control={methods.control} name="brokerMargin" render={({ field }) => (<FormItem className="text-left"><FormLabel>Broker Margin (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                    </div>
                                    
                                    <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed space-y-4 text-left">
                                        <h4 className="font-black uppercase text-[10px] tracking-widest text-muted-foreground mb-4">Earnings Breakdown</h4>
                                        <div className="space-y-2 text-left">
                                            <div className="flex justify-between text-sm"><span>Broker Participation ({methods.watch('brokerMargin')}%)</span><span className="font-bold">{new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(commercials.brokerEarn)}</span></div>
                                            <div className="flex justify-between text-sm"><span>Platform Fee (2.5%)</span><span className="font-bold">{new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(commercials.platformFee)}</span></div>
                                            <Separator />
                                            <div className="flex justify-between text-lg font-black text-primary pt-2"><span>HAULIER PAYOUT</span><span>{new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(commercials.haulierPayout)}</span></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="text-center py-12 space-y-4">
                                    <CheckCircle className="h-16 w-16 mx-auto text-primary" />
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold">Ready to Broadcast</h3>
                                        <p className="text-sm text-muted-foreground">Your load will be visible to all verified hauliers in the Loads Mall.</p>
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
                    <Button onClick={() => setCurrentStep(prev => prev + 1)}>Next Step <ArrowRight className="ml-2 h-4 w-4"/></Button>
                ) : (
                    <Button onClick={methods.handleSubmit(onSubmit)} disabled={isLoading} className="gap-2 font-black uppercase shadow-lg h-12 px-8">
                        {isLoading ? <Loader2 className="animate-spin h-4 w-4"/> : <CheckCircle className="h-4 w-4" />}
                        Broadcast Load
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
