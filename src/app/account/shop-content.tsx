'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, Store, PlusCircle, ShieldAlert, Edit, ArrowLeft, Warehouse, Truck, ShieldCheck, Landmark, PackageSearch, ShoppingCart, Zap, Eye, Clock, ExternalLink, ArrowRight, CheckCircle } from 'lucide-react';
import { useUser, useFirestore, getClientSideAuthToken, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ShopWizard } from './shop-wizard';
import { usePermissions } from '@/hooks/use-permissions';
import { Badge } from '@/components/ui/badge';
import { useSearchParams, useRouter } from 'next/navigation';
import PromoteNodeContent from './promote-node-content';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatDateSafe } from '@/lib/utils';
import Link from 'next/link';

const nodeConfig: Record<string, { title: string; description: string; icon: any }> = {
    loads: { 
        title: "Brokerage Hub", 
        description: "Manage your freight clearing authorizations, margins, and active load postings.", 
        icon: PackageSearch 
    },
    warehouse: { 
        title: "Warehouse Hub", 
        description: "Manage storage capacity, pallet availability, and handling fees.", 
        icon: Warehouse 
    },
    transport: { 
        title: "Fleet Node", 
        description: "Configure your vehicle assets, service lanes, and technical profile.", 
        icon: Truck 
    },
    'buy-sell': { 
        title: "Marketplace Node", 
        description: "Manage your vehicle inventory, sales agreements, and buyer communications.", 
        icon: ShoppingCart 
    },
    supplier: { 
        title: "Supplier Shop", 
        description: "Manage your digital storefront and product catalogue.", 
        icon: Store 
    },
    default: { 
        title: "Industrial Node", 
        description: "Manage your professional presence across the ecosystem.", 
        icon: Landmark 
    }
};

const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    pending_review: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-green-100 text-green-700 border-green-200",
    rejected: "bg-red-100 text-red-700 border-red-200"
};

export default function ShopContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('terminal');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
      setIsEditing(true);
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
        setIsEditing(true);
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
    if (isEditing) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => setIsEditing(false)} className="gap-2 text-muted-foreground">
                    <ArrowLeft className="h-4 w-4" /> Back to Node Hub
                </Button>
                {userShop && <ShopWizard shop={userShop} nodeType={nodeType} onUpdate={() => { forceRefreshUser(); forceRefreshCompany(); if(forceRefreshShop) forceRefreshShop(); }} />}
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left">
            <div className="text-left space-y-1 mb-8">
                <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3 text-left">
                    <config.icon className="h-8 w-8 text-primary" />
                    {config.title} Terminal
                </h1>
                <p className="text-muted-foreground">{config.description}</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full text-left">
                <TabsList className="bg-muted/50 p-1 h-auto mb-8 flex-wrap justify-start">
                    <TabsTrigger value="terminal" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <config.icon className="h-3.5 w-3.5" /> Node Management
                    </TabsTrigger>
                    <TabsTrigger value="promote" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <Zap className="h-3.5 w-3.5" /> Visibility Boost
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="terminal" className="space-y-8 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                        <Card className="shadow-xl border-none text-left bg-white">
                            <CardHeader className="bg-slate-50 border-b p-6 text-left">
                                <div className="flex justify-between items-center text-left">
                                    <div className="text-left">
                                        <CardTitle className="text-lg font-bold text-left">{config.title} Overview</CardTitle>
                                        <CardDescription className="text-left">Management of your community-facing presence.</CardDescription>
                                    </div>
                                    <Badge className={cn("capitalize px-3 py-1 font-black text-[10px] tracking-widest", statusColors[userShop?.status || 'draft'])}>
                                        {userShop?.status?.replace('_', ' ') || 'Draft'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6 text-left">
                                <div className="space-y-4 text-left">
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="bg-muted p-2 rounded-lg text-left"><Store className="h-5 w-5 text-primary" /></div>
                                        <div className="text-left">
                                            <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Public Label</p>
                                            <p className="font-bold text-lg">{userShop?.shopName || 'Unnamed Node'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="bg-muted p-2 rounded-lg text-left"><Clock className="h-5 w-5 text-primary" /></div>
                                        <div className="text-left">
                                            <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Last Synced</p>
                                            <p className="font-bold">{formatDateSafe(userShop?.updatedAt, "dd MMM yyyy, HH:mm")}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 flex flex-col gap-3">
                                    <Button className="h-14 text-lg font-black uppercase tracking-tight shadow-lg gap-2" onClick={() => setIsEditing(true)}>
                                        <Edit className="h-5 w-5" />
                                        Enter Edit Terminal
                                    </Button>
                                    <Button variant="outline" className="h-14 text-lg font-black uppercase tracking-tight gap-2" asChild disabled={userShop?.status !== 'approved'}>
                                        <Link href={`/shops/${userShop?.id}`}>
                                            <Eye className="h-5 w-5" />
                                            View Public Profile
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-primary/5 border-2 border-dashed border-primary/20 text-left">
                            <CardHeader className="text-left">
                                <div className="bg-primary/10 p-3 rounded-xl w-fit mb-4 text-left"><Zap className="h-6 w-6 text-primary" /></div>
                                <CardTitle className="text-xl font-bold text-left">Terminal Directives</CardTitle>
                                <CardDescription className="text-left">Recommendations for maximizing your node's performance.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 text-left">
                                <ul className="space-y-3 text-sm text-left">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                        <span>Complete the **Technical Summary** to improve AI matching accuracy.</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-left">
                                        <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                        <span>Upload high-fidelity **Facility Images** to build trust with buyers.</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-left">
                                        <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                        <span>Use the **Visibility Boost** tab to reach more transporters.</span>
                                    </li>
                                </ul>
                            </CardContent>
                            <CardFooter className="text-left">
                                <Button variant="link" className="p-0 h-auto font-bold text-primary" asChild>
                                    <Link href="/resources">Read Management Guide <ArrowRight className="ml-1 h-3 w-3" /></Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
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
