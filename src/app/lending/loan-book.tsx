'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
// import { generateAmortizationSchedule, type MonthlyPayment } from '@/app/lending/loan-calculations'; // Temporarily disabled due to missing file
import { formatCurrency } from '@/lib/utils';

const LENDING_ASSUMPTIONS_KEY = 'adminLendingAssumptions_v1';

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
        // The calculation logic has been temporarily removed because its dependency 
        // ('@/app/lending/loan-calculations') was lost during a previous erroneous file deletion.
        // This will be restored separately.
        return [];
    }, []);
    
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
                        <Link href="/lending?view=assumptions">Go to Lending Assumptions</Link>
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
                    {/* Add a message indicating the feature is disabled */}
                    <div className="text-center py-20 text-muted-foreground bg-muted/50">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                        <p className="mt-4 font-semibold">Calculation Engine Temporarily Disabled</p>
                        <p className="text-sm">The loan book calculation logic is being restored. Please check back shortly.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
