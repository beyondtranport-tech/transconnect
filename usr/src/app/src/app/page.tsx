
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
        <Card className="w-full max-w-2xl text-center">
            <CardHeader>
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                    <Wrench className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="mt-4 text-3xl">Undergoing Content Review</CardTitle>
                <CardDescription>
                    This page is being updated to ensure all content is accurate and professional. Please stand by.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">This is a temporary diagnostic message to verify file updates.</p>
            </CardContent>
        </Card>
    </div>
  );
}
