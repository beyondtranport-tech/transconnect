
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AgreementsContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Agreements</CardTitle>
                <CardDescription>This page will manage all lending agreements. This component is under construction.</CardDescription>
            </CardHeader>
             <CardContent>
                <p className="text-muted-foreground">A data table for managing agreements will be implemented here.</p>
            </CardContent>
        </Card>
    );
}
