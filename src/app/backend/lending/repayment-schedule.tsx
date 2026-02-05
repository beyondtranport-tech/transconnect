
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { generateAmortizationSchedule } from './loan-calculations';

const LENDING_ASSUMPTIONS_KEY = 'adminLendingAssumptions_v1';

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R 0';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

export default function LendingRepaymentSchedule() {
    const [assumptions, setAssumptions] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const savedData = localStorage.getItem(LENDING_ASSUMPTIONS_KEY);
            if (savedData) {
                setAssumptions(JSON.parse(savedData));
            }
        } catch (e) {
            console.error("Failed to parse lending assumptions:", e);
        }
        setIsLoading(false);
    }, []);

    const { loan, schedule } = useMemo(() => {
        if (!assumptions) return { loan: null, schedule: [] };
        
        const agreementTypes = ['loan', 'installmentSale', 'lease', 'factoring'];
        let firstEnabledLoan = null;

        for (const type of agreementTypes) {
            if (assumptions[type] && assumptions[type].enabled) {
                firstEnabledLoan = { type, ...assumptions[type] };
                break;
            }
        }
        
        if (!firstEnabledLoan) {
            return { loan: null, schedule: [] };
        }

        const amortizationSchedule = generateAmortizationSchedule(
            firstEnabledLoan.amount || 0,
            firstEnabledLoan.rate || 0,
            firstEnabledLoan.term || 0
        );

        return { loan: firstEnabledLoan, schedule: amortizationSchedule };
    }, [assumptions]);
    
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!loan) {
        return (
             <Card className="w-full max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle>No Active Loan Product Found</CardTitle>
                    <CardDescription>
                        Please enable at least one loan product in the assumptions to view a sample schedule.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                     <Button asChild variant="outline">
                        <Link href="/adminaccount?view=lending-assumptions">Go to Lending Assumptions</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sheet /> Amortization Schedule
                </CardTitle>
                <CardDescription>
                    Showing a sample repayment schedule for the first enabled loan product in your assumptions: <span className="font-semibold text-primary">{loan.type}</span>.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="p-4 bg-muted/50 rounded-lg mb-6">
                    <h3 className="font-semibold text-lg">Loan Parameters</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                        <div><p className="text-muted-foreground">Principal</p><p className="font-mono font-semibold">{formatCurrency(loan.amount)}</p></div>
                        <div><p className="text-muted-foreground">Annual Rate</p><p className="font-mono font-semibold">{loan.rate}%</p></div>
                        <div><p className="text-muted-foreground">Term</p><p className="font-mono font-semibold">{loan.term} Months</p></div>
                        <div><p className="text-muted-foreground">Est. Payment</p><p className="font-mono font-semibold">{formatCurrency(schedule[0]?.payment || 0)}</p></div>
                    </div>
                </div>
                 <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Month</TableHead>
                                <TableHead className="text-right">Payment</TableHead>
                                <TableHead className="text-right">Principal</TableHead>
                                <TableHead className="text-right">Interest</TableHead>
                                <TableHead className="text-right font-bold text-primary">Remaining Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {schedule.map((row) => (
                                <TableRow key={row.month}>
                                    <TableCell>{row.month}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(row.payment)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(row.principal)}</TableCell>
                                    <TableCell className="text-right font-mono text-destructive">{formatCurrency(row.interest)}</TableCell>
                                    <TableCell className="text-right font-mono font-bold text-primary">{formatCurrency(row.remainingBalance)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

