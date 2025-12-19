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
  vehicleType: z.string().min(1, 'Vehicle type is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  capacity: z.string().min(1, 'Capacity is required'),
});

type FleetFormValues = z.infer<typeof formSchema>;

export default function FleetForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<FleetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleType: '',
      registrationNumber: '',
      capacity: '',
    },
  });

  const onSubmit = async (values: FleetFormValues) => {
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
      const contributionsCollectionRef = collection(firestore, 'fleetContributions');
      const contributionData = {
        ...values,
        userId: user.uid,
        createdAt: serverTimestamp(),
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
        description: 'Thank you for contributing your fleet data.',
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
          name="vehicleType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Type</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Tautliner, Flatbed, Refrigerated" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="registrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Registration</FormLabel>
              <FormControl>
                <Input placeholder="e.g., CA 123-456" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacity</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 34 tons" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading || !user}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Fleet Details
        </Button>
      </form>
    </Form>
  );
}
