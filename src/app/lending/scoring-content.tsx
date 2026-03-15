'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

export default function ScoringContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="h-6 w-6" />
                    Scoring
                </CardTitle>
                <CardDescription>This section is under construction. Advanced scoring and risk assessment tools will be available here.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Analyze client data to generate risk scores and determine creditworthiness for funding applications.</p>
            </CardContent>
        </Card>
    );
}
