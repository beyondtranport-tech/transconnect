
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Store, PlusCircle } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import ShopWizard from './shop-wizard';


export default function ShopContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  // Query the user's private shop subcollection. We only expect one, so we limit to 1.
  const shopsCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'members', user.uid, 'shops'), limit(1));
  }, [firestore, user]);

  const { data: shops, isLoading: isShopsLoading } = useCollection(shopsCollectionRef);

  const isLoading = isUserLoading || isShopsLoading;
  
  // The user's shop is the first (and only) document in the collection.
  const userShop = shops && shops.length > 0 ? shops[0] : null;

  const handleCreateShop = async () => {
    if (!user || !firestore) {
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
        const shopCollection = collection(firestore, 'members', user.uid, 'shops');
        
        await addDoc(shopCollection, newShopData)
          .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: shopCollection.path,
                operation: 'create',
                requestResourceData: newShopData,
            });
            errorEmitter.emit('permission-error', permissionError);
          });
      
      toast({ title: 'Shop Draft Created!', description: "Let's get started with the details." });
    } catch (error: any) {
      console.error("Error creating shop:", error);
      toast({ variant: 'destructive', title: 'Error Creating Shop', description: error.message || "An unexpected error occurred." });
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
          // Pass the shop data and ID to the wizard
          <ShopWizard shop={userShop} memberId={user!.uid} shopId={userShop.id} />
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
