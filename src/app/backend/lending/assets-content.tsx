'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";

export default function AssetsContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Truck /> Assets Management
                </CardTitle>
                <CardDescription>
                    This is the module for managing financed assets. Please provide your instructions on how this section should function.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Placeholder content for Assets module.</p>
            </CardContent>
        </Card>
    );
}
