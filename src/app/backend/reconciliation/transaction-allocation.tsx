
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { Banknote, FileCheck } from 'lucide-react';

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
    { id: 1, date: '2024-07-15', description: 'EFT payment received', reference: 'MEMBER-UID-001', amount: 375.00, status: 'pending' },
    { id: 2, date: '2024-07-16', description: 'EFT payment received', reference: 'MEMBER-UID-002', amount: 425.00, status: 'pending' },
    { id: 3, date: '2024-07-18', description: 'Wallet top-up', reference: 'MEMBER-UID-003', amount: 1000.00, status: 'pending' },
    { id: 4, date: '2024-07-20', description: 'Cash deposit', reference: 'MEMBER-UID-001', amount: 50.00, status: 'pending' },
    { id: 5, date: '2024-07-22', description: 'EFT payment received', reference: 'MEMBER-UID-004', amount: 475.00, status: 'pending' },
];


export default function TransactionAllocation({ statementName }: { statementName: string }) {
    const [transactions, setTransactions] = useState(parsedTransactions);
    const { toast } = useToast();

    const handleAllocate = (transactionId: number) => {
        // In a real app, this would trigger a server action to save the allocation.
        console.log(`Allocating transaction ${transactionId}`);
        
        // Find the transaction and update its status
        const updatedTransactions = transactions.map(t => 
            t.id === transactionId ? { ...t, status: 'allocated' } : t
        );
        setTransactions(updatedTransactions);

        toast({
            title: "Transaction Allocated!",
            description: `Transaction ID ${transactionId} has been marked as allocated.`,
        });
    };

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
                <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
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
                                    <TableCell>{tx.date}</TableCell>
                                    <TableCell>{tx.description}</TableCell>
                                    <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
                                    <TableCell className="text-right font-mono">{tx.amount.toFixed(2)}</TableCell>
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
        </Card>
    )
}
