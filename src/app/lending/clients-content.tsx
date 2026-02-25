
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientsContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Clients (Debtors)</CardTitle>
                <CardDescription>This page will be used to manage all lending clients (debtors). This component is under construction.</CardDescription>
            </CardHeader>
             <CardContent>
                <p className="text-muted-foreground">A data table for managing clients will be implemented here.</p>
            </CardContent>
        </Card>
    );
}
