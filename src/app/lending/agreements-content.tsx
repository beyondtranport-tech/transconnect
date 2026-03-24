
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSignature } from "lucide-react";

export default function AgreementsContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileSignature className="h-6 w-6" />
                    Agreements
                </CardTitle>
                <CardDescription>This section is under construction. Tools for managing lending agreements will be available here.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Create, view, and manage all lending agreements with clients.</p>
            </CardContent>
        </Card>
    );
}
