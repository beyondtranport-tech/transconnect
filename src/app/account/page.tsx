
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger
} from '@/components/ui/sidebar';
import {
  Users,
  Settings,
  LogOut,
  LayoutDashboard,
  FileText,
  DollarSign,
  User,
  Building,
  Store,
  CreditCard,
  Wallet,
  Gift,
  Star,
  Award,
  Percent,
  Truck,
  HeartHandshake,
  Package,
  Wand2,
  Video,
  Search,
  Activity,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useConfig } from '@/hooks/use-config';
import { signOut } from 'firebase/auth';
import AccountDashboard from './dashboard';
import { Loader2 } from 'lucide-react';
import StaffContent from './staff-content';
import ProfileContent from './profile-content';
import CompanyContent from './company-content';
import ShopContent from './shop-content';
import BillingContent from './billing-content';
import WalletContent from './wallet-content';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ActivityFeed from './activity-feed';

function DocumentsContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="mt-2 text-muted-foreground">This is where document management will go.</p>
        </div>
    )
}
function SettingsContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="mt-2 text-muted-foreground">This is where account settings will go.</p>
        </div>
    )
}

function RewardsContent() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const { data: loyaltySettings, isLoading: isSettingsLoading } = useConfig<any>('loyaltySettings');

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userData, isLoading: isUserDocLoading } = useDoc(userDocRef);

    const companyDocRef = useMemoFirebase(() => {
        if (!firestore || !userData?.companyId) return null;
        return doc(firestore, 'companies', userData.companyId);
    }, [firestore, userData]);

    const { data: companyData, isLoading: isCompanyLoading } = useDoc(companyDocRef);

    const isLoading = isUserLoading || isUserDocLoading || isCompanyLoading || isSettingsLoading;
    
    const tier = companyData?.loyaltyTier || 'bronze';
    const tierColors: {[key: string]: string} = {
        bronze: 'bg-orange-200 text-orange-800',
        silver: 'bg-slate-200 text-slate-800',
        gold: 'bg-yellow-200 text-yellow-800',
    }
    
    const earningActions = [
        { points: loyaltySettings?.userSignupPoints, name: 'Sign up for an account', icon: User, cta: { label: 'Completed!', href: '#', disabled: true } },
        { points: loyaltySettings?.shopCreationPoints, name: 'Create a Vendor Shop', icon: Store, cta: { label: 'Create Shop', href: '/account?view=shop' } },
        { points: loyaltySettings?.productAddPoints, name: 'Add a Product to your Shop', icon: Package, cta: { label: 'Add Product', href: '/account?view=shop' } },
        { points: loyaltySettings?.truckContributionPoints, name: 'Contribute Truck/Trailer Data', icon: Truck, cta: { label: 'Contribute', href: '/contribute' } },
        { points: loyaltySettings?.supplierContributionPoints, name: 'Contribute Supplier Data', icon: Building, cta: { label: 'Contribute', href: '/contribute?tab=suppliers' } },
        { points: loyaltySettings?.partnerReferralPoints, name: 'Refer a New Member', icon: HeartHandshake, cta: { label: 'Refer Now', href: '/incentives' } },
        { points: loyaltySettings?.aiVideoGeneratorPoints, name: 'Generate an AI Video', icon: Video, cta: { label: 'Go to Tech', href: '/tech' } },
        { points: loyaltySettings?.seoBoosterPoints, name: 'Use the AI SEO Booster', icon: Search, cta: { label: 'Go to My Shop', href: '/account?view=shop' } },
    ]

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl"><Gift /> My Rewards Dashboard</CardTitle>
                    <CardDescription>Your current loyalty status, points, and opportunities to earn more.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                     ) : companyData ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                <Card className="bg-muted/50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Star /> Loyalty Status</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className={cn("w-fit text-2xl font-bold px-4 py-2 rounded-lg capitalize flex items-center gap-2", tierColors[tier])}>
                                           <Award /> {tier}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-muted/50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Gift /> Reward Points</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-5xl font-extrabold text-primary">{companyData.rewardPoints || 0}</p>
                                    </CardContent>
                                </Card>
                                 <Card className="bg-muted/50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Percent /> Your Tier Benefits</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                         <div className="flex justify-between items-center text-lg">
                                            <p>Commission Share:</p>
                                            <p className="font-bold text-primary">{companyData.commissionShare || 0}%</p>
                                        </div>
                                         <div className="flex justify-between items-center text-lg">
                                            <p>Discount Share:</p>
                                            <p className="font-bold text-primary">{companyData.discountShare || 0}%</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>How to Earn Points</CardTitle>
                                        <CardDescription>Complete actions to earn points and climb the loyalty tiers.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Action</TableHead>
                                                    <TableHead className="text-center">Points</TableHead>
                                                    <TableHead className="text-right">Go</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {earningActions.map((action) => {
                                                    const Icon = action.icon;
                                                    return (
                                                        <TableRow key={action.name}>
                                                            <TableCell className="font-medium flex items-center gap-3"><Icon className="h-5 w-5 text-muted-foreground" /> {action.name}</TableCell>
                                                            <TableCell className="text-center font-bold text-primary">{action.points || 0}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Button asChild size="sm" variant="outline" disabled={action.cta.disabled}>
                                                                    <Link href={action.cta.href}>{action.cta.label}</Link>
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                     ) : (
                        <div className="text-center py-20">
                            <p className="text-muted-foreground">Could not load your rewards information.</p>
                        </div>
                     )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Rewards Store</CardTitle>
                    <CardDescription>Redeem your hard-earned points for valuable rewards.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="text-center py-20 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">The Rewards Store is coming soon.</p>
                        <p className="text-sm text-muted-foreground mt-1">You'll be able to redeem points for fuel vouchers, service discounts, and more.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}


function AccountPageContent() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') || 'dashboard';
  const [activeView, setActiveView] = useState(initialView);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  useEffect(() => {
    if (isUserLoading) {
      return; // Do nothing while loading
    }
    if (!user) {
      router.replace('/signin');
    }
  }, [user, isUserLoading, router]);


  const onLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AC";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const renderContent = () => {
    switch (activeView) {
      case 'profile':
        return <ProfileContent />;
      case 'company':
        return <CompanyContent />;
      case 'staff':
        return <StaffContent />;
      case 'shop':
        return <ShopContent />;
      case 'wallet':
        return <WalletContent />;
      case 'billing':
        return <BillingContent />;
      case 'rewards':
        return <RewardsContent />;
      case 'documents':
        return <DocumentsContent />;
      case 'activity-feed':
        return <ActivityFeed />;
      case 'settings':
        return <SettingsContent />;
      case 'dashboard':
      default:
        return <AccountDashboard />;
    }
  }

  if (isUserLoading || !user) {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <User className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Member Area
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Dashboard" isActive={activeView === 'dashboard'} onClick={() => router.push('/account?view=dashboard', { scroll: false })}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="My Profile" isActive={activeView === 'profile'} onClick={() => router.push('/account?view=profile', { scroll: false })}>
                  <User />
                  <span>My Profile</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Company" isActive={activeView === 'company'} onClick={() => router.push('/account?view=company', { scroll: false })}>
                  <Building />
                  <span>Company</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Staff" isActive={activeView === 'staff'} onClick={() => router.push('/account?view=staff', { scroll: false })}>
                  <Users />
                  <span>Staff</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="My Shop" isActive={activeView === 'shop'} onClick={() => router.push('/account?view=shop', { scroll: false })}>
                  <Store />
                  <span>My Shop</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Wallet" isActive={activeView === 'wallet'} onClick={() => router.push('/account?view=wallet', { scroll: false })}>
                  <Wallet />
                  <span>Wallet</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Rewards" isActive={activeView === 'rewards'} onClick={() => router.push('/account?view=rewards', { scroll: false })}>
                  <Gift />
                  <span>Rewards</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Billing" isActive={activeView === 'billing'} onClick={() => router.push('/account?view=billing', { scroll: false })}>
                  <CreditCard />
                  <span>Billing</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Documents" isActive={activeView === 'documents'} onClick={() => router.push('/account?view=documents', { scroll: false })}>
                  <FileText />
                  <span>Documents</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Activity Feed" isActive={activeView === 'activity-feed'} onClick={() => router.push('/account?view=activity-feed', { scroll: false })}>
                  <Activity />
                  <span>Activity Feed</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Settings" isActive={activeView === 'settings'} onClick={() => router.push('/account?view=settings', { scroll: false })}>
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {user.displayName}
              </span>
              <span className="text-xs text-sidebar-foreground/70 truncate">
                {user.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={onLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 md:p-6">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function AccountPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <AccountPageContent />
    </Suspense>
  );
}
