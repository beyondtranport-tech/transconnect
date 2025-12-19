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

const formSchema = z.object({
  make: z.string().min(1, 'Vehicle make is required'),
  model: z.string().min(1, 'Model/Series is required'),
  year: z.string().min(4, 'Enter a valid year').max(4, 'Enter a valid year'),
  vin: z.string().min(1, 'VIN is required'),
  engineNumber: z.string().min(1, 'Engine number is required'),
  tare: z.string().min(1, 'Tare weight is required'),
  gvm: z.string().min(1, 'GVM is required'),
});

type TruckFormValues = z.infer<typeof formSchema>;

export default function TruckForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<TruckFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      make: '',
      model: '',
      year: '',
      vin: '',
      engineNumber: '',
      tare: '',
      gvm: '',
    },
  });

  const onSubmit = async (values: TruckFormValues) => {
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
        type: 'truck',
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
        description: 'Thank you for contributing your truck data.',
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="make"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Vehicle Make</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Scania" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Model / Series</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., R 560" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Year of Manufacture</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., 2018" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="vin"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Vehicle Identification Number (VIN)</FormLabel>
                <FormControl>
                    <Input placeholder="Vehicle VIN" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="engineNumber"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Engine Number</FormLabel>
                <FormControl>
                    <Input placeholder="Engine Number" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="tare"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Tare (kg)</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., 9000" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="gvm"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Gross Vehicle Mass (GVM - kg)</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., 26000" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <Button type="submit" disabled={isLoading || !user}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Truck Details
        </Button>
      </form>
    </Form>
  );
}
