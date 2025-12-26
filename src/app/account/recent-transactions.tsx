
'use client';

import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function RecentTransactions() {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading for a moment to avoid flashing content
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    // If the user is an admin, render nothing. This is a crucial guard.
    if (user && user.email === 'beyondtranport@gmail.com') {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <DollarSign className="h-6 w-6" />
                   Recent Transactions
                </CardTitle>
                <CardDescription>Your last 5 wallet transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                
                {!isLoading && (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">Transaction history is temporarily unavailable.</p>
                      <p className="text-sm text-muted-foreground">We are performing scheduled maintenance.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 <Button variant="outline" asChild>
                    <Link href="/account?view=transactions">View Full History</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
