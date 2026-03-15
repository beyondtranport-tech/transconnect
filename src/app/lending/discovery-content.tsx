
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSearch } from "lucide-react";

export default function DiscoveryContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileSearch className="h-6 w-6" />
                    Discovery & Application
                </CardTitle>
                <CardDescription>This section is under construction. Tools for client discovery and application management will be available here.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Manage the KYC/FICA process, collect necessary documents, and build a complete client profile for funding applications.</p>
            </CardContent>
        </Card>
    );
}
