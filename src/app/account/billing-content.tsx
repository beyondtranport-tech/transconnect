
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';


export default function BillingContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <CreditCard className="h-6 w-6" />
                   Billing
                </CardTitle>
                <CardDescription>View your monthly invoices, statements, and charges reports from Logistics Flow.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Invoices & Statements</p>
                    <p className="text-sm text-muted-foreground mt-1">Your generated invoices and statements will appear here soon.</p>
                </div>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">This page is for viewing historical billing documents. Wallet actions are on your dashboard.</p>
            </CardFooter>
        </Card>
    );
}

    