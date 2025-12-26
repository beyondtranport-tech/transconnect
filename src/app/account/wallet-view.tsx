'use client';

import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ClipboardCopy, FilePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import bankDetailsData from '@/lib/bank-details.json';
import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const formatDate = (timestamp: any) => {
    if (timestamp && timestamp.toDate) {
        return format(timestamp.toDate(), "dd MMM yyyy, HH:mm");
    }
    return 'N/A';
};

function RequestTopUp() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !firestore || !amount || parseFloat(amount) <= 0) {
            toast({ variant: 'destructive', title: 'Invalid amount', description: 'Please enter a valid positive amount.' });
            return;
        }

        setIsLoading(true);
        const applicationData = {
            applicantId: user.uid,
            status: 'pending',
            fundingType: 'credit-top-up',
            amountRequested: parseFloat(amount),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        
        try {
            // Use the new subcollection path
            const financeAppsCollection = collection(firestore, `members/${user.uid}/financeApplications`);
            addDoc(financeAppsCollection, applicationData).catch((serverError) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: financeAppsCollection.path,
                    operation: 'create',
                    requestResourceData: applicationData
                }));
            });

            toast({
                title: 'Top-up Request Submitted',
                description: `Your request for ${formatCurrency(parseFloat(amount))} has been sent for admin approval.`,
            });
            setAmount('');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your request. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Request Wallet Top-up</CardTitle>
                <CardDescription>Submit a request for a credit top-up. An admin will review and process your request after payment is confirmed.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="topup-amount">Amount (ZAR)</Label>
                        <Input
                            id="topup-amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g., 500.00"
                            min="1"
                        />
                    </div>
                     <Button type="submit" disabled={isLoading || !amount}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus className="mr-2 h-4 w-4" />}
                        Submit Top-up Request
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

function WalletHistory() {
    return (
        <div className="text-center py-10">
            <p className="text-muted-foreground">Your transaction history will appear here.</p>
        </div>
    );
}


export default function WalletView() {
    const { user } = useUser();
    const { toast } = useToast();

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: "Copied!", description: `${text} copied to clipboard.`})
        });
    };

    const safeBankDetails = bankDetailsData || {};

    if (user && user.email === 'transconnect@gmail.com') {
        return null;
    }

    return (
        <div className="w-full space-y-8">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Top up your Wallet via EFT</CardTitle>
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
                <RequestTopUp />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Wallet History</CardTitle>
                    <CardDescription>A history of your wallet transactions and top-up requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    <WalletHistory />
                </CardContent>
            </Card>
        </div>
    );
}
