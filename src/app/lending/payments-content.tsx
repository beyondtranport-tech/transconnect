
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck } from "lucide-react";

export default function PaymentsContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarCheck className="h-6 w-6" />
                    Payments
                </CardTitle>
                <CardDescription>This section is under construction. Tools for managing payment schedules and records will be available here.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">View upcoming payments, track payment history, and manage arrears.</p>
            </CardContent>
        </Card>
    );
}
