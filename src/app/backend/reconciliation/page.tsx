
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, DownloadCloud, Upload } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import TransactionAllocation from "./transaction-allocation";
import { getClientSideAuthToken } from "@/firebase";
import demoStatementData from '@/lib/demo-statement.json';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// A blank statement template for manual adjustments
const manualAdjustmentTemplate = {
    statementName: `manual-adjustment-${new Date().toISOString()}`,
    openingBalance: 0,
    closingBalance: 0,
    transactions: []
};

async function fetchPendingPayments() {
    const token = await getClientSideAuthToken();
    if (!token) throw new Error("Authentication failed.");
    
    const response = await fetch('/api/getUserSubcollection', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: 'walletPayments', type: 'collection-group' }),
    });

    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch pending payments');
    }
    
    // Filter for pending status and transform data to match statement format
    return result.data
        .filter((p: any) => p.status === 'pending')
        .map((p: any, index: number) => ({
            id: index + 1, // Simple UI key
            paymentId: p.id, // The actual Firestore document ID
            date: new Date(p.createdAt).toISOString().split('T')[0],
            description: p.description,
            reference: p.applicantId, // Map applicantId to reference for the allocation component
            amount: p.amount,
            type: 'credit', // All pending payments are credits
        }));
}

export default function ReconciliationPage() {
    const [processingData, setProcessingData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [useDemo, setUseDemo] = useState(false);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if (useDemo) {
            setProcessingData(demoStatementData);
             toast({ title: "Demo Statement Loaded", description: "Sample transactions are ready for reconciliation." });
        } else {
            // If there's data and it's from the demo, clear it.
            if (processingData && processingData.statementName === 'demo-statement.csv') {
                 setProcessingData(null);
            }
        }
    }, [useDemo]);

    const handleProcessPendingEFTs = async () => {
        setIsLoading(true);
        setProcessingData(null);
        setUseDemo(false);
        try {
            const pending = await fetchPendingPayments();
            if (pending.length === 0) {
                toast({ title: "No Pending Payments", description: "There are no unallocated EFTs to reconcile."});
                setIsLoading(false);
                return;
            }
            
            const totalAmount = pending.reduce((sum, p) => sum + p.amount, 0);

            setProcessingData({
                statementName: `pending-efts-${new Date().toISOString()}`,
                openingBalance: 0,
                closingBalance: totalAmount, // The closing balance is the sum of all pending payments
                transactions: pending,
            });
             toast({ title: "Pending Payments Loaded", description: `${pending.length} unallocated payments are ready for reconciliation.` });
        } catch (e: any) {
             toast({ variant: 'destructive', title: "Failed to Load Payments", description: e.message });
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleManualAdjustment = () => {
        setUseDemo(false);
        toast({
            title: "Manual Adjustment Mode",
            description: "You can now add manual transactions below.",
        });
        setProcessingData(manualAdjustmentTemplate);
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setUseDemo(false);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const rows = text.split('\n').slice(1); // Skip header row
                const transactions = rows.map((row, index) => {
                    const [date, description, reference, amountStr] = row.split(',');
                    const amount = parseFloat(amountStr);
                    return {
                        id: index + 1,
                        date,
                        description,
                        reference,
                        amount: Math.abs(amount),
                        type: amount >= 0 ? 'credit' : 'debit'
                    };
                }).filter(tx => tx.date && tx.description); // Filter out empty rows

                if (transactions.length === 0) {
                    throw new Error("No valid transactions found in the file.");
                }

                setProcessingData({
                    statementName: file.name,
                    openingBalance: 0,
                    closingBalance: 0,
                    transactions: transactions
                });
                toast({ title: "Statement Loaded", description: `${transactions.length} transactions are ready for reconciliation.` });
            } catch (err: any) {
                toast({ variant: "destructive", title: "Error Parsing File", description: err.message });
                setProcessingData(null);
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="w-full space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Transaction Reconciliation</CardTitle>
                            <CardDescription>
                                Start by loading pending EFTs, uploading a statement, or using the demo data.
                            </CardDescription>
                        </div>
                         <div className="flex gap-4 items-center">
                             <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".csv"
                                onChange={handleFileChange}
                             />
                              <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={isLoading}>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Statement (CSV)
                            </Button>
                             <Button onClick={handleManualAdjustment} variant="outline" disabled={isLoading}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Manual Adjustment
                            </Button>
                            <Button onClick={handleProcessPendingEFTs} variant="default" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <DownloadCloud className="mr-2 h-4 w-4" />}
                                Load Pending EFTs
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 mb-4 p-4 border rounded-md bg-muted/50">
                        <Checkbox id="demo-mode" checked={useDemo} onCheckedChange={(checked) => setUseDemo(!!checked)} />
                        <Label htmlFor="demo-mode" className="cursor-pointer">Use Demo Statement</Label>
                    </div>
                    {!processingData && (
                         <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">Your reconciliation session will appear below once started.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {processingData && (
                <TransactionAllocation statementData={processingData} />
            )}
        </div>
    );
}
