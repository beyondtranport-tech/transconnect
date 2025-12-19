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
  make: z.string().min(1, 'Trailer make is required'),
  model: z.string().min(1, 'Model/Series is required'),
  year: z.string().min(4, 'Enter a valid year').max(4, 'Enter a valid year'),
  vin: z.string().min(1, 'VIN is required'),
  tare: z.string().min(1, 'Tare weight is required'),
  gvm: z.string().min(1, 'GVM is required'),
  registerNumber: z.string().min(1, 'Register number is required'),
  titleholder: z.string().min(1, 'Titleholder is required'),
  owner: z.string().min(1, 'Owner is required'),
  firstRegistrationDate: z.string().min(1, 'Date of first registration is required'),
  classification: z.string().min(1, 'Classification is required'),
});

type TrailerFormValues = z.infer<typeof formSchema>;

export default function TrailerForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<TrailerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      make: '',
      model: '',
      year: '',
      vin: '',
      tare: '',
      gvm: '',
      registerNumber: '',
      titleholder: '',
      owner: '',
      firstRegistrationDate: '',
      classification: '',
    },
  });

  const onSubmit = async (values: TrailerFormValues) => {
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
        type: 'trailer',
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
        description: 'Thank you for contributing your trailer data.',
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
            name="make"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Trailer Make</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Henred Fruehauf" {...field} />
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
                    <Input placeholder="e.g., Tautliner" {...field} />
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
                    <Input placeholder="e.g., 2020" {...field} />
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
                    <Input placeholder="Trailer VIN" {...field} />
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
                    <Input placeholder="e.g., 7500" {...field} />
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
                    <Input placeholder="e.g., 34000" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
              control={form.control}
              name="registerNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Register #</FormLabel>
                  <FormControl>
                    <Input placeholder="Register Number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="titleholder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titleholder</FormLabel>
                  <FormControl>
                    <Input placeholder="Titleholder" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <FormControl>
                    <Input placeholder="Owner" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="firstRegistrationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of First Registration</FormLabel>
                  <FormControl>
                    <Input placeholder="YYYY-MM-DD" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="classification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classification</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Trailer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <Button type="submit" disabled={isLoading || !user}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Trailer Details
        </Button>
      </form>
    </Form>
  );
}
