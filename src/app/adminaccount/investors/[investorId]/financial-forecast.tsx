
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Save, TrendingUp, Users } from 'lucide-react';
import { calculateInvestorForecast } from './calculations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R 0';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value);
};

interface ForecastInputs {
    membersPerMonth: number;
    projectionPeriod: number;
    membershipFee: number;
    avgSpendPerMember: number;
    platformDiscount: number;
    opexPerMonth: number;
}

const defaultInputs: ForecastInputs = {
    membersPerMonth: 100,
    projectionPeriod: 36,
    membershipFee: 250,
    avgSpendPerMember: 1000,
    platformDiscount: 2.5,
    opexPerMonth: 50000,
};

function ForecastResults({ inputs }: { inputs: ForecastInputs }) {
    const data = useMemo(() => calculateInvestorForecast(inputs), [inputs]);

    if (!data || data.length === 0) {
        return <p>Enter inputs to generate a forecast.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">New Members</TableHead>
                        <TableHead className="text-right">Total Members</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                        <TableHead className="text-right">Total Costs</TableHead>
                        <TableHead className="text-right text-primary font-bold">Net Profit</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map(row => (
                        <TableRow key={row.month}>
                            <TableCell>{row.month}</TableCell>
                            <TableCell className="text-right">{row.newMembers.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-semibold">{row.cumulativeMembers.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(row.totalRevenue)}</TableCell>
                            <TableCell className="text-right font-mono text-destructive">{formatCurrency(row.totalCosts)}</TableCell>
                            <TableCell className={`text-right font-mono font-bold ${row.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                {formatCurrency(row.netProfit)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}


export default function FinancialForecast({ investorId }: { investorId: string }) {
    const { toast } = useToast();
    const [currentInputs, setCurrentInputs] = useState<ForecastInputs>(defaultInputs);

    const form = useForm<ForecastInputs>({
        defaultValues: defaultInputs
    });
    
    const localStorageKey = `investor-forecast-${investorId}`;

    useEffect(() => {
        const savedData = localStorage.getItem(localStorageKey);
        if (savedData) {
            const parsed = JSON.parse(savedData);
            form.reset(parsed);
            setCurrentInputs(parsed);
        }
    }, [investorId, form, localStorageKey]);

    const onSubmit = (data: ForecastInputs) => {
        localStorage.setItem(localStorageKey, JSON.stringify(data));
        setCurrentInputs(data);
        toast({ title: "Assumptions Saved!", description: "The financial forecast has been updated." });
    };
    
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users /> Forecast Inputs</CardTitle>
                    <CardDescription>Adjust these variables to model different scenarios for this specific investor.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                               <FormField control={form.control} name="membersPerMonth" render={({ field }) => ( <FormItem><FormLabel>New Members per Month</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem> )} />
                               <FormField control={form.control} name="projectionPeriod" render={({ field }) => ( <FormItem><FormLabel>Projection Period (Months)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem> )} />
                               <FormField control={form.control} name="membershipFee" render={({ field }) => ( <FormItem><FormLabel>Avg. Membership Fee (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem> )} />
                               <FormField control={form.control} name="avgSpendPerMember" render={({ field }) => ( <FormItem><FormLabel>Avg. Mall Spend / Member (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem> )} />
                               <FormField control={form.control} name="platformDiscount" render={({ field }) => ( <FormItem><FormLabel>Platform Discount (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem> )} />
                               <FormField control={form.control} name="opexPerMonth" render={({ field }) => ( <FormItem><FormLabel>Total OPEX per Month (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem> )} />
                            </div>
                            <Button type="submit">
                                <Save className="mr-2" />
                                Save & Update Forecast
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp /> Financial Forecast Results</CardTitle>
                    <CardDescription>A monthly projection based on the inputs you provided above.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ForecastResults inputs={currentInputs} />
                </CardContent>
            </Card>
        </div>
    );
}

