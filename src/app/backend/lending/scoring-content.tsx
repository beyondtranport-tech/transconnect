
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Save, RotateCcw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


const scorecardCriteria = {
    "Financial": [
        { id: 'positiveNetProfit', label: 'Positive Net Profit in Last Financials', defaultPoints: 20 },
        { id: 'healthyDebtRatio', label: 'Healthy Debt-to-Equity Ratio', defaultPoints: 15 },
        { id: 'consistentRevenue', label: 'Consistent or Growing Revenue', defaultPoints: 15 },
        { id: 'positiveWallet', label: 'Maintains Positive Wallet Balance', defaultPoints: 5 },
    ],
    "Customer": [
        { id: 'highRating', label: 'High Community/Customer Rating', defaultPoints: 15 },
        { id: 'repeatBusiness', label: 'Demonstrates Repeat Business', defaultPoints: 10 },
        { id: 'lowDisputes', label: 'Low Rate of Disputes/Complaints', defaultPoints: 10 },
    ],
    "Internal Process": [
        { id: 'completedShop', label: 'Has a Completed Shop Profile', defaultPoints: 10 },
        { id: 'hasProducts', label: 'Shop has Products Listed', defaultPoints: 5 },
        { id: 'hasSales', label: 'Has Made Sales via Platform', defaultPoints: 15 },
        { id: 'contributesData', label: 'Contributes Data to the Community', defaultPoints: 10 },
    ],
    "Learning & Growth": [
        { id: 'timeInBusiness', label: 'Time in Business (> 3 years)', defaultPoints: 10 },
        { id: 'paidMembership', label: 'Has a Paid Membership Plan', defaultPoints: 10 },
        { id: 'multipleStaff', label: 'Has Multiple Confirmed Staff Members', defaultPoints: 5 },
        { id: 'techAdoption', label: 'Has Used Advanced Tech Tools (e.g., AI)', defaultPoints: 5 },
    ]
};

const defaultPoints = Object.values(scorecardCriteria).flatMap(section => section).reduce((acc, item) => {
    acc[item.id] = item.defaultPoints;
    return acc;
}, {} as Record<string, number>);

export default function ScoringContent() {
    const { toast } = useToast();
    const [points, setPoints] = useState<Record<string, number>>(defaultPoints);
    const [isLoading, setIsLoading] = useState(false);

    const handlePointChange = (id: string, value: string) => {
        setPoints(prev => ({ ...prev, [id]: Number(value) || 0 }));
    };

    const handleSave = () => {
        setIsLoading(true);
        // In a real app, this would save to a configuration document in Firestore
        console.log("Saving scorecard:", points);
        setTimeout(() => {
            toast({
                title: 'Scorecard Saved!',
                description: 'The credit scoring model has been updated.',
            });
            setIsLoading(false);
        }, 1000);
    };

    const handleReset = () => {
        setPoints(defaultPoints);
        toast({
            title: 'Scorecard Reset',
            description: 'The scoring model has been reset to default values.',
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star /> Credit Scorecard Builder
                </CardTitle>
                <CardDescription>
                    Define the criteria and points system for your credit scoring model based on the Balanced Scorecard framework.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-2/3">Criterion</TableHead>
                                <TableHead className="text-right">Points Awarded</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(scorecardCriteria).map(([category, items]) => (
                                <React.Fragment key={category}>
                                    <TableRow className="bg-muted/50">
                                        <TableCell colSpan={2} className="font-semibold text-primary">{category} Perspective</TableCell>
                                    </TableRow>
                                    {items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="pl-8">{item.label}</TableCell>
                                            <TableCell className="text-right">
                                                <Input
                                                    type="number"
                                                    value={points[item.id] ?? ''}
                                                    onChange={(e) => handlePointChange(item.id, e.target.value)}
                                                    className="w-24 ml-auto text-right"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
             <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleReset} disabled={isLoading}>
                    <RotateCcw className="mr-2 h-4 w-4"/> Reset to Defaults
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                    Save Scorecard
                </Button>
            </CardFooter>
        </Card>
    );
}
