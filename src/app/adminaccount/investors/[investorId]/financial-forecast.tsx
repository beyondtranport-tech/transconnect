'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, AlertTriangle, Loader2, DollarSign, Users, Map, Target, Banknote, Save, RotateCcw, Handshake, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

// --- Helper Functions ---
const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R 0';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value);
};

const formatNumber = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    return value.toLocaleString();
};

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// --- Zod Schema for Inputs ---
const salesRoadmapSchema = z.object({
    powerPartners: z.object({ count: z.coerce.number(), oppsPerMonth: z.coerce.number(), conversionRate: z.coerce.number() }),
    isaAgents: z.object({ count: z.coerce.number(), referralsPerMonth: z.coerce.number(), conversionRate: z.coerce.number() }),
});
const targetsSchema = z.object({
    connectPlanAdoptionRate: z.coerce.number(),
});
const budgetSchema = z.object({
    avgMembershipFee: z.coerce.number(),
    avgMallSpend: z.coerce.number(),
    mallCommissionRate: z.coerce.number(),
    opexPerMonth: z.coerce.number(),
});

const formSchema = z.object({
    forecastMonths: z.coerce.number().int().min(12).max(60),
    startMonth: z.coerce.number().int().min(0).max(11),
    startYear: z.coerce.number().int(),
    salesRoadmap: salesRoadmapSchema,
    targets: targetsSchema,
    budget: budgetSchema,
});
type FormValues = z.infer<typeof formSchema>;

// --- Default Values ---
const defaultValues: FormValues = {
    forecastMonths: 36,
    startMonth: new Date().getMonth(),
    startYear: new Date().getFullYear(),
    salesRoadmap: {
        powerPartners: { count: 5, oppsPerMonth: 200, conversionRate: 5 },
        isaAgents: { count: 10, referralsPerMonth: 20, conversionRate: 10 },
    },
    targets: {
        connectPlanAdoptionRate: 15,
    },
    budget: {
        avgMembershipFee: 350,
        avgMallSpend: 1500,
        mallCommissionRate: 2.5,
        opexPerMonth: 250000,
    }
};

// --- Calculation Logic ---
function calculateProjections(inputs: FormValues) {
    if (!inputs.startYear || !inputs.forecastMonths) return { projections: [], totals: {} };

    const { forecastMonths, salesRoadmap, targets, budget, startMonth, startYear } = inputs;
    let partnerMembers = 0;
    let totalMembers = 0;
    const projections = Array.from({ length: forecastMonths }, (_, i) => {
        const date = new Date(startYear, startMonth + i);
        const monthName = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        const monthLabel = `${monthName} ${year}`;
        
        const partnerNewMembers = Math.round(salesRoadmap.powerPartners.count * salesRoadmap.powerPartners.oppsPerMonth * (salesRoadmap.powerPartners.conversionRate / 100));
        const isaNewMembers = Math.round(salesRoadmap.isaAgents.count * salesRoadmap.isaAgents.referralsPerMonth * (salesRoadmap.isaAgents.conversionRate / 100));
        const newPartnerDrivenMembers = partnerNewMembers + isaNewMembers;
        partnerMembers += newPartnerDrivenMembers;
        totalMembers = partnerMembers;

        const membershipRevenue = totalMembers * budget.avgMembershipFee;
        const connectPlanRevenue = totalMembers * (targets.connectPlanAdoptionRate / 100) * 50;
        const mallRevenue = totalMembers * budget.avgMallSpend * (budget.mallCommissionRate / 100);
        const totalRevenue = membershipRevenue + connectPlanRevenue + mallRevenue;

        const grossProfit = totalRevenue;
        const opex = budget.opexPerMonth;
        const netProfit = grossProfit - opex;

        return {
            month: monthLabel,
            year,
            partnerNewMembers,
            isaNewMembers,
            totalPartnerDriven: newPartnerDrivenMembers,
            cumulativePartnerMembers: partnerMembers,
            cumulativeTotalMembers: totalMembers,
            membershipRevenue,
            connectPlanRevenue,
            mallRevenue,
            totalRevenue,
            grossProfit,
            opex,
            netProfit,
        };
    });

    const totals = projections.reduce((acc, curr) => {
        Object.keys(curr).forEach(key => {
            const typedKey = key as keyof typeof curr;
            if (typeof curr[typedKey] === 'number') {
                acc[typedKey] = (acc[typedKey] || 0) + (curr[typedKey] as number);
            }
        });
        return acc;
    }, {} as Record<string, number>);

    // Replace cumulative values with the last month's value
    if (projections.length > 0) {
        totals.cumulativePartnerMembers = projections[projections.length - 1].cumulativePartnerMembers;
        totals.cumulativeTotalMembers = projections[projections.length - 1].cumulativeTotalMembers;
    }

    return { projections, totals };
}


// --- Main Component ---
export default function FinancialForecast({ investorId }: { investorId: string }) {
    const { toast } = useToast();
    const localStorageKey = `investorForecast_${investorId}`;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: useCallback(() => {
            if (typeof window === 'undefined') return defaultValues;
            const saved = localStorage.getItem(localStorageKey);
            return saved ? JSON.parse(saved) : defaultValues;
        }, [localStorageKey])()
    });

    const { control, handleSubmit, watch, reset } = form;
    const watchedValues = watch();

    const { projections, totals } = useMemo(() => calculateProjections(watchedValues), [watchedValues]);
    
    const onSubmit = (data: FormValues) => {
        localStorage.setItem(localStorageKey, JSON.stringify(data));
        toast({ title: 'Projections Saved!', description: 'Your financial assumptions have been saved locally for this investor.' });
    };
    
    const handleReset = () => {
        localStorage.removeItem(localStorageKey);
        reset(defaultValues);
        toast({ title: 'Projections Reset', description: 'Assumptions have been reset to default values.' });
    };

    const renderInput = (name: any, label: string) => (
        <FormField control={control} name={name} render={({ field }) => (
            <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
            </FormItem>
        )} />
    );

    return (
        <div className="space-y-8">
             <Form {...form}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                        <AccordionItem value="item-1">
                            <AccordionTrigger><h2 className="text-xl font-semibold">Financial Assumptions</h2></AccordionTrigger>
                            <AccordionContent className="p-4 bg-background/50 rounded-b-lg">
                                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                     <Card><CardHeader><CardTitle className="flex items-center gap-2"><Map size={18}/>Sales Roadmap</CardTitle></CardHeader>
                                        <CardContent className="space-y-4">
                                            {renderInput('salesRoadmap.powerPartners.count', '# Power Partners')}
                                            {renderInput('salesRoadmap.powerPartners.oppsPerMonth', 'Opps/Partner/Mo')}
                                            {renderInput('salesRoadmap.powerPartners.conversionRate', 'Partner Conv. Rate (%)')}
                                            <Separator />
                                            {renderInput('salesRoadmap.isaAgents.count', '# ISA Agents')}
                                            {renderInput('salesRoadmap.isaAgents.referralsPerMonth', 'Refs/ISA/Mo')}
                                            {renderInput('salesRoadmap.isaAgents.conversionRate', 'ISA Conv. Rate (%)')}
                                        </CardContent>
                                    </Card>
                                     <Card><CardHeader><CardTitle className="flex items-center gap-2"><Target size={18}/>Targets</CardTitle></CardHeader>
                                        <CardContent className="space-y-4">
                                            {renderInput('targets.connectPlanAdoptionRate', 'Connect Plan Adopt. (%)')}
                                        </CardContent>
                                    </Card>
                                     <Card><CardHeader><CardTitle className="flex items-center gap-2"><Banknote size={18}/>Budget</CardTitle></CardHeader>
                                        <CardContent className="space-y-4">
                                            {renderInput('budget.avgMembershipFee', 'Avg. Membership Fee (R)')}
                                            {renderInput('budget.avgMallSpend', 'Avg. Mall Spend/Member (R)')}
                                            {renderInput('budget.mallCommissionRate', 'Mall Commission Rate (%)')}
                                            {renderInput('budget.opexPerMonth', 'Monthly OPEX (R)')}
                                        </CardContent>
                                    </Card>
                                     <Card><CardHeader><CardTitle>General</CardTitle></CardHeader>
                                        <CardContent className="space-y-4">
                                            {renderInput('forecastMonths', 'Forecast Months')}
                                             <div className="grid grid-cols-2 gap-4">
                                                <FormField control={control} name="startMonth" render={({field}) => <FormItem><FormLabel>Start Month</FormLabel><Select value={String(field.value)} onValueChange={v => field.onChange(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{monthNames.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent></Select></FormItem>} />
                                                <FormField control={control} name="startYear" render={({field}) => <FormItem><FormLabel>Start Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                                            </div>
                                             <div className="pt-6 flex flex-col gap-2">
                                                <Button type="submit"><Save className="mr-2"/>Save</Button>
                                                <Button type="button" variant="outline" onClick={handleReset}><RotateCcw className="mr-2"/>Reset</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                 </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </form>
            </Form>
            
            <Tabs defaultValue="partners" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="partners">Partners</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="turnover">Turnover</TabsTrigger>
                    <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
                </TabsList>

                <TabsContent value="partners" className="mt-4">
                    <Card><CardHeader><CardTitle>Partner-Driven Member Growth</CardTitle></CardHeader>
                        <CardContent><Table>
                            <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>New (Partners)</TableHead><TableHead>New (ISAs)</TableHead><TableHead>Total New</TableHead><TableHead>Cumulative</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {projections.map(p => (<TableRow key={p.month}><TableCell>{p.month}</TableCell><TableCell>{formatNumber(p.partnerNewMembers)}</TableCell><TableCell>{formatNumber(p.isaNewMembers)}</TableCell><TableCell>{formatNumber(p.totalPartnerDriven)}</TableCell><TableCell className="font-bold">{formatNumber(p.cumulativePartnerMembers)}</TableCell></TableRow>))}
                                <TableRow className="bg-muted font-bold"><TableCell>Total</TableCell><TableCell>{formatNumber(totals.partnerNewMembers)}</TableCell><TableCell>{formatNumber(totals.isaNewMembers)}</TableCell><TableCell>{formatNumber(totals.totalPartnerDriven)}</TableCell><TableCell>{formatNumber(totals.cumulativePartnerMembers)}</TableCell></TableRow>
                            </TableBody>
                        </Table></CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="members" className="mt-4">
                     <Card>
                        <CardHeader><CardTitle>Total Member Growth</CardTitle></CardHeader>
                        <CardContent><Table>
                            <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>New Members</TableHead><TableHead>Cumulative Members</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {projections.map(p => (<TableRow key={p.month}><TableCell>{p.month}</TableCell><TableCell>{formatNumber(p.totalPartnerDriven)}</TableCell><TableCell className="font-bold">{formatNumber(p.cumulativeTotalMembers)}</TableCell></TableRow>))}
                                <TableRow className="bg-muted font-bold"><TableCell>Total</TableCell><TableCell>{formatNumber(totals.totalPartnerDriven)}</TableCell><TableCell>{formatNumber(totals.cumulativeTotalMembers)}</TableCell></TableRow>
                            </TableBody>
                        </Table></CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="turnover" className="mt-4">
                     <Card>
                        <CardHeader><CardTitle>Turnover (Revenue) Projection</CardTitle></CardHeader>
                        <CardContent><Table>
                            <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Membership</TableHead><TableHead>Connect Plan</TableHead><TableHead>Mall</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {projections.map(p => (<TableRow key={p.month}><TableCell>{p.month}</TableCell><TableCell>{formatCurrency(p.membershipRevenue)}</TableCell><TableCell>{formatCurrency(p.connectPlanRevenue)}</TableCell><TableCell>{formatCurrency(p.mallRevenue)}</TableCell><TableCell className="font-bold">{formatCurrency(p.totalRevenue)}</TableCell></TableRow>))}
                                <TableRow className="bg-muted font-bold"><TableCell>Total</TableCell><TableCell>{formatCurrency(totals.membershipRevenue)}</TableCell><TableCell>{formatCurrency(totals.connectPlanRevenue)}</TableCell><TableCell>{formatCurrency(totals.mallRevenue)}</TableCell><TableCell>{formatCurrency(totals.totalRevenue)}</TableCell></TableRow>
                            </TableBody>
                        </Table></CardContent>
                    </Card>
                </TabsContent>

                 <TabsContent value="income-statement" className="mt-4">
                     <Card>
                        <CardHeader><CardTitle>Income Statement (P&L) Projection</CardTitle></CardHeader>
                        <CardContent><Table>
                            <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Total Revenue</TableHead><TableHead>OPEX</TableHead><TableHead>Net Profit</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {projections.map(p => (<TableRow key={p.month}><TableCell>{p.month}</TableCell><TableCell>{formatCurrency(p.totalRevenue)}</TableCell><TableCell>{formatCurrency(p.opex)}</TableCell><TableCell className={`font-bold ${p.netProfit < 0 ? 'text-destructive' : 'text-green-600'}`}>{formatCurrency(p.netProfit)}</TableCell></TableRow>))}
                                <TableRow className="bg-muted font-bold"><TableCell>Total</TableCell><TableCell>{formatCurrency(totals.totalRevenue)}</TableCell><TableCell>{formatCurrency(totals.opex)}</TableCell><TableCell className={`font-bold ${totals.netProfit < 0 ? 'text-destructive' : 'text-green-600'}`}>{formatCurrency(totals.netProfit)}</TableCell></TableRow>
                            </TableBody>
                        </Table></CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
