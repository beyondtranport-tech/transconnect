
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Store, PlusCircle, Save } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// 1. Zod Schema for the shop object (matches the backend.json entity)
const shopSchema = z.object({
  shopName: z.string().min(1, "Shop name is required."),
  shopDescription: z.string().optional(),
  category: z.string().min(1, "Please select a category."),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  status: z.enum(["draft", "pending_review", "approved", "rejected"]),
  template: z.string().optional(),
  theme: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // ownerId, createdAt, updatedAt are handled server-side or on creation
});

type ShopFormValues = z.infer<typeof shopSchema>;

function ShopForm({ shopData, memberId }: { shopData: any, memberId: string }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      shopName: shopData.shopName || '',
      shopDescription: shopData.shopDescription || '',
      category: shopData.category || '',
      contactEmail: shopData.contactEmail || '',
      contactPhone: shopData.contactPhone || '',
      status: shopData.status || 'draft',
      metaTitle: shopData.metaTitle || '',
      metaDescription: shopData.metaDescription || '',
    }
  });
  
  const onSubmit = async (values: ShopFormValues) => {
    setIsSaving(true);
    if (!firestore || !memberId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Not logged in or database not available.' });
        setIsSaving(false);
        return;
    }
    
    const memberDocRef = doc(firestore, 'members', memberId);
    
    // We update the 'shop' field within the member document
    const dataToUpdate = {
        shop: {
          ...shopData, // Preserve existing fields like ownerId, createdAt
          ...values,   // Overwrite with new form values
          updatedAt: serverTimestamp()
        },
        // Also update the top-level member updatedAt timestamp
        updatedAt: serverTimestamp()
    };

    try {
        await updateDoc(memberDocRef, dataToUpdate);
        toast({ title: 'Shop Updated', description: 'Your shop details have been saved.' });
    } catch (serverError: any) {
        const permissionError = new FirestorePermissionError({
            path: memberDocRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: serverError.message || 'You do not have permission to update your shop.',
        });
    } finally {
        setIsSaving(false);
    }
  }

  // Placeholder for Step 2 of the wizard
  // In a real multi-step form, this would be a separate component or view
  const renderStepContent = () => {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
                control={form.control}
                name="shopName"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Shop Name</FormLabel>
                    <FormControl><Input placeholder="My Awesome Shop" {...field} /></FormControl>
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
                    <FormControl><Textarea placeholder="Describe what your shop sells..." {...field} /></FormControl>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Parts">Parts</SelectItem>
                            <SelectItem value="Services">Services</SelectItem>
                            <SelectItem value="Tires">Tires</SelectItem>
                            <SelectItem value="Equipment">Equipment</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            <div className="grid md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Public Contact Email</FormLabel>
                        <FormControl><Input placeholder="sales@myshop.com" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Public Contact Phone</FormLabel>
                        <FormControl><Input placeholder="011 123 4567" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
             <FormField
                control={form.control}
                name="metaTitle"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>SEO Title</FormLabel>
                    <FormControl><Input placeholder="e.g., Quality Truck Parts | My Shop" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="metaDescription"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>SEO Description</FormLabel>
                    <FormControl><Textarea placeholder="Short description for search engines..." {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

            <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Shop Details
            </Button>
        </form>
      </Form>
    );
  };
  
  return renderStepContent();
}

export default function ShopContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  // 1. Get the member document, which may or may not contain the shop object
  const memberDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'members', user.uid);
  }, [firestore, user]);

  const { data: memberData, isLoading: isMemberLoading } = useDoc(memberDocRef);

  const isLoading = isUserLoading || isMemberLoading;
  
  // The user's shop data is now just a field on the member document
  const userShop = memberData?.shop;

  const handleCreateShop = async () => {
    if (!user || !firestore || !memberDocRef) {
      toast({ variant: 'destructive', title: 'You must be logged in to create a shop.' });
      return;
    }
    if (userShop) {
      toast({ variant: 'destructive', title: 'Shop Already Exists', description: 'You can only manage one shop per account.' });
      return;
    }
    setIsCreating(true);

    const newShopData = {
        ownerId: user.uid,
        status: 'draft',
        shopName: `${user.displayName || 'My'}'s New Shop`,
        category: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    
    try {
        // We just update the member document with a new 'shop' field.
      await updateDoc(memberDocRef, { 
        shop: newShopData,
        // Also add a role to the member for easier identification
        role: 'vendor',
        updatedAt: serverTimestamp()
      });
      
      toast({ title: 'Shop Draft Created!', description: "Let's get started with the details." });
    } catch (error: any) {
      console.error("Error creating shop:", error);
      const permissionError = new FirestorePermissionError({
          path: memberDocRef.path,
          operation: 'update',
          requestResourceData: { shop: newShopData },
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({ variant: 'destructive', title: 'Error Creating Shop', description: error.message || "Missing or insufficient permissions." });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Store /> My Shop</CardTitle>
        <CardDescription>
          {userShop 
            ? `Manage your shop: ${userShop.shopName}`
            : "Create and manage your public-facing shop on TransConnect."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : userShop ? (
          <ShopForm shopData={userShop} memberId={user!.uid} />
        ) : (
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <Store className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">You don't have a shop yet.</h3>
            <p className="mt-2 text-muted-foreground">Ready to start selling? Create your shop to get started.</p>
            <Button onClick={handleCreateShop} disabled={isCreating} className="mt-6">
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Create My Shop
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
