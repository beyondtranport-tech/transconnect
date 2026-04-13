'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Mail } from 'lucide-react';

export default function InvestorEmails() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Investor Email Sequence
                </CardTitle>
                <CardDescription>
                    Email templates for engaging with potential investors. This content is under construction.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Templates for initial outreach, pitch deck follow-ups, and due diligence will be available here.</p>
            </CardContent>
        </Card>
    )
}
