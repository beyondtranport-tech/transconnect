
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Store, PlusCircle } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import ShopWizard from './shop-wizard';

export default function ShopContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  // 1. Get the member document to check for a shopId
  const memberRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `members/${user.uid}`);
  }, [firestore, user]);

  const { data: memberData, isLoading: isMemberLoading } = useDoc(memberRef);

  // 2. Use the shopId from the member data to fetch the shop document
  const shopRef = useMemoFirebase(() => {
    if (!firestore || !user || !memberData?.shopId) return null;
    return doc(firestore, `members/${user.uid}/shops/${memberData.shopId}`);
  }, [firestore, user, memberData]);

  const { data: userShop, isLoading: isShopLoading } = useDoc(shopRef);

  const isLoading = isUserLoading || isMemberLoading;

  const handleCreateShop = async () => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'You must be logged in to create a shop.' });
      return;
    }
    if (memberData?.shopId) {
      toast({ variant: 'destructive', title: 'Shop Already Exists', description: 'You can only manage one shop per account.' });
      return;
    }
    setIsCreating(true);
    
    try {
      // Create a new unique ID for the shop
      const shopId = doc(collection(firestore, 'temp')).id;
      const newShopRef = doc(firestore, `members/${user.uid}/shops`, shopId);
      
      const newShopData = {
        ownerId: user.uid,
        status: 'draft',
        shopName: `${user.displayName || 'My'}'s New Shop`,
        category: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        id: shopId, // Storing the ID within the document itself
      };

      await setDoc(newShopRef, newShopData);
      
      // Update the member document with the new shopId
      await updateDoc(memberRef!, { shopId: shopId });

      toast({ title: 'Shop Draft Created!', description: "Let's get started with the details." });
    } catch (serverError: any) {
      const permissionError = new FirestorePermissionError({
        path: `members/${user.uid}/shops`,
        operation: 'create',
        requestResourceData: { shopName: `${user.displayName || 'My'}'s New Shop` },
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({ variant: 'destructive', title: 'Error Creating Shop', description: serverError.message || "An unexpected error occurred." });
    } finally {
      setIsCreating(false);
    }
  };

  // Determine if a shop exists based on memberData and potentially the shop fetch itself
  const shopExists = !!memberData?.shopId && (isShopLoading || !!userShop);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Store /> My Shop</CardTitle>
        <CardDescription>
          {shopExists && userShop
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
        ) : shopExists ? (
            // If we know a shop should exist but it's still loading, show a loader.
            // Otherwise, show the wizard.
            isShopLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="ml-4">Loading your shop...</p>
                </div>
            ) : userShop ? (
                <ShopWizard shop={userShop} />
            ) : (
                 <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <Store className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-semibold text-destructive">Shop data is missing.</h3>
                    <p className="mt-2 text-muted-foreground">Your profile indicates a shop exists, but we couldn't load its data. Please contact support.</p>
                </div>
            )
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
