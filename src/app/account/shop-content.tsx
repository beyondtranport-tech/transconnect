
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Store, PlusCircle } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import ShopWizard from './shop-wizard';

export default function ShopContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  // 1. Get the member document to find the shopId
  const memberDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'members', user.uid);
  }, [firestore, user]);

  const { data: memberData, isLoading: isMemberLoading } = useDoc<{shopId?: string}>(memberDocRef);

  // 2. Based on the shopId from the member document, fetch the actual shop document
  const shopDocRef = useMemoFirebase(() => {
    if (!firestore || !memberData?.shopId) return null;
    return doc(firestore, 'shops', memberData.shopId);
  }, [firestore, memberData]);

  const { data: userShop, isLoading: isShopLoading } = useDoc(shopDocRef);

  const isLoading = isUserLoading || isMemberLoading || (!!memberData?.shopId && isShopLoading);

  const handleCreateShop = async () => {
    if (!user || !firestore || !memberDocRef) {
      toast({ variant: 'destructive', title: 'You must be logged in to create a shop.' });
      return;
    }
    setIsCreating(true);

    try {
      // Create the shop document first
      const newShopRef = await addDoc(collection(firestore, 'shops'), {
        ownerId: user.uid,
        status: 'draft',
        shopName: `${user.displayName || 'My'}'s New Shop`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Then, update the member document with the new shop's ID
      await updateDoc(memberDocRef, {
        shopId: newShopRef.id
      });
      
      toast({ title: 'Shop Draft Created!', description: "Let's get started with the details." });
    } catch (error: any) {
      console.error("Error creating shop:", error);
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
