
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function ClientsContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    Clients (Debtors)
                </CardTitle>
                <CardDescription>This section is under construction. Tools for managing clients/debtors will be available here.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">View client profiles, agreements, and financial history.</p>
            </CardContent>
        </Card>
    );
}
