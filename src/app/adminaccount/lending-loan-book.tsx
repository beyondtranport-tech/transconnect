
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
        const agreementTypes = { loan, installmentSale, lease, factoring };
        
        let outstandingBalance = 0;
        const data = [];

        for (let i = 0; i < 36; i++) { // Simulate 36 months for now
            let monthlyPayouts = 0;

            for (const key in agreementTypes) {
                const agreement = agreementTypes[key as keyof typeof agreementTypes];
                if (agreement.enabled) {
                    monthlyPayouts += (agreement.dealsPerMonth || 0) * (agreement.amount || 0);
                }
            }

            // Simple placeholder logic for receipts
            const receiptsCapital = outstandingBalance > 0 ? outstandingBalance * 0.02 : 0; // Assuming 2% of capital is paid back each month
            const receiptsInterest = outstandingBalance > 0 ? outstandingBalance * (0.15 / 12) : 0; // Assuming 15% annual interest
            
            outstandingBalance += monthlyPayouts - receiptsCapital;

            data.push({
                month: `Month ${i + 1}`,
                payouts: monthlyPayouts,
                receiptsCapital,
                receiptsInterest,
                outstanding: outstandingBalance,
            });
        }

        return data;
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
                                <TableHead className="text-right">Receipts (Capital)</TableHead>
                                <TableHead className="text-right">Receipts (Interest)</TableHead>
                                <TableHead className="text-right font-bold text-primary">Outstanding Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loanBookData.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell>{row.month}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.payouts)}</TableCell>
                                    <TableCell className="text-right text-green-600">{formatCurrency(row.receiptsCapital)}</TableCell>
                                    <TableCell className="text-right text-green-600">{formatCurrency(row.receiptsInterest)}</TableCell>
                                    <TableCell className="text-right font-bold text-primary">{formatCurrency(row.outstanding)}</TableCell>
                                </TableRow>
                            ))}
                             {loanBookData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
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
