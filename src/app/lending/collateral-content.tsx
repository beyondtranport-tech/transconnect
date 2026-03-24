
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Paperclip } from "lucide-react";

export default function CollateralContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Paperclip className="h-6 w-6" />
                    Collateral
                </CardTitle>
                <CardDescription>This section is under construction. Tools for managing collateral and security documents will be available here.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Upload and manage all security documents related to lending agreements.</p>
            </CardContent>
        </Card>
    );
}
