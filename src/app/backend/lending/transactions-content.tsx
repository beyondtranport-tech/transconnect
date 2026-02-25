'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TransactionsContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Lending Transactions</CardTitle>
                <CardDescription>This page will provide a ledger of all lending-related financial transactions. This component is under construction.</CardDescription>
            </CardHeader>
             <CardContent>
                <p className="text-muted-foreground">A transaction ledger data table will be implemented here.</p>
            </CardContent>
        </Card>
    );
}
