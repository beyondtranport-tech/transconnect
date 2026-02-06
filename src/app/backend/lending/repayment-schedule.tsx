
'use client';

import React, { useMemo } from 'react';
import { useSearchParams, notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Sheet, AlertTriangle, ArrowLeft } from 'lucide-react';
import { generateAmortizationSchedule } from './loan-calculations';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R 0.00';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const formatDate = (date: Date) => {
    if (!date || isNaN(date.getTime())) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

function RepaymentScheduleContent() {
    const searchParams = useSearchParams();

    const principal = Number(searchParams.get('principal') || '0');
    const rate = Number(searchParams.get('rate') || '0');
    const term = Number(searchParams.get('term') || '0');
    const firstInstallmentDate = searchParams.get('firstInstallmentDate') || new Date().toISOString().split('T')[0];
    const paymentsInAdvance = searchParams.get('paymentsInAdvance') === 'true';
    const type = searchParams.get('type') || 'Loan';
    
    const schedule = useMemo(() => {
        return generateAmortizationSchedule(principal, rate, term, firstInstallmentDate, paymentsInAdvance);
    }, [principal, rate, term, firstInstallmentDate, paymentsInAdvance]);
    
    const totalInterest = useMemo(() => {
        if (schedule.length === 0) return 0;
        return schedule.reduce((acc, row) => acc + row.interest, 0);
    }, [schedule]);

    if (!principal || !term) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle>Incomplete Data</CardTitle>
                    <CardDescription>
                        Principal, term, and rate must be provided to generate a schedule.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                     <Button asChild variant="outline">
                        <Link href="/backend?view=lending-assumptions">Back to Assumptions</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="w-full max-w-6xl mx-auto">
            <CardHeader>
                 <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Sheet /> Repayment Schedule</CardTitle>
                        <CardDescription>
                            A detailed amortization schedule based on your inputs. This is for illustrative purposes.
                        </CardDescription>
                    </div>
                     <Button variant="outline" asChild>
                        <Link href="/backend?view=lending-assumptions"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Assumptions</Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="p-4 rounded-lg border bg-muted mb-6">
                    <h3 className="font-semibold text-lg">Loan Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-2 text-sm">
                        <div className="space-y-1"><p className="text-muted-foreground">Client</p><p className="font-semibold">Psalm Trading CC</p></div>
                        <div className="space-y-1"><p className="text-muted-foreground">Client Status</p><p className="font-semibold">Captured</p></div>
                        <div className="space-y-1"><p className="text-muted-foreground">Agreement Status</p><p className="font-semibold">Pending</p></div>
                        <div className="space-y-1"><p className="text-muted-foreground">Type</p><p className="font-semibold capitalize">{type}</p></div>
                        <div className="space-y-1"><p className="text-muted-foreground">Principal</p><p className="font-semibold font-mono">{formatCurrency(principal)}</p></div>
                        <div className="space-y-1"><p className="text-muted-foreground">Financial Charges</p><p className="font-semibold font-mono">{formatCurrency(totalInterest)}</p></div>
                        <div className="space-y-1"><p className="text-muted-foreground">Interest Rate</p><p className="font-semibold font-mono">{rate}%</p></div>
                        <div className="space-y-1"><p className="text-muted-foreground">Current Prime</p><p className="font-semibold font-mono">7.75%</p></div>
                        <div className="space-y-1"><p className="text-muted-foreground"># Instalments</p><p className="font-semibold font-mono">{term}</p></div>
                        <div className="space-y-1"><p className="text-muted-foreground">Current Instalment</p><p className="font-semibold font-mono">{formatCurrency(schedule[0]?.payment || 0)}</p></div>
                    </div>
                </div>
                <div className="border rounded-md overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>No</TableHead>
                                <TableHead>Billed</TableHead>
                                <TableHead>Date Billed</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead className="text-right">Capital</TableHead>
                                <TableHead className="text-right">Interest</TableHead>
                                <TableHead className="text-right">Instalment</TableHead>
                                <TableHead className="text-right">Capital Paid</TableHead>
                                <TableHead className="text-right">Interest Paid</TableHead>
                                <TableHead className="text-right">Total Paid</TableHead>
                                <TableHead className="text-right">Capital o/s</TableHead>
                                <TableHead className="text-right">Total Balance o/s</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {schedule.map(row => (
                                <TableRow key={row.month}>
                                    <TableCell>{formatDate(row.date)}</TableCell>
                                    <TableCell>{row.month}</TableCell>
                                    <TableCell></TableCell> {/* Billed */}
                                    <TableCell></TableCell> {/* Date Billed */}
                                    <TableCell>{rate.toFixed(2)}%</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.principal)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.interest)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.payment)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.capitalPaid)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.interestPaid)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.totalPaid)}</TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(row.remainingBalance)}</TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(row.totalBalanceOwed)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={5} className="font-bold">Totals</TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(schedule.reduce((acc, r) => acc + r.principal, 0))}</TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(totalInterest)}</TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(schedule.reduce((acc, r) => acc + r.payment, 0))}</TableCell>
                                <TableCell colSpan={5}></TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

export default function RepaymentSchedulePage() {
    return (
        <div className="py-16">
            <React.Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
                <RepaymentScheduleContent />
            </React.Suspense>
        </div>
    )
}
