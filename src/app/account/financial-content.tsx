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

    const dateHeaders = useMemo(() => {
        const headers = [];
        let yearTotals = new Set<number>();

        for (let i = 0; i < forecastMonths; i++) {
            const date = new Date(startYear, startMonth + i);
            const month = monthNames[date.getMonth()];
            const year = date.getFullYear();
            headers.push({ type: 'month', label: `${month} ${year}` });

            // Add a total column after every 12 months or at the end
            if ((i + 1) % 12 === 0 && i < forecastMonths - 1) {
                headers.push({ type: 'year-total', label: `Total ${year}` });
                yearTotals.add(year);
            }
        }
        
        // Add final year total if it wasn't already added
        const lastYear = new Date(startYear, startMonth + forecastMonths - 1).getFullYear();
        if (!yearTotals.has(lastYear)) {
            headers.push({ type: 'year-total', label: `Total ${lastYear}` });
        }


        return headers;
    }, [startMonth, startYear, forecastMonths]);
    

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
                <div className="p-4 border rounded-lg bg-muted/50 mb-8">
                     <h3 className="font-semibold mb-2">Forecast Settings</h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start-month">Start Month</Label>
                            <Input id="start-month" type="number" value={startMonth + 1} onChange={e => setStartMonth(Number(e.target.value) - 1)} />
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
                            <TableRow className="bg-muted/50 font-bold">
                                <TableCell colSpan={dateHeaders.length + 2} className="sticky left-0 bg-muted/95 z-10">
                                    Budget Inputs
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="sticky left-0 bg-background z-10">Start Month</TableCell>
                                <TableCell className="text-right font-mono"></TableCell>
                                {dateHeaders.map((_, index) => <TableCell key={index}></TableCell>)}
                            </TableRow>
                            <TableRow>
                                <TableCell className="sticky left-0 bg-background z-10">Start Year</TableCell>
                                <TableCell className="text-right font-mono"></TableCell>
                                 {dateHeaders.map((_, index) => <TableCell key={index}></TableCell>)}
                            </TableRow>
                             <TableRow>
                                <TableCell className="sticky left-0 bg-background z-10"># of Months</TableCell>
                                <TableCell className="text-right font-mono"></TableCell>
                                 {dateHeaders.map((_, index) => <TableCell key={index}></TableCell>)}
                            </TableRow>
                             <TableRow className="bg-muted/50 font-bold">
                                <TableCell colSpan={dateHeaders.length + 2} className="sticky left-0 bg-muted/95 z-10">
                                    Forecast Output
                                </TableCell>
                            </TableRow>
                            {/* Placeholder for future output rows */}
                            <TableRow>
                                <TableCell className="sticky left-0 bg-background z-10">Total Members</TableCell>
                                <TableCell className="text-right font-mono"></TableCell>
                                {dateHeaders.map((_, index) => <TableCell key={index} className="text-right font-mono">...</TableCell>)}
                            </TableRow>
                            <TableRow>
                                <TableCell className="sticky left-0 bg-background z-10">Revenue</TableCell>
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
