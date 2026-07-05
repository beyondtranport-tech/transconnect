
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, Store, PlusCircle, ShieldAlert, Edit, Eye, ArrowLeft, CheckCircle, Warehouse } from 'lucide-react';
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

export default function ShopContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<'overview' | 'wizard'>('overview');
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
  
  useEffect(() => {
    if (searchParams.get('created') === 'true' && companyData?.shopId) {
        setView('wizard');
        router.replace('/account?view=shop', { scroll: false });
    }
  }, [searchParams, companyData, router]);

  const isLoading = isUserLoading || isUserDataLoading || isCompanyLoading || arePermissionsLoading;

  const forceRefreshAll = useCallback(() => {
    forceRefreshUser();
    forceRefreshCompany();
    if (forceRefreshShop) forceRefreshShop();
  }, [forceRefreshUser, forceRefreshCompany, forceRefreshShop]);

  const handleCreateShop = async () => {
    if (!user || !userData?.companyId) {
      toast({ variant: 'destructive', title: 'Error', description: 'User or company not found.' });
      return;
    }
    setIsCreating(true);

    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error('Authentication token not found.');
      
      const response = await fetch('/api/createShop', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toast({ title: 'Profile Draft Created!' });
        await forceRefreshAll();
        router.push('/account?view=shop&created=true');
      } else {
        throw new Error(result.error || 'Failed to create shop.');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Initializing Profile', description: error.message });
    } finally {
      setIsCreating(false);
    }
  };

  const canCreateShop = can('create', 'shop');
  const shopExists = !!companyData?.shopId;
  
  const isTransporter = user?.declaredPosition === 'transporter' || companyData?.shopType === 'transporter';
  const isDistributor = user?.declaredPosition === 'distributor' || companyData?.shopType === 'distributor';
  const isWarehouse = user?.declaredPosition === 'warehouse' || companyData?.shopType === 'warehouse';
  const isAssociate = user?.declaredPosition === 'associate' || user?.role === 'associate';
  const isLender = user?.declaredPosition === 'lender' || user?.role === 'lender' || companyData?.declaredRole === 'lender';
  const isSupplier = (user?.declaredPosition === 'vendor' || companyData?.shopType === 'vendor') && !isLender && !isWarehouse;

  const shopStatus = userShop?.status || 'draft';

  const creationLabel = useMemo(() => {
      if (isAssociate) return "Create Creator Profile";
      if (isTransporter) return "Create Transport Profile";
      if (isDistributor) return "Create Distribution Profile";
      if (isWarehouse) return "Create Warehouse Branch";
      if (isLender) return "Create Lender Profile";
      if (isSupplier) return "Create My Shop";
      return "Create Profile";
  }, [isAssociate, isTransporter, isLender, isSupplier, isDistributor, isWarehouse]);

  const renderContent = () => {
    if (view === 'wizard' && userShop) {
      return <ShopWizard shop={userShop} onUpdate={forceRefreshAll} />;
    }

    if (shopExists) {
        if (isShopLoading || !userShop) {
            return (
                 <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="ml-4">Loading your commercial profile...</p>
                </div>
            );
        }
        return (
             <div className="space-y-6">
                <div className="p-6 border rounded-lg bg-muted/50">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-left">
                        <div className="text-left flex items-center gap-3">
                            {isWarehouse ? <Warehouse className="h-6 w-6 text-primary" /> : <Store className="h-6 w-6 text-primary" />}
                            <div>
                                <h3 className="text-xl font-semibold text-left">{userShop.shopName}</h3>
                                <p className="text-muted-foreground text-left">{userShop.category || 'General'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-left">
                            <span className="text-sm font-medium">Status:</span>
                            <Badge variant={statusColors[shopStatus] || 'secondary'} className="capitalize text-base">
                                {shopStatus.replace(/_/g, ' ')}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mt-4 pt-4 border-t text-left">
                        {!isAssociate && !isLender && (
                            <div className="text-left">
                                <p className="text-sm font-medium text-left">{(isTransporter || isDistributor) ? 'Active Service Lanes' : isWarehouse ? 'Storage Products' : 'Products Listed'}</p>
                                <p className="text-2xl font-bold text-left">{products?.length || 0}</p>
                            </div>
                        )}
                        <div className="flex gap-2 text-left ml-auto">
                            {userShop.status === 'approved' && (
                                <Button asChild variant="outline">
                                    <Link href={`/shops/${userShop.id}`} target="_blank">
                                        <Eye className="mr-2 h-4 w-4" /> View Live Profile
                                    </Link>
                                </Button>
                            )}
                            <Button onClick={() => setView('wizard')}>
                                <Edit className="mr-2 h-4 w-4" /> Change Profile Details
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
     return (
          <div className="text-center py-20 border-2 border-dashed rounded-lg text-left">
            <Store className="mx-auto h-12 w-12 text-muted-foreground text-left" />
            <h3 className="mt-4 text-xl font-semibold text-left">You don't have a commercial profile yet.</h3>
            <p className="mt-2 text-muted-foreground text-left">Ready to start {isAssociate ? 'building your network' : 'selling your services'}? Create your profile to get started.</p>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-block mt-4 text-left">
                    <Button onClick={handleCreateShop} disabled={isCreating || !canCreateShop || arePermissionsLoading}>
                      {isCreating || arePermissionsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                      {creationLabel}
                    </Button>
                  </div>
                </TooltipTrigger>
                {!canCreateShop && (
                  <TooltipContent>
                    <p className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> You don't have permission to create a profile.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        );
  };

  const titleIcon = isWarehouse ? <Warehouse className="h-6 w-6" /> : <Store className="h-6 w-6" />;
  const titleLabel = isAssociate ? 'Creator Profile' : (isTransporter ? 'Transport Profile' : isDistributor ? 'Distribution Profile' : isWarehouse ? 'Warehouse Branch' : isLender ? 'Lender Profile' : 'My Shop');

  return (
    <Card>
      <CardHeader className="text-left">
        <div className="flex justify-between items-start text-left">
            <div className="text-left">
                <CardTitle className="flex items-center gap-2 text-left">
                    {titleIcon} {titleLabel}
                </CardTitle>
                <CardDescription className="text-left">
                {shopExists ? `Manage your professional profile: ${userShop?.shopName || '...'}` : "Create and manage your public-facing profile."}
                </CardDescription>
            </div>
            {view === 'wizard' && (
                 <Button variant="outline" onClick={() => setView('overview')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Overview
                </Button>
            )}
        </div>
      </CardHeader>
      <CardContent className="text-left">
        {isLoading ? (
          <div className="flex justify-center items-center py-20 text-left">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : renderContent()}
      </CardContent>
    </Card>
  );
}
