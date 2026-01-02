
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Store, PlusCircle } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, useDoc, getClientSideAuthToken } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import ShopWizard from './shop-wizard';

export default function ShopContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const memberDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `members/${user.uid}`);
  }, [firestore, user]);

  const { data: memberData, isLoading: isMemberLoading, forceRefresh } = useDoc(memberDocRef);

  const shopRef = useMemoFirebase(() => {
    if (!firestore || !memberData?.shopId || !user) return null;
    return doc(firestore, `members/${user.uid}/shops/${memberData.shopId}`);
  }, [firestore, memberData, user]);

  const { data: userShop, isLoading: isShopLoading } = useDoc(shopRef);

  const isLoading = isUserLoading || isMemberLoading;

  const handleCreateShop = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in to create a shop.' });
      return;
    }
    setIsCreating(true);

    try {
      const token = await getClientSideAuthToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }
      
      const response = await fetch('/api/createShop', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({ title: 'Shop Draft Created!', description: "Let's get started with the details." });
        forceRefresh();
      } else {
        throw new Error(result.error || 'Failed to create shop.');
      }

    } catch (error: any) {
      console.error("Error creating shop:", error);
      toast({
        variant: 'destructive',
        title: 'Error Creating Shop',
        description: error.message || "An unexpected error occurred."
      });
    } finally {
      setIsCreating(false);
    }
  };

  const shopExists = !!memberData?.shopId;

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
