'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Upload } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const availableStatements = [
    "statement-2024-07-01-2024-07-31.csv"
];

export default function ReconciliationPage() {
    const [selectedStatement, setSelectedStatement] = useState<string | null>(null);
    const { toast } = useToast();

    const handleProcess = () => {
        if (!selectedStatement) {
            toast({
                variant: 'destructive',
                title: "No statement selected",
                description: "Please select a statement to process.",
            });
            return;
        }

        toast({
            title: "Processing Started",
            description: `Processing statement: ${selectedStatement}`,
        });

        // In a real implementation, you would trigger the parsing
        // and reconciliation logic here.
        console.log(`Processing statement: ${selectedStatement}`);
    }

    return (
        <div className="w-full space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Transaction Reconciliation</CardTitle>
                            <CardDescription>
                                Select a bank statement from the list to begin reconciling transactions.
                            </CardDescription>
                        </div>
                        <Button onClick={handleProcess} disabled={!selectedStatement}>
                            <Check className="mr-2 h-4 w-4" />
                            Process Selected Statement
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {availableStatements.length > 0 ? (
                        <div className="space-y-4 rounded-md border p-4">
                            <h3 className="font-medium">Available Statements</h3>
                            {availableStatements.map(statement => (
                                <div key={statement} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={statement}
                                        checked={selectedStatement === statement}
                                        onCheckedChange={(checked) => {
                                            setSelectedStatement(checked ? statement : null);
                                        }}
                                    />
                                    <Label htmlFor={statement} className="font-mono cursor-pointer">
                                        {statement}
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
        </div>
    );
}
