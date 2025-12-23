
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function ReconciliationPage() {

    return (
        <div className="w-full space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Transaction Reconciliation</CardTitle>
                            <CardDescription>
                                Upload a bank statement to begin reconciling transactions.
                            </CardDescription>
                        </div>
                        <Button>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Statement
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="text-center py-20">
                    <p className="text-muted-foreground">No statement uploaded. Upload a CSV file to get started.</p>
                </CardContent>
            </Card>
        </div>
    );
}
