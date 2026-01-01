
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Upload, PlusCircle, Loader2, DownloadCloud } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import TransactionAllocation from "./transaction-allocation";
import statementData from './bank-statements/statement-2024-07-01-2024-07-31.json';
import { getClientSideAuthToken } from "@/firebase";

const availableStatements = [
    {
        id: "statement-2024-07-01-2024-07-31.csv",
        data: statementData
    }
];

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
        body: JSON.stringify({ path: `walletPayments`, type: 'collection-group' }),
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
    const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);
    const [processingData, setProcessingData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleProcessStatement = () => {
        if (!selectedStatementId) {
            toast({
                variant: 'destructive',
                title: "No statement selected",
                description: "Please select a statement to process.",
            });
            return;
        }
        
        const statementToProcess = availableStatements.find(s => s.id === selectedStatementId);

        if (!statementToProcess) {
             toast({
                variant: 'destructive',
                title: "Statement not found",
                description: "Could not find the data for the selected statement.",
            });
            return;
        }

        toast({
            title: "Processing Started",
            description: `Parsing and preparing statement: ${selectedStatementId}`,
        });
        
        setProcessingData(statementToProcess.data);
    }

    const handleProcessPendingEFTs = async () => {
        setIsLoading(true);
        setProcessingData(null);
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
        toast({
            title: "Manual Adjustment Mode",
            description: "You can now add manual transactions below.",
        });
        setSelectedStatementId(null); // Deselect any statement
        setProcessingData(manualAdjustmentTemplate);
    }

    return (
        <div className="w-full space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Transaction Reconciliation</CardTitle>
                            <CardDescription>
                                Select a source to begin reconciliation.
                            </CardDescription>
                        </div>
                         <div className="flex gap-2">
                             <Button onClick={handleManualAdjustment} variant="outline">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Manual Adjustment
                            </Button>
                            <Button onClick={handleProcessPendingEFTs} variant="outline" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <DownloadCloud className="mr-2 h-4 w-4" />}
                                Load Pending EFTs
                            </Button>
                            <Button onClick={handleProcessStatement} disabled={!selectedStatementId}>
                                <Check className="mr-2 h-4 w-4" />
                                Process Selected Statement
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {availableStatements.length > 0 ? (
                        <div className="space-y-4 rounded-md border p-4">
                            <h3 className="font-medium">Available Bank Statements</h3>
                            {availableStatements.map(statement => (
                                <div key={statement.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={statement.id}
                                        checked={selectedStatementId === statement.id}
                                        onCheckedChange={(checked) => {
                                            setSelectedStatementId(checked ? statement.id : null);
                                            setProcessingData(null); // Clear previous processing data
                                        }}
                                    />
                                    <Label htmlFor={statement.id} className="font-mono cursor-pointer">
                                        {statement.id}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-20">
                             <p className="text-muted-foreground">No statements available for processing.</p>
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
