
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

export default function DashboardContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <LayoutDashboard className="h-6 w-6" />
                    Admin Dashboard
                </CardTitle>
                <CardDescription>This section is under construction. Key metrics and alerts for the admin will be displayed here.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Admin-specific dashboard content will go here.</p>
            </CardContent>
        </Card>
    );
}
