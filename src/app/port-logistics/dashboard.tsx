'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

export default function DashboardContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <LayoutDashboard className="h-6 w-6" />
                    Dashboard
                </CardTitle>
                <CardDescription>This section is under construction. A high-level overview of port logistics operations will appear here.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Key metrics, live container statuses, and booking alerts will be displayed on this dashboard.</p>
            </CardContent>
        </Card>
    );
}
