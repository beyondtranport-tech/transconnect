
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser, getClientSideAuthToken } from '@/firebase';
import { doc, writeBatch, collection, increment, serverTimestamp } from 'firebase/firestore';
import { Loader2, User, Wallet, Calendar, Mail, FileCheck } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore } from '@/firebase'; 
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import MemberFundingRecords from './member-funding-records';
import MemberWalletPayments from './member-wallet-payments';
import MemberTransactions from './member-transactions';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
const formatDate = (isoString: any) => {
    if (!isoString) return 'N/A';
    // Handle both string and Firestore Timestamp
    const date = isoString.toDate ? isoString.toDate() : new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-ZA', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
}

export default function MemberWallet({ memberId }: { memberId: string }) {
    const { toast } = useToast();
    const { user: adminUser, isUserLoading: isAdminLoading } = useUser();
    const firestore = useFirestore();

    const [isPosting, setIsPosting] = useState(false);
    const [newRecordAmount, setNewRecordAmount] = useState<number | string>('');
    const [newRecordDescription, setNewRecordDescription] = useState('');
    const [formattedBalance, setFormattedBalance] = useState<string | null>(null);

    const [memberData, setMemberData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchMemberData = useCallback(async () => {
        if (isAdminLoading) return; // Don't fetch if admin user is not loaded
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication token not found.");
            
            const response = await fetch('/api/getUserSubcollection', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path: `members/${memberId}`, type: 'document' }),
            });

            const result = await response.json();
            if (result.success) {
                setMemberData(result.data);
            } else {
                setError(result.error || 'Failed to load member data.');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [memberId, isAdminLoading]);

    useEffect(() => {
        fetchMemberData();
    }, [fetchMemberData, refreshTrigger]);


    useEffect(() => {
        if (memberData !== null && memberData !== undefined) {
            setFormattedBalance(formatCurrency(memberData.walletBalance ?? 0));
        } else {
            setFormattedBalance(formatCurrency(0));
        }
    }, [memberData]);

    const getInitials = (fName?: string, lName?: string) => {
        if (!fName || !lName) return "U";
        return (fName[0] + lName[0]).toUpperCase();
    }
    
    const handleAddRecord = async () => {
        if (!firestore || !adminUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to post.' });
            return;
        }
        if (!newRecordAmount || !newRecordDescription) {
            toast({ variant: 'destructive', title: 'Missing Info', description: 'Please provide an amount and description.' });
            return;
        }

        setIsPosting(true);
        const amount = Number(newRecordAmount);
        
        const batch = writeBatch(firestore);
        
        const memberDocRef = doc(firestore, 'members', memberId);
        const transactionRef = doc(collection(firestore, 'members', memberId, 'transactions'));
        
        const transactionData = {
            memberId: memberId,
            type: amount >= 0 ? 'credit' : 'debit',
            amount: Math.abs(amount),
            date: serverTimestamp(),
            description: newRecordDescription,
            status: 'allocated',
            isAdjustment: true,
            postedBy: adminUser.uid,
            postedAt: serverTimestamp(),
            chartOfAccountsCode: '7000-ManualAdjustment',
            transactionId: transactionRef.id
        };

        batch.update(memberDocRef, { walletBalance: increment(amount) });
        batch.set(transactionRef, transactionData);
        
        try {
            await batch.commit();
            toast({ title: 'Success!', description: `Wallet updated and transaction recorded for ${memberData?.firstName}.` });
            setNewRecordAmount('');
            setNewRecordDescription('');
            setRefreshTrigger(prev => prev + 1); // Trigger a re-fetch
        } catch (error: any) {
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: `members/${memberId}/transactions`,
                    operation: 'write',
                    requestResourceData: { walletUpdate: { walletBalance: increment(amount) }, transaction: transactionData },
                })
            );
            toast({ variant: 'destructive', title: 'Posting Failed', description: error.message || 'Missing or insufficient permissions.' });
        } finally {
            setIsPosting(false);
        }
    };

    if (isLoading || isAdminLoading) {
        return <div class="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 class="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (error) {
         return (
            <Card>
                <CardHeader><CardTitle class="text-destructive">Error</CardTitle></CardHeader>
                <CardContent><p>{error}</p></CardContent>
            </Card>
         );
    }

    if (!memberData) {
        return (
             <Card>
                <CardHeader><CardTitle>Member Not Found</CardTitle></CardHeader>
                <CardContent><p>No member found with the ID: {memberId}</p></CardContent>
            </Card>
        );
    }

    return (
        <div class="space-y-8">
            <Card>
                <CardHeader>
                    <div class="flex items-center gap-4">
                        <Avatar class="h-16 w-16">
                            <AvatarFallback>{getInitials(memberData?.firstName, memberData?.lastName)}</AvatarFallback>
                        </Avatar>
                        <div>
                             <CardTitle class="text-3xl">{memberData?.firstName} {memberData?.lastName}</CardTitle>
                             <CardDescription class="flex items-center gap-2 mt-1">
                                <Mail class="h-4 w-4" /> {memberData?.email}
                             </CardDescription>
                             <CardDescription class="flex items-center gap-2">
                                <Calendar class="h-4 w-4" /> Joined: {formatDate(memberData?.createdAt)}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div class="flex items-baseline gap-2">
                         <h3 class="text-sm font-medium text-muted-foreground">Current Balance:</h3>
                         <p class="text-3xl font-bold">{formattedBalance ?? 'R 0.00'}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Manual Wallet Adjustment</CardTitle>
                    <CardDescription>
                        Manually add a credit or debit to this member's wallet. Use a negative number for debits.
                    </CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="md:col-span-1">
                            <Label htmlFor="amount">Amount (R)</Label>
                            <Input 
                                id="amount" 
                                type="number" 
                                placeholder="e.g., 500 or -50" 
                                value={newRecordAmount}
                                onChange={(e) => setNewRecordAmount(e.target.value)}
                            />
                        </div>
                         <div class="md:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <Input 
                                id="description" 
                                placeholder="e.g., Manual top-up for sign-on bonus" 
                                value={newRecordDescription}
                                onChange={(e) => setNewRecordDescription(e.target.value)}
                             />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleAddRecord} disabled={isPosting}>
                        {isPosting ? <Loader2 class="mr-2 h-4 w-4 animate-spin"/> : <FileCheck class="mr-2 h-4 w-4" />}
                        Add Record & Update Wallet
                    </Button>
                </CardFooter>
            </Card>
            
            <MemberWalletPayments memberId={memberId} onUpdate={() => setRefreshTrigger(prev => prev + 1)} />
            <MemberFundingRecords memberId={memberId} />
            <MemberTransactions memberId={memberId} key={refreshTrigger} />
        </div>
    );
}

    