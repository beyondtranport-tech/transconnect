
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { generateAmortizationSchedule, type MonthlyPayment } from './lending/loan-calculations';

const LENDING_ASSUMPTIONS_KEY = 'adminLendingAssumptions_v1';

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R 0';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value);
};

export default function LendingLoanBook() {
    const [assumptions, setAssumptions] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // This effect runs only on the client side after the component mounts
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

    const loanBookData = useMemo(() => {
        if (!assumptions) return [];

        const { loan, installmentSale, lease, factoring } = assumptions;
        const agreementTypes = [
            { type: 'loan', ...loan },
            { type: 'installmentSale', ...installmentSale },
            { type: 'lease', ...lease },
            { type: 'factoring', ...factoring },
        ];
        
        const allOriginatedLoanSchedules: { startMonth: number; schedule: MonthlyPayment[]; principal: number }[] = [];
        const forecastPeriod = assumptions.forecastMonths || 36;

        // 1. Determine all loans that will be created and when.
        for (const agreement of agreementTypes) {
            if (!agreement.enabled || !agreement.dealsPerMonth || agreement.dealsPerMonth <= 0) {
                continue;
            }

            const loanPrincipal = agreement.amount || 0;
            const loanRate = agreement.rate || 0;
            const loanTerm = agreement.term || 0;

            // If recurring is not explicitly false, treat it as recurring.
            if (agreement.recurring !== false) {
                for (let month = 0; month < forecastPeriod; month++) {
                    for (let i = 0; i < agreement.dealsPerMonth; i++) {
                        const schedule = generateAmortizationSchedule(loanPrincipal, loanRate, loanTerm);
                        if (schedule.length > 0) {
                            allOriginatedLoanSchedules.push({ startMonth: month, schedule, principal: loanPrincipal });
                        }
                    }
                }
            } else { // Not recurring, originate only in the first month.
                for (let i = 0; i < agreement.dealsPerMonth; i++) {
                    const schedule = generateAmortizationSchedule(loanPrincipal, loanRate, loanTerm);
                    if (schedule.length > 0) {
                        allOriginatedLoanSchedules.push({ startMonth: 0, schedule, principal: loanPrincipal });
                    }
                }
            }
        }
        
        const projection = [];
        let cumulativePayouts = 0;
        let cumulativeReceiptsCapital = 0;
        let cumulativeReceiptsInterest = 0;
        let outstandingBalance = 0;

        // 2. Process the timeline month by month based on the pre-generated loans.
        for (let currentMonth = 0; currentMonth < forecastPeriod; currentMonth++) {
            let monthlyPayouts = 0;
            let monthlyReceiptsCapital = 0;
            let monthlyReceiptsInterest = 0;

            for (const scheduledLoan of allOriginatedLoanSchedules) {
                // A loan is paid out in its start month.
                if (scheduledLoan.startMonth === currentMonth) {
                    monthlyPayouts += scheduledLoan.principal;
                }
                
                // If the loan is active during this month, add its scheduled repayment to the monthly totals.
                const monthInLoanLife = currentMonth - scheduledLoan.startMonth;
                if (monthInLoanLife >= 0 && monthInLoanLife < scheduledLoan.schedule.length) {
                    const payment = scheduledLoan.schedule[monthInLoanLife];
                    monthlyReceiptsCapital += payment.principal;
                    monthlyReceiptsInterest += payment.interest;
                }
            }
            
            cumulativePayouts += monthlyPayouts;
            cumulativeReceiptsCapital += monthlyReceiptsCapital;
            cumulativeReceiptsInterest += monthlyReceiptsInterest;
            outstandingBalance += (monthlyPayouts - monthlyReceiptsCapital);

            projection.push({
                month: `Month ${currentMonth + 1}`,
                payouts: monthlyPayouts,
                cumulativePayouts,
                receiptsCapital: monthlyReceiptsCapital,
                cumulativeReceiptsCapital,
                receiptsInterest: monthlyReceiptsInterest,
                cumulativeReceiptsInterest,
                outstanding: outstandingBalance,
            });
        }

        return projection;
    }, [assumptions]);
    
     if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!assumptions) {
        return (
             <Card className="w-full max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle>Assumption Data Missing</CardTitle>
                    <CardDescription>
                        Please set up and save your assumptions for the lending model before viewing this projection.
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
                    <Database /> Loan Book Projection
                </CardTitle>
                <CardDescription>
                    This projection shows the growth of the loan book based on your saved assumptions.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Month</TableHead>
                                <TableHead className="text-right">Payouts</TableHead>
                                <TableHead className="text-right">Cum. Payouts</TableHead>
                                <TableHead className="text-right">Receipts (Capital)</TableHead>
                                <TableHead className="text-right">Cum. Receipts (Capital)</TableHead>
                                <TableHead className="text-right">Receipts (Interest)</TableHead>
                                <TableHead className="text-right">Cum. Receipts (Interest)</TableHead>
                                <TableHead className="text-right font-bold text-primary">Outstanding Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loanBookData.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell>{row.month}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.payouts)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.cumulativePayouts)}</TableCell>
                                    <TableCell className="text-right text-green-600">{formatCurrency(row.receiptsCapital)}</TableCell>
                                    <TableCell className="text-right text-green-600">{formatCurrency(row.cumulativeReceiptsCapital)}</TableCell>
                                    <TableCell className="text-right text-green-600">{formatCurrency(row.receiptsInterest)}</TableCell>
                                    <TableCell className="text-right text-green-600">{formatCurrency(row.cumulativeReceiptsInterest)}</TableCell>
                                    <TableCell className="text-right font-bold text-primary">{formatCurrency(row.outstanding)}</TableCell>
                                </TableRow>
                            ))}
                             {loanBookData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                        No active lending products found in your assumptions.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
