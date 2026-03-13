'use client';

import React, { useMemo, Suspense, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, AlertTriangle, Loader2 } from 'lucide-react';
import { salesRoadmapLogic, budgetLogic } from '@/app/adminaccount/lib/calculations';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R 0';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value);
};

function TurnoverComponent() {
    const [isClient, setIsClient] = useState(false);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        setIsClient(true);
        try {
            const settingsString = localStorage.getItem('accountFinancialSetup_v1');
            const budgetString = localStorage.getItem('accountBudgetAssumptions_v2');
            const salesRoadmapString = localStorage.getItem('accountSalesRoadmapScenarios_v1');
            const targetsString = localStorage.getItem('accountFinancialTargets_v1');
            
            const settings = settingsString ? JSON.parse(settingsString) : null;
            const budget = budgetString ? JSON.parse(budgetString) : null;
            
            const salesRoadmapData = salesRoadmapString ? JSON.parse(salesRoadmapString) : null;
            const activeScenarioName = salesRoadmapData?.activeScenario || 'Default';
            const salesRoadmap = salesRoadmapData?.scenarios?.[activeScenarioName] || null;

            const targets = targetsString ? JSON.parse(targetsString) : null;

            setData({ 
                salesInputs: salesRoadmap,
                budgetData: budget, 
                settings,
                targets,
            });
        } catch (e) {
            console.error("Failed to parse forecast data:", e);
            setData(null);
        }
    }, []);
    
    const { totalProjection } = useMemo(() => {
        if (!isClient || !data?.salesInputs || !data?.settings) {
            return { totalProjection: [] };
        }
        return salesRoadmapLogic(data.settings, data.salesInputs);
    }, [isClient, data]);

    const forecastData = useMemo(() => {
        if (totalProjection.length === 0 || !data?.budgetData || !data?.targets) return [];
        return budgetLogic(totalProjection, data.budgetData, data.targets);
    }, [totalProjection, data]);

     const yearlyTotals = useMemo(() => {
        const totals: Record<string, any> = {};
        if (!forecastData || forecastData.length === 0) return totals;
        
        forecastData.forEach(row => {
            if (!totals[row.year]) {
                 totals[row.year] = {
                    membershipRevenue: 0, connectPlanRevenue: 0, mallRevenue: 0, techRevenue: 0, totalRevenue: 0
                };
            }
            totals[row.year].membershipRevenue += row.membershipRevenue;
            totals[row.year].connectPlanRevenue += row.connectPlanRevenue;
            totals[row.year].mallRevenue += row.mallRevenue;
            totals[row.year].techRevenue += row.techRevenue;
            totals[row.year].totalRevenue += row.totalRevenue;
        });
        return totals;
    }, [forecastData]);

    if (!isClient) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (!data || !data.settings || !data.salesInputs || !data.budgetData || !data.targets || forecastData.length === 0) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle>Incomplete Data</CardTitle>
                    <CardDescription>
                        Please complete all input pages in the "Financials" section before viewing projections.
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
    
    const years = [...new Set(forecastData.map(d => d.year))];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign /> Turnover (Revenue) Projection</CardTitle>
                <CardDescription>This forecast is based on your assumptions. All figures are in ZAR.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="sticky left-0 bg-card z-10 w-[250px]">Revenue Stream</TableHead>
                            {years.map(year => (
                                <TableHead key={`total-${year}`} className="text-right bg-primary/10 font-bold">Total {year}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow><TableCell className="font-semibold sticky left-0 bg-card z-10">Membership Revenue</TableCell>{years.map(year => <TableCell key={`mem-${year}`} className="text-right font-mono bg-primary/10">{formatCurrency(yearlyTotals[year].membershipRevenue)}</TableCell>)}</TableRow>
                        <TableRow><TableCell className="font-semibold sticky left-0 bg-card z-10">Connect Plan Revenue</TableCell>{years.map(year => <TableCell key={`con-${year}`} className="text-right font-mono bg-primary/10">{formatCurrency(yearlyTotals[year].connectPlanRevenue)}</TableCell>)}</TableRow>
                        <TableRow><TableCell className="font-semibold sticky left-0 bg-card z-10">Mall Commission Revenue</TableCell>{years.map(year => <TableCell key={`mal-${year}`} className="text-right font-mono bg-primary/10">{formatCurrency(yearlyTotals[year].mallRevenue)}</TableCell>)}</TableRow>
                        <TableRow><TableCell className="font-semibold sticky left-0 bg-card z-10">Tech Services Revenue</TableCell>{years.map(year => <TableCell key={`tec-${year}`} className="text-right font-mono bg-primary/10">{formatCurrency(yearlyTotals[year].techRevenue)}</TableCell>)}</TableRow>
                        <TableRow className="bg-muted font-bold"><TableCell className="sticky left-0 bg-muted z-10 text-primary">Total Revenue</TableCell>{years.map(year => <TableCell key={`tot-${year}`} className="text-right font-mono text-primary bg-primary/10">{formatCurrency(yearlyTotals[year].totalRevenue)}</TableCell>)}</TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function TurnoverPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin" /></div>}>
            <TurnoverComponent />
        </Suspense>
    );
}
