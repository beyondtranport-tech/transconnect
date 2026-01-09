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
            </div>


            <Card>
                <CardHeader>
                    <CardTitle>Income Statement</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="sticky left-0 bg-card w-[250px]">Description</TableHead>
                                {forecastPeriod.map((p, i) => (
                                    <TableHead key={i} className="text-center">{p.month} {p.year}</TableHead>
                                ))}
                                {yearlyTotalsColumns.map(year => (
                                    <TableHead key={`total-${year}`} className="text-right font-bold">Total {year}</TableHead>
                                ))}
                                <TableHead className="text-right font-bold">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* This is where the assumption and revenue rows will go */}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
