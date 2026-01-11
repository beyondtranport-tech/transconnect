'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, Users, Percent, Loader2, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Form } from '@/components/ui/form';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SETUP_KEY = 'accountFinancialSetup_v1';
const BUDGET_KEY = 'accountBudgetAssumptions_v2';

const assumptionGroups = {
    revenue: [
        { id: 'membershipFees', label: 'Avg. Membership Fee', defaultValue: 250 },
        { id: 'connectPlanAdoptionRate', label: 'Connect Plan Adoption (%)', defaultValue: 15 },
        { id: 'avgConnectPlanFee', label: 'Avg. Connect Plan Fee', defaultValue: 50 },
        { id: 'mallCommissionRate', label: 'Mall Commission (%)', defaultValue: 2.5 },
        { id: 'avgMallSpendPerMember', label: 'Avg. Mall Spend / Member', defaultValue: 1000 },
        { id: 'techServicesAdoptionRate', label: 'Tech Services Adoption (%)', defaultValue: 10 },
        { id: 'avgTechSpendPerMember', label: 'Avg. Tech Spend / Member', defaultValue: 150 },
    ],
    cogs: [
        { id: 'isaCommissionRate', label: 'ISA Commission Rate (%)', defaultValue: 20 },
    ],
    opexOther: [
        { id: 'digitalAdvertising', label: 'Digital Advertising', defaultValue: 30000 },
        { id: 'contentCreation', label: 'Content & SEO', defaultValue: 15000 },
        { id: 'eventsAndSponsorships', label: 'Events & Sponsorships', defaultValue: 10000 },
        { id: 'officeRental', label: 'Office Rental', defaultValue: 35000 },
        { id: 'utilities', label: 'Utilities', defaultValue: 15000 },
        { id: 'insurance', label: 'Insurance', defaultValue: 5000 },
        { id: 'legalAndProfessional', label: 'Legal & Professional Fees', defaultValue: 10000 },
        { id: 'bankCharges', label: 'Bank Charges', defaultValue: 2000 },
        { id: 'telephone', label: 'Telephone & Comms', defaultValue: 8000 },
        { id: 'travelAndEntertainment', label: 'Travel & Entertainment', defaultValue: 5000 },
        { id: 'platformCosts', label: 'Platform Hosting', defaultValue: 20000 },
        { id: 'softwareLicenses', label: 'Software Licenses', defaultValue: 10000 },
    ]
};

const generateDefaultValues = (months: number) => {
    const defaults: any = { budgetInputs: {}, opexSalaries: [] };
    Object.keys(assumptionGroups).forEach(groupKey => {
        const key = groupKey as keyof typeof assumptionGroups;
        defaults.budgetInputs[key] = {};
        assumptionGroups[key].forEach(assumption => {
            defaults.budgetInputs[key][assumption.id] = Array(months).fill(assumption.defaultValue);
        });
    });
     defaults.opexSalaries = [
        { role: 'Executive Director', count: 1, salary: 150000 },
        { role: 'Non-Executive Director', count: 2, salary: 25000 },
        { role: 'Manager', count: 3, salary: 75000 },
        { role: 'Admin', count: 4, salary: 35000 },
    ];
    return defaults;
};


function BudgetPageComponent() {
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
                console.error("Could not parse financial setup settings for budget page.");
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
                const savedData = localStorage.getItem(BUDGET_KEY);
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    const firstAssumption = assumptionGroups.revenue[0].id;
                    const savedMonths = parsed.budgetInputs.revenue[firstAssumption]?.length || 0;
                    if (savedMonths === forecastMonths) {
                        return parsed;
                    }
                }
            } catch (e) {
                console.error("Failed to parse saved budget data.", e);
            }
            return generateDefaultValues(forecastMonths);
        }, [forecastMonths])()
    });

    const { control, handleSubmit, reset } = form;

    const { fields: staffFields } = useFieldArray({
        control,
        name: "opexSalaries"
    });

    const monthHeaders = Array.from({ length: forecastMonths }, (_, i) => {
        const date = new Date(startYear, startMonth + i);
        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    });
    
    const onSubmit = (data: any) => {
        localStorage.setItem(BUDGET_KEY, JSON.stringify(data));
        
        toast({
            title: "Budget Saved!",
            description: "Your monthly assumptions have been saved. Redirecting to the forecast.",
        });

        router.push(`/account?view=forecast`);
    };

     const handleReset = () => {
        const defaults = generateDefaultValues(forecastMonths);
        reset(defaults);
        toast({
            title: 'Budget Reset',
            description: 'Assumptions have been reset to their default values.',
        });
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    const renderAssumptionRows = (groupKey: keyof typeof assumptionGroups) => (
        assumptionGroups[groupKey].map((assumption) => (
            <TableRow key={assumption.id}>
                <TableCell className="font-medium sticky left-0 bg-background z-10">{assumption.label}</TableCell>
                {monthHeaders.map((_, monthIndex) => (
                    <TableCell key={`${assumption.id}-${monthIndex}`}>
                        <Controller
                            name={`budgetInputs.${groupKey}.${assumption.id}.${monthIndex}`}
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    className="h-8 w-24 text-center"
                                    {...field}
                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                            )}
                        />
                    </TableCell>
                ))}
            </TableRow>
        ))
    );

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader className="flex flex-row justify-between items-start">
                        <div>
                            <CardTitle>Budget Assumptions</CardTitle>
                            <CardDescription>Enter your monthly assumptions for Revenue, COGS, and Operating Expenses.</CardDescription>
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
                                        {monthHeaders.map(header => <TableHead key={header} className="w-[120px] text-center">{header}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow className="bg-muted/50 font-semibold"><TableCell colSpan={forecastMonths + 1}><DollarSign className="inline h-4 w-4 mr-2"/>Revenue</TableCell></TableRow>
                                    {renderAssumptionRows('revenue')}
                                    <TableRow className="bg-muted/50 font-semibold"><TableCell colSpan={forecastMonths + 1}><Percent className="inline h-4 w-4 mr-2"/>COGS</TableCell></TableRow>
                                    {renderAssumptionRows('cogs')}
                                    <TableRow className="bg-muted/50 font-semibold"><TableCell colSpan={forecastMonths + 1}><Users className="inline h-4 w-4 mr-2"/>Other Operating Expenses</TableCell></TableRow>
                                    {renderAssumptionRows('opexOther')}
                                </TableBody>
                            </Table>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Users />Salaries (Static)</CardTitle><CardDescription>Enter the static monthly salary and headcount for each role. These values will be used for all months.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-3 gap-4 font-semibold text-sm px-2">
                            <h3>Role</h3><h3>Headcount</h3><h3>Monthly Salary (ZAR)</h3>
                        </div>
                        <div className="space-y-2">
                            {staffFields.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-3 gap-4">
                                    <Input value={item.role} disabled />
                                    <FormField name={`opexSalaries.${index}.count`} control={control} render={({field}) => <FormItem><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                                    <FormField name={`opexSalaries.${index}.salary`} control={control} render={({field}) => <FormItem><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                
                <div className="mt-8 flex justify-end">
                    <Button type="submit">
                        <Save className="mr-2 h-4 w-4"/>
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
            <BudgetPageComponent />
        </Suspense>
    );
}
