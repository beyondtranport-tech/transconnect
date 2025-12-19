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

const formSchema = z.object({
  vehicleType: z.string().min(1, 'Vehicle type is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  capacity: z.string().min(1, 'Capacity is required'),
});

type FleetFormValues = z.infer<typeof formSchema>;

export default function FleetForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

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
    
    // Simulate an API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real application, you would send this data to your backend.
    // For now, we'll just show a success message.
    console.log('Fleet data submitted:', values);

    toast({
      title: 'Submission Received!',
      description: 'Thank you for contributing your fleet data.',
    });
    
    form.reset();
    setIsLoading(false);
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
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Fleet Details
        </Button>
      </form>
    </Form>
  );
}
