
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DiscoveryContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Discovery</CardTitle>
                <CardDescription>This page will contain tools for the initial discovery and assessment phase of a new application. This component is under construction.</CardDescription>
            </CardHeader>
             <CardContent>
                <p className="text-muted-foreground">Discovery tools and checklists will be implemented here.</p>
            </CardContent>
        </Card>
    );
}
