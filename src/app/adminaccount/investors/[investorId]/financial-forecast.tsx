
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R 0';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value);
};

const formatNumber = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    return value.toLocaleString();
};

const defaultValues = {
    membersPerMonth: 50,
    projectionMonths: 36,
    avgMembershipFee: 350,
    avgMallSpend: 1500,
    mallCommissionPercent: 2.5,
    opexPerMonth: 250000,
};

type ForecastInputs = typeof defaultValues;

function calculateForecast(inputs: ForecastInputs) {
    const data = [];
    let cumulativeMembers = 0;

    // Ensure all inputs from the form are treated as numbers
    const numInputs = {
        projectionMonths: Number(inputs.projectionMonths) || 0,
        membersPerMonth: Number(inputs.membersPerMonth) || 0,
        avgMembershipFee: Number(inputs.avgMembershipFee) || 0,
        avgMallSpend: Number(inputs.avgMallSpend) || 0,
        mallCommissionPercent: Number(inputs.mallCommissionPercent) || 0,
        opexPerMonth: Number(inputs.opexPerMonth) || 0,
    };

    for (let i = 1; i <= numInputs.projectionMonths; i++) {
        cumulativeMembers += numInputs.membersPerMonth;
        const membershipRevenue = cumulativeMembers * numInputs.avgMembershipFee;
        const mallRevenue = cumulativeMembers * numInputs.avgMallSpend * (numInputs.mallCommissionPercent / 100);
        const totalRevenue = membershipRevenue + mallRevenue;
        const netProfit = totalRevenue - numInputs.opexPerMonth;
        data.push({
            month: i,
            members: cumulativeMembers,
            membershipRevenue,
            mallRevenue,
            totalRevenue,
            opex: numInputs.opexPerMonth,
            netProfit,
        });
    }
    return data;
}

export default function FinancialForecast({ investorId }: { investorId: string }) {
    const { toast } = useToast();
    const localStorageKey = `investorForecast_${investorId}`;

    const form = useForm<ForecastInputs>({
        defaultValues: (() => {
            if (typeof window === 'undefined') return defaultValues;
            const saved = localStorage.getItem(localStorageKey);
            return saved ? JSON.parse(saved) : defaultValues;
        })()
    });
    
    const { control, handleSubmit, watch, reset } = form;
    const watchedInputs = watch();

    const forecastData = useMemo(() => calculateForecast(watchedInputs), [watchedInputs]);

    const onSubmit = (data: ForecastInputs) => {
        localStorage.setItem(localStorageKey, JSON.stringify(data));
        toast({ title: "Forecast Assumptions Saved!", description: "Your inputs have been saved locally for this investor." });
    };

    const handleReset = () => {
        localStorage.removeItem(localStorageKey);
        reset(defaultValues);
        toast({ title: 'Inputs Reset', description: 'Assumptions have been reset to default values.' });
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp /> Financial Forecast</CardTitle>
                    <CardDescription>Adjust the inputs to generate a simple net profit projection tailored for this investor. Data is saved locally in your browser.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                <FormField control={control} name="membersPerMonth" render={({ field }) => (<FormItem><FormLabel>New Members / Mo</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                <FormField control={control} name="projectionMonths" render={({ field }) => (<FormItem><FormLabel>Months to Project</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                <FormField control={control} name="avgMembershipFee" render={({ field }) => (<FormItem><FormLabel>Avg. Membership Fee (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                <FormField control={control} name="avgMallSpend" render={({ field }) => (<FormItem><FormLabel>Avg. Mall Spend / Member (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                <FormField control={control} name="mallCommissionPercent" render={({ field }) => (<FormItem><FormLabel>Mall Commission (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                <FormField control={control} name="opexPerMonth" render={({ field }) => (<FormItem><FormLabel>Operating Expenses / Mo (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit"><Save className="mr-2 h-4 w-4"/>Save Inputs</Button>
                                <Button type="button" variant="outline" onClick={handleReset}><RotateCcw className="mr-2 h-4 w-4"/>Reset</Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle>Profit & Loss Projection</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Month</TableHead>
                                <TableHead>Members</TableHead>
                                <TableHead>Membership Revenue</TableHead>
                                <TableHead>Mall Revenue</TableHead>
                                <TableHead className="font-bold">Total Revenue</TableHead>
                                <TableHead>OPEX</TableHead>
                                <TableHead className="font-bold text-primary">Net Profit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {forecastData.map(row => (
                                <TableRow key={row.month}>
                                    <TableCell>{row.month}</TableCell>
                                    <TableCell>{formatNumber(row.members)}</TableCell>
                                    <TableCell>{formatCurrency(row.membershipRevenue)}</TableCell>
                                    <TableCell>{formatCurrency(row.mallRevenue)}</TableCell>
                                    <TableCell className="font-semibold">{formatCurrency(row.totalRevenue)}</TableCell>
                                    <TableCell>{formatCurrency(row.opex)}</TableCell>
                                    <TableCell className="font-bold text-primary">{formatCurrency(row.netProfit)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
