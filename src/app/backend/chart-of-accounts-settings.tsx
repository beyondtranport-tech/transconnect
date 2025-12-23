
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
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const formSchema = z.object({
  accountCode: z.string().min(1, 'Account code is required (e.g., 4000)'),
  accountName: z.string().min(1, 'Account name is required (e.g., Membership Income)'),
});

type CoAFormValues = z.infer<typeof formSchema>;
type Account = { code: string; name: string };

export default function ChartOfAccountsSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isCoaLoading, setIsCoaLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const coaDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'platform_config', 'chart_of_accounts');
  }, [firestore]);
  
  useEffect(() => {
    const fetchAccounts = async () => {
        if (!coaDocRef || !user) {
            setIsCoaLoading(false);
            return;
        }

        try {
            const docSnap = await getDoc(coaDocRef);
            if (docSnap.exists()) {
                setAccounts(docSnap.data()?.accounts || []);
            }
        } catch (e: any) {
             const permissionError = new FirestorePermissionError({
                path: coaDocRef.path,
                operation: 'get'
            });
            setError(permissionError);
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsCoaLoading(false);
        }
    };

    if (!isUserLoading) {
        fetchAccounts();
    }
  }, [isUserLoading, user, coaDocRef]);


  const form = useForm<CoAFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountCode: '',
      accountName: '',
    },
  });

  const onSubmit = async (values: CoAFormValues) => {
    if (!coaDocRef || !user) return;
    setIsLoading(true);

    const newAccount = { code: values.accountCode, name: values.accountName };
    const updatedAccounts = [...accounts, newAccount];
    const updateData = { accounts: updatedAccounts };

    try {
      await setDoc(coaDocRef, updateData, { merge: true });
      // Optimistic UI update
      setAccounts(updatedAccounts);
      toast({
        title: 'Account Added',
        description: `"${values.accountName}" has been added to the Chart of Accounts.`,
      });
      form.reset();
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: 'Submission Failed',
            description: 'You do not have permission to perform this action.',
        });
        const permissionError = new FirestorePermissionError({
            path: coaDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderContent = () => {
    if (isUserLoading || isCoaLoading) {
      return (
        <TableRow>
          <TableCell colSpan={2} className="h-24 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          </TableCell>
        </TableRow>
      );
    }

    if (error) {
       return (
         <TableRow>
            <TableCell colSpan={2} className="h-24 text-center text-destructive">
                Error loading Chart of Accounts. Please check your permissions.
            </TableCell>
        </TableRow>
       );
    }

    if (accounts.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                No accounts defined yet.
                </TableCell>
            </TableRow>
        );
    }

    return accounts.map((acc: Account) => (
        <TableRow key={acc.code}>
        <TableCell className="font-mono">{acc.code}</TableCell>
        <TableCell className="font-medium">{acc.name}</TableCell>
        </TableRow>
    ));
  }


  return (
    <Card className="w-full max-w-2xl">
        <CardHeader>
            <div className="flex items-center gap-4">
                <Book className="h-8 w-8 text-primary"/>
                <div>
                    <CardTitle>Chart of Accounts</CardTitle>
                    <CardDescription>
                        Define the income streams for transaction reconciliation.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4 mb-6">
                <FormField
                control={form.control}
                name="accountCode"
                render={({ field }) => (
                    <FormItem className="flex-1">
                    <FormLabel>Account Code</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., 4000" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                    <FormItem className="flex-1">
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Membership Income" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" disabled={isLoading || isUserLoading || !user} className="h-10">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                </Button>
            </form>
            </Form>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">Code</TableHead>
                            <TableHead>Name</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderContent()}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>
  );
}
