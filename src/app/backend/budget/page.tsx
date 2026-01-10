'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sheet, DollarSign, Users, Percent, Map, TrendingUp, RotateCcw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const BUDGET_ASSUMPTIONS_KEY = 'backendBudgetAssumptions_v3';

const defaultValues = {
    startMonth: new Date().getMonth(),
    startYear: new Date().getFullYear(),
    forecastMonths: 36,
    salesInputs: {
        initialTransporters: 1000,
        initialSuppliers: 500,
        numberOfPowerPartners: 5,
        opportunitiesPerPartner: 2000,
        campaignConversionRate: 5,
        campaignDuration: 6,
        avgCustomersPerMember: 10,
        customerConversionRate: 2,
        customerConversionLag: 3,
        numberOfIsas: 10,
        referralsPerIsa: 50,
        isaConversionRate: 10,
    },
    budgetInputs: {
        revenue: {
            membershipFees: 250,
            connectPlanAdoptionRate: 15,
            avgConnectPlanFee: 50,
            mallCommissionRate: 2.5,
            avgMallSpendPerMember: 1000,
            techServicesAdoptionRate: 10,
            avgTechSpendPerMember: 150
        },
        cogs: { memberCommissionShare: 50, isaCommissionRate: 20 },
        opexOther: {
            digitalAdvertising: 30000, contentCreation: 15000, eventsAndSponsorships: 10000,
            officeRental: 35000, utilities: 15000, insurance: 5000,
            legalAndProfessional: 10000, bankCharges: 2000, telephone: 8000,
            travelAndEntertainment: 5000, platformCosts: 20000, softwareLicenses: 10000
        }
    }
};

function BudgetPageContent() {
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm({
        defaultValues: useCallback(() => {
            if (typeof window === 'undefined') {
                return defaultValues;
            }
            try {
                const savedData = localStorage.getItem(BUDGET_ASSUMPTIONS_KEY);
                return savedData ? JSON.parse(savedData) : defaultValues;
            } catch (e) {
                console.error("Failed to parse saved budget data, using defaults.", e);
            }
            return defaultValues;
        }, [])()
    });

    const { control, register, handleSubmit, watch, reset } = form;

    const onSubmit = (data: any) => {
        localStorage.setItem(BUDGET_ASSUMPTIONS_KEY, JSON.stringify(data));
        
        toast({
            title: "Budget Assumptions Saved!",
            description: "Your assumptions have been saved locally. Navigate to the Forecast page to see the results.",
        });

        router.push(`/backend?view=forecast`);
    };
    
    const handleReset = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(BUDGET_ASSUMPTIONS_KEY);
        }
        reset(defaultValues);
        toast({
            title: 'Budget Reset',
            description: 'Assumptions have been reset to their default values.',
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader className="flex flex-row justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Sheet /> Budget & Forecast Assumptions</CardTitle>
                            <CardDescription>Enter your financial assumptions here. Your data is saved locally in your browser.</CardDescription>
                        </div>
                        <Button type="button" variant="outline" onClick={handleReset}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset to Defaults
                        </Button>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <Label htmlFor="start-month">Start Month</Label>
                            <Select defaultValue={String(watch('startMonth'))} onValueChange={v => control.register('startMonth').onChange({ target: { value: Number(v) } })}>
                                <SelectTrigger id="start-month"><SelectValue /></SelectTrigger>
                                <SelectContent>{monthNames.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="start-year">Start Year</Label>
                            <Input id="start-year" type="number" {...register('startYear')} />
                        </div>
                        <div>
                            <Label htmlFor="forecast-months">Months to Forecast</Label>
                            <Input id="forecast-months" type="number" {...register('forecastMonths')} />
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-1 space-y-8">
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Map />Sales Roadmap Assumptions</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField name="salesInputs.initialTransporters" control={control} render={({field}) => <FormItem><FormLabel>Initial Transporters</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                <FormField name="salesInputs.initialSuppliers" control={control} render={({field}) => <FormItem><FormLabel>Initial Suppliers</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                <FormField name="salesInputs.numberOfPowerPartners" control={control} render={({field}) => <FormItem><FormLabel># Power Partners</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                <FormField name="salesInputs.opportunitiesPerPartner" control={control} render={({field}) => <FormItem><FormLabel>Opps per Partner</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                <FormField name="salesInputs.campaignConversionRate" control={control} render={({field}) => <FormItem><FormLabel>Campaign Conversion (%)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                <FormField name="salesInputs.campaignDuration" control={control} render={({field}) => <FormItem><FormLabel>Campaign Duration (mths)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                <FormField name="salesInputs.avgCustomersPerMember" control={control} render={({field}) => <FormItem><FormLabel>Avg Customers / Member</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                <FormField name="salesInputs.customerConversionRate" control={control} render={({field}) => <FormItem><FormLabel>Customer Conversion (%)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                <FormField name="salesInputs.customerConversionLag" control={control} render={({field}) => <FormItem><FormLabel>Conversion Lag (mths)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                <FormField name="salesInputs.numberOfIsas" control={control} render={({field}) => <FormItem><FormLabel># of ISAs</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                <FormField name="salesInputs.referralsPerIsa" control={control} render={({field}) => <FormItem><FormLabel>Referrals per ISA</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                <FormField name="salesInputs.isaConversionRate" control={control} render={({field}) => <FormItem><FormLabel>ISA Conversion (%)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                            </CardContent>
                        </Card>
                    </div>

                     <div className="lg:col-span-1 space-y-8">
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign />Revenue Assumptions</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField name="budgetInputs.revenue.membershipFees" control={control} render={({field}) => <FormItem><FormLabel>Avg. Membership Fee</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                <FormField name="budgetInputs.revenue.connectPlanAdoptionRate" control={control} render={({field}) => <FormItem><FormLabel>Connect Plan Adoption (%)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                <FormField name="budgetInputs.revenue.avgConnectPlanFee" control={control} render={({field}) => <FormItem><FormLabel>Avg. Connect Plan Fee</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                <FormField name="budgetInputs.revenue.mallCommissionRate" control={control} render={({field}) => <FormItem><FormLabel>Mall Commission (%)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                <FormField name="budgetInputs.revenue.avgMallSpendPerMember" control={control} render={({field}) => <FormItem><FormLabel>Avg. Mall Spend / Member</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                <FormField name="budgetInputs.revenue.techServicesAdoptionRate" control={control} render={({field}) => <FormItem><FormLabel>Tech Services Adoption (%)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                <FormField name="budgetInputs.revenue.avgTechSpendPerMember" control={control} render={({field}) => <FormItem><FormLabel>Avg. Tech Spend / Member</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Percent />Cost of Goods Sold (COGS)</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField name="budgetInputs.cogs.memberCommissionShare" control={control} render={({field}) => <FormItem><FormLabel>Member Commission Share (%)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                <FormField name="budgetInputs.cogs.isaCommissionRate" control={control} render={({field}) => <FormItem><FormLabel>ISA Commission Rate (%)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1 space-y-8">
                         <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Users />Operating Expenses (OPEX)</CardTitle></CardHeader>
                            <CardContent>
                                <h3 className="font-semibold text-lg">Other Expenses (Monthly)</h3>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField name="budgetInputs.opexOther.digitalAdvertising" control={control} render={({field}) => <FormItem><FormLabel>Digital Advertising</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.contentCreation" control={control} render={({field}) => <FormItem><FormLabel>Content & SEO</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.eventsAndSponsorships" control={control} render={({field}) => <FormItem><FormLabel>Events</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.officeRental" control={control} render={({field}) => <FormItem><FormLabel>Office Rental</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.utilities" control={control} render={({field}) => <FormItem><FormLabel>Utilities</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.insurance" control={control} render={({field}) => <FormItem><FormLabel>Insurance</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.legalAndProfessional" control={control} render={({field}) => <FormItem><FormLabel>Legal & Pro Fees</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.bankCharges" control={control} render={({field}) => <FormItem><FormLabel>Bank Charges</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.telephone" control={control} render={({field}) => <FormItem><FormLabel>Telephone</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.travelAndEntertainment" control={control} render={({field}) => <FormItem><FormLabel>Travel</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.platformCosts" control={control} render={({field}) => <FormItem><FormLabel>Platform Hosting</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.softwareLicenses" control={control} render={({field}) => <FormItem><FormLabel>Software Licenses</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                    <Button type="submit">
                        <TrendingUp className="mr-2 h-4 w-4"/>
                        Save Budget & View Forecast
                    </Button>
                </div>
            </form>
        </Form>
    );
}

export default function BudgetPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin" /></div>}>
            <BudgetPageContent />
        </Suspense>
    );
}
