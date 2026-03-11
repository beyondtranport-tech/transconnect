
'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateAmortizationSchedule } from '@/app/lending/loan-calculations';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

function RepaymentScheduleComponent() {
    const searchParams = useSearchParams();
    
    const principal = Number(searchParams.get('principal')) || 0;
    const rate = Number(searchParams.get('rate')) || 0;
    const term = Number(searchParams.get('term')) || 0;
    const residual = Number(searchParams.get('residual')) || 0;
    const startDate = searchParams.get('startDate') || undefined;
    const firstPaymentDate = searchParams.get('firstInstallmentDate') || undefined;
    const paymentsInAdvance = searchParams.get('paymentsInAdvance') === 'true';
    const agreementType = searchParams.get('type') || 'Agreement';

    const schedule = useMemo(() => {
        return generateAmortizationSchedule(principal, rate, term, startDate, firstPaymentDate, paymentsInAdvance);
    }, [principal, rate, term, startDate, firstPaymentDate, paymentsInAdvance]);
    
    const totals = useMemo(() => ({
        payment: schedule.reduce((acc, curr) => acc + curr.payment, 0),
        principal: schedule.reduce((acc, curr) => acc + curr.principal, 0),
        interest: schedule.reduce((acc, curr) => acc + curr.interest, 0),
    }), [schedule]);

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Repayment Schedule: {agreementType}</CardTitle>
                <CardDescription>
                    Principal: {formatCurrency(principal)} | Rate: {rate}% | Term: {term} months
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Principal</TableHead>
                            <TableHead>Interest</TableHead>
                            <TableHead>Remaining Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {schedule.map(row => (
                            <TableRow key={row.month}>
                                <TableCell>{row.month}</TableCell>
                                <TableCell>{formatCurrency(row.payment)}</TableCell>
                                <TableCell>{formatCurrency(row.principal)}</TableCell>
                                <TableCell>{formatCurrency(row.interest)}</TableCell>
                                <TableCell>{formatCurrency(row.remainingBalance)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell className="font-bold">Totals</TableCell>
                            <TableCell className="font-bold">{formatCurrency(totals.payment)}</TableCell>
                            <TableCell className="font-bold">{formatCurrency(totals.principal)}</TableCell>
                            <TableCell className="font-bold">{formatCurrency(totals.interest)}</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </CardContent>
             <CardFooter>
                <Button asChild variant="outline">
                    <Link href="/lending?view=agreements">Back to Agreements</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function RepaymentSchedulePage() {
    return (
        <div className="container py-12">
            <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
                <RepaymentScheduleComponent />
            </Suspense>
        </div>
    )
}
