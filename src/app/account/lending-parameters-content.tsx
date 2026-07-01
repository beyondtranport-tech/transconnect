'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useUser, getClientSideAuthToken, forceRefresh } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Landmark, Info, Banknote, ShieldCheck, Zap, Scale, TrendingUp, History, Users, Package, MapPin, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supplierCategories } from '@/app/adminaccount/marketing/discovery-engine';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

const lendingSchema = z.object({
    // Financial Criteria
    appTypes: z.array(z.string()).min(1, "Select at least one agreement type."),
    minDealSize: z.coerce.number().min(0),
    maxDealSize: z.coerce.number().min(0),
    preferredTerms: z.array(z.string()).min(1, "Select at least one preferred term."),
    
    // Risk & Entity
    entityTypes: z.array(z.string()).min(1, "Select at least one entity type."),
    minYearsInBusiness: z.coerce.number().min(0),
    minAnnualTurnover: z.coerce.number().min(0),
    minCreditScore: z.coerce.number().min(0).max(999).optional(),
    requiresNoJudgements: z.boolean().default(false),
    requiresNoDefaults: z.boolean().default(false),
    requiresNoArrears: z.boolean().default(false),

    // Product & Asset Portfolio (Unified)
    assetTypes: z.array(z.string()).min(1, "Select at least one asset focus."),
    supportedBrands: z.array(z.string()).min(1, "Select at least one supported brand."),
    serviceRegions: z.array(z.string()).min(1, "Select your primary funding regions."),
});

const appTypeOptions = ['Working Capital', 'Asset Finance', 'Personal Loan', 'Micro Loan', 'Factoring', 'Invoice Discounting', 'Bridge Finance'];
const termOptions = ['1-12 Months', '12-24 Months', '24-36 Months', '36-48 Months', '48-60 Months', '60-72+ Months'];
const entityOptions = ['Ltd', 'Private Company (Pty Ltd)', 'Sole Proprietor', 'Close Corporation (CC)', 'Trust', 'Individual', 'Partnership'];
const brandOptions = ['Scania', 'Volvo', 'Mercedes-Benz', 'MAN', 'Freightliner', 'Iveco', 'DAF', 'UD Trucks', 'Isuzu', 'Hino', 'Toyota (Bakkie)', 'Universal/All'];
const regionOptions = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Mpumalanga', 'Limpopo', 'North West', 'Northern Cape', 'Cross-Border'];

export default function LendingParametersContent() {
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const isPaid = user?.companyData?.membershipId && user.companyData.membershipId !== 'free';

    const form = useForm<z.infer<typeof lendingSchema>>({
        resolver: zodResolver(lendingSchema),
        defaultValues: {
            appTypes: user?.companyData?.lendingParams?.appTypes || [],
            minDealSize: user?.companyData?.lendingParams?.minDealSize || 0,
            maxDealSize: user?.companyData?.lendingParams?.maxDealSize || 0,
            preferredTerms: user?.companyData?.lendingParams?.preferredTerms || [],
            entityTypes: user?.companyData?.lendingParams?.entityTypes || [],
            minYearsInBusiness: user?.companyData?.lendingParams?.minYearsInBusiness || 0,
            minAnnualTurnover: user?.companyData?.lendingParams?.minAnnualTurnover || 0,
            minCreditScore: user?.companyData?.lendingParams?.minCreditScore || 600,
            requiresNoJudgements: user?.companyData?.lendingParams?.requiresNoJudgements || false,
            requiresNoDefaults: user?.companyData?.lendingParams?.requiresNoDefaults || false,
            requiresNoArrears: user?.companyData?.lendingParams?.requiresNoArrears || false,
            assetTypes: user?.companyData?.lendingParams?.assetTypes || [],
            supportedBrands: user?.companyData?.lendingParams?.supportedBrands || [],
            serviceRegions: user?.companyData?.lendingParams?.serviceRegions || [],
        }
    });

    useEffect(() => {
        if (user?.companyData?.lendingParams) {
            form.reset(user.companyData.lendingParams);
        }
    }, [user, form]);

    const onSubmit = async (values: z.infer<typeof lendingSchema>) => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");

            const response = await fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: `companies/${user.companyId}`,
                    data: { 
                        lendingParams: values, 
                        declaredRole: 'lender',
                        updatedAt: { _methodName: 'serverTimestamp' } 
                    }
                })
            });

            if (!response.ok) throw new Error("Update failed.");
            toast({ title: "Lending Focus Saved", description: "Your investment parameters have been updated." });
            forceRefresh();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: e.message });
        } finally {
            setIsSaving(false);
        }
    };

    if (isUserLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

    return (
        <div className="space-y-6 text-left">
            <div className="flex items-center gap-4 text-left">
                <div className="bg-primary/10 p-3 rounded-xl text-left"><Landmark className="h-8 w-8 text-primary" /></div>
                <div className="text-left">
                    <h1 className="text-3xl font-black font-headline text-left">Lending Focus & Portfolio</h1>
                    <p className="text-muted-foreground text-left">Define your credit appetite and the assets you are willing to finance.</p>
                </div>
            </div>

            {!isPaid && (
                <Alert className="bg-amber-50 border-amber-200 text-left">
                    <Zap className="h-5 w-5 text-amber-600" />
                    <AlertTitle className="font-bold text-amber-800 text-left">Draft Mode: Free Account</AlertTitle>
                    <AlertDescription className="text-sm text-amber-700 leading-relaxed mt-1 text-left">
                        You can configure your lending focus now, but your profile will only receive **Matched Enquiries** once you upgrade to a paid membership.
                    </AlertDescription>
                </Alert>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Tabs defaultValue="criteria" className="w-full text-left">
                        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 text-left">
                            <TabsTrigger value="criteria" className="py-2.5 font-bold uppercase tracking-widest text-[10px]">Financial Criteria</TabsTrigger>
                            <TabsTrigger value="risk" className="py-2.5 font-bold uppercase tracking-widest text-[10px]">Risk & Entity Focus</TabsTrigger>
                            <TabsTrigger value="assets" className="py-2.5 font-bold uppercase tracking-widest text-[10px]">Asset & Product Portfolio</TabsTrigger>
                        </TabsList>

                        <TabsContent value="criteria" className="mt-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 text-left">
                             <Card className="text-left">
                                <CardHeader className="text-left"><CardTitle className="text-lg flex items-center gap-2 text-left"><Scale className="h-5 w-5 text-primary"/> Deal Size & Terms</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                                    <div className="space-y-4 text-left">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-left">Deal Amount Range (ZAR)</Label>
                                        <div className="grid grid-cols-2 gap-4 text-left">
                                            <FormField control={form.control} name="minDealSize" render={({ field }) => (
                                                <FormItem className="text-left"><FormLabel>Minimum</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                            )} />
                                            <FormField control={form.control} name="maxDealSize" render={({ field }) => (
                                                <FormItem className="text-left"><FormLabel>Maximum</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                            )} />
                                        </div>
                                    </div>
                                    <div className="space-y-4 text-left">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-left">Annual Turnover Required (R)</Label>
                                        <FormField control={form.control} name="minAnnualTurnover" render={({ field }) => (
                                            <FormItem className="text-left"><FormControl><Input type="number" placeholder="e.g. 1000000" {...field} /></FormControl></FormItem>
                                        )} />
                                    </div>
                                </CardContent>
                                <CardContent className="space-y-4 border-t pt-6 text-left">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-left">Preferred Terms</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-left">
                                        {termOptions.map(item => (
                                            <FormField key={item} control={form.control} name="preferredTerms" render={({ field }) => (
                                                <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                                                    <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => checked ? field.onChange([...field.value, item]) : field.onChange(field.value?.filter((v: string) => v !== item))} /></FormControl>
                                                    <FormLabel className="font-medium text-[10px] cursor-pointer leading-tight text-left">{item}</FormLabel>
                                                </FormItem>
                                            )} />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="risk" className="mt-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 text-left">
                             <Card className="text-left">
                                <CardHeader className="text-left"><CardTitle className="text-lg flex items-center gap-2 text-left"><Users className="h-5 w-5 text-primary"/> Entity & History Focus</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                                    <div className="space-y-4 text-left">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-left">Entity Maturity</Label>
                                        <FormField control={form.control} name="minYearsInBusiness" render={({ field }) => (
                                            <FormItem className="text-left"><FormLabel>Min Entity Age (Years)</FormLabel><FormControl><Input type="number" placeholder="e.g. 2" {...field} /></FormControl></FormItem>
                                        )} />
                                    </div>
                                    <div className="space-y-4 text-left">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-left">Credit History Focus</Label>
                                        <div className="grid grid-cols-1 gap-2 text-left">
                                            <FormField control={form.control} name="requiresNoJudgements" render={({ field }) => (
                                                <FormItem className="flex items-center justify-between space-x-3 space-y-0 p-3 border rounded-md text-left">
                                                    <FormLabel className="font-medium text-xs text-left">Must have no judgements</FormLabel>
                                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="requiresNoDefaults" render={({ field }) => (
                                                <FormItem className="flex items-center justify-between space-x-3 space-y-0 p-3 border rounded-md text-left">
                                                    <FormLabel className="font-medium text-xs text-left">Must have no defaults</FormLabel>
                                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                </FormItem>
                                            )} />
                                             <FormField control={form.control} name="requiresNoArrears" render={({ field }) => (
                                                <FormItem className="flex items-center justify-between space-x-3 space-y-0 p-3 border rounded-md text-left">
                                                    <FormLabel className="font-medium text-xs text-left">No active arrears accounts</FormLabel>
                                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardContent className="space-y-4 border-t pt-6 text-left">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-left">Target Entity Types</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                                        {entityOptions.map(item => (
                                            <FormField key={item} control={form.control} name="entityTypes" render={({ field }) => (
                                                <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                                                    <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => checked ? field.onChange([...field.value, item]) : field.onChange(field.value?.filter((v: string) => v !== item))} /></FormControl>
                                                    <FormLabel className="font-medium text-[10px] cursor-pointer text-left">{item}</FormLabel>
                                                </FormItem>
                                            )} />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="assets" className="mt-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 text-left">
                             <Card className="text-left">
                                <CardHeader className="text-left">
                                    <CardTitle className="text-lg flex items-center gap-2 text-left"><Banknote className="h-5 w-5 text-primary"/> Agreement & Asset Portfolio</CardTitle>
                                    <CardDescription className="text-left">Select the types of agreements you offer and the physical assets you will finance.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-10 text-left">
                                    <div className="space-y-4 text-left">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-left">Lending Agreement Products</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                                            {appTypeOptions.map(item => (
                                                <FormField key={item} control={form.control} name="appTypes" render={({ field }) => (
                                                    <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                                                        <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => checked ? field.onChange([...field.value, item]) : field.onChange(field.value?.filter((v: string) => v !== item))} /></FormControl>
                                                        <FormLabel className="font-medium text-xs cursor-pointer text-left">{item}</FormLabel>
                                                    </FormItem>
                                                )} />
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-4 text-left">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 ml-1 text-left"><Package className="h-4 w-4" /> Industrial Asset Specialization</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                                            {supplierCategories.map(item => (
                                                <FormField key={item} control={form.control} name="assetTypes" render={({ field }) => (
                                                    <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                                                        <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => checked ? field.onChange([...field.value, item]) : field.onChange(field.value?.filter((v: string) => v !== item))} /></FormControl>
                                                        <FormLabel className="font-medium text-[11px] cursor-pointer leading-tight text-left">{item}</FormLabel>
                                                    </FormItem>
                                                )} />
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-4 text-left">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 ml-1 text-left"><Sparkles className="h-4 w-4" /> Preferred Truck Brands</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                                            {brandOptions.map(item => (
                                                <FormField key={item} control={form.control} name="supportedBrands" render={({ field }) => (
                                                    <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                                                        <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => checked ? field.onChange([...field.value, item]) : field.onChange(field.value?.filter((v: string) => v !== item))} /></FormControl>
                                                        <FormLabel className="font-medium text-sm cursor-pointer text-left">{item}</FormLabel>
                                                    </FormItem>
                                                )} />
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-4 text-left">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 ml-1 text-left"><MapPin className="h-4 w-4" /> Funding Regions</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-left">
                                            {regionOptions.map(item => (
                                                <FormField key={item} control={form.control} name="serviceRegions" render={({ field }) => (
                                                    <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                                                        <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => checked ? field.onChange([...field.value, item]) : field.onChange(field.value?.filter((v: string) => v !== item))} /></FormControl>
                                                        <FormLabel className="font-medium text-[10px] cursor-pointer text-left">{item}</FormLabel>
                                                    </FormItem>
                                                )} />
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <div className="bg-slate-50 border-t p-6 flex justify-end mt-8 rounded-lg shadow-inner">
                        <Button type="submit" disabled={isSaving} size="lg" className="h-12 px-10 font-bold gap-2">
                            {isSaving ? <Loader2 className="h-5 w-5 animate-spin"/> : <Save className="h-5 w-5" />}
                            Update Lending Focus & Portfolio
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
