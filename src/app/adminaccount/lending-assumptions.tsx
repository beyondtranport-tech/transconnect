
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Calculator, Users, Percent, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const agreementSchema = z.object({
    enabled: z.boolean().default(false),
    amount: z.coerce.number().optional(),
    term: z.coerce.number().optional(),
    rate: z.coerce.number().optional(),
});

const formSchema = z.object({
    monthlySignups: z.coerce.number().min(0, "Must be non-negative."),
    quoteConversionRate: z.coerce.number().min(0).max(100),
    enquiryConversionRate: z.coerce.number().min(0).max(100),
    applicationConversionRate: z.coerce.number().min(0).max(100),
    loan: agreementSchema,
    installmentSale: agreementSchema,
    lease: agreementSchema,
    factoring: agreementSchema,
});

type FormValues = z.infer<typeof formSchema>;

export default function LendingAssumptions() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            monthlySignups: 100,
            quoteConversionRate: 50,
            enquiryConversionRate: 30,
            applicationConversionRate: 60,
            loan: { enabled: true, amount: 250000, term: 48, rate: 18 },
            installmentSale: { enabled: true, amount: 750000, term: 60, rate: 15 },
            lease: { enabled: false, amount: 600000, term: 54, rate: 16 },
            factoring: { enabled: true, amount: 100000, term: 3, rate: 5 },
        }
    });

    const onSubmit = (values: FormValues) => {
        setIsLoading(true);
        console.log(values);
        // Here you would save the data to localStorage or a backend
        setTimeout(() => {
            toast({ title: "Assumptions Saved", description: "Your lending model inputs have been updated." });
            setIsLoading(false);
        }, 1000);
    };

    const renderAgreementFields = (name: "loan" | "installmentSale" | "lease" | "factoring", title: string) => (
        <Card>
            <CardHeader>
                <FormField
                    control={form.control}
                    name={`${name}.enabled`}
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} id={name}/>
                            </FormControl>
                            <FormLabel htmlFor={name} className="text-lg font-semibold cursor-pointer">
                                {title}
                            </FormLabel>
                        </FormItem>
                    )}
                />
            </CardHeader>
            <CardContent className="space-y-4">
                <fieldset disabled={!form.watch(`${name}.enabled`)} className="space-y-4">
                    <FormField control={form.control} name={`${name}.amount`} render={({ field }) => (<FormItem><FormLabel>Avg. Amount (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`${name}.term`} render={({ field }) => (<FormItem><FormLabel>Avg. Term (Months)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`${name}.rate`} render={({ field }) => (<FormItem><FormLabel>Avg. Rate / Discount Fee (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </fieldset>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Calculator /> Lending Model Assumptions</CardTitle>
                    <CardDescription>Define the inputs for your lending book financial model. These values drive the projections.</CardDescription>
                </CardHeader>
            </Card>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users /> Member Origination Funnel</CardTitle>
                            <CardDescription>Model the flow of members from sign-up to funded application.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <FormField control={form.control} name="monthlySignups" render={({ field }) => (<FormItem><FormLabel>New Members / Month</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="quoteConversionRate" render={({ field }) => (<FormItem><FormLabel>Quote Request Rate (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="enquiryConversionRate" render={({ field }) => (<FormItem><FormLabel>Formal Enquiry Rate (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="applicationConversionRate" render={({ field }) => (<FormItem><FormLabel>Funded Application Rate (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </CardContent>
                    </Card>

                    <Card>
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FileText /> Agreement Product Mix</CardTitle>
                            <CardDescription>Enable the agreement types you want to offer and set their average financial parameters.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {renderAgreementFields("loan", "Loans")}
                            {renderAgreementFields("installmentSale", "Installment Sale")}
                            {renderAgreementFields("lease", "Lease / Rental")}
                            {renderAgreementFields("factoring", "Factoring / Discounting")}
                        </CardContent>
                    </Card>
                    
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                            Save Assumptions
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
