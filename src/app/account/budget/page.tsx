'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet } from 'lucide-react';

export default function BudgetPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <Sheet className="h-6 w-6" />
                   Budget & Forecast Assumptions
                </CardTitle>
                <CardDescription>This is where you will input your financial variables and assumptions to drive the forecast.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Budget input fields will be built here.</p>
                </div>
            </CardContent>
        </Card>
    );
}
