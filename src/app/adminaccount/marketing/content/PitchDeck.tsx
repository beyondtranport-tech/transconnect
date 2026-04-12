'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Presentation } from "lucide-react";

export default function PitchDeck() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Presentation className="h-6 w-6" />
                    Pitch Deck
                </CardTitle>
                <CardDescription>This section is under construction.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">A full, downloadable pitch deck presentation will be available here.</p>
            </CardContent>
        </Card>
    );
}
