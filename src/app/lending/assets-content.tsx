
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AssetsContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Asset Register</CardTitle>
                <CardDescription>This page will manage all assets financed through the lending portal. This component is under construction.</CardDescription>
            </CardHeader>
             <CardContent>
                <p className="text-muted-foreground">A data table for the asset register will be implemented here.</p>
            </CardContent>
        </Card>
    );
}
