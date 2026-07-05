
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
import { Loader2, ArrowLeft, ArrowRight, Truck, MapPin, Package, DollarSign, ShieldCheck, CheckCircle, Lock, ClipboardList, Gavel, Network } from 'lucide-react';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { provinces } from '@/lib/geodata';
import { cn, formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Link from 'next/link';

const loadSchema = z.object({
  agreementId: z.string().min(1, "Please select an authorized appointment."),
  loadType: z.enum(['local_distribution', 'long_haul']).default('long_haul'),
  origin: z.string().min(1, "Origin is required."),
  destination: z.string().min(1, "Destination is required."),
  cargoType: z.string().min(1, "Cargo type is required."),
  requiredEquipment: z.array(z.string()).min(1, "Select at least one equipment type."),
  weight: z.coerce.number().positive(),
  totalValue: z.coerce.number().positive("What is the total value of this load?"),
  brokerMargin: z.coerce.number().min(0).max(50, "Margin capped at 50%"),
  collectionDetails: z.string().min(10, "Provide full collection address and contact."),
  deliveryDetails: z.string().min(10, "Provide full delivery address and contact."),
  demurrageConditions: z.string().min(5, "Specify delay penalties."),
  collectionDate: z.string().min(1, "Required."),
  deliveryDate: z.string().min(1, "Required."),
});

const cargoOptions = ["Containers", "Refrigerated", "General Freight", "Bulk Aggregates", "FMCG", "Hazmat"];
const equipmentOptions = ["Skeletal", "Skeletal + Genset", "Tautliner", "Flatbed", "Tipper", "Reefer"];
const locations = provinces.flatMap(p => p.cities.map(c => `${c}, ${p.name}`));

const steps = [
    { id: 'type', title: 'Flow Type', icon: Network },
    { id: 'logistics', title: 'Logistics', icon: MapPin },
    { id: 'execution', title: 'Execution', icon: ClipboardList },
    { id: 'cargo', title: 'Cargo & Specs', icon: Package },
    { id: 'commercials', title: 'Commercials', icon: DollarSign },
    { id: 'review', title: 'Publish', icon: ShieldCheck },
];

export function PostLoadWizard({ agreements, onComplete }: { agreements: any[], onComplete: () => void }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const isEarningMember = user?.companyData?.membershipId && user.companyData.membershipId !== 'free';

    const methods = useForm<z.infer<typeof loadSchema>>({
        resolver: zodResolver(loadSchema),
        mode: 'onChange',
        defaultValues: { 
            requiredEquipment: [],
            loadType: 'long_haul',
            brokerMargin: agreements.find(a => a.status === 'verified')?.commissionRate || 5,
            demurrageConditions: 'R2500 per day standing fee if not offloaded within 4 hours of arrival.'
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
        if (!isEarningMember) return;

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
                        brokerName: user?.companyData?.companyName || 'Primary Contractor',
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
        <Card className="max-w-4xl mx-auto shadow-2xl border-none text-left overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-8">
                <CardTitle className="text-2xl font-black font-headline flex items-center gap-3 text-white text-left">
                    <Truck className="h-6 w-6 text-primary" />
                    Freight Clearing Wizard
                </CardTitle>
                <CardDescription className="text-slate-400">Post verified freight instructions to the specialized haulier network.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 bg-white text-foreground">
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
                        <div className="space-y-8 min-h-[450px] text-left">
                            {currentStep === 0 && (
                                <div className="space-y-8 text-left text-foreground">
                                     <FormField control={methods.control} name="loadType" render={({ field }) => (
                                        <FormItem className="space-y-4 text-left">
                                            <FormLabel className="font-black uppercase text-[10px] tracking-widest text-primary">Select Flow Segment</FormLabel>
                                            <FormControl>
                                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 gap-4">
                                                    <div className={cn("flex items-center space-x-4 p-4 border-2 rounded-2xl cursor-pointer transition-all", field.value === 'local_distribution' ? "border-primary bg-primary/5" : "border-muted")}>
                                                        <RadioGroupItem value="local_distribution" id="local" className="h-5 w-5" />
                                                        <Label htmlFor="local" className="flex-1 cursor-pointer">
                                                            <p className="font-black text-sm uppercase">Local Distribution</p>
                                                            <p className="text-[11px] text-muted-foreground">Inner-city urban Spokes. Sourced from Distribution Mall.</p>
                                                        </Label>
                                                    </div>
                                                    <div className={cn("flex items-center space-x-4 p-4 border-2 rounded-2xl cursor-pointer transition-all", field.value === 'long_haul' ? "border-primary bg-primary/5" : "border-muted")}>
                                                        <RadioGroupItem value="long_haul" id="haul" className="h-5 w-5" />
                                                        <Label htmlFor="haul" className="flex-1 cursor-pointer">
                                                            <p className="font-black text-sm uppercase">Long-Haul Transport</p>
                                                            <p className="text-[11px] text-muted-foreground">Arterial inter-hub movement. Sourced from Transport Mall.</p>
                                                        </Label>
                                                    </div>
                                                </RadioGroup>
                                            </FormControl>
                                        </FormItem>
                                     )} />
                                     
                                     <FormField control={methods.control} name="agreementId" render={({ field }) => (
                                        <FormItem className="text-left">
                                            <FormLabel className="font-black uppercase text-[10px] tracking-widest text-primary">Authorized Appointment</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger className="h-11 border-2"><SelectValue placeholder="Select verified provider..." /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {agreements.filter(a => a.status === 'verified').map(a => <SelectItem key={a.id} value={a.id}>{a.providerName}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription className="text-[10px] italic">Must be a verified primary contract holder.</FormDescription>
                                        </FormItem>
                                    )} />
                                </div>
                            )}

                            {currentStep === 1 && (
                                <div className="space-y-6 text-left">
                                    <h3 className="font-bold text-lg flex items-center gap-2 text-foreground"><MapPin className="h-5 w-5 text-primary" /> Corridor Logistics</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={methods.control} name="origin" render={({ field }) => (
                                            <FormItem className="text-left">
                                                <FormLabel>Origin Hub</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="bg-white"><SelectValue/></SelectTrigger></FormControl><SelectContent>{locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
                                            </FormItem>
                                        )} />
                                        <FormField control={methods.control} name="destination" render={({ field }) => (
                                            <FormItem className="text-left">
                                                <FormLabel>Destination Hub</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="bg-white"><SelectValue/></SelectTrigger></FormControl><SelectContent>{locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>
                            )}
                            
                            {/* ... remaining steps ... */}
                            {currentStep === 2 && (
                                <div className="space-y-6 text-left text-foreground">
                                    <h3 className="font-bold text-lg flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Execution Specifics</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={methods.control} name="collectionDate" render={({ field }) => (<FormItem><FormLabel>Collection Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                                        <FormField control={methods.control} name="deliveryDate" render={({ field }) => (<FormItem><FormLabel>Target Delivery</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                                    </div>
                                    <FormField control={methods.control} name="collectionDetails" render={({ field }) => (
                                        <FormItem><FormLabel>Collection Full Address & Contact</FormLabel><FormControl><Textarea placeholder="Precise pickup location..." {...field} /></FormControl></FormItem>
                                    )} />
                                    <FormField control={methods.control} name="deliveryDetails" render={({ field }) => (
                                        <FormItem><FormLabel>Delivery Full Address & Contact</FormLabel><FormControl><Textarea placeholder="Precise offload location..." {...field} /></FormControl></FormItem>
                                    )} />
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-6 text-left">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={methods.control} name="cargoType" render={({ field }) => (
                                            <FormItem className="text-left text-foreground">
                                                <FormLabel>Cargo Classification</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="bg-white"><SelectValue/></SelectTrigger></FormControl><SelectContent>{cargoOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                                            </FormItem>
                                        )} />
                                        <FormField control={methods.control} name="weight" render={({ field }) => (<FormItem className="text-left"><FormLabel>Tonnage (Tons)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                    </div>
                                    <div className="space-y-3 text-left">
                                        <Label className="font-bold text-foreground">Required Equipment</Label>
                                        <div className="grid grid-cols-2 gap-2 text-left">
                                            {equipmentOptions.map(opt => (
                                                <FormField key={opt} control={methods.control} name="requiredEquipment" render={({ field }) => (
                                                    <div className="flex items-center space-x-2 p-2 border rounded-md text-left">
                                                        <Checkbox checked={field.value.includes(opt)} onCheckedChange={(checked) => checked ? field.onChange([...field.value, opt]) : field.onChange(field.value.filter((v:any) => v !== opt))} />
                                                        <span className="text-xs">{opt}</span>
                                                    </div>
                                                )} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="space-y-8 text-left text-foreground">
                                    <div className="grid grid-cols-2 gap-6 text-left">
                                        <FormField control={methods.control} name="totalValue" render={({ field }) => (<FormItem className="text-left"><FormLabel className="font-black text-primary uppercase text-[10px]">Gross Load Value (ZAR)</FormLabel><FormControl><Input type="number" className="h-12 text-xl font-mono" {...field} /></FormControl></FormItem>)} />
                                        <FormField control={methods.control} name="brokerMargin" render={({ field }) => (<FormItem className="text-left"><FormLabel className="font-black uppercase text-[10px]">Broker Participation (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                    </div>
                                    
                                    <div className="bg-slate-50 p-8 rounded-3xl border-2 border-dashed space-y-4 text-left">
                                        <h4 className="font-black uppercase text-[10px] tracking-widest text-muted-foreground mb-4">Clearing Logic</h4>
                                        <div className="space-y-3 text-left text-sm">
                                            <div className="flex justify-between"><span>Your Net Earning</span><span className="font-bold text-green-700">{formatCurrency(commercials.brokerEarn)}</span></div>
                                            <div className="flex justify-between"><span>Platform Fee (2.5%)</span><span className="font-bold">{formatCurrency(commercials.platformFee)}</span></div>
                                            <Separator />
                                            <div className="flex justify-between text-lg font-black text-primary pt-2"><span>HAULIER PAYOUT</span><span>{formatCurrency(commercials.haulierPayout)}</span></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 5 && (
                                <div className="space-y-6 text-center py-10">
                                    <CheckCircle className="h-16 w-16 mx-auto text-primary" />
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black">Audit Verified</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">This load will be broadcasted to the specialized {methods.watch('loadType') === 'local_distribution' ? 'Distribution' : 'Transport'} fleet registry.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </FormProvider>
                </div>
            </CardContent>
            <CardFooter className="p-8 bg-slate-50 border-t flex justify-between">
                <Button variant="ghost" onClick={currentStep === 0 ? onComplete : () => setCurrentStep(prev => prev - 1)}><ArrowLeft className="mr-2 h-4 w-4"/> {currentStep === 0 ? 'Cancel' : 'Back'}</Button>
                {currentStep < 5 ? (
                    <Button onClick={() => handleNext()}>Next Step <ArrowRight className="ml-2 h-4 w-4"/></Button>
                ) : (
                    <Button onClick={methods.handleSubmit(onSubmit)} disabled={isLoading || !isEarningMember} className="gap-2 font-black uppercase shadow-lg h-12 px-8 text-white">
                        {isLoading ? <Loader2 className="animate-spin h-4 w-4"/> : <ShieldCheck className="h-4 w-4" />}
                        Broadcast & Open Handshake
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

function StepDetails() {
    const { control } = useFormContext();
    return (
        <div className="space-y-4 text-left">
            <FormField control={control} name="shopName" render={({ field }) => ( <FormItem><FormLabel>Branding Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={control} name="category" render={({ field }) => ( <FormItem><FormLabel>Category</FormLabel><Input {...field} /></FormItem> )} />
             <FormField control={control} name="contactEmail" render={({ field }) => ( <FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
        </div>
    );
}

function StepMedia() {
    const { setValue, watch } = useFormContext();
    const logo = watch('logoUrl');
    return (
        <div className="space-y-6 text-left">
            <div className="flex items-center justify-between">
                <h3 className="font-bold">Media & Logo</h3>
            </div>
            <div className="aspect-square w-32 border rounded bg-muted relative overflow-hidden">
                {logo && <Image src={logo} alt="Logo" fill className="object-contain" />}
            </div>
        </div>
    );
}

function StepContent() {
    const { control } = useFormContext();
    return (
        <div className="space-y-4 text-left">
            <FormField control={control} name="homeHeading" render={({ field }) => ( <FormItem><FormLabel>Headline</FormLabel><Input {...field} /></FormItem> )} />
            <FormField control={control} name="aboutText" render={({ field }) => ( <FormItem><FormLabel>About Wording</FormLabel><Textarea rows={5} {...field} /></FormItem> )} />
        </div>
    );
}

function StepCatalog({ shop }: any) { return <div className="p-8 border rounded-lg bg-muted/20 text-center">Standard Catalog Tools enabled.</div>; }
function StepFleet({ shop }: any) { return <div className="p-8 border rounded-lg bg-muted/20 text-center">Fleet Gallery tools enabled.</div>; }
function StepCommercials({ shop }: any) { return <div className="p-8 border rounded-lg bg-muted/20 text-center">Revenue sharing registered at 2.5%</div>; }

function StepPublish({ shop, onSave }: any) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const handlePublish = async () => {
        setLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            await fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: `companies/${shop.companyId}/shops/${shop.id}`, data: { status: 'pending_review' } }),
            });
            toast({ title: "Submitted for Review" });
            onSave();
        } catch (e) { toast({ variant: 'destructive', title: 'Failed' }); }
        finally { setLoading(false); }
    };
    return (
        <div className="text-center py-10 space-y-4">
            <h3 className="text-2xl font-bold text-foreground">Ready to Publish?</h3>
            <Button onClick={handlePublish} disabled={loading}>{loading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Send className="mr-2 h-4 w-4"/>} Submit Profile</Button>
        </div>
    );
}
