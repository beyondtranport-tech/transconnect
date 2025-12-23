
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Upload, PlusCircle } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import TransactionAllocation from "./transaction-allocation";
import statementData from './bank-statements/statement-2024-07-01-2024-07-31.json';

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

export default function ReconciliationPage() {
    const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);
    const [processingData, setProcessingData] = useState<any | null>(null);
    const { toast } = useToast();

    const handleProcess = () => {
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
                                Select a bank statement or start a manual adjustment session.
                            </CardDescription>
                        </div>
                         <div className="flex gap-2">
                             <Button onClick={handleManualAdjustment} variant="outline">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Manual Adjustment
                            </Button>
                            <Button onClick={handleProcess} disabled={!selectedStatementId}>
                                <Check className="mr-2 h-4 w-4" />
                                Process Selected Statement
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {availableStatements.length > 0 ? (
                        <div className="space-y-4 rounded-md border p-4">
                            <h3 className="font-medium">Available Statements</h3>
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
