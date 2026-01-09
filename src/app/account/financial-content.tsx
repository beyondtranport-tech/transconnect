'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sheet } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function FinancialContent() {
    const [startMonth, setStartMonth] = useState(new Date().getMonth());
    const [startYear, setStartYear] = useState(new Date().getFullYear());
    const [forecastMonths, setForecastMonths] = useState(36);

    // Membership Inputs
    const [basicPlanFee, setBasicPlanFee] = useState(150);
    const [standardPlanFee, setStandardPlanFee] = useState(300);
    const [premiumPlanFee, setPremiumPlanFee] = useState(500);

    const [basicPlanSales, setBasicPlanSales] = useState(10);
    const [standardPlanSales, setStandardPlanSales] = useState(5);
    const [premiumPlanSales, setPremiumPlanSales] = useState(2);


    const dateHeaders = useMemo(() => {
        const headers = [];
        let yearTotals = new Set<number>();

        for (let i = 0; i < forecastMonths; i++) {
            const date = new Date(startYear, startMonth + i);
            const month = monthNames[date.getMonth()];
            const year = date.getFullYear();
            headers.push({ type: 'month', label: `${month} ${year}` });

            if ((i + 1) % 12 === 0 && i < forecastMonths - 1) {
                headers.push({ type: 'year-total', label: `Total ${year}` });
                yearTotals.add(year);
            }
        }
        
        const lastYear = new Date(startYear, startMonth + forecastMonths - 1).getFullYear();
        if (!yearTotals.has(lastYear)) {
            headers.push({ type: 'year-total', label: `Total ${lastYear}` });
        }

        return headers;
    }, [startMonth, startYear, forecastMonths]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    }
    
    // --- CALCULATIONS ---
    const membershipRevenue = useMemo(() => {
        const basicRevenue = basicPlanFee * basicPlanSales;
        const standardRevenue = standardPlanFee * standardPlanSales;
        const premiumRevenue = premiumPlanFee * premiumPlanSales;
        return {
            basic: basicRevenue,
            standard: standardRevenue,
            premium: premiumRevenue,
            total: basicRevenue + standardRevenue + premiumRevenue,
        }
    }, [basicPlanFee, basicPlanSales, standardPlanFee, standardPlanSales, premiumPlanFee, premiumPlanSales]);
    

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <Sheet className="h-6 w-6" />
                   Financial Modeling Tool
                </CardTitle>
                <CardDescription>Adjust variables in real-time to see your financial forecast update instantly.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="max-w-4xl mx-auto">
                    <div className="p-4 border rounded-lg bg-muted/50 mb-8 space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">Forecast Settings</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-month">Start Month</Label>
                                    <Input id="start-month" type="number" value={startMonth + 1} onChange={e => setStartMonth(Number(e.target.value) - 1)} min="1" max="12" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="start-year">Start Year</Label>
                                    <Input id="start-year" type="number" value={startYear} onChange={e => setStartYear(Number(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="forecast-months"># of Months</Label>
                                    <Input id="forecast-months" type="number" value={forecastMonths} onChange={e => setForecastMonths(Number(e.target.value))} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Membership Assumptions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-4 border rounded-md bg-background space-y-4">
                                    <h4 className="font-medium text-center">Basic Plan</h4>
                                    <div className="space-y-2">
                                        <Label>Monthly Fee (R)</Label>
                                        <Input type="number" value={basicPlanFee} onChange={e => setBasicPlanFee(Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>New Memberships Sold / Month</Label>
                                        <Input type="number" value={basicPlanSales} onChange={e => setBasicPlanSales(Number(e.target.value))} />
                                    </div>
                                </div>
                                <div className="p-4 border rounded-md bg-background space-y-4">
                                    <h4 className="font-medium text-center">Standard Plan</h4>
                                    <div className="space-y-2">
                                        <Label>Monthly Fee (R)</Label>
                                        <Input type="number" value={standardPlanFee} onChange={e => setStandardPlanFee(Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>New Memberships Sold / Month</Label>
                                        <Input type="number" value={standardPlanSales} onChange={e => setStandardPlanSales(Number(e.target.value))} />
                                    </div>
                                </div>
                                <div className="p-4 border rounded-md bg-background space-y-4">
                                    <h4 className="font-medium text-center">Premium Plan</h4>
                                    <div className="space-y-2">
                                        <Label>Monthly Fee (R)</Label>
                                        <Input type="number" value={premiumPlanFee} onChange={e => setPremiumPlanFee(Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>New Memberships Sold / Month</Label>
                                        <Input type="number" value={premiumPlanSales} onChange={e => setPremiumPlanSales(Number(e.target.value))} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px] sticky left-0 bg-background/95 z-10">Description</TableHead>
                                <TableHead className="w-[150px] text-right">Period Total</TableHead>
                                {dateHeaders.map((header, index) => (
                                    <TableHead key={index} className={`w-[120px] text-right ${header.type === 'year-total' ? 'font-bold bg-muted/80' : ''}`}>
                                        {header.label}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* --- INCOME STATEMENT --- */}
                            <TableRow className="bg-muted/50 font-bold">
                                <TableCell colSpan={dateHeaders.length + 2} className="sticky left-0 bg-muted/95 z-10">
                                    Income Statement
                                </TableCell>
                            </TableRow>
                             <TableRow className="font-semibold">
                                <TableCell className="sticky left-0 bg-background z-10 pl-6">Total Revenue</TableCell>
                                <TableCell className="text-right font-mono"></TableCell>
                                {dateHeaders.map((_, index) => <TableCell key={index} className="text-right font-mono">...</TableCell>)}
                            </TableRow>
                            <TableRow>
                                <TableCell className="sticky left-0 bg-background z-10 pl-12">Membership Revenue</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(membershipRevenue.total * forecastMonths)}</TableCell>
                                {dateHeaders.map((header, index) => (
                                    <TableCell key={index} className={`text-right font-mono ${header.type === 'year-total' ? 'font-bold' : ''}`}>
                                        {header.type === 'month' ? formatCurrency(membershipRevenue.total) : formatCurrency(membershipRevenue.total * 12)}
                                    </TableCell>
                                ))}
                            </TableRow>
                             {/* Placeholder for future output rows */}
                            <TableRow>
                                <TableCell className="sticky left-0 bg-background z-10">Total Members</TableCell>
                                <TableCell className="text-right font-mono"></TableCell>
                                {dateHeaders.map((_, index) => <TableCell key={index} className="text-right font-mono">...</TableCell>)}
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
