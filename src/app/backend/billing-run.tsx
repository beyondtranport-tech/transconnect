
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';

interface BillingResult {
    billedCount: number;
    totalBilled: number;
    checkedCount: number;
    errors: string[];
}

export default function BillingRun() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<BillingResult | null>(null);
    const { toast } = useToast();

    const handleRunBilling = async () => {
        setIsLoading(true);
        setResult(null);

        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication token not found.");
            
            const response = await fetch('/api/run-billing', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to run billing job.');
            }
            
            // Set default for errors if it's not in the response
            const finalResult = {
                ...data,
                errors: data.errors || [],
            };

            setResult(finalResult);
            toast({
                title: 'Billing Run Complete',
                description: data.message,
            });

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Billing Run Failed',
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recurring Membership Billing</CardTitle>
                <CardDescription>Manually trigger the billing process for all paid members whose subscription is due.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleRunBilling} disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <PlayCircle className="mr-2 h-4 w-4" />
                    )}
                    Run Monthly Billing
                </Button>
            </CardContent>
            {result && (
                <CardFooter className="flex-col items-start gap-4 text-sm">
                    <h3 className="font-semibold text-base">Billing Run Summary</h3>
                    <div className="p-4 bg-muted/50 rounded-lg w-full grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="font-medium">Members Checked</p>
                            <p className="text-xl font-bold">{result.checkedCount}</p>
                        </div>
                        <div>
                            <p className="font-medium text-green-600">Successfully Billed</p>
                            <p className="text-xl font-bold text-green-600">{result.billedCount}</p>
                        </div>
                        <div>
                            <p className="font-medium">Total Revenue</p>
                            <p className="text-xl font-bold">{formatCurrency(result.totalBilled)}</p>
                        </div>
                    </div>
                    {result.errors && result.errors.length > 0 && (
                        <div className="w-full">
                            <h4 className="font-semibold text-destructive">Errors Encountered ({result.errors.length}):</h4>
                             <ul className="list-disc list-inside mt-2 text-xs text-destructive bg-destructive/10 p-3 rounded-md">
                                {result.errors.map((err, i) => (
                                    <li key={i} className="font-mono">{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}
