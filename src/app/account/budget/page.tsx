'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sheet, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function BudgetPage() {
    const router = useRouter();
    const { toast } = useToast();

    const { register, control, handleSubmit, watch } = useForm({
        defaultValues: {
            startMonth: new Date().getMonth(),
            startYear: new Date().getFullYear(),
            forecastMonths: 36,
            membershipFees: { basic: 100, standard: 250, premium: 500 },
            staffAssumptions: [
                { role: 'Executive Director', count: 1, salary: 150000 },
                { role: 'Non-Executive Director', count: 2, salary: 25000 },
                { role: 'Manager', count: 3, salary: 75000 },
                { role: 'Admin', count: 4, salary: 35000 },
            ],
            // Hardcoded values from the previous version
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
        }
    });

    const { fields } = useFieldArray({
        control,
        name: "staffAssumptions"
    });
    
    const onSubmit = (data: any) => {
        const { startMonth, startYear, forecastMonths, membershipFees, staffAssumptions, salesInputs: hardcodedSales, budgetInputs: hardcodedBudget } = data;

        const salesInputs = {
            ...hardcodedSales,
            startMonth,
            startYear,
            forecastMonths,
        };

        const budgetInputs = {
            ...hardcodedBudget,
            revenue: {
                ...hardcodedBudget.revenue,
                membershipFees: (membershipFees.basic + membershipFees.standard + membershipFees.premium) / 3, // Average fee
            },
            opexSalaries: staffAssumptions
        };
        
        const fullData = { salesInputs, budgetInputs };
        const dataString = encodeURIComponent(JSON.stringify(fullData));
        
        toast({
            title: "Generating Forecast...",
            description: "You will be redirected to the income statement.",
        });

        router.push(`/account?view=forecast&data=${dataString}`);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sheet /> Budget & Forecast Assumptions</CardTitle>
                    <CardDescription>Enter your financial assumptions here. Click the button at the bottom to generate the income statement forecast.</CardDescription>
                </CardHeader>
            </Card>

            <div className="space-y-8">
                <Card className="lg:col-span-1">
                    <CardHeader><CardTitle>Forecast Settings</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="start-month">Start Month</Label>
                        <Select defaultValue={String(watch('startMonth'))} onValueChange={v => control.register('startMonth').onChange({ target: { value: Number(v) } })}>
                        <SelectTrigger className="w-[180px]" id="start-month"><SelectValue /></SelectTrigger>
                        <SelectContent>{monthNames.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="start-year">Start Year</Label>
                        <Input id="start-year" type="number" {...register('startYear')} className="w-[180px]" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="forecast-months">Months to Forecast</Label>
                        <Input id="forecast-months" type="number" {...register('forecastMonths')} className="w-[180px]" />
                    </div>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Staff Assumptions</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4">
                        {fields.map((item, index) => (
                            <React.Fragment key={item.id}>
                                <div><Label>{item.role} Count</Label><Input type="number" {...register(`staffAssumptions.${index}.count`)} /></div>
                                <div><Label>{item.role} Salary (R)</Label><Input type="number" {...register(`staffAssumptions.${index}.salary`)} /></div>
                            </React.Fragment>
                        ))}
                    </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Membership Assumptions</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                        <h3 className="font-medium text-muted-foreground">Monthly Fees</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center justify-between gap-4"><Label>Basic Plan (R)</Label><Input type="number" {...register('membershipFees.basic')} className="w-[180px]" /></div>
                            <div className="flex items-center justify-between gap-4"><Label>Standard Plan (R)</Label><Input type="number" {...register('membershipFees.standard')} className="w-[180px]" /></div>
                            <div className="flex items-center justify-between gap-4"><Label>Premium Plan (R)</Label><Input type="number" {...register('membershipFees.premium')} className="w-[180px]" /></div>
                        </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
             <div className="mt-8 flex justify-end">
                <Button type="submit">
                    <TrendingUp className="mr-2 h-4 w-4"/>
                    Generate Income Statement
                </Button>
            </div>
        </form>
    );
}