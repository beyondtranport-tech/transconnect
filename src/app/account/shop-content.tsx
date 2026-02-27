
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Store, PlusCircle, ShieldAlert, Edit, Eye, ArrowLeft, CheckCircle } from 'lucide-react';
import { useUser, useFirestore, getClientSideAuthToken, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ShopWizard } from './shop-wizard';
import { usePermissions } from '@/hooks/use-permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  draft: 'secondary',
  pending_review: 'outline',
  approved: 'default',
  rejected: 'destructive',
};

function ShopPublishedDialog({ shopId, onGoToDashboard, onGoToShop }: { shopId: string; onGoToDashboard: () => void; onGoToShop: () => void; }) {
  return (
    <Card className="text-center py-10">
      <CardHeader>
        <div className="mx-auto bg-green-100 p-4 rounded-full w-fit">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <CardTitle className="mt-4">Shop Submitted Successfully!</CardTitle>
        <CardDescription>
          Your shop has been sent for admin review. You will be notified once it is approved and published.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center gap-4">
        <Button variant="outline" onClick={onGoToDashboard}>
          Back to Account Dashboard
        </Button>
      </CardContent>
    </Card>
  );
}


export default function ShopContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<'overview' | 'wizard' | 'success'>('overview');
  const [isCreating, setIsCreating] = useState(false);
  const { can, isLoading: arePermissionsLoading } = usePermissions();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);
  const { data: userData, isLoading: isUserDataLoading, forceRefresh: forceRefreshUser } = useDoc(userDocRef);

  const companyDocRef = useMemoFirebase(() => {
    if (!firestore || !userData?.companyId) return null;
    return doc(firestore, `companies/${userData.companyId}`);
  }, [firestore, userData?.companyId]);
  const { data: companyData, isLoading: isCompanyLoading, forceRefresh: forceRefreshCompany } = useDoc(companyDocRef);

  const shopRef = useMemoFirebase(() => {
    if (!firestore || !companyData?.shopId || !userData?.companyId) return null;
    return doc(firestore, `companies/${userData.companyId}/shops/${companyData.shopId}`);
  }, [firestore, companyData?.shopId, userData?.companyId]);

  const { data: userShop, isLoading: isShopLoading, forceRefresh: forceRefreshShop } = useDoc(shopRef);

  const productsQuery = useMemoFirebase(() => {
      if (!firestore || !companyData?.shopId || !userData?.companyId) return null;
      return collection(firestore, `companies/${userData.companyId}/shops/${companyData.shopId}/products`);
  }, [firestore, companyData?.shopId, userData?.companyId]);
  const { data: products } = useCollection(productsQuery);
  
  // When 'created' param is in URL, switch to wizard immediately.
  useEffect(() => {
    if (searchParams.get('created') === 'true' && companyData?.shopId) {
        setView('wizard');
        // Clean the URL
        router.replace('/account?view=shop', { scroll: false });
    }
  }, [searchParams, companyData, router]);

  const isLoading = isUserLoading || isUserDataLoading || isCompanyLoading || arePermissionsLoading;

  const forceRefreshAll = useCallback(() => {
    forceRefreshUser();
    forceRefreshCompany();
    if (forceRefreshShop) {
      forceRefreshShop();
    }
  }, [forceRefreshUser, forceRefreshCompany, forceRefreshShop]);

  const handleCreateShop = async () => {
    if (!user || !userData?.companyId) {
      toast({ variant: 'destructive', title: 'User or company not found.' });
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
        await forceRefreshAll();
        // Use a URL parameter to trigger the wizard view on reload
        router.push('/account?view=shop&created=true');
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

  const canCreateShop = can('create', 'shop');
  const shopExists = !!companyData?.shopId;

  const shopStatus = userShop?.status || 'draft';

  const renderContent = () => {
    if (view === 'success' && userShop) {
      return (
        <ShopPublishedDialog
          shopId={userShop.id}
          onGoToDashboard={() => setView('overview')}
          onGoToShop={() => window.open(`/shops/${userShop.id}`, '_blank')}
        />
      );
    }

    if (view === 'wizard' && userShop) {
      return <ShopWizard shop={userShop} onShopUpdate={forceRefreshAll} />;
    }

    // Default to 'overview'
    if (shopExists) {
        if (isShopLoading || !userShop) {
            return (
                 <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="ml-4">Loading your shop...</p>
                </div>
            );
        }
        return (
             <div className="space-y-6">
                <div className="p-6 border rounded-lg bg-muted/50">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-semibold">{userShop.shopName}</h3>
                            <p className="text-muted-foreground">{userShop.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Status:</span>
                            <Badge variant={statusColors[shopStatus] || 'secondary'} className="capitalize text-base">
                                {shopStatus.replace(/_/g, ' ')}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mt-4 pt-4 border-t">
                        <div>
                            <p className="text-sm font-medium">Products Listed</p>
                            <p className="text-2xl font-bold">{products?.length || 0}</p>
                        </div>
                        <div className="flex gap-2">
                            {userShop.status === 'approved' && (
                                <Button asChild variant="outline">
                                    <Link href={`/shops/${userShop.id}`} target="_blank">
                                        <Eye className="mr-2 h-4 w-4" /> View Live Shop
                                    </Link>
                                </Button>
                            )}
                            <Button onClick={() => setView('wizard')}>
                                <Edit className="mr-2 h-4 w-4" /> Manage Shop
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
     return (
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <Store className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">You don't have a shop yet.</h3>
            <p className="mt-2 text-muted-foreground">Ready to start selling? Create your shop to get started.</p>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-block mt-4">
                    <Button onClick={handleCreateShop} disabled={isCreating || !canCreateShop || arePermissionsLoading}>
                      {isCreating || arePermissionsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                      Create My Shop
                    </Button>
                  </div>
                </TooltipTrigger>
                {!canCreateShop && (
                  <TooltipContent>
                    <p className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> 
                        {arePermissionsLoading ? 'Loading permissions...' : "You don't have permission to create a shop."}
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        );
  };
  
  const handleBackToOverview = () => {
    setView('overview');
    forceRefreshAll();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="flex items-center gap-2"><Store /> My Shop</CardTitle>
                <CardDescription>
                {shopExists
                    ? `Manage your shop: ${userShop?.shopName || '...'}`
                    : "Create and manage your public-facing shop on TransConnect."
                }
                </CardDescription>
            </div>
            {view === 'wizard' && (
                 <Button variant="outline" onClick={handleBackToOverview}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Overview
                </Button>
            )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : renderContent()}
      </CardContent>
    </Card>
  );
}
