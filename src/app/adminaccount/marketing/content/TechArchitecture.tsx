'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";

export default function TechArchitecture() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-6 w-6" />
                    Technology Architecture
                </CardTitle>
                <CardDescription>A presentation detailing the platform's technical architecture and capabilities will be available here.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">This content is under construction.</p>
            </CardContent>
        </Card>
    );
}
