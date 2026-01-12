'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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

const salesRoleGroups = [
    {
        role: 'Power Partners',
        description: 'Businesses with significant relationship bases (e.g., associations, brokers, depots).',
        assumptions: [
            { id: 'numberOfPowerPartners', label: '# of Power Partners', defaultValue: 5 },
            { id: 'opportunitiesPerPartner', label: 'Opps per Partner / Month', defaultValue: 50 },
            { id: 'powerPartnerConversion', label: '% Conversion to Member', defaultValue: 25 },
        ]
    },
    {
        role: 'Vendors',
        assumptions: [
            { id: 'referralsPerMemberVendors', label: '# of Referrals / Member / Month', defaultValue: 10 },
            { id: 'conversionToMemberVendors', label: '% Conversion to Member', defaultValue: 5 }
        ]
    },
    {
        role: 'Buyers',
        assumptions: [
            { id: 'referralsPerMemberBuyers', label: '# of Referrals / Member / Month', defaultValue: 10 },
            { id: 'conversionToMemberBuyers', label: '% Conversion to Member', defaultValue: 5 }
        ]
    },
    {
        role: 'Associates',
        assumptions: [
            { id: 'referralsPerMemberAssociates', label: '# of Referrals / Member / Month', defaultValue: 10 },
            { id: 'conversionToMemberAssociates', label: '% Conversion to Member', defaultValue: 10 }
        ]
    },
    {
        role: 'ISA Agents',
        assumptions: [
            { id: 'referralsPerMemberIsaAgents', label: '# of Referrals / Member / Month', defaultValue: 20 },
            { id: 'conversionToMemberIsaAgents', label: '% Conversion to Member', defaultValue: 25 }
        ]
    },
    {
        role: 'Drivers',
        assumptions: [
            { id: 'referralsPerMemberDrivers', label: '# of Referrals / Member / Month', defaultValue: 10 },
            { id: 'conversionToMemberDrivers', label: '% Conversion to Member', defaultValue: 5 }
        ]
    },
    {
        role: 'Developers',
        assumptions: [
            { id: 'referralsPerMemberDevelopers', label: '# of Referrals / Member / Month', defaultValue: 0 },
            { id: 'conversionToMemberDevelopers', label: '% Conversion to Member', defaultValue: 0 }
        ]
    },
];

const generateDefaultValues = (months: number) => {
    const defaults: { [key: string]: any } = {
        initialMembersVendors: 5,
        initialMembersBuyers: 5,
        initialMembersAssociates: 10,
        initialMembersIsaAgents: 5,
        initialMembersDrivers: 5,
        initialMembersDevelopers: 0,
    };
    salesRoleGroups.forEach(group => {
        group.assumptions.forEach(assumption => {
            defaults[assumption.id] = Array(months).fill(assumption.defaultValue);
        });
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
                    const firstAssumptionId = salesRoleGroups[0].assumptions[0].id;
                    const savedMonths = parsed.monthlyAssumptions[firstAssumptionId]?.length || 0;
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

    const { control, handleSubmit, register, reset } = form;

    const monthHeaders = Array.from({ length: forecastMonths }, (_, i) => {
        const date = new Date(startYear, startMonth + i);
        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    });

    const onSubmit = (data: any) => {
        const processedData = {
            monthlyAssumptions: {
                ...data.monthlyAssumptions,
                initialMembersVendors: Number(data.monthlyAssumptions.initialMembersVendors),
                initialMembersBuyers: Number(data.monthlyAssumptions.initialMembersBuyers),
                initialMembersAssociates: Number(data.monthlyAssumptions.initialMembersAssociates),
                initialMembersIsaAgents: Number(data.monthlyAssumptions.initialMembersIsaAgents),
                initialMembersDrivers: Number(data.monthlyAssumptions.initialMembersDrivers),
                initialMembersDevelopers: Number(data.monthlyAssumptions.initialMembersDevelopers)
            }
        }
        localStorage.setItem(SALES_ROADMAP_KEY, JSON.stringify(processedData));
        toast({
            title: "Referral Targets Saved!",
            description: "Your monthly referral targets have been saved locally.",
        });
        router.push('/account?view=member-projection');
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
                            <CardTitle className="flex items-center gap-2"><Map /> Sales Conversion Funnel</CardTitle>
                            <CardDescription>Set your monthly referral targets and conversion rates for each member role. This data is saved locally.</CardDescription>
                        </div>
                         <Button type="button" variant="outline" onClick={handleReset}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset to Defaults
                        </Button>
                    </CardHeader>
                </Card>

                <div className="space-y-6">
                    {salesRoleGroups.map(group => (
                        <Card key={group.role}>
                            <CardHeader>
                                <CardTitle className="text-xl">{group.role}</CardTitle>
                                {group.description && <CardDescription>{group.description}</CardDescription>}
                                {group.role !== 'Power Partners' && (
                                    <div className="pt-4">
                                        <Controller
                                            name={`monthlyAssumptions.initialMembers${group.role.replace(/\s+/g, '')}`}
                                            control={control}
                                            render={({ field }) => (
                                                <FormItem className="max-w-xs">
                                                    <FormLabel>Initial # of Members</FormLabel>
                                                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
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
                                            {group.assumptions.map((assumption) => (
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
                                                                        value={field.value ?? ''}
                                                                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
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
                    ))}
                </div>

                <div className="mt-8 flex justify-end">
                    <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        Save Sales Roadmap & View Projection
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
