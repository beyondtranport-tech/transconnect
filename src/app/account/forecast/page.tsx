
'use client';

import React, { useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { salesRoadmapLogic, budgetLogic } from './calculations';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R 0';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', notation: 'compact', maximumFractionDigits: 0 }).format(value);
};

const formatNumber = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    return value.toLocaleString();
};

function ForecastComponent() {
    const searchParams = useSearchParams();
    const dataString = searchParams.get('data');

    const { salesInputs, budgetInputs } = useMemo(() => {
        if (!dataString) return { salesInputs: null, budgetInputs: null };
        try {
            const decoded = decodeURIComponent(dataString);
            return JSON.parse(decoded);
        } catch (e) {
            console.error("Failed to parse forecast data:", e);
            return { salesInputs: null, budgetInputs: null };
        }
    }, [dataString]);
    
    const roadmapData = useMemo(() => {
        if (!salesInputs) return [];
        return salesRoadmapLogic(salesInputs);
    }, [salesInputs]);

    const forecastData = useMemo(() => {
        if (roadmapData.length === 0 || !budgetInputs) return [];
        return budgetLogic(roadmapData, budgetInputs);
    }, [roadmapData, budgetInputs]);

    const yearlyTotals = useMemo(() => {
        const totals: Record<string, any> = {};
        if (!forecastData || forecastData.length === 0) return totals;
        
        forecastData.forEach(row => {
            if (!totals[row.year]) {
                totals[row.year] = { revenue: 0, cogs: 0, grossProfit: 0, opex: 0, netProfit: 0, members: 0 };
            }
            totals[row.year].revenue += row.revenue;
            totals[row.year].cogs += row.cogs;
            totals[row.year].grossProfit += row.grossProfit;
            totals[row.year].opex += row.opex;
            totals[row.year].netProfit += row.netProfit;
            totals[row.year].members = row.members; // Store last member count for the year
        });
        return totals;
    }, [forecastData]);

    const lineItems = [
        { key: 'members', label: 'Members', format: formatNumber },
        { key: 'revenue', label: 'Revenue', format: formatCurrency },
        { key: 'cogs', label: 'COGS', format: formatCurrency },
        { key: 'grossProfit', label: 'Gross Profit', format: formatCurrency, isBold: true, isPrimary: true },
        { key: 'opex', label: 'OPEX', format: formatCurrency },
        { key: 'netProfit', label: 'Net Profit', format: formatCurrency, isBold: true, isPrimary: true, isProfit: true },
    ];

    if (!salesInputs || !budgetInputs || forecastData.length === 0) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle>No Forecast Data</CardTitle>
                    <CardDescription>
                        It looks like you haven't generated a forecast yet. Please go to the budget page to enter your assumptions first.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <Button asChild>
                        <Link href="/account?view=budget">Go to Budget Page</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    // Get unique years for column grouping
    const years = [...new Set(forecastData.map(d => d.year))];

    return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp /> Income Statement Forecast</CardTitle>
            <CardDescription>This is a forecast based on the assumptions from the budget page. All figures in ZAR.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="sticky left-0 bg-card z-10 w-[150px]">Line Item</TableHead>
                        {forecastData.map((col) => (
                           <TableHead key={col.month} className="text-right">{col.month}</TableHead>
                        ))}
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
                            {forecastData.map(col => (
                                <TableCell key={`${item.key}-${col.month}`} className={`text-right font-mono text-xs ${item.isProfit && col[item.key as keyof typeof col] < 0 ? 'text-destructive' : ''}`}>
                                    {item.format(col[item.key as keyof typeof col])}
                                </TableCell>
                            ))}
                            {years.map(year => (
                                <TableCell key={`total-${item.key}-${year}`} className={`text-right bg-primary/10 font-bold font-mono text-sm ${item.isProfit && yearlyTotals[year][item.key] < 0 ? 'text-destructive' : ''}`}>
                                     {item.format(yearlyTotals[year][item.key])}
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

export default function ForecastPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <ForecastComponent />
        </Suspense>
    );
}
