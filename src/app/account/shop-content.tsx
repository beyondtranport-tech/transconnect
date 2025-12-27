
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2, Store, Save, PlusCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"


const shopFormSchema = z.object({
  shopName: z.string().min(3, 'Shop name must be at least 3 characters'),
  shopDescription: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  contactEmail: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

type ShopFormValues = z.infer<typeof shopFormSchema>;

export default function ShopContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const shopsCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'members', user.uid, 'shops');
  }, [firestore, user]);

  const { data: shops, isLoading: isShopsLoading } = useCollection(shopsCollectionRef);
  const existingShop = shops?.[0]; // Assuming one shop per vendor for now

  const form = useForm<ShopFormValues>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      shopName: '',
      shopDescription: '',
      category: '',
      contactEmail: '',
      contactPhone: '',
    },
  });

  useEffect(() => {
    if (existingShop) {
      form.reset(existingShop);
    }
  }, [existingShop, form]);

  const onSubmit = async (values: ShopFormValues) => {
    setIsSaving(true);
    if (!firestore || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Not logged in.' });
        setIsSaving(false);
        return;
    }
    
    // Use the existing shop ID or create a new one
    const shopId = existingShop?.id || doc(collection(firestore, 'members', user.uid, 'shops')).id;
    const shopDocRef = doc(firestore, 'members', user.uid, 'shops', shopId);
    
    const dataToSave = {
      ...values,
      ownerId: user.uid,
      updatedAt: serverTimestamp(),
      createdAt: existingShop?.createdAt || serverTimestamp(), // Preserve original creation date
    };

    setDoc(shopDocRef, dataToSave, { merge: true })
      .then(() => {
        toast({
          title: 'Shop Updated',
          description: 'Your shop information has been successfully saved.',
        });
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: shopDocRef.path,
            operation: 'write',
            requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'You do not have permission to update your shop.',
        });
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const isLoading = isUserLoading || isShopsLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Store /> My Shop</CardTitle>
        <CardDescription>Manage your public-facing shop profile on TransConnect.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
              {!existingShop && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Set up your shop!</AlertTitle>
                  <AlertDescription>
                    You don't have a shop yet. Fill out the form below to create one.
                  </AlertDescription>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="shopName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Quality Truck Parts" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shopDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell customers about your shop..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Diesel Parts, Tires, Maintenance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input placeholder="sales@mypartsshop.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="011 123 4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (existingShop ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />)}
                {existingShop ? 'Save Changes' : 'Create Shop'}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}

    