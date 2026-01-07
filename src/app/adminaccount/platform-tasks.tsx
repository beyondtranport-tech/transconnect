
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, Star, PlayCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';

interface LoyaltyResult {
    promotions: number;
    checked: number;
}

interface BillingResult {
    createdCount: number;
    checkedCount: number;
    errors: string[];
}


function BillingRun() {
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recurring Membership Billing</CardTitle>
                <CardDescription>Manually trigger the process to create payable invoices for all members whose subscription is due.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleRunBilling} disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <PlayCircle className="mr-2 h-4 w-4" />
                    )}
                    Generate Membership Invoices
                </Button>
            </CardContent>
            {result && (
                <CardFooter className="flex-col items-start gap-4 text-sm">
                    <h3 className="font-semibold text-base">Billing Run Summary</h3>
                    <div className="p-4 bg-muted/50 rounded-lg w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="font-medium">Members Checked</p>
                            <p className="text-xl font-bold">{result.checkedCount}</p>
                        </div>
                        <div>
                            <p className="font-medium text-green-600">Invoices Created</p>
                            <p className="text-xl font-bold text-green-600">{result.createdCount}</p>
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

function LoyaltyTierUpdate() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<LoyaltyResult | null>(null);
    const { toast } = useToast();

    const handleRunUpdate = async () => {
        setIsLoading(true);
        setResult(null);

        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication token not found.");
            
            const response = await fetch('/api/run-loyalty-update', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to run loyalty update.');
            
            setResult(data);
            toast({
                title: 'Loyalty Update Complete',
                description: data.message,
            });

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Member Loyalty Tier Update</CardTitle>
                <CardDescription>Manually trigger the process to update member loyalty tiers based on their current reward points.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleRunUpdate} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
                    Update Loyalty Tiers
                </Button>
            </CardContent>
            {result && (
                <CardFooter className="flex-col items-start gap-4 text-sm">
                    <h3 className="font-semibold text-base">Update Summary</h3>
                    <div className="p-4 bg-muted/50 rounded-lg w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="font-medium">Members Checked</p>
                            <p className="text-xl font-bold">{result.checked}</p>
                        </div>
                        <div>
                            <p className="font-medium text-green-600">Members Promoted</p>
                            <p className="text-xl font-bold text-green-600">{result.promotions}</p>
                        </div>
                    </div>
                </CardFooter>
            )}
        </Card>
    );
}

export default function PlatformTasksContent() {
     return (
        <div className="space-y-8">
             <div>
                <h1 className="text-2xl font-bold">Business Account Tasks</h1>
                <p className="mt-2 text-muted-foreground">Run manual jobs and processes related to your business's operations.</p>
            </div>
            <BillingRun />
            <LoyaltyTierUpdate />
        </div>
    )
}
