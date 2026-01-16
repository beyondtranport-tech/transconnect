'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Users, Repeat } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value);
};

// These are example cost assumptions. In a real app, these might come from a config file.
const COST_PER_USER_PER_MONTH = 0.50; // R0.50 for user data storage, auth, etc.
const COST_PER_TRANSACTION = 0.02;    // R0.02 for each read/write operation, function invocation, etc.

export default function CostCalculator() {
    const [memberCount, setMemberCount] = useState(1000);
    const [transactionsPerMember, setTransactionsPerMember] = useState(10);

    const calculations = useMemo(() => {
        const userCost = memberCount * COST_PER_USER_PER_MONTH;
        const transactionCost = memberCount * transactionsPerMember * COST_PER_TRANSACTION;
        const monthlyTotal = userCost + transactionCost;
        const annualTotal = monthlyTotal * 12;

        return {
            userCost,
            transactionCost,
            monthlyTotal,
            annualTotal,
        };
    }, [memberCount, transactionsPerMember]);

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-6 w-6" />
                        Platform Cost Calculator
                    </CardTitle>
                    <CardDescription>
                        Estimate your monthly and annual platform running costs based on member and transaction volume.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="member-count" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Number of Active Members
                            </Label>
                            <Input
                                id="member-count"
                                type="number"
                                value={memberCount}
                                onChange={(e) => setMemberCount(Number(e.target.value) || 0)}
                                placeholder="e.g., 1000"
                            />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="tx-per-member" className="flex items-center gap-2">
                                <Repeat className="h-4 w-4" />
                                Avg. Transactions per Member/Month
                            </Label>
                            <Input
                                id="tx-per-member"
                                type="number"
                                value={transactionsPerMember}
                                onChange={(e) => setTransactionsPerMember(Number(e.target.value) || 0)}
                                placeholder="e.g., 10"
                            />
                        </div>
                    </div>

                    <Alert>
                        <AlertTitle className="font-semibold">Cost Assumptions</AlertTitle>
                        <AlertDescription className="text-xs space-y-1 mt-2">
                            <p><strong>Cost per User:</strong> {formatCurrency(COST_PER_USER_PER_MONTH)} / month (covers auth, basic storage, etc.)</p>
                            <p><strong>Cost per Transaction:</strong> {formatCurrency(COST_PER_TRANSACTION)} (covers database reads/writes, function calls, etc.)</p>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Estimated Costs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                        <span className="font-medium">Monthly User-Based Cost</span>
                        <span className="font-semibold font-mono">{formatCurrency(calculations.userCost)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                        <span className="font-medium">Monthly Transaction-Based Cost</span>
                        <span className="font-semibold font-mono">{formatCurrency(calculations.transactionCost)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 border-t">
                        <span className="font-bold text-lg">Estimated Total Monthly Cost</span>
                        <span className="font-bold text-lg text-primary">{formatCurrency(calculations.monthlyTotal)}</span>
                    </div>
                     <div className="flex justify-between items-center p-4 border-t bg-primary/10 rounded-md">
                        <span className="font-bold text-lg">Estimated Total Annual Cost</span>
                        <span className="font-bold text-lg text-primary">{formatCurrency(calculations.annualTotal)}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
