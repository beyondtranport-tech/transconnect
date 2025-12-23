
'use client';

import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ClipboardCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import bankDetailsData from '@/lib/bank-details.json';
import { useState, useEffect } from 'react';

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
};

export default function WalletView() {
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading for a moment to avoid flashing content
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: "Copied!", description: `${text} copied to clipboard.`})
        });
    };

    const safeBankDetails = bankDetailsData || {};

    // If the user is an admin, render nothing. This is the crucial guard.
    if (user && user.email === 'transconnect@gmail.com') {
        return null;
    }

    return (
        <div className="w-full space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Top up your Wallet</CardTitle>
                    <CardDescription>
                        To add funds, make an EFT payment using the details below. Your balance will be updated once payment is confirmed by an administrator.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                         {Object.entries(safeBankDetails).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="font-mono">{value}</span>
                            </div>
                        ))}
                        {user && (
                            <div className="flex justify-between items-center text-sm pt-3 border-t">
                                <span className="text-muted-foreground font-semibold">Your Payment Reference</span>
                                 <button onClick={() => copyToClipboard(user.uid)} className="font-mono text-primary hover:underline flex items-center gap-2">
                                    {user.uid}
                                    <ClipboardCopy className="h-4 w-4"/>
                                </button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Wallet History</CardTitle>
                    <CardDescription>A history of your credit top-up requests and other transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    
                    {!isLoading && (
                       <p className="text-center text-muted-foreground py-10">Your transaction history is temporarily unavailable while we perform system upgrades.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
