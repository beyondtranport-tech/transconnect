'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, Store, PlusCircle, ShieldAlert, Edit, Eye, ArrowLeft, CheckCircle, Warehouse, Truck, Network, ShieldCheck, Landmark, ShoppingCart, Zap, PackageSearch } from 'lucide-react';
import { useUser, useFirestore, getClientSideAuthToken, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ShopWizard } from './shop-wizard';
import { usePermissions } from '@/hooks/use-permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  draft: 'secondary',
  pending_review: 'outline',
  approved: 'default',
  rejected: 'destructive',
};

const nodeConfig: Record<string, { title: string; description: string; icon: any }> = {
    loads: { title: "Brokerage Hub", description: "Manage your freight clearing margins and haulier compliance rules.", icon: PackageSearch },
    warehouse: { title: "Warehouse Node", description: "Manage storage capacity, pallet availability, and handling fees.", icon: Warehouse },
    transport: { title: "Fleet Node", description: "Configure your vehicle assets, service lanes, and technical profile.", icon: Truck },
    supplier: { title: "Supplier Shop", description: "Manage your digital storefront and product catalogue.", icon: Store },
    default: { title: "Industrial Node", description: "Manage your professional presence across the ecosystem.", icon: Landmark }
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

  const nodeType = searchParams.get('nodeType') || 'default';
  const config = nodeConfig[nodeType] || nodeConfig.default;

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
        toast({ title: 'Profile Node Initialized' });
        forceRefreshUser();
        forceRefreshCompany();
        setView('wizard');
      } else {
        throw new Error(result.error || 'Failed to create node.');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Initializing Node', description: error.message });
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
  
  const shopStatus = userShop?.status || 'draft';

  const renderContent = () => {
    if (view === 'wizard' && userShop) {
      return <ShopWizard shop={userShop} nodeType={nodeType} onUpdate={forceRefreshAll} />;
    }

    if (shopExists) {
        if (isShopLoading || !userShop) {
            return (
                 <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground text-center">Synchronizing Node Data...</p>
                </div>
            );
        }
        return (
             <div className="space-y-8 animate-in fade-in duration-500 text-left">
                <div className="p-8 border rounded-3xl bg-muted/30 shadow-inner text-left">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 text-left">
                        <div className="text-left flex items-center gap-4">
                            <div className="bg-primary p-3 rounded-2xl text-white shadow-lg">
                                <config.icon className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-left">{userShop.shopName || config.title}</h3>
                                <p className="text-muted-foreground text-left font-medium">{userShop.category || 'Forensic Category Required'}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 text-right">
                             <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Node Status</p>
                             <Badge variant={statusColors[shopStatus] || 'secondary'} className="capitalize text-sm font-black px-4 py-1 h-auto">
                                {shopStatus.replace(/_/g, ' ')}
                             </Badge>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-1 text-left">
                             <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-left">Live Configuration</p>
                             <p className="text-3xl font-black text-primary text-left">{(products?.length || 0).toLocaleString()}</p>
                             <p className="text-[10px] font-bold text-muted-foreground italic text-left">Active Listings / Rules</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-center gap-3">
                            <Button onClick={() => setView('wizard')} className="font-bold gap-2 h-12 text-lg uppercase tracking-tight">
                                <Edit className="h-5 w-5" /> Manage {config.title}
                            </Button>
                        </div>
                    </div>
                </div>

                {shopStatus === 'draft' && (
                    <Alert className="bg-amber-50 border-amber-200 text-left">
                        <ShieldAlert className="h-5 w-5 text-amber-600" />
                        <div className="ml-2 text-left">
                            <AlertTitle className="font-bold text-amber-900">Node Inactive</AlertTitle>
                            <AlertDescription className="text-sm text-amber-800 leading-relaxed mt-1 text-left">
                                Your **{config.title}** is currently in draft mode. You must complete the setup wizard and submit for review before your business is visible in the malls.
                            </AlertDescription>
                        </div>
                    </Alert>
                )}
            </div>
        );
    }
    
     return (
          <div className="text-center py-24 border-4 border-dashed rounded-3xl bg-muted/10 text-left animate-in fade-in zoom-in duration-700">
            <div className="bg-white p-6 rounded-full w-fit mx-auto mb-6 shadow-sm">
                <config.icon className="h-12 w-12 text-muted-foreground opacity-30" />
            </div>
            <h3 className="text-2xl font-black text-center uppercase tracking-tight">Establish Your {config.title}</h3>
            <p className="mt-2 text-muted-foreground max-w-sm mx-auto text-center leading-relaxed font-medium">Ready to monetize your capacity? Initialize your commercial node to start trading and matching in the ecosystem.</p>
            
            <div className="flex justify-center mt-8">
                <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <div className="inline-block">
                        <Button size="lg" className="h-16 px-16 text-lg font-black uppercase tracking-tight shadow-xl" onClick={handleCreateShop} disabled={isCreating || !canCreateShop || arePermissionsLoading}>
                        {isCreating || arePermissionsLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <PlusCircle className="mr-2 h-6 w-6" />}
                        Initialize {config.title}
                        </Button>
                    </div>
                    </TooltipTrigger>
                    {!canCreateShop && (
                    <TooltipContent>
                        <p className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Account Restricted</p>
                    </TooltipContent>
                    )}
                </Tooltip>
                </TooltipProvider>
            </div>
          </div>
        );
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500 text-foreground">
        <div className="flex justify-between items-start">
            <div className="text-left">
                <h1 className="text-3xl font-black font-headline flex items-center gap-3 text-left">
                    <config.icon className="h-8 w-8 text-primary" /> {config.title} Terminal
                </h1>
                <p className="text-muted-foreground mt-1 text-left font-medium">
                {config.description}
                </p>
            </div>
            {view === 'wizard' && (
                    <Button variant="ghost" onClick={() => setView('overview')} className="font-bold text-muted-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Exit Setup
                </Button>
            )}
        </div>
        
        {renderContent()}
    </div>
  );
}
