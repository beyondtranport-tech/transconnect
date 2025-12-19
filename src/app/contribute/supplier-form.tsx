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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  supplierName: z.string().min(1, 'Supplier name is required'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Please enter a valid email.').optional().or(z.literal('')),
  itemsPurchased: z.string().min(1, 'Please list items you purchase.'),
  paymentTerms: z.string().optional(),
  memberSince: z.string().optional(),
  hasCreditFacility: z.enum(['yes', 'no', '']),
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
      phone: '',
      email: '',
      itemsPurchased: '',
      paymentTerms: '',
      memberSince: '',
      hasCreditFacility: '',
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
        data: {
          ...values,
          hasCreditFacility: values.hasCreditFacility === 'yes' ? true : (values.hasCreditFacility === 'no' ? false : undefined),
        }
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 011 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., sales@partsinc.co.za" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 30 Days from statement" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="memberSince"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Using Since (Year, optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 2015" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              <FormField
                control={form.control}
                name="hasCreditFacility"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Has Credit Facility? (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <div className="lg:col-span-3">
                <FormField
                control={form.control}
                name="itemsPurchased"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Items/Services Purchased</FormLabel>
                    <FormControl>
                        <Textarea placeholder="e.g., Tires, engine oil, brake pads, filters..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
        </div>
        <Button type="submit" disabled={isLoading || !user}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Supplier Details
        </Button>
      </form>
    </Form>
  );
}
