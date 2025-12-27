
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Store, PlusCircle } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import ShopWizard from './shop-wizard';

export default function ShopContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const shopsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Query the top-level shops collection for a shop owned by the current user
    return query(collection(firestore, 'shops'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const { data: shops, isLoading: isShopsLoading } = useCollection(shopsQuery);

  const userShop = shops?.[0]; // Get the first shop, as a user should only have one
  const isLoading = isUserLoading || isShopsLoading;

  const handleCreateShop = async () => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'You must be logged in to create a shop.' });
      return;
    }
    setIsCreating(true);

    try {
      const shopsCollectionRef = collection(firestore, 'shops');
      // Create a basic draft shop document
      await addDoc(shopsCollectionRef, {
        ownerId: user.uid,
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        shopName: `${user.displayName}'s New Shop`, // Default name
        shopDescription: '',
        category: '',
      });
      toast({ title: 'Shop Draft Created!', description: "Let's get started with the details." });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Creating Shop', description: error.message });
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
          // If a shop exists, render the wizard to manage it
          <ShopWizard shop={userShop} />
        ) : (
          // If no shop exists, show the "Create Shop" screen
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

    