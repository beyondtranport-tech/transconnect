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
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  supplierName: z.string().min(1, 'Supplier name is required'),
  contactPerson: z.string().optional(),
  itemsPurchased: z.string().min(1, 'Please list items you purchase.'),
});

type SupplierFormValues = z.infer<typeof formSchema>;

export default function SupplierForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierName: '',
      contactPerson: '',
      itemsPurchased: '',
    },
  });

  const onSubmit = async (values: SupplierFormValues) => {
    setIsLoading(true);

    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to contribute.',
      });
      setIsLoading(false);
      return;
    }
    
    try {
      const contributionsCollectionRef = collection(firestore, 'contributions');
      const contributionData = {
        userId: user.uid,
        createdAt: serverTimestamp(),
        type: 'supplier',
        data: values,
      };
      
      addDoc(contributionsCollectionRef, contributionData)
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: contributionsCollectionRef.path,
                operation: 'create',
                requestResourceData: contributionData,
            });
            errorEmitter.emit('permission-error', permissionError);
             toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: 'You do not have permission to submit this data.',
            });
        });

      toast({
        title: 'Submission Received!',
        description: 'Thank you for contributing your supplier data.',
      });
      
      form.reset();

    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'An unexpected error occurred',
        description: 'Please try again later.',
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="supplierName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Parts Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactPerson"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Person (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="itemsPurchased"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Items/Services Purchased</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Tires, engine oil, brake pads..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading || !user}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Supplier Details
        </Button>
      </form>
    </Form>
  );
}
