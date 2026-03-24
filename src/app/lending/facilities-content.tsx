
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote } from "lucide-react";

export default function FacilitiesContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Banknote className="h-6 w-6" />
                    Facilities
                </CardTitle>
                <CardDescription>This section is under construction. Tools for managing credit facilities will be available here.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Define and manage credit facilities for clients, often linked to specific partners and agreements.</p>
            </CardContent>
        </Card>
    );
}
