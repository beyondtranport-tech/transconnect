
'use client';

import React, { useMemo, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { salesRoadmapLogic, budgetLogic } from './lib/calculations';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R 0';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value);
};

function IncomeStatementComponent() {
    const { salesInputs, budgetData, settings, targets } = useMemo(() => {
        if (typeof window === 'undefined') return { salesInputs: null, budgetData: null, settings: null, targets: null };
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

            return { 
                salesInputs: salesRoadmap,
                budgetData: budget, 
                settings,
                targets,
            };
        } catch (e) {
            console.error("Failed to parse forecast data:", e);
            return { salesInputs: null, budgetData: null, settings: null, targets: null };
        }
    }, []);
    
    const roadmapData = useMemo(() => {
        if (!salesInputs || !settings) return [];
        return salesRoadmapLogic(settings, salesInputs);
    }, [salesInputs, settings]);

    const forecastData = useMemo(() => {
        if (roadmapData.length === 0 || !budgetData || !targets) return [];
        return budgetLogic(roadmapData, budgetData, targets);
    }, [roadmapData, budgetData, targets]);

     const yearlyTotals = useMemo(() => {
        const totals: Record<string, any> = {};
        if (!forecastData || forecastData.length === 0) return totals;
        
        forecastData.forEach(row => {
            if (!totals[row.year]) {
                 totals[row.year] = {
                    totalRevenue: 0, totalCogs: 0, grossProfit: 0, totalOpex: 0, netProfit: 0
                };
            }
            totals[row.year].totalRevenue += row.totalRevenue;
            totals[row.year].totalCogs += row.totalCogs;
            totals[row.year].grossProfit += row.grossProfit;
            totals[row.year].totalOpex += row.totalOpex;
            totals[row.year].netProfit += row.netProfit;
        });
        return totals;
    }, [forecastData]);

    const lineItems = [
        { key: 'totalRevenue', label: 'Total Revenue', format: formatCurrency, isBold: true, isPrimary: true },
        { key: 'totalCogs', label: 'Total COGS', format: formatCurrency, isBold: true },
        { key: 'grossProfit', label: 'Gross Profit', format: formatCurrency, isBold: true, isPrimary: true },
        { key: 'totalOpex', label: 'Total OPEX', format: formatCurrency, isBold: true },
        { key: 'netProfit', label: 'Net Profit', format: formatCurrency, isBold: true, isPrimary: true, isProfit: true },
    ];

    if (!settings || !salesInputs || !budgetData || !targets || forecastData.length === 0) {
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
                <CardTitle className="flex items-center gap-2"><TrendingUp /> Income Statement (P&L) Forecast</CardTitle>
                <CardDescription>This forecast is based on your assumptions. All figures are in ZAR.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="sticky left-0 bg-card z-10 w-[250px]">Line Item</TableHead>
                            {years.map(year => (
                                <TableHead key={`total-${year}`} className="text-right bg-primary/10 font-bold">Total {year}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lineItems.map(item => (
                            <TableRow key={item.key}>
                                <TableCell className={`sticky left-0 bg-card z-10 ${item.isBold ? 'font-semibold' : ''} ${item.isPrimary ? 'text-primary' : ''}`}>
                                    {item.label}
                                </TableCell>
                                {years.map(year => (
                                    <TableCell key={`total-${item.key}-${year}`} className={`text-right bg-primary/10 font-bold font-mono text-sm ${item.isProfit && yearlyTotals[year]?.[item.key] < 0 ? 'text-destructive' : ''}`}>
                                        {item.format && yearlyTotals[year] ? item.format(yearlyTotals[year][item.key]) : ''}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function IncomeStatementPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin" /></div>}>
            <IncomeStatementComponent />
        </Suspense>
    );
}
