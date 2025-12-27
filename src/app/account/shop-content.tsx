
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Store, PlusCircle } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import ShopWizard from './shop-wizard';

export default function ShopContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const memberDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'members', user.uid);
  }, [firestore, user]);

  const { data: memberData, isLoading: isMemberLoading } = useDoc(memberDocRef);

  const isLoading = isUserLoading || isMemberLoading;
  
  const handleCreateShop = async () => {
    if (!user || !firestore || !memberDocRef) {
      toast({ variant: 'destructive', title: 'You must be logged in to create a shop.' });
      return;
    }
    if (memberData?.shop) {
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
      await updateDoc(memberDocRef, {
        shop: newShopData,
        updatedAt: serverTimestamp()
      });
      toast({ title: 'Shop Draft Created!', description: "Let's get started with the details." });
    } catch (serverError: any) {
      const permissionError = new FirestorePermissionError({
        path: memberDocRef.path,
        operation: 'update',
        requestResourceData: { shop: newShopData },
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({ variant: 'destructive', title: 'Error Creating Shop', description: serverError.message || "An unexpected error occurred." });
    } finally {
      setIsCreating(false);
    }
  };
  
  const userShop = memberData?.shop;

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
          <ShopWizard member={memberData} />
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
