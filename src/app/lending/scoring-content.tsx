
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ScoringContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Scoring</CardTitle>
                <CardDescription>This page will house the credit scoring models and risk assessment tools. This component is under construction.</CardDescription>
            </CardHeader>
             <CardContent>
                <p className="text-muted-foreground">Credit scoring dashboards and calculators will be implemented here.</p>
            </CardContent>
        </Card>
    );
}
