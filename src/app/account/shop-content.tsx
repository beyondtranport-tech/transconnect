
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Store, PlusCircle } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import ShopWizard from './shop-wizard';

export default function ShopContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  // Query the 'shops' subcollection under the current user's member document.
  const shopsCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `members/${user.uid}/shops`);
  }, [firestore, user]);

  const { data: userShops, isLoading: areShopsLoading } = useCollection(shopsCollectionRef);
  
  // A user should only have one shop, so we take the first from the results.
  const userShop = userShops?.[0];

  const isLoading = isUserLoading || areShopsLoading;

  const handleCreateShop = async () => {
    if (!user || !firestore || !shopsCollectionRef) {
      toast({ variant: 'destructive', title: 'You must be logged in to create a shop.' });
      return;
    }
    setIsCreating(true);

    try {
      // Create the shop document in the user's subcollection
      await addDoc(shopsCollectionRef, {
        ownerId: user.uid, // Redundant but good for consistency
        status: 'draft',
        shopName: `${user.displayName || 'My'}'s New Shop`,
        shopDescription: 'My new shop on TransConnect!',
        category: 'General',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      toast({ title: 'Shop Draft Created!', description: "Let's get started with the details." });
    } catch (error: any) {
      console.error("Error creating shop:", error);
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
