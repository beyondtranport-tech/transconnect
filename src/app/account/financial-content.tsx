'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sheet, DollarSign, Users, ShoppingCart, Percent } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function FinancialContent() {
    const [startMonth, setStartMonth] = useState(new Date().getMonth());
    const [startYear, setStartYear] = useState(new Date().getFullYear());
    const [forecastMonths, setForecastMonths] = useState(36);

    const [membershipFees, setMembershipFees] = useState({ basic: 100, standard: 250, premium: 500 });
    const [membershipsSold, setMembershipsSold] = useState({ basic: 10, standard: 5, premium: 2 });
    
    const forecastPeriod = useMemo(() => {
        const period = [];
        for (let i = 0; i < forecastMonths; i++) {
            const date = new Date(startYear, startMonth + i, 1);
            period.push({
                month: monthNames[date.getMonth()],
                year: date.getFullYear(),
            });
        }
        return period;
    }, [startMonth, startYear, forecastMonths]);

    const yearlyTotalsColumns = useMemo(() => {
        const years = [...new Set(forecastPeriod.map(p => p.year))];
        return years;
    }, [forecastPeriod]);

    const handleMembershipFeeChange = (plan: 'basic' | 'standard' | 'premium', value: string) => {
        setMembershipFees(prev => ({ ...prev, [plan]: Number(value) || 0 }));
    };

    const handleMembershipsSoldChange = (plan: 'basic' | 'standard' | 'premium', value: string) => {
        setMembershipsSold(prev => ({ ...prev, [plan]: Number(value) || 0 }));
    };
    
    const renderTableRows = (count: number) => {
        return Array(count).fill(0).map((_, i) => <TableCell key={i} className="text-right">0.00</TableCell>);
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sheet /> Financial Modeling</CardTitle>
                    <CardDescription>A dynamic tool for forecasting your business's financial future. Adjust assumptions to see real-time impacts on your income statement.</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Forecast Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="start-month">Start Month</Label>
                            <Select value={String(startMonth)} onValueChange={v => setStartMonth(Number(v))}>
                                <SelectTrigger className="w-[180px]" id="start-month"><SelectValue /></SelectTrigger>
                                <SelectContent>{monthNames.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="start-year">Start Year</Label>
                            <Input id="start-year" type="number" value={startYear} onChange={e => setStartYear(Number(e.target.value))} className="w-[180px]" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="forecast-months">Months to Forecast</Label>
                            <Input id="forecast-months" type="number" value={forecastMonths} onChange={e => setForecastMonths(Number(e.target.value))} className="w-[180px]" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                     <CardHeader>
                        <CardTitle>Membership Assumptions</CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div>
                                <Label>Basic Plan Monthly Fee (R)</Label>
                                <Input type="number" value={membershipFees.basic} onChange={e => handleMembershipFeeChange('basic', e.target.value)} />
                            </div>
                            <div>
                                <Label>Standard Plan Monthly Fee (R)</Label>
                                <Input type="number" value={membershipFees.standard} onChange={e => handleMembershipFeeChange('standard', e.target.value)} />
                            </div>
                            <div>
                                <Label>Premium Plan Monthly Fee (R)</Label>
                                <Input type="number" value={membershipFees.premium} onChange={e => handleMembershipFeeChange('premium', e.target.value)} />
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>New Basic Memberships / Month</Label>
                                <Input type="number" value={membershipsSold.basic} onChange={e => handleMembershipsSoldChange('basic', e.target.value)} />
                            </div>
                             <div>
                                <Label>New Standard Memberships / Month</Label>
                                <Input type="number" value={membershipsSold.standard} onChange={e => handleMembershipsSoldChange('standard', e.target.value)} />
                            </div>
                             <div>
                                <Label>New Premium Memberships / Month</Label>
                                <Input type="number" value={membershipsSold.premium} onChange={e => handleMembershipsSoldChange('premium', e.target.value)} />
                            </div>
                        </div>
                     </CardContent>
                </Card>
            </div>


            <Card>
                <CardHeader>
                    <CardTitle>Income Statement</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="sticky left-0 bg-card w-[250px] min-w-[250px]">Description</TableHead>
                                {forecastPeriod.map((p, i) => (
                                    <TableHead key={i} className="text-center min-w-[120px]">{p.month} {p.year}</TableHead>
                                ))}
                                {yearlyTotalsColumns.map(year => (
                                    <TableHead key={`total-${year}`} className="text-right font-bold min-w-[150px]">Total {year}</TableHead>
                                ))}
                                <TableHead className="text-right font-bold min-w-[150px]">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Revenue Section */}
                            <TableRow className="font-bold bg-muted/50"><TableCell className="sticky left-0 bg-muted/50">Revenue</TableCell><TableCell colSpan={forecastMonths + yearlyTotalsColumns.length + 1}></TableCell></TableRow>
                            <TableRow><TableCell className="sticky left-0 bg-card pl-8">Membership Fees</TableCell>{forecastPeriod.map((_, i) => <TableCell key={i} className="text-right">{(membershipFees.basic * membershipsSold.basic + membershipFees.standard * membershipsSold.standard + membershipFees.premium * membershipsSold.premium).toFixed(2)}</TableCell>)}{renderTableRows(yearlyTotalsColumns.length + 1)}</TableRow>
                            <TableRow><TableCell className="sticky left-0 bg-card pl-8">Mall Commission Revenue</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                            <TableRow><TableCell className="sticky left-0 bg-card pl-8">Marketplace Fees</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                            <TableRow><TableCell className="sticky left-0 bg-card pl-8">Connect Plan Revenue</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                            <TableRow><TableCell className="sticky left-0 bg-card pl-8">Tech Services Revenue</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                            <TableRow className="font-semibold border-t-2 border-foreground"><TableCell className="sticky left-0 bg-card">Total Revenue</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>

                            {/* Cost of Revenue Section */}
                            <TableRow className="font-bold bg-muted/50"><TableCell className="sticky left-0 bg-muted/50">Cost of Revenue</TableCell><TableCell colSpan={forecastMonths + yearlyTotalsColumns.length + 1}></TableCell></TableRow>
                            <TableRow><TableCell className="sticky left-0 bg-card pl-8">Member Commission Share</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                            <TableRow><TableCell className="sticky left-0 bg-card pl-8">ISA Commission</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                            <TableRow className="font-semibold"><TableCell className="sticky left-0 bg-card">Total Cost of Revenue</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>

                            {/* Gross Profit */}
                            <TableRow className="font-bold text-lg border-y-2 border-foreground bg-primary/10"><TableCell className="sticky left-0 bg-primary/10">Gross Profit</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                            
                            {/* Operating Expenses Section */}
                            <TableRow className="font-bold bg-muted/50"><TableCell className="sticky left-0 bg-muted/50">Operating Expenses (OPEX)</TableCell><TableCell colSpan={forecastMonths + yearlyTotalsColumns.length + 1}></TableCell></TableRow>
                            <TableRow><TableCell className="sticky left-0 bg-card pl-8 font-semibold">Salaries & Wages</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                            <TableRow><TableCell className="sticky left-0 bg-card pl-12">Sales & Marketing</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                            <TableRow><TableCell className="sticky left-0 bg-card pl-8 font-semibold">General & Administrative</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                            <TableRow><TableCell className="sticky left-0 bg-card pl-12">Rent</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                            <TableRow><TableCell className="sticky left-0 bg-card pl-12">Utilities</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                            <TableRow><TableCell className="sticky left-0 bg-card pl-12">Insurance</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                            <TableRow><TableCell className="sticky left-0 bg-card pl-8 font-semibold">Technology & R&D</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                             <TableRow className="font-semibold"><TableCell className="sticky left-0 bg-card">Total Operating Expenses</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                            
                            {/* EBIT */}
                            <TableRow className="font-bold border-t-2 border-foreground"><TableCell className="sticky left-0 bg-card">Operating Income (EBITDA)</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                            <TableRow><TableCell className="sticky left-0 bg-card pl-8">Depreciation & Amortization</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                            <TableRow className="font-semibold"><TableCell className="sticky left-0 bg-card">Earnings Before Interest & Tax (EBIT)</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                            
                            {/* Net Income */}
                             <TableRow><TableCell className="sticky left-0 bg-card pl-8">Interest Expense</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                            <TableRow className="font-semibold"><TableCell className="sticky left-0 bg-card">Earnings Before Tax (EBT)</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                             <TableRow><TableCell className="sticky left-0 bg-card pl-8">Income Tax Expense</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                            <TableRow className="font-bold text-lg border-y-2 border-foreground bg-primary/10"><TableCell className="sticky left-0 bg-primary/10">Net Income</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>

                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
