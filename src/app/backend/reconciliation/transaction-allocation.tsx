
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { Banknote, FileCheck, Scale, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { saveAndPostReconciliation } from '../actions';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
    }).format(amount);
};

export default function TransactionAllocation({ statementData }: { statementData: any }) {
    const [transactions, setTransactions] = useState(
        statementData.transactions.map((t: any) => ({ ...t, status: 'pending' }))
    );
    const { toast } = useToast();
    const [openingBalance, setOpeningBalance] = useState(statementData.openingBalance);
    const [closingBalance, setClosingBalance] = useState(statementData.closingBalance);
    
    const [totalCredits, setTotalCredits] = useState(0);
    const [totalDebits, setTotalDebits] = useState(0);
    const [calculatedClosingBalance, setCalculatedClosingBalance] = useState(0);
    const [difference, setDifference] = useState(0);
    const [isPosting, setIsPosting] = useState(false);

    
    const handleAllocationChange = (transactionId: number) => {
        let wasAllocated = false;
        let newStatus = 'pending';

        const updatedTransactions = transactions.map((tx: any) => {
            if (tx.id === transactionId) {
                newStatus = tx.status === 'allocated' ? 'pending' : 'allocated';
                if (newStatus === 'allocated') {
                    wasAllocated = true;
                }
                return { ...tx, status: newStatus };
            }
            return tx;
        });

        setTransactions(updatedTransactions);

        if (wasAllocated) {
            toast({ title: `Transaction ${transactionId} allocated.` });
        }
    };


    const handleReferenceChange = (transactionId: number, newReference: string) => {
        setTransactions(currentTransactions =>
            currentTransactions.map((tx: any) => 
                tx.id === transactionId ? { ...tx, reference: newReference } : tx
            )
        );
    };

    const handleSaveAndPost = async () => {
        setIsPosting(true);
        const allocatedTransactions = transactions.filter((tx: any) => tx.status === 'allocated');
        const result = await saveAndPostReconciliation(allocatedTransactions, statementData.statementName);

        if (result.success) {
            toast({
                title: 'Success!',
                description: 'Reconciliation has been posted and wallets have been updated.',
            });
        } else {
             toast({
                variant: 'destructive',
                title: 'Posting Failed',
                description: result.error,
            });
        }

        setIsPosting(false);
    }

    useEffect(() => {
        const allocatedTransactions = transactions.filter((t: any) => t.status === 'allocated');
        const newTotalCredits = allocatedTransactions.filter((t: any) => t.type === 'credit').reduce((sum: number, t: any) => sum + t.amount, 0);
        const newTotalDebits = allocatedTransactions.filter((t: any) => t.type === 'debit').reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
        const newCalculatedClosingBalance = openingBalance + newTotalCredits - newTotalDebits;
        const newDifference = closingBalance - newCalculatedClosingBalance;

        setTotalCredits(newTotalCredits);
        setTotalDebits(newTotalDebits);
        setCalculatedClosingBalance(newCalculatedClosingBalance);
        setDifference(newDifference);
    }, [transactions, openingBalance, closingBalance]);


    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Banknote className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>Allocate Transactions</CardTitle>
                        <CardDescription>
                            Reviewing statement: <span className="font-mono font-semibold">{statementData.statementName}</span>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <Label htmlFor="opening-balance">Opening Balance (R)</Label>
                        <Input
                            id="opening-balance"
                            type="number"
                            placeholder="0.00"
                            value={openingBalance}
                            onChange={e => setOpeningBalance(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                     <div>
                        <Label htmlFor="closing-balance">Closing Balance (R)</Label>
                        <Input
                            id="closing-balance"
                            type="number"
                            placeholder="0.00"
                            value={closingBalance}
                            onChange={e => setClosingBalance(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>

                <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-[250px]">Reference (Member UID)</TableHead>
                                <TableHead className="text-right">Amount (R)</TableHead>
                                <TableHead className="w-[120px] text-center">Status</TableHead>
                                <TableHead className="w-[120px] text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((tx: any) => (
                                <TableRow key={tx.id} className={tx.status === 'allocated' ? 'bg-green-100/50 dark:bg-green-900/20' : ''}>
                                    <TableCell>{tx.date}</TableCell>
                                    <TableCell>{tx.description}</TableCell>
                                    <TableCell>
                                        <Input
                                          value={tx.reference}
                                          onChange={(e) => handleReferenceChange(tx.id, e.target.value)}
                                          className="h-8 text-xs font-mono"
                                        />
                                    </TableCell>
                                    <TableCell className={`text-right font-mono ${tx.type === 'credit' ? 'text-green-600' : 'text-destructive'}`}>{tx.amount.toFixed(2)}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={tx.status === 'allocated' ? 'default' : 'secondary'} className="capitalize">
                                            {tx.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant={tx.status === 'allocated' ? 'outline' : 'default'}
                                            size="sm"
                                            onClick={() => handleAllocationChange(tx.id)}
                                        >
                                            {tx.status === 'allocated' ? 'Un-allocate' : 'Allocate'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
                 <div className="w-full bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-lg">Reconciliation Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Opening Balance</p>
                            <p className="font-mono font-semibold">{formatCurrency(openingBalance)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Allocated Credits</p>
                            <p className="font-mono font-semibold text-green-600">{formatCurrency(totalCredits)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Allocated Debits</p>
                            <p className="font-mono font-semibold text-destructive">{formatCurrency(totalDebits)}</p>
                        </div>
                        <div className="space-y-1 border-t pt-2">
                            <p className="text-muted-foreground">Calculated Balance</p>
                            <p className="font-mono font-bold text-base">{formatCurrency(calculatedClosingBalance)}</p>
                        </div>
                         <div className="space-y-1 border-t pt-2">
                            <p className="text-muted-foreground">Entered Closing</p>
                            <p className="font-mono font-bold text-base">{formatCurrency(closingBalance)}</p>
                        </div>
                         <div className={`space-y-1 border-t pt-2 ${Math.abs(difference) < 0.01 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} p-2 rounded-md`}>
                            <p className="text-muted-foreground font-semibold">Difference</p>
                            <p className={`font-mono font-extrabold text-lg ${Math.abs(difference) < 0.01 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(difference)}</p>
                        </div>
                    </div>
                </div>
                 <Button onClick={handleSaveAndPost} disabled={isPosting || Math.abs(difference) > 0.01}>
                    {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileCheck className="mr-2 h-4 w-4" />}
                    Save &amp; Post Reconciliation
                </Button>
            </CardFooter>
        </Card>
    )
}
