
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2, Book, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const formSchema = z.object({
  accountCode: z.string().min(1, 'Account code is required (e.g., 4000)'),
  accountName: z.string().min(1, 'Account name is required (e.g., Membership Income)'),
});

type CoAFormValues = z.infer<typeof formSchema>;
type Account = { code: string; name: string, series: string };

const finalizedAccounts: Account[] = [
    // 4000 Series: Core Membership & Subscription Revenue
    { series: '4000: Core Membership & Subscription Revenue', code: '4010', name: 'Basic Membership Fees' },
    { series: '4000: Core Membership & Subscription Revenue', code: '4020', name: 'Standard Membership Fees' },
    { series: '4000: Core Membership & Subscription Revenue', code: '4030', name: 'Premium Membership Fees' },
    { series: '4000: Core Membership & Subscription Revenue', code: '4110', name: 'Loyalty Plan Subscription Fees' },
    { series: '4000: Core Membership & Subscription Revenue', code: '4120', name: 'Actions Plan Subscription Fees' },
    { series: '4000: Core Membership & Subscription Revenue', code: '4130', name: 'Rewards Plan Subscription Fees' },

    // 4200 Series: Mall Commission Revenue
    { series: '4200: Mall Commission Revenue', code: '4210', name: 'Finance Mall (Successful Match Commission)' },
    { series: '4200: Mall Commission Revenue', code: '4220', name: 'Supplier Mall (Transaction Commission)' },
    { series: '4200: Mall Commission Revenue', code: '4230', name: 'Transporter Mall (Subcontracting Commission)' },
    { series: '4200: Mall Commission Revenue', code: '4240', name: 'Buy & Sell Mall (Sales Commission)' },
    { series: '4200: Mall Commission Revenue', code: '4250', name: 'Distribution Mall (Partnership Commission)' },
    { series: '4200: Mall Commission Revenue', code: '4260', name: 'Warehouse Mall (Booking Commission)' },
    { series: '4200: Mall Commission Revenue', code: '4270', name: 'Repurpose Mall (Sales Commission)' },

    // 4300 Series: Marketplace Product Revenue
    { series: '4300: Marketplace Product Revenue', code: '4310', name: 'Resold Partner Services (Gross Revenue)' },

    // 4400 Series: Tech & SaaS Revenue
    { series: '4400: Tech & SaaS Revenue', code: '4410', name: 'Wallet Transaction Fees (SaaS)' },
];


export default function ChartOfAccountsSettings() {
  const [accounts, setAccounts] = useState<Account[]>(finalizedAccounts);
  
  const groupedAccounts = accounts.reduce((acc, account) => {
    (acc[account.series] = acc[account.series] || []).push(account);
    return acc;
  }, {} as Record<string, Account[]>);


  return (
    <Card className="w-full max-w-4xl">
        <CardHeader>
            <div className="flex items-center gap-4">
                <Book className="h-8 w-8 text-primary"/>
                <div>
                    <CardTitle>Finalized Chart of Accounts</CardTitle>
                    <CardDescription>
                        Below are the defined income streams for transaction reconciliation.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">Account Code</TableHead>
                            <TableHead>Account Name</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(groupedAccounts).map(([series, accounts]) => (
                            <React.Fragment key={series}>
                                <TableRow className="bg-muted/50">
                                    <TableCell colSpan={2} className="font-bold text-primary">{series}</TableCell>
                                </TableRow>
                                {accounts.map((acc) => (
                                     <TableRow key={acc.code}>
                                        <TableCell className="font-mono pl-8">{acc.code}</TableCell>
                                        <TableCell className="font-medium">{acc.name}</TableCell>
                                    </TableRow>
                                ))}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>
  );
}
