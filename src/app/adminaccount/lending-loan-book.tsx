'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const LENDING_ASSUMPTIONS_KEY = 'adminLendingAssumptions_v1';

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R 0';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value);
};


export default function LendingLoanBook() {
    const assumptions = useMemo(() => {
        if (typeof window === 'undefined') return null;
        const savedData = localStorage.getItem(LENDING_ASSUMPTIONS_KEY);
        return savedData ? JSON.parse(savedData) : null;
    }, []);

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
    
    // Placeholder for calculation logic that will be added later
    const loanBookData = [
        { month: 'Month 1', payouts: 1100000, receiptsCapital: 20000, receiptsInterest: 5000, outstanding: 1080000 },
        { month: 'Month 2', payouts: 1100000, receiptsCapital: 41000, receiptsInterest: 10000, outstanding: 2139000 },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database /> Loan Book Projection
                </CardTitle>
                <CardDescription>
                    This projection shows the growth of the loan book based on your assumptions.
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
                              <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    Full projection calculation is under development.
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}