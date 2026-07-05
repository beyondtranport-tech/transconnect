'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, Store, PlusCircle, ShieldAlert, Edit, Eye, ArrowLeft, CheckCircle, Warehouse, Truck, Network, ShieldCheck } from 'lucide-react';
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
        forceRefreshUser();
        forceRefreshCompany();
        setView('wizard');
      } else {
        throw new Error(result.error || 'Failed to create shop.');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Initializing Profile', description: error.message });
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    const subview = searchParams.get('subview');
    if (subview === 'wizard') {
        if (companyData?.shopId) {
            setView('wizard');
        } else if (!isCompanyLoading && !isCreating) {
            handleCreateShop();
        }
    }
  }, [searchParams, companyData, isCompanyLoading, isCreating]);

  const isLoading = isUserLoading || isUserDataLoading || isCompanyLoading || arePermissionsLoading;

  const forceRefreshAll = useCallback(() => {
    forceRefreshUser();
    forceRefreshCompany();
    if (forceRefreshShop) forceRefreshShop();
  }, [forceRefreshUser, forceRefreshCompany, forceRefreshShop]);

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
      if (isAssociate) return "Activate Creator Node";
      if (isTransporter) return "Initialize Transport Node";
      if (isDistributor) return "Initialize Distribution Node";
      if (isWarehouse) return "Initialize Warehouse Node";
      if (isLender) return "Initialize Lender Node";
      return "Initialize Commercial Node";
  }, [isAssociate, isTransporter, isLender, isSupplier, isDistributor, isWarehouse]);

  const renderContent = () => {
    if (view === 'wizard' && userShop) {
      return <ShopWizard shop={userShop} onUpdate={forceRefreshAll} />;
    }

    if (shopExists) {
        if (isShopLoading || !userShop) {
            return (
                 <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Synchronizing Commercial Profile...</p>
                </div>
            );
        }
        return (
             <div className="space-y-6">
                <div className="p-8 border rounded-3xl bg-muted/30 shadow-inner">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 text-left">
                        <div className="text-left flex items-center gap-4">
                            <div className="bg-primary p-3 rounded-2xl text-white shadow-lg">
                                {isWarehouse ? <Warehouse className="h-8 w-8" /> : isTransporter ? <Truck className="h-8 w-8" /> : <Store className="h-8 w-8" />}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-left">{userShop.shopName}</h3>
                                <p className="text-muted-foreground text-left font-medium">{userShop.category || 'Forensic Category Required'}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 text-right">
                             <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Node Status</p>
                             <Badge variant={statusColors[shopStatus] || 'secondary'} className="capitalize text-sm font-black px-4 py-1 h-auto">
                                {shopStatus.replace(/_/g, ' ')}
                             </Badge>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 mt-8 pt-8 border-t border-muted text-left">
                        {!isAssociate && !isLender && (
                            <div className="text-left space-y-1">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Live Portfolio</p>
                                <p className="text-3xl font-black text-primary">{(products?.length || 0).toLocaleString()}</p>
                                <p className="text-[10px] font-bold text-muted-foreground italic">{(isTransporter || isDistributor) ? 'Active Service Lanes' : isWarehouse ? 'Capacity Slots' : 'Products Listed'}</p>
                            </div>
                        )}
                        <div className="flex gap-3 text-left ml-auto">
                            {userShop.status === 'approved' && (
                                <Button asChild variant="outline" className="font-bold gap-2">
                                    <Link href={`/shops/${userShop.id}`} target="_blank">
                                        <Eye className="h-4 w-4" /> View Public Profile
                                    </Link>
                                </Button>
                            )}
                            <Button onClick={() => setView('wizard')} className="font-bold gap-2">
                                <Edit className="h-4 w-4" /> Manage Configuration
                            </Button>
                        </div>
                    </div>
                </div>

                {shopStatus === 'draft' && (
                    <Alert className="bg-amber-50 border-amber-200">
                        <ShieldAlert className="h-5 w-5 text-amber-600" />
                        <div className="ml-2 text-left">
                            <AlertTitle className="font-bold text-amber-900">Node Inactive</AlertTitle>
                            <AlertDescription className="text-sm text-amber-800 leading-relaxed mt-1">
                                Your commercial profile is currently in draft mode. You must complete the setup wizard and submit for review before your capacity is visible in the malls.
                            </AlertDescription>
                        </div>
                    </Alert>
                )}
            </div>
        );
    }
    
     return (
          <div className="text-center py-20 border-4 border-dashed rounded-3xl bg-muted/10 text-left">
            <div className="bg-white p-6 rounded-full w-fit mx-auto mb-6 shadow-sm">
                <Store className="h-12 w-12 text-muted-foreground opacity-30" />
            </div>
            <h3 className="text-2xl font-black text-center">Establish Your Handshake</h3>
            <p className="mt-2 text-muted-foreground max-w-sm mx-auto text-center leading-relaxed">Ready to monetize your capacity? Initialize your commercial node to start trading in the malls.</p>
            
            <div className="flex justify-center mt-8">
                <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <div className="inline-block">
                        <Button size="lg" className="h-14 px-12 text-lg font-black uppercase tracking-tight shadow-xl" onClick={handleCreateShop} disabled={isCreating || !canCreateShop || arePermissionsLoading}>
                        {isCreating || arePermissionsLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
                        {creationLabel}
                        </Button>
                    </div>
                    </TooltipTrigger>
                    {!canCreateShop && (
                    <TooltipContent>
                        <p className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Access Restricted</p>
                    </TooltipContent>
                    )}
                </Tooltip>
                </TooltipProvider>
            </div>
          </div>
        );
  };

  const titleIcon = isWarehouse ? <Warehouse className="h-6 w-6" /> : isTransporter ? <Truck className="h-6 w-6" /> : <Store className="h-6 w-6" />;
  const titleLabel = isAssociate ? 'Digital Associate Node' : (isTransporter ? 'Transport Node' : isDistributor ? 'Distribution Node' : isWarehouse ? 'Warehouse Node' : isLender ? 'Lender Profile' : 'Commercial Node');

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500">
        <div className="flex justify-between items-start">
            <div className="text-left">
                <h1 className="text-3xl font-black font-headline flex items-center gap-3">
                    {titleIcon} {titleLabel}
                </h1>
                <p className="text-muted-foreground mt-1">
                {shopExists ? `Managing ${userShop?.shopName || '...'}` : "Configure your professional presence in the ecosystem."}
                </p>
            </div>
            {view === 'wizard' && (
                    <Button variant="ghost" onClick={() => setView('overview')} className="font-bold text-muted-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Exit Wizard
                </Button>
            )}
        </div>
        
        {renderContent()}
    </div>
  );
}
