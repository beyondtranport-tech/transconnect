'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, Save, TicketPercent } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const formSchema = z.object({
  eftTopUpFee: z.coerce.number().min(0, 'Fee must be non-negative.'),
  walletTransferFee: z.coerce.number().min(0).max(100, 'Must be between 0 and 100'),
});

type FormValues = z.infer<typeof formSchema>;

export default function WalletFees() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);

  const configRef = useMemoFirebase(() => firestore ? doc(firestore, 'configuration', 'walletFees') : null, [firestore]);
  const { data: feeConfig, isLoading: isConfigLoading } = useDoc<FormValues>(configRef);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eftTopUpFee: 0,
      walletTransferFee: 0,
    },
  });

  useEffect(() => {
    if (feeConfig) {
      form.reset(feeConfig);
    }
  }, [feeConfig, form]);

  const onSubmit = async (values: FormValues) => {
    if (!configRef) return;
    setIsLoading(true);
    
    try {
      await setDoc(configRef, { ...values, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: 'Wallet Fees Updated!', description: 'The new fee structure has been saved.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
        <CardHeader>
            <div className="flex items-center gap-4">
                <TicketPercent className="h-8 w-8 text-primary"/>
                <div>
                    <CardTitle>Wallet & Transaction Fees</CardTitle>
                    <CardDescription>
                        Define fees for wallet top-ups and future wallet-to-wallet transfers.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {isConfigLoading ? (
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="eftTopUpFee"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>EFT Top-up Fee (R)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="walletTransferFee"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Wallet Transfer Fee (%)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button type="submit" disabled={isLoading} className="mt-4">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Fees
                    </Button>
                </form>
                </Form>
            )}
        </CardContent>
    </Card>
  );
}