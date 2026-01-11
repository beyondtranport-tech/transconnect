
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
const SALES_ROADMAP_KEY = 'accountSalesRoadmap_v2'; // Changed version

const salesAssumptions = [
    { id: 'referralsVendors', label: '# of Referrals (Vendors)', defaultValue: 10 },
    { id: 'referralsBuyers', label: '# of Referrals (Buyers)', defaultValue: 10 },
    { id: 'referralsPartners', label: '# of Referrals (Partners)', defaultValue: 1 },
    { id: 'referralsAssociates', label: '# of Referrals (Associates)', defaultValue: 10 },
    { id: 'referralsIsaAgents', label: '# of Referrals (ISA Agents)', defaultValue: 5 },
    { id: 'referralsDrivers', label: '# of Referrals (Drivers)', defaultValue: 10 },
    { id: 'referralsDevelopers', label: '# of Referrals (Developers)', defaultValue: 10 },
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
            title: "Referral Targets Saved!",
            description: "Your monthly referral targets have been saved locally.",
        });
        // You might want to navigate to another page to see the effect of these targets.
        // For now, we'll just save.
    };

    const handleReset = () => {
        const defaults = generateDefaultValues(forecastMonths);
        reset(defaults);
        toast({
            title: 'Referral Targets Reset',
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
                            <CardTitle className="flex items-center gap-2"><Map /> Referral Targets</CardTitle>
                            <CardDescription>Set your monthly referral targets for each member role. This data is saved locally.</CardDescription>
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
                                        <TableHead className="w-[250px] sticky left-0 bg-background z-10">Target Metric</TableHead>
                                        {monthHeaders.map(header => (
                                            <TableHead key={header} className="w-[120px] text-center">{header}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {salesAssumptions.map((assumption) => (
                                        <TableRow key={assumption.id} className="border-b-0">
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
                        Save Referral Targets
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
