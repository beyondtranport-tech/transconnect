
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, Store, PlusCircle, ShieldAlert, Edit, ArrowLeft, Warehouse, Truck, ShieldCheck, Landmark, PackageSearch } from 'lucide-react';
import { useUser, useFirestore, getClientSideAuthToken, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ShopWizard } from './shop-wizard';
import { usePermissions } from '@/hooks/use-permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  draft: 'secondary',
  pending_review: 'outline',
  approved: 'default',
  rejected: 'destructive',
};

const nodeConfig: Record<string, { title: string; description: string; icon: any }> = {
    loads: { 
        title: "Brokerage Hub Terminal", 
        description: "Manage your freight clearing authorizations, margins, and active load postings.", 
        icon: PackageSearch 
    },
    warehouse: { 
        title: "Warehouse Hub Terminal", 
        description: "Manage storage capacity, pallet availability, and handling fees.", 
        icon: Warehouse 
    },
    transport: { 
        title: "Fleet Node Terminal", 
        description: "Configure your vehicle assets, service lanes, and technical profile.", 
        icon: Truck 
    },
    supplier: { 
        title: "Supplier Shop Terminal", 
        description: "Manage your digital storefront and product catalogue.", 
        icon: Store 
    },
    default: { 
        title: "Industrial Node Terminal", 
        description: "Manage your professional presence across the ecosystem.", 
        icon: Landmark 
    }
};

export default function ShopContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
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
        toast({ title: 'Node Handshake Initialized' });
        forceRefreshUser();
        forceRefreshCompany();
        setView('wizard');
      } else {
        throw new Error(result.error || 'Failed to initialize node.');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Initialization Failed', description: error.message });
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

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Synchronizing Terminal...</p>
        </div>
    );
  }

  if (view === 'wizard' && userShop) {
    return <ShopWizard shop={userShop} nodeType={nodeType} onUpdate={() => { forceRefreshUser(); forceRefreshCompany(); if(forceRefreshShop) forceRefreshShop(); }} />;
  }

  if (!!companyData?.shopId) {
    const shopStatus = userShop?.status || 'draft';
    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left">
            <div className="p-8 border rounded-3xl bg-muted/30 shadow-inner">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary p-3 rounded-2xl text-white shadow-lg">
                            <config.icon className="h-8 w-8" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-2xl font-black">{userShop?.shopName || config.title}</h3>
                            <p className="text-muted-foreground font-medium">{userShop?.category || 'Registry Hub'}</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Node Status</p>
                        <Badge variant={statusColors[shopStatus] || 'secondary'} className="capitalize text-sm font-black px-4 py-1 h-auto">
                            {shopStatus.replace(/_/g, ' ')}
                        </Badge>
                    </div>
                </div>
                
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                    <Button onClick={() => setView('wizard')} className="font-bold gap-2 h-12 text-lg uppercase tracking-tight flex-1">
                        <Edit className="h-5 w-5" /> Configure {config.title}
                    </Button>
                </div>
            </div>

            {shopStatus === 'draft' && (
                <Alert className="bg-amber-50 border-amber-200">
                    <ShieldAlert className="h-5 w-5 text-amber-600" />
                    <div className="ml-2 text-left">
                        <AlertTitle className="font-bold text-amber-900">Handshake Incomplete</AlertTitle>
                        <AlertDescription className="text-sm text-amber-800 leading-relaxed mt-1">
                            Your **{config.title}** is currently in draft mode. You must complete the legal and commercial setup steps to activate your presence in the Mall.
                        </AlertDescription>
                    </div>
                </Alert>
            )}
        </div>
    );
  }

  return (
    <div className="text-center py-24 border-4 border-dashed rounded-3xl bg-muted/10 animate-in fade-in zoom-in duration-700">
        <div className="bg-white p-6 rounded-full w-fit mx-auto mb-6 shadow-sm">
            <config.icon className="h-12 w-12 text-muted-foreground opacity-30" />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tight">Initialize {config.title}</h3>
        <p className="mt-2 text-muted-foreground max-w-sm mx-auto font-medium">Connect your business to the digital grid. This initiates the handshake required to list deals and capacity.</p>
        <div className="mt-10">
            <Button size="lg" className="h-16 px-16 text-lg font-black uppercase tracking-tight shadow-xl" onClick={handleCreateShop} disabled={isCreating || !can('create', 'shop')}>
                {isCreating ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <PlusCircle className="mr-2 h-6 w-6" />}
                Activate {config.title}
            </Button>
        </div>
    </div>
  );
}
