
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";

export default function AssetRegisterContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Truck className="h-6 w-6" />
                    Asset Register
                </CardTitle>
                <CardDescription>This section is under construction. Tools for managing financed assets will be available here.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Track all assets financed through the platform, including their status and value.</p>
            </CardContent>
        </Card>
    );
}
