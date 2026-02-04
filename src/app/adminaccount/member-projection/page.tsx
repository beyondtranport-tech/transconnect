
'use client';

import React, { useMemo, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AlertTriangle, Users, Map, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { salesRoadmapLogic } from '../lib/calculations';

const memberRoleGroups = [
    { role: 'Vendors', id: 'Vendors' },
    { role: 'Buyers', id: 'Buyers' },
    { role: 'Associates', id: 'Associates' },
    { role: 'ISA Agents', id: 'IsaAgents' },
    { role: 'Drivers', id: 'Drivers' },
    { role: 'Developers', id: 'Developers' }
];

function MemberProjectionComponent() {
    const { roadmapInputs, setupInputs } = useMemo(() => {
        if (typeof window === 'undefined') return { roadmapInputs: null, setupInputs: null };
        try {
            const salesRoadmapData = localStorage.getItem('accountSalesRoadmapScenarios_v1');
            const setupData = localStorage.getItem('accountFinancialSetup_v1');
            
            const activeScenarioName = salesRoadmapData ? JSON.parse(salesRoadmapData).activeScenario : 'Default';
            const scenarios = salesRoadmapData ? JSON.parse(salesRoadmapData).scenarios : null;

            return {
                roadmapInputs: scenarios ? scenarios[activeScenarioName] : null,
                setupInputs: setupData ? JSON.parse(setupData) : null,
            };
        } catch (e) {
            console.error("Failed to parse projection data", e);
            return { roadmapInputs: null, setupInputs: null };
        }
    }, []);

    const projectionData = useMemo(() => {
        if (!roadmapInputs || !setupInputs) return [];
        return salesRoadmapLogic(setupInputs, roadmapInputs);
    }, [roadmapInputs, setupInputs]);

    if (!roadmapInputs || !setupInputs) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle>Incomplete Projection Data</CardTitle>
                    <CardDescription>
                        Please complete the "Set Up" and "Sales Roadmap" pages in the Financials section first.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <Button asChild variant="outline">
                        <Link href="/adminaccount?view=sales-roadmap">Go to Sales Roadmap</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    const yearlyTotals = projectionData.reduce((acc, row) => {
        if (!acc[row.year]) {
            acc[row.year] = { powerPartnerNewMembers: 0, referralNewMembers: 0, totalNewMembers: 0, cumulativeMembers: 0 };
        }
        acc[row.year].powerPartnerNewMembers += row.powerPartnerNewMembers;
        acc[row.year].referralNewMembers += row.referralNewMembers;
        acc[row.year].totalNewMembers += row.totalNewMembers;
        acc[row.year].cumulativeMembers = row.cumulativeMembers; // Take the last value for cumulative
        return acc;
    }, {} as Record<string, any>);
    const years = Object.keys(yearlyTotals);

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users /> Total Member Growth Projection</CardTitle>
                    <CardDescription>Month-by-month forecast of new paying members based on your sales roadmap assumptions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[120px] sticky left-0 bg-card z-10">Month</TableHead>
                                    <TableHead className="text-right">New (Partners)</TableHead>
                                    <TableHead className="text-right">New (Referrals)</TableHead>
                                    <TableHead className="text-right font-bold text-primary">Total New</TableHead>
                                    <TableHead className="text-right font-bold text-primary">Cumulative</TableHead>
                                     {years.map(year => <TableHead key={year} className="text-right bg-muted font-bold">Total {year}</TableHead>)}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projectionData.map((row) => (
                                    <TableRow key={row.month}>
                                        <TableCell className="sticky left-0 bg-card z-10">{row.month}</TableCell>
                                        <TableCell className="text-right">{row.powerPartnerNewMembers.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">{row.referralNewMembers.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">{row.totalNewMembers.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">{row.cumulativeMembers.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-muted font-bold">
                                    <TableCell>Total</TableCell>
                                    <TableCell className="text-right">{Object.values(yearlyTotals).reduce((s, y) => s + y.powerPartnerNewMembers, 0).toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{Object.values(yearlyTotals).reduce((s, y) => s + y.referralNewMembers, 0).toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-primary">{Object.values(yearlyTotals).reduce((s, y) => s + y.totalNewMembers, 0).toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-primary">{yearlyTotals[years[years.length-1]]?.cumulativeMembers.toLocaleString()}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

export default function MemberProjectionPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin" /></div>}>
            <MemberProjectionComponent />
        </Suspense>
    );
}
