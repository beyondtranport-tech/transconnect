
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, ArrowLeft, PlusCircle, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import AddJournalEntryDialog from './add-journal-entry-dialog';
import WalletTransactions from './wallet-transactions';
import { DocumentData } from 'firebase/firestore';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
    }).format(amount);
};

export default function MemberWalletPage() {
    const router = useRouter();
    const params = useParams();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const memberId = params.memberId as string;
    
    const [isSaving, setIsSaving] = useState(false);
    const [newTransactions, setNewTransactions] = useState<DocumentData[]>([]);

    const memberRef = useMemoFirebase(() => {
        if (!firestore || !memberId) return null;
        return doc(firestore, 'members', memberId);
    }, [firestore, memberId]);

    const { data: memberData, isLoading: isMemberLoading } = useDoc(memberData ? memberRef : null);

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !memberId) return null;
        return query(
            collection(firestore, 'transactions'), 
            where('memberId', '==', memberId),
            orderBy('date', 'desc')
        );
    }, [firestore, memberId]);

    const { data: existingTransactions, isLoading: isLoadingTransactions } = useCollection(transactionsQuery);

    const allTransactions = useMemo(() => {
        const combined = [...(existingTransactions || []), ...newTransactions];
        combined.sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
            const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        });
        return combined;
    }, [existingTransactions, newTransactions]);
    
    const openingBalance = memberData?.walletBalance || 0;

    const closingBalance = useMemo(() => {
        return allTransactions.reduce((acc, tx) => {
            return tx.type === 'credit' ? acc + tx.amount : acc - tx.amount;
        }, 0);
    }, [allTransactions]);

    const handleAddJournalEntry = (entry: DocumentData) => {
        setNewTransactions(prev => [...prev, entry]);
    };
    
    const handleSaveAndEmail = async () => {
        if (!firestore || newTransactions.length === 0) {
            toast({ title: "No new entries to save." });
            return;
        }

        setIsSaving(true);
        const batch = writeBatch(firestore);

        let netAmount = 0;
        
        newTransactions.forEach(tx => {
            const transactionRef = doc(collection(firestore, 'transactions'));
            batch.set(transactionRef, tx);
            if (tx.type === 'credit') {
                netAmount += tx.amount;
            } else {
                netAmount -= tx.amount;
            }
        });

        // Update member's wallet balance
        if (memberRef) {
            batch.update(memberRef, { walletBalance: increment(netAmount) });
        }

        try {
            await batch.commit();
            toast({ title: 'Success!', description: 'Journal entries saved and wallet balance updated.' });
            setNewTransactions([]);
            // In a real app, you would trigger an email here.
            toast({ title: 'Email Sent (Simulated)', description: `Statement sent to ${memberData?.email}`});

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: error.message || "Could not save journal entries.",
            });
        } finally {
            setIsSaving(false);
        }
    };


    if (isMemberLoading || !memberData) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="w-full space-y-6">
             <Button variant="outline" onClick={() => router.push('/backend')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Members List
            </Button>
            
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                             <CardTitle className="flex items-center gap-2 text-2xl">
                                <User className="h-6 w-6" />
                                {memberData.firstName} {memberData.lastName}
                            </CardTitle>
                            <CardDescription>
                                Company: {memberData.companyName} | Email: {memberData.email}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                             <AddJournalEntryDialog onAddEntry={handleAddJournalEntry} memberId={memberId} />
                              <Button onClick={handleSaveAndEmail} disabled={isSaving || newTransactions.length === 0}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                Save & Email
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-center">
                        <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">Opening Balance</p>
                            <p className="text-2xl font-bold">{formatCurrency(openingBalance)}</p>
                        </div>
                         <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">Closing Balance</p>
                            <p className="text-2xl font-bold">{formatCurrency(closingBalance)}</p>
                        </div>
                    </div>
                   <WalletTransactions transactions={allTransactions} isLoading={isLoadingTransactions} />
                </CardContent>
            </Card>
        </div>
    );
}
