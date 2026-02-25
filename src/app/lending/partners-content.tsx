
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartnersContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Lending Partners</CardTitle>
                <CardDescription>This page will be used to manage all co-funders and lending partners. This component is under construction.</CardDescription>
            </CardHeader>
             <CardContent>
                <p className="text-muted-foreground">A data table for managing lending partners will be implemented here.</p>
            </CardContent>
        </Card>
    );
}
