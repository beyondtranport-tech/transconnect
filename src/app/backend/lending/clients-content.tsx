'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function ClientsContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users /> Clients Management
                </CardTitle>
                <CardDescription>
                    This is the module for managing lending clients (debtors). Please provide your instructions on how this section should function.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Placeholder content for Clients module.</p>
            </CardContent>
        </Card>
    );
}
