
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Repeat } from "lucide-react";

export default function TransactionsContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Repeat className="h-6 w-6" />
                    Transactions
                </CardTitle>
                <CardDescription>This section is under construction. A ledger of all lending transactions will be available here.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">View a detailed log of all disbursements, repayments, fees, and adjustments.</p>
            </CardContent>
        </Card>
    );
}
