
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { Banknote, FileCheck, Scale } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const chartOfAccounts = [
    // 4000 Series: Core Membership & Subscription Revenue
    { code: '4010', name: 'Basic Membership Fees' },
    { code: '4020', name: 'Standard Membership Fees' },
    { code: '4030', name: 'Premium Membership Fees' },
    { code: '4110', name: 'Loyalty Plan Subscription Fees' },
    { code: '4120', name: 'Actions Plan Subscription Fees' },
    { code: '4130', name: 'Rewards Plan Subscription Fees' },
    // 4200 Series: Mall Commission Revenue
    { code: '4210', name: 'Finance Mall (Successful Match Commission)' },
    { code: '4220', name: 'Supplier Mall (Transaction Commission)' },
    { code: '4230', name: 'Transporter Mall (Subcontracting Commission)' },
    { code: '4240', name: 'Buy & Sell Mall (Sales Commission)' },
    { code: '4250', name: 'Distribution Mall (Partnership Commission)' },
    { code: '4260', name: 'Warehouse Mall (Booking Commission)' },
    { code: '4270', name: 'Repurpose Mall (Sales Commission)' },
    // 4300 Series: Marketplace Product Revenue
    { code: '4310', name: 'Resold Partner Services (Gross Revenue)' },
    // 4400 Series: Tech & SaaS Revenue
    { code: '4410', name: 'Wallet Transaction Fees (SaaS)' },
    // A catch-all for wallet top-ups
    { code: '1100', name: 'Wallet Top-Up (Asset)' },
];


// This is mock data that simulates the parsed CSV file.
const parsedTransactions = [
    { id: 1, date: '2024-07-15', description: 'EFT payment received', reference: 'MEMBER-UID-001', amount: 375.00, type: 'credit', status: 'pending', checked: true },
    { id: 2, date: '2024-07-16', description: 'EFT payment received', reference: 'MEMBER-UID-002', amount: 425.00, type: 'credit', status: 'pending', checked: true },
    { id: 3, date: '2024-07-18', description: 'Wallet top-up', reference: 'MEMBER-UID-003', amount: 1000.00, type: 'credit', status: 'pending', checked: true },
    { id: 4, date: '2024-07-19', description: 'Bank Charges', reference: 'FEE-JULY24', amount: -150.00, type: 'debit', status: 'pending', checked: true },
    { id: 5, date: '2024-07-20', description: 'Cash deposit', reference: 'MEMBER-UID-001', amount: 50.00, type: 'credit', status: 'pending', checked: true },
    { id: 6, date: '2024-07-22', description: 'EFT payment received', reference: 'MEMBER-UID-004', amount: 475.00, type: 'credit', status: 'pending', checked: true },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
    }).format(amount);
};


export default function TransactionAllocation({ statementName }: { statementName: string }) {
    const [transactions, setTransactions] = useState(parsedTransactions);
    const { toast } = useToast();
    const [openingBalance, setOpeningBalance] = useState(0);
    const [closingBalance, setClosingBalance] = useState(0);

    const handleAllocate = (transactionId: number) => {
        console.log(`Allocating transaction ${transactionId}`);
        const updatedTransactions = transactions.map(t => 
            t.id === transactionId ? { ...t, status: 'allocated' } : t
        );
        setTransactions(updatedTransactions);

        toast({
            title: "Transaction Allocated!",
            description: `Transaction ID ${transactionId} has been marked as allocated.`,
        });
    };
    
    const handleCheckChange = (transactionId: number, isChecked: boolean) => {
        const updatedTransactions = transactions.map(t =>
            t.id === transactionId ? { ...t, checked: isChecked } : t
        );
        setTransactions(updatedTransactions);
    };

    const checkedTransactions = transactions.filter(t => t.checked);
    const totalCredits = checkedTransactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = checkedTransactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
    const calculatedClosingBalance = openingBalance + totalCredits + totalDebits; // Debits are negative
    const difference = closingBalance - calculatedClosingBalance;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Banknote className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>Allocate Transactions</CardTitle>
                        <CardDescription>
                            Reviewing statement: <span className="font-mono font-semibold">{statementName}</span>
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
                                <TableHead className="w-[50px] text-center"><Scale className="h-4 w-4 mx-auto" /></TableHead>
                                <TableHead className="w-[120px]">Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead className="text-right">Amount (R)</TableHead>
                                <TableHead className="w-[200px]">Member</TableHead>
                                <TableHead className="w-[250px]">Chart of Accounts</TableHead>
                                <TableHead className="text-center w-[150px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((tx) => (
                                <TableRow key={tx.id} className={tx.status === 'allocated' ? 'bg-green-100/50' : ''}>
                                    <TableCell className="text-center">
                                         <Checkbox
                                            checked={tx.checked}
                                            onCheckedChange={(isChecked) => handleCheckChange(tx.id, !!isChecked)}
                                        />
                                    </TableCell>
                                    <TableCell>{tx.date}</TableCell>
                                    <TableCell>{tx.description}</TableCell>
                                    <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
                                    <TableCell className={`text-right font-mono ${tx.type === 'credit' ? 'text-green-600' : 'text-destructive'}`}>{tx.amount.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Input 
                                            placeholder="Member ID or Email" 
                                            className="h-8 text-xs" 
                                            disabled={tx.status === 'allocated'} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Select disabled={tx.status === 'allocated'}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Select Account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {chartOfAccounts.map(acc => (
                                                    <SelectItem key={acc.code} value={acc.code}>
                                                        {acc.code} - {acc.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {tx.status === 'pending' ? (
                                             <Button size="sm" onClick={() => handleAllocate(tx.id)}>
                                                Allocate
                                            </Button>
                                        ) : (
                                            <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                                                <FileCheck className="mr-2 h-4 w-4" />
                                                Allocated
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter>
                 <div className="w-full bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-lg">Reconciliation Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Opening Balance</p>
                            <p className="font-mono font-semibold">{formatCurrency(openingBalance)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Total Credits</p>
                            <p className="font-mono font-semibold text-green-600">{formatCurrency(totalCredits)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Total Debits</p>
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
                         <div className={`space-y-1 border-t pt-2 ${difference === 0 ? 'bg-green-100' : 'bg-red-100'} p-2 rounded-md`}>
                            <p className="text-muted-foreground font-semibold">Difference</p>
                            <p className={`font-mono font-extrabold text-lg ${difference === 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(difference)}</p>
                        </div>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}

    