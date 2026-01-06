'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default function PermissionsContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lock className="h-6 w-6" />
                    Permissions Management
                </CardTitle>
                <CardDescription>
                    Define roles and functions, and assign specific permissions to them.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Permission management interface is coming soon.</p>
                    <p className="text-sm text-muted-foreground mt-1">This section will allow you to control access to different parts of the application.</p>
                </div>
            </CardContent>
        </Card>
    );
}
