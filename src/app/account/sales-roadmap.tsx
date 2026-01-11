
'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Map, Loader2, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form } from '@/components/ui/form';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SETUP_KEY = 'accountFinancialSetup_v1';
const SALES_ROADMAP_KEY = 'accountSalesRoadmap_v1';

const salesAssumptions = [
    { id: 'initialTransporters', label: 'Initial Transporters', defaultValue: 1000 },
    { id: 'initialSuppliers', label: 'Initial Suppliers', defaultValue: 500 },
    { id: 'numberOfPowerPartners', label: '# Power Partners', defaultValue: 5 },
    { id: 'opportunitiesPerPartner', label: 'Opps per Partner', defaultValue: 2000 },
    { id: 'campaignConversionRate', label: 'Campaign Conversion (%)', defaultValue: 5 },
    { id: 'campaignDuration', label: 'Campaign Duration (mths)', defaultValue: 6 },
    { id: 'avgCustomersPerMember', label: 'Avg Customers / Member', defaultValue: 10 },
    { id: 'customerConversionRate', label: 'Customer Conversion (%)', defaultValue: 2 },
    { id: 'customerConversionLag', label: 'Conversion Lag (mths)', defaultValue: 3 },
    { id: 'numberOfIsas', label: '# of ISAs', defaultValue: 10 },
    { id: 'referralsPerIsa', label: 'Referrals per ISA', defaultValue: 50 },
    { id: 'isaConversionRate', label: 'ISA Conversion (%)', defaultValue: 10 },
];

const generateDefaultValues = (months: number) => {
    const defaults: { [key: string]: number[] } = {};
    salesAssumptions.forEach(assumption => {
        defaults[assumption.id] = Array(months).fill(assumption.defaultValue);
    });
    return { monthlyAssumptions: defaults };
};

function SalesRoadmapComponent() {
    const router = useRouter();
    const { toast } = useToast();
    const [forecastMonths, setForecastMonths] = useState(36);
    const [startMonth, setStartMonth] = useState(new Date().getMonth());
    const [startYear, setStartYear] = useState(new Date().getFullYear());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const savedSettings = localStorage.getItem(SETUP_KEY);
                if (savedSettings) {
                    const parsed = JSON.parse(savedSettings);
                    setForecastMonths(parsed.forecastMonths || 36);
                    setStartMonth(parsed.startMonth || new Date().getMonth());
                    setStartYear(parsed.startYear || new Date().getFullYear());
                }
            } catch (e) {
                console.error("Could not parse financial setup settings.");
            } finally {
                setIsLoading(false);
            }
        }
    }, []);

    const form = useForm({
        defaultValues: useCallback(() => {
            if (typeof window === 'undefined') {
                return generateDefaultValues(forecastMonths);
            }
            try {
                const savedData = localStorage.getItem(SALES_ROADMAP_KEY);
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    // Check if the number of months matches
                    const savedMonths = parsed.monthlyAssumptions[salesAssumptions[0].id]?.length || 0;
                    if (savedMonths === forecastMonths) {
                        return parsed;
                    }
                }
            } catch (e) {
                console.error("Failed to parse saved sales roadmap data.", e);
            }
            return generateDefaultValues(forecastMonths);
        }, [forecastMonths])()
    });

    const { control, handleSubmit, reset } = form;

    const monthHeaders = Array.from({ length: forecastMonths }, (_, i) => {
        const date = new Date(startYear, startMonth + i);
        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    });

    const onSubmit = (data: any) => {
        localStorage.setItem(SALES_ROADMAP_KEY, JSON.stringify(data));
        toast({
            title: "Sales Roadmap Saved!",
            description: "Your monthly sales assumptions have been saved locally.",
        });
        router.push(`/account?view=forecast`);
    };

    const handleReset = () => {
        const defaults = generateDefaultValues(forecastMonths);
        reset(defaults);
        toast({
            title: 'Sales Roadmap Reset',
            description: 'Assumptions have been reset to their default values.',
        });
    };
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader className="flex flex-row justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Map /> Sales Roadmap Assumptions</CardTitle>
                            <CardDescription>Enter your sales and growth assumptions for each month of the forecast period. This data is saved locally.</CardDescription>
                        </div>
                        <Button type="button" variant="outline" onClick={handleReset}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset to Defaults
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[250px] sticky left-0 bg-background z-10">Assumption</TableHead>
                                        {monthHeaders.map(header => (
                                            <TableHead key={header} className="w-[120px] text-center">{header}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {salesAssumptions.map((assumption) => (
                                        <TableRow key={assumption.id}>
                                            <TableCell className="font-medium sticky left-0 bg-background z-10">{assumption.label}</TableCell>
                                            {monthHeaders.map((_, monthIndex) => (
                                                <TableCell key={`${assumption.id}-${monthIndex}`}>
                                                    <Controller
                                                        name={`monthlyAssumptions.${assumption.id}.${monthIndex}`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Input
                                                                type="number"
                                                                className="h-8 w-24 text-center"
                                                                {...field}
                                                                onChange={e => field.onChange(Number(e.target.value))}
                                                            />
                                                        )}
                                                    />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </CardContent>
                </Card>

                <div className="mt-8 flex justify-end">
                    <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        Save Sales Roadmap
                    </Button>
                </div>
            </form>
        </Form>
    );
}


export default function SalesRoadmap() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin" /></div>}>
            <SalesRoadmapComponent />
        </Suspense>
    );
}

