
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet } from 'lucide-react';

export default function FinancialContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <Sheet className="h-6 w-6" />
                   Financial Modeling
                </CardTitle>
                <CardDescription>This is the new section for your financial forecasting tool.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Please tell me how you would like the UI to be set up and how the model should work.</p>
                </div>
            </CardContent>
        </Card>
    );
}
