
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { Banknote, FileCheck, Scale, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { writeBatch, doc, collection, increment, serverTimestamp, query, deleteDoc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
    }).format(amount);
};

// A new type for our dynamically added rows
type ManualTransaction = {
    id: number;
    paymentId?: string; // The original Firestore ID for pending payments
    date: string;
    description: string;
    reference: string; // This will hold the Member UID
    amount: number;
    type: 'credit' | 'debit';
    status: 'allocated' | 'pending';
    memberName?: string; // To display member name
};

export default function TransactionAllocation({ statementData }: { statementData: any }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();

    // 1. Fetch all members to create a mapping from UID to Name
    const membersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'members'));
    }, [firestore]);
    const { data: members, isLoading: isLoadingMembers } = useCollection(membersQuery);

    const memberMap = useMemo(() => {
        if (!members) return new Map();
        return new Map(members.map(m => [m.id, `${m.firstName} ${m.lastName}`]));
    }, [members]);
    
    // 2. Initialize transactions state, adding memberName if UID exists in statement
    const initialTransactions = useMemo(() => {
        return statementData.transactions.map((t: any) => ({ 
            ...t, 
            status: 'pending',
            memberName: 'Loading...' // Set a temporary loading state
        }));
    }, [statementData.transactions]);

    const [transactions, setTransactions] = useState<ManualTransaction[]>(initialTransactions);
    const [openingBalance, setOpeningBalance] = useState(statementData.openingBalance);
    const [closingBalance, setClosingBalance] = useState(statementData.closingBalance);
    
    const [totalCredits, setTotalCredits] = useState(0);
    const [totalDebits, setTotalDebits] = useState(0);
    const [calculatedClosingBalance, setCalculatedClosingBalance] = useState(0);
    const [difference, setDifference] = useState(0);
    const [isPosting, setIsPosting] = useState(false);

    // This effect now correctly populates the member names once the memberMap is ready.
    useEffect(() => {
        setTransactions(currentTxs => 
            currentTxs.map(tx => ({
                ...tx,
                memberName: memberMap.get(tx.reference) || (tx.reference ? 'Unknown Member' : '')
            }))
        );
    }, [memberMap, initialTransactions]);
    
    const handleAllocationChange = (transactionId: number) => {
        let wasAllocated = false;
        const updatedTransactions = transactions.map((tx) => {
            if (tx.id === transactionId) {
                const newStatus = tx.status === 'allocated' ? 'pending' : 'allocated';
                if (newStatus === 'allocated') wasAllocated = true;
                return { ...tx, status: newStatus };
            }
            return tx;
        });

        setTransactions(updatedTransactions);
        if (wasAllocated) toast({ title: `Transaction ${transactionId} allocated.` });
    };

    const handleFieldChange = (transactionId: number, field: keyof ManualTransaction, value: string | number) => {
        setTransactions(currentTransactions =>
            currentTransactions.map(tx => {
                if (tx.id === transactionId) {
                    const updatedTx = { ...tx, [field]: value };
                    if (field === 'reference') {
                        updatedTx.memberName = memberMap.get(value as string) || (value ? 'Unknown Member' : '');
                    }
                    return updatedTx;
                }
                return tx;
            })
        );
    };

    const addManualRow = () => {
        const newId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
        const newRow: ManualTransaction = {
            id: newId,
            date: new Date().toISOString().split('T')[0],
            description: '',
            reference: '', // Member ID goes here
            amount: 0,
            type: 'credit',
            status: 'allocated', // Manual entries are always allocated
            memberName: ''
        };
        setTransactions([...transactions, newRow]);
    };
    
    const removeManualRow = (id: number) => {
        setTransactions(transactions.filter(tx => tx.id !== id));
    };

    const handleSaveAndPost = async () => {
        if (!firestore || !user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to post.' });
            return;
        }

        setIsPosting(true);
        const allocatedTransactions = transactions.filter(tx => tx.status === 'allocated' && memberMap.has(tx.reference));
        
        if (allocatedTransactions.length === 0) {
            toast({ variant: 'destructive', title: 'No Valid Transactions', description: 'No valid transactions were allocated to post. Ensure a valid Member UID is set.' });
            setIsPosting(false);
            return;
        }

        const batch = writeBatch(firestore);

        for (const tx of allocatedTransactions) {
            const memberId = tx.reference;
            const memberRef = doc(firestore, 'members', memberId);
            const transactionAmount = tx.type === 'credit' ? tx.amount : -tx.amount;
            
            batch.update(memberRef, { walletBalance: increment(transactionAmount) });

            // Create transaction in the member's subcollection
            const transactionRef = doc(collection(firestore, 'members', memberId, 'transactions'));
            batch.set(transactionRef, {
                reconciliationId: statementData.statementName,
                memberId: tx.reference,
                type: tx.type,
                amount: tx.amount,
                date: new Date(tx.date),
                description: tx.description,
                status: 'allocated',
                chartOfAccountsCode: tx.description.toLowerCase().includes('manual') ? '7000-ManualAdjustment' : '4410', // Simplistic logic
                isAdjustment: tx.description.toLowerCase().includes('manual'),
                postedAt: serverTimestamp(),
                postedBy: user.uid,
                transactionId: transactionRef.id
            });
            
            // If this transaction came from a pending payment, delete the original record
            if (tx.paymentId) {
                const pendingPaymentRef = doc(firestore, 'members', memberId, 'walletPayments', tx.paymentId);
                batch.delete(pendingPaymentRef);
            }
        }
        
        try {
            await batch.commit();
            toast({ title: 'Success!', description: 'Reconciliation has been posted and wallets have been updated.' });
            // Clear out the posted transactions
            setTransactions(transactions.filter(tx => tx.status !== 'allocated'));
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Posting Failed', description: error.message || "You may not have the required permissions." });
        } finally {
            setIsPosting(false);
        }
    };

    useEffect(() => {
        const allocatedTransactions = transactions.filter(t => t.status === 'allocated');
        const newTotalCredits = allocatedTransactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
        const newTotalDebits = allocatedTransactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        const newCalculatedClosingBalance = openingBalance + newTotalCredits - newTotalDebits;
        const newDifference = closingBalance - newCalculatedClosingBalance;

        setTotalCredits(newTotalCredits);
        setTotalDebits(newTotalDebits);
        setCalculatedClosingBalance(newCalculatedClosingBalance);
        setDifference(newDifference);
    }, [transactions, openingBalance, closingBalance]);

    const isManualMode = statementData.statementName.startsWith('manual-adjustment');

    if (isLoadingMembers) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Allocate Transactions</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center py-10">
                     <Loader2 className="h-8 w-8 animate-spin text-primary" />
                     <p className="ml-4 text-muted-foreground">Loading member data...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Banknote className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>Allocate Transactions</CardTitle>
                        <CardDescription>
                            Reviewing: <span className="font-mono font-semibold">{isManualMode ? 'Manual Adjustment Session' : statementData.statementName}</span>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {!isManualMode && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <Label htmlFor="opening-balance">Opening Balance (R)</Label>
                            <Input id="opening-balance" type="number" placeholder="0.00" value={openingBalance} onChange={e => setOpeningBalance(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div>
                            <Label htmlFor="closing-balance">Closing Balance (R)</Label>
                            <Input id="closing-balance" type="number" placeholder="0.00" value={closingBalance} onChange={e => setClosingBalance(parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>
                )}

                <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-[250px]">Member (UID or Name)</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Amount (R)</TableHead>
                                <TableHead className="w-[120px] text-center">Status</TableHead>
                                <TableHead className="w-[120px] text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map(tx => (
                                <TableRow key={tx.id} className={tx.status === 'allocated' ? 'bg-green-100/50 dark:bg-green-900/20' : ''}>
                                    <TableCell>
                                        <Input value={tx.date} onChange={(e) => handleFieldChange(tx.id, 'date', e.target.value)} className="h-8 text-xs font-mono" type="date" />
                                    </TableCell>
                                    <TableCell>
                                         <Input value={tx.description} onChange={(e) => handleFieldChange(tx.id, 'description', e.target.value)} className="h-8 text-xs" />
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            value={tx.reference} 
                                            onChange={(e) => handleFieldChange(tx.id, 'reference', e.target.value)} 
                                            className={`h-8 text-xs font-mono ${tx.reference && !memberMap.has(tx.reference) ? 'border-destructive' : ''}`}
                                            list="members-datalist"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1 truncate">{tx.memberName}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Select value={tx.type} onValueChange={(value: 'credit' | 'debit') => handleFieldChange(tx.id, 'type', value)}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent><SelectItem value="credit">Credit</SelectItem><SelectItem value="debit">Debit</SelectItem></SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-right">
                                         <Input value={tx.amount} onChange={(e) => handleFieldChange(tx.id, 'amount', parseFloat(e.target.value) || 0)} className="h-8 text-xs font-mono text-right" type="number" step="0.01" />
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={tx.status === 'allocated' ? 'default' : 'secondary'} className="capitalize">{tx.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {isManualMode ? (
                                             <Button variant="ghost" size="icon" onClick={() => removeManualRow(tx.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                        ) : (
                                            <Button variant={tx.status === 'allocated' ? 'outline' : 'default'} size="sm" onClick={() => handleAllocationChange(tx.id)}>
                                                {tx.status === 'allocated' ? 'Un-allocate' : 'Allocate'}
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <datalist id="members-datalist">
                        {members?.map(m => <option key={m.id} value={m.id}>{`${m.firstName} ${m.lastName} (${m.companyName})`}</option>)}
                    </datalist>
                </div>
                 <Button onClick={addManualRow} variant="outline" size="sm" className="mt-4"><PlusCircle className="mr-2 h-4 w-4" />Add Manual Record</Button>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
                 {!isManualMode && (
                    <div className="w-full bg-muted p-4 rounded-lg">
                        <h4 className="font-semibold mb-3 text-lg">Reconciliation Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div className="space-y-1"><p className="text-muted-foreground">Opening Balance</p><p className="font-mono font-semibold">{formatCurrency(openingBalance)}</p></div>
                            <div className="space-y-1"><p className="text-muted-foreground">Allocated Credits</p><p className="font-mono font-semibold text-green-600">{formatCurrency(totalCredits)}</p></div>
                            <div className="space-y-1"><p className="text-muted-foreground">Allocated Debits</p><p className="font-mono font-semibold text-destructive">{formatCurrency(totalDebits)}</p></div>
                            <div className="space-y-1 border-t pt-2"><p className="text-muted-foreground">Calculated Balance</p><p className="font-mono font-bold text-base">{formatCurrency(calculatedClosingBalance)}</p></div>
                            <div className="space-y-1 border-t pt-2"><p className="text-muted-foreground">Entered Closing</p><p className="font-mono font-bold text-base">{formatCurrency(closingBalance)}</p></div>
                            <div className={`space-y-1 border-t pt-2 ${Math.abs(difference) < 0.01 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} p-2 rounded-md`}><p className="text-muted-foreground font-semibold">Difference</p><p className={`font-mono font-extrabold text-lg ${Math.abs(difference) < 0.01 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(difference)}</p></div>
                        </div>
                    </div>
                )}
                 <Button onClick={handleSaveAndPost} disabled={isPosting || (!isManualMode && Math.abs(difference) > 0.01)}>
                    {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileCheck className="mr-2 h-4 w-4" />}
                    Save & Post Transactions
                </Button>
            </CardFooter>
        </Card>
    )
}
