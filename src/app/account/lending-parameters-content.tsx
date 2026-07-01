'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useUser, getClientSideAuthToken } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Landmark, Info, Banknote, ShieldCheck, Zap, Scale, TrendingUp, History, Users, Briefcase } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

const lendingSchema = z.object({
    appTypes: z.array(z.string()).min(1, "Select at least one agreement type."),
    assetTypes: z.array(z.string()).min(1, "Select at least one asset focus."),
    minDealSize: z.coerce.number().min(0),
    maxDealSize: z.coerce.number().min(0),
    preferredTerms: z.array(z.string()).min(1, "Select at least one preferred term."),
    entityTypes: z.array(z.string()).min(1, "Select at least one entity type."),
    minYearsInBusiness: z.coerce.number().min(0),
    minAnnualTurnover: z.coerce.number().min(0),
    requiresNoJudgements: z.boolean().default(false),
    requiresNoDefaults: z.boolean().default(false),
    requiresNoArrears: z.boolean().default(false),
});

const appTypeOptions = ['Working Capital', 'Asset Finance', 'Personal Loan', 'Micro Loan', 'Factoring', 'Invoice Discounting'];
const assetOptions = ['Trucks', 'Trailers', 'CNC Equipment', 'Computer Hardware', 'Automation', 'Production Line', 'Printing', 'CCTV/Security'];
const termOptions = ['12 Months', '24 Months', '36 Months', '48 Months', '60 Months', '72+ Months'];
const entityOptions = ['Private Company (Pty Ltd)', 'Sole Proprietor', 'Close Corporation (CC)', 'Trust', 'Individual', 'Partnership', 'Ltd'];

export default function LendingParametersContent() {
    const { user, isUserLoading, forceRefresh } = useUser();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const isPaid = user?.companyData?.membershipId && user.companyData.membershipId !== 'free';

    const form = useForm<z.infer<typeof lendingSchema>>({
        resolver: zodResolver(lendingSchema),
        defaultValues: {
            appTypes: user?.companyData?.lendingParams?.appTypes || [],
            assetTypes: user?.companyData?.lendingParams?.assetTypes || [],
            minDealSize: user?.companyData?.lendingParams?.minDealSize || 0,
            maxDealSize: user?.companyData?.lendingParams?.maxDealSize || 0,
            preferredTerms: user?.companyData?.lendingParams?.preferredTerms || [],
            entityTypes: user?.companyData?.lendingParams?.entityTypes || [],
            minYearsInBusiness: user?.companyData?.lendingParams?.minYearsInBusiness || 0,
            minAnnualTurnover: user?.companyData?.lendingParams?.minAnnualTurnover || 0,
            requiresNoJudgements: user?.companyData?.lendingParams?.requiresNoJudgements || false,
            requiresNoDefaults: user?.companyData?.lendingParams?.requiresNoDefaults || false,
            requiresNoArrears: user?.companyData?.lendingParams?.requiresNoArrears || false,
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
        <Card className="max-w-4xl mx-auto shadow-xl text-left text-foreground">
            <CardHeader className="border-b bg-muted/20 text-left">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl"><Landmark className="h-6 w-6 text-primary" /></div>
                    <div className="text-left text-foreground">
                        <CardTitle className="text-2xl font-bold">Lending Focus & Portfolio</CardTitle>
                        <CardDescription>Define the forensic variables that drive your deal selection and matching engine.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="p-8 space-y-10 text-left">
                        {!isPaid && (
                            <Alert className="bg-amber-50 border-amber-200 text-left">
                                <Zap className="h-5 w-5 text-amber-600" />
                                <AlertTitle className="font-bold text-amber-800 text-left">Draft Mode: Free Account</AlertTitle>
                                <AlertDescription className="text-sm text-amber-700 leading-relaxed mt-1 text-left">
                                    You can configure your lending portfolio now, but your profile will only receive **Matched Enquiries** once you upgrade to a paid membership.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-4">
                            <h3 className="font-bold flex items-center gap-2 text-lg text-foreground"><Banknote className="h-5 w-5 text-primary" /> Agreement Types</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {appTypeOptions.map(item => (
                                    <FormField key={item} control={form.control} name="appTypes" render={({ field }) => (
                                        <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                                            <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => checked ? field.onChange([...field.value, item]) : field.onChange(field.value?.filter((v: string) => v !== item))} /></FormControl>
                                            <FormLabel className="font-medium text-xs cursor-pointer">{item}</FormLabel>
                                        </FormItem>
                                    )} />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold flex items-center gap-2 text-lg text-foreground"><Briefcase className="h-5 w-5 text-primary" /> Asset Specialization</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {assetOptions.map(item => (
                                    <FormField key={item} control={form.control} name="assetTypes" render={({ field }) => (
                                        <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                                            <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => checked ? field.onChange([...field.value, item]) : field.onChange(field.value?.filter((v: string) => v !== item))} /></FormControl>
                                            <FormLabel className="font-medium text-[10px] cursor-pointer leading-tight">{item}</FormLabel>
                                        </FormItem>
                                    )} />
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-foreground">
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg flex items-center gap-2 text-foreground"><Scale className="h-5 w-5 text-primary"/> Deal Size Range (ZAR)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="minDealSize" render={({ field }) => (
                                        <FormItem><FormLabel>Minimum Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name="maxDealSize" render={({ field }) => (
                                        <FormItem><FormLabel>Maximum Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                    )} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg flex items-center gap-2 text-foreground"><TrendingUp className="h-5 w-5 text-primary"/> Risk Criteria</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="minYearsInBusiness" render={({ field }) => (
                                        <FormItem><FormLabel>Min Entity Age (Years)</FormLabel><FormControl><Input type="number" placeholder="e.g. 2" {...field} /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name="minAnnualTurnover" render={({ field }) => (
                                        <FormItem><FormLabel>Min Annual Turnover (R)</FormLabel><FormControl><Input type="number" placeholder="e.g. 1000000" {...field} /></FormControl></FormItem>
                                    )} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-foreground"><History className="h-5 w-5 text-primary"/> Credit History Focus</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField control={form.control} name="requiresNoJudgements" render={({ field }) => (
                                    <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md">
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        <FormLabel className="font-medium text-xs">Must have no judgements</FormLabel>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="requiresNoDefaults" render={({ field }) => (
                                    <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md">
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        <FormLabel className="font-medium text-xs">Must have no defaults</FormLabel>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="requiresNoArrears" render={({ field }) => (
                                    <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md">
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        <FormLabel className="font-medium text-xs">Must have no active arrears</FormLabel>
                                    </FormItem>
                                )} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-foreground"><Users className="h-5 w-5 text-primary" /> Target Entity Types</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {entityOptions.map(item => (
                                    <FormField key={item} control={form.control} name="entityTypes" render={({ field }) => (
                                        <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                                            <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => checked ? field.onChange([...field.value, item]) : field.onChange(field.value?.filter((v: string) => v !== item))} /></FormControl>
                                            <FormLabel className="font-medium text-[10px] cursor-pointer">{item}</FormLabel>
                                        </FormItem>
                                    )} />
                                ))}
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t p-6 flex justify-end">
                        <Button type="submit" disabled={isSaving} size="lg" className="h-12 px-10 font-bold gap-2">
                            {isSaving ? <Loader2 className="h-5 w-5 animate-spin"/> : <Save className="h-5 w-5" />}
                            Update Lending Portfolio
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
