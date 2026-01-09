'use client';

import React, { useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { salesRoadmapLogic, budgetLogic } from './calculations';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R 0';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', notation: 'compact', maximumFractionDigits: 0 }).format(value);
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
    
    // All hooks are now called unconditionally at the top level.
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
                totals[row.year] = {
                    revenue: 0, cogs: 0, grossProfit: 0, opex: 0, netProfit: 0, members: 0
                };
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

    // This conditional check happens *after* all hooks have been called.
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

    return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp /> Income Statement Forecast</CardTitle>
            <CardDescription>This is a forecast based on the assumptions from the budget page.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="sticky left-0 bg-card w-[100px]">Month</TableHead>
                        <TableHead className="text-right">Members</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">COGS</TableHead>
                        <TableHead className="text-right text-primary font-semibold">Gross Profit</TableHead>
                        <TableHead className="text-right">OPEX</TableHead>
                        <TableHead className="text-right text-primary font-bold">Net Profit</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {forecastData.map((row, index) => {
                        const isLastOfMonthInYear = row.month.startsWith('Dec');
                        const totalRow = yearlyTotals[row.year];
                        
                        return (
                            <React.Fragment key={index}>
                                <TableRow>
                                    <TableCell className="sticky left-0 bg-card">{row.month}</TableCell>
                                    <TableCell className="text-right font-mono text-xs">{row.members.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.cogs)}</TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(row.grossProfit)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.opex)}</TableCell>
                                    <TableCell className={`text-right font-bold ${row.netProfit < 0 ? 'text-destructive' : 'text-green-600'}`}>
                                        {formatCurrency(row.netProfit)}
                                    </TableCell>
                                </TableRow>
                                {isLastOfMonthInYear && totalRow && (
                                    <TableRow className="bg-primary/10 font-bold">
                                        <TableCell className="sticky left-0 bg-primary/10">Total {row.year}</TableCell>
                                        <TableCell className="text-right font-mono text-xs">{totalRow.members.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(totalRow.revenue)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(totalRow.cogs)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(totalRow.grossProfit)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(totalRow.opex)}</TableCell>
                                        <TableCell className={`text-right ${totalRow.netProfit < 0 ? 'text-destructive' : 'text-green-700'}`}>
                                            {formatCurrency(totalRow.netProfit)}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        );
                    })}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
    );
}

export default function ForecastPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ForecastComponent />
        </Suspense>
    );
}
