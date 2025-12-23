
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle } from 'lucide-react';
import { serverTimestamp } from 'firebase/firestore';

const formSchema = z.object({
  type: z.enum(['credit', 'debit']),
  accountCode: z.string().min(1, 'Please select an account code'),
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be a positive number'),
});

type JournalEntryFormValues = z.infer<typeof formSchema>;

interface AddJournalEntryDialogProps {
  memberId: string;
  onAddEntry: (entry: any) => void;
}

const accountCodes = {
    credit: [
        { code: '4410', name: 'Wallet Top-Up (EFT)' },
        { code: '4210', name: 'Finance Commission' },
        { code: '4900', name: 'Other Income' },
    ],
    debit: [
        { code: '4010', name: 'Basic Membership Fee' },
        { code: '4020', name: 'Standard Membership Fee' },
        { code: '4030', name: 'Premium Membership Fee' },
        { code: '4110', name: 'Loyalty Plan Fee' },
        { code: '4120', name: 'Actions Plan Fee' },
        { code: '4130', name: 'Rewards Plan Fee' },
        { code: '8100', name: 'Bank Charges' },
        { code: '8200', name: 'Wallet Withdrawal' },
    ]
};

const generateTransactionId = (type: 'credit' | 'debit') => {
    const prefix = type === 'credit' ? 'CR' : 'DB';
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear().toString().slice(-2);
    const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    return `${prefix}${month}${year}-${random}`;
};

export default function AddJournalEntryDialog({ memberId, onAddEntry }: AddJournalEntryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<JournalEntryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'credit',
      accountCode: '',
      description: '',
      amount: 0,
    },
  });
  
  const selectedType = form.watch('type');

  const onSubmit = (values: JournalEntryFormValues) => {
    setIsLoading(true);
    
    const newEntry = {
        transactionId: generateTransactionId(values.type),
        memberId: memberId,
        date: serverTimestamp(),
        type: values.type,
        amount: values.amount,
        description: values.description,
        chartOfAccountsCode: values.accountCode,
        status: 'allocated',
        isAdjustment: true,
    };
    
    onAddEntry(newEntry);

    toast({
        title: 'Journal Entry Added',
        description: 'The new entry is staged. Click "Save & Email" to commit changes.',
    });
    
    setIsLoading(false);
    setIsOpen(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Journal Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Journal Entry</DialogTitle>
          <DialogDescription>
            Manually add a credit or debit to the member's wallet ledger.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Journal Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select entry type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="credit">Journal Credit</SelectItem>
                      <SelectItem value="debit">Journal Debit</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       {accountCodes[selectedType].map(acc => (
                           <SelectItem key={acc.code} value={acc.code}>{acc.code} - {acc.name}</SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (R)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Manual correction for invoice #123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Entry
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
