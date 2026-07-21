'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, Store, PlusCircle, ShieldAlert, Edit, ArrowLeft, Warehouse, Truck, ShieldCheck, Landmark, PackageSearch, ShoppingCart, Zap } from 'lucide-react';
import { useUser, useFirestore, getClientSideAuthToken, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ShopWizard } from './shop-wizard';
import { usePermissions } from '@/hooks/use-permissions';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import PromoteNodeContent from './promote-node-content';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    'buy-sell': { 
        title: "Marketplace Node Terminal", 
        description: "Manage your vehicle inventory, sales agreements, and buyer communications.", 
        icon: ShoppingCart 
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

  const [activeTab, setActiveTab] = useState('terminal');
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
        setActiveTab('terminal');
      } else {
        throw new Error(result.error || 'Failed to initialize node.');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Initialization Failed', description: error.message });
    } finally {
      setIsCreating(false);
    }
  };

  const isLoading = isUserLoading || isUserDataLoading || isCompanyLoading || arePermissionsLoading;

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Synchronizing Terminal...</p>
        </div>
    );
  }

  if (!!companyData?.shopId) {
    return (
        <div className="space-y-6">
            <div className="text-left space-y-1 mb-8">
                <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3">
                    <config.icon className="h-8 w-8 text-primary" />
                    {config.title}
                </h1>
                <p className="text-muted-foreground">{config.description}</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full text-left">
                <TabsList className="bg-muted/50 p-1 h-auto mb-8 flex-wrap justify-start">
                    <TabsTrigger value="terminal" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <config.icon className="h-3.5 w-3.5" /> Node Terminal
                    </TabsTrigger>
                    <TabsTrigger value="promote" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <Zap className="h-3.5 w-3.5" /> Visibility Boost
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="terminal" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {userShop && <ShopWizard shop={userShop} nodeType={nodeType} onUpdate={() => { forceRefreshUser(); forceRefreshCompany(); if(forceRefreshShop) forceRefreshShop(); }} />}
                </TabsContent>

                <TabsContent value="promote" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <PromoteNodeContent />
                </TabsContent>
            </Tabs>
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
