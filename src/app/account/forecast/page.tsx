'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export default function ForecastPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <TrendingUp className="h-6 w-6" />
                   Financial Forecast
                </CardTitle>
                <CardDescription>This page will display the projected income statement based on your budget assumptions.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">The forecast table will be displayed here.</p>
                </div>
            </CardContent>
        </Card>
    );
}
