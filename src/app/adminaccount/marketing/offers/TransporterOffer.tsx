'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";

export default function TransporterOffer() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Truck className="h-6 w-6" />
                    Transporter Offer
                </CardTitle>
                <CardDescription>This section is under construction.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">A detailed offer document for potential transporters will be available here.</p>
            </CardContent>
        </Card>
    );
}
